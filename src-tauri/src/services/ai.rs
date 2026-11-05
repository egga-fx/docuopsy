use crate::error::AppError;
use eventsource_stream::Eventsource;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::env;
use tauri::{AppHandle, Emitter};

pub const DEFAULT_KIE_BASE_URL: &str = "https://api.kie.ai/openai/v1";
pub const DEFAULT_KIE_MODEL: &str = "deepseek-v4-1-flash";
pub const DEFAULT_DEV_API_KEY: &str = "e003b0c015d233ea848997456242e97b";

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AIStreamChunk {
    pub stream_id: String,
    pub delta: String,
    pub is_done: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Deserialize, Debug)]
#[serde(untagged)]
enum AnySsePayload {
    DeepSeekDelta {
        #[serde(rename = "type")]
        event_type: String,
        delta: Option<String>,
    },
    AnthropicDelta {
        delta: AnthropicTextDelta,
    },
    OpenAiDelta {
        choices: Vec<ChoiceChunk>,
    },
    StopEvent {
        #[serde(rename = "type")]
        _event_type: String,
    },
}

#[derive(Deserialize, Debug)]
struct AnthropicTextDelta {
    text: Option<String>,
}

#[derive(Deserialize, Debug)]
struct ChoiceChunk {
    delta: DeltaChunk,
}

#[derive(Deserialize, Debug)]
struct DeltaChunk {
    content: Option<String>,
}

/// Parses an incoming SSE line from KIE AI chat/messages stream
pub fn parse_sse_line(line: &str) -> Result<Option<String>, AppError> {
    let trimmed = line.trim();
    if trimmed.is_empty() || trimmed.starts_with(':') {
        return Ok(None);
    }

    if let Some(data) = trimmed.strip_prefix("data:") {
        let payload = data.trim();
        if payload == "[DONE]" {
            return Ok(None);
        }

        match serde_json::from_str::<AnySsePayload>(payload) {
            Ok(AnySsePayload::DeepSeekDelta { event_type, delta }) => {
                if event_type == "response.output_text.delta" {
                    Ok(delta)
                } else {
                    Ok(None)
                }
            }
            Ok(AnySsePayload::AnthropicDelta { delta }) => {
                Ok(delta.text)
            }
            Ok(AnySsePayload::OpenAiDelta { choices }) => {
                Ok(choices.into_iter().next().and_then(|c| c.delta.content))
            }
            Ok(AnySsePayload::StopEvent { .. }) => Ok(None),
            Err(e) => {
                tracing::trace!("Skipping non-JSON SSE chunk: {}: {:?}", payload, e);
                Ok(None)
            }
        }
    } else {
        Ok(None)
    }
}

pub struct KIEAiService {
    client: reqwest::Client,
    base_url: String,
    api_key: String,
    model: String,
}

impl Default for KIEAiService {
    fn default() -> Self {
        Self::new()
    }
}

impl KIEAiService {
    pub fn new() -> Self {
        let base_url = env::var("KIE_AI_BASE_URL").unwrap_or_else(|_| DEFAULT_KIE_BASE_URL.to_string());
        let api_key = env::var("KIE_AI_API_KEY").unwrap_or_else(|_| DEFAULT_DEV_API_KEY.to_string());
        let model = env::var("KIE_AI_DEFAULT_MODEL").unwrap_or_else(|_| DEFAULT_KIE_MODEL.to_string());

        Self {
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(60))
                .build()
                .unwrap_or_default(),
            base_url,
            api_key,
            model,
        }
    }

    pub async fn stream_completion(
        &self,
        stream_id: String,
        prompt: String,
        context: String,
        app_handle: AppHandle,
    ) -> Result<(), AppError> {
        let endpoint = if self.base_url.ends_with("/responses")
            || self.base_url.ends_with("/messages")
            || self.base_url.ends_with("/chat/completions")
        {
            self.base_url.clone()
        } else if self.model.starts_with("deepseek") {
            format!("{}/responses", self.base_url.trim_end_matches('/'))
        } else if self.base_url.contains("/claude") || self.base_url.contains("/anthropic") {
            format!("{}/messages", self.base_url.trim_end_matches('/'))
        } else {
            format!("{}/responses", self.base_url.trim_end_matches('/'))
        };

        let system_instruction = "You are Docuopsy AI Assistant, powered by DeepSeek V4.1 Flash on KIE AI. You assist users in writing, refining, analyzing, and structuring text documents. Respond concisely, accurately, and format responses cleanly in GitHub Flavored Markdown.";

        let user_message = if context.is_empty() {
            prompt
        } else {
            format!("Context:\n```\n{}\n```\n\nTask: {}", context, prompt)
        };

        let request_body = if endpoint.ends_with("/responses") {
            serde_json::json!({
                "model": self.model,
                "stream": true,
                "input": [
                    { "role": "system", "content": system_instruction },
                    { "role": "user", "content": user_message }
                ]
            })
        } else {
            serde_json::json!({
                "model": self.model,
                "max_tokens": 4096,
                "stream": true,
                "system": system_instruction,
                "messages": [
                    { "role": "user", "content": user_message }
                ]
            })
        };

        tracing::info!("Starting KIE AI stream id={} with model={} at endpoint={}", stream_id, self.model, endpoint);

        // Emit initial thinking/reasoning status
        let _ = app_handle.emit(
            "ai:stream:chunk",
            AIStreamChunk {
                stream_id: stream_id.clone(),
                delta: String::new(),
                is_done: false,
                status: Some("thinking".to_string()),
                error: None,
            },
        );

        let max_retries = 3;
        let mut last_error_msg = String::new();
        let mut response_opt = None;

        for attempt in 1..=max_retries {
            if attempt > 1 {
                let _ = app_handle.emit(
                    "ai:stream:chunk",
                    AIStreamChunk {
                        stream_id: stream_id.clone(),
                        delta: String::new(),
                        is_done: false,
                        status: Some("retrying".to_string()),
                        error: None,
                    },
                );
                tokio::time::sleep(tokio::time::Duration::from_millis(1500 * attempt as u64)).await;
            }

            let mut req = self
                .client
                .post(&endpoint)
                .header("Authorization", format!("Bearer {}", self.api_key))
                .header("Content-Type", "application/json");

            if endpoint.ends_with("/messages") {
                req = req.header("anthropic-version", "2023-06-01");
            }

            let resp_result = req.json(&request_body).send().await;

            match resp_result {
                Ok(resp) => {
                    let status = resp.status();
                    if status.is_success() {
                        response_opt = Some(resp);
                        break;
                    }

                    let err_body = resp.text().await.unwrap_or_default();
                    last_error_msg = format!("HTTP {}: {}", status, err_body);

                    if status.is_server_error() || err_body.contains("Resources are tight") {
                        tracing::warn!("KIE AI server congestion (attempt {}/{}): {}", attempt, max_retries, last_error_msg);
                        continue;
                    } else {
                        break;
                    }
                }
                Err(e) => {
                    last_error_msg = format!("Connection error: {}", e);
                    tracing::warn!("KIE AI connection failed (attempt {}/{}): {}", attempt, max_retries, last_error_msg);
                }
            }
        }

        let response = match response_opt {
            Some(r) => r,
            None => {
                let clean_msg = if last_error_msg.contains("Resources are tight") {
                    "Server AI sedang mengalami antrian padat (Resources are tight). Silakan coba lagi beberapa saat.".to_string()
                } else if last_error_msg.contains("Internal error") {
                    "Server AI mengalami kendala internal sementara. Silakan coba lagi beberapa saat.".to_string()
                } else {
                    format!("Gagal terhubung ke AI: {}", last_error_msg)
                };

                let _ = app_handle.emit(
                    "ai:stream:chunk",
                    AIStreamChunk {
                        stream_id: stream_id.clone(),
                        delta: String::new(),
                        is_done: true,
                        status: Some("error".to_string()),
                        error: Some(clean_msg.clone()),
                    },
                );

                return Err(AppError::Network(clean_msg));
            }
        };

        let mut stream = response.bytes_stream().eventsource();

        while let Some(event_result) = stream.next().await {
            match event_result {
                Ok(event) => {
                    let raw_line = format!("data: {}", event.data);
                    if let Ok(Some(content_delta)) = parse_sse_line(&raw_line) {
                        let _ = app_handle.emit(
                            "ai:stream:chunk",
                            AIStreamChunk {
                                stream_id: stream_id.clone(),
                                delta: content_delta,
                                is_done: false,
                                status: Some("streaming".to_string()),
                                error: None,
                            },
                        );
                    }
                }
                Err(err) => {
                    tracing::warn!("Stream error: {:?}", err);
                    let _ = app_handle.emit(
                        "ai:stream:chunk",
                        AIStreamChunk {
                            stream_id: stream_id.clone(),
                            delta: String::new(),
                            is_done: true,
                            status: Some("error".to_string()),
                            error: Some(format!("Stream interrupted: {}", err)),
                        },
                    );
                    break;
                }
            }
        }

        // Final completion event
        let _ = app_handle.emit(
            "ai:stream:chunk",
            AIStreamChunk {
                stream_id,
                delta: String::new(),
                is_done: true,
                status: Some("completed".to_string()),
                error: None,
            },
        );

        Ok(())
    }
}
