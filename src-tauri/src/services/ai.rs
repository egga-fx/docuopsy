use crate::error::AppError;
use eventsource_stream::Eventsource;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::env;
use tauri::{AppHandle, Emitter};

pub const DEFAULT_KIE_BASE_URL: &str = "https://api.kie.ai/v1";
pub const DEFAULT_KIE_MODEL: &str = "claude-haiku-5-5";
pub const DEFAULT_DEV_API_KEY: &str = "e003b0c015d233ea848997456242e97b";

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AIStreamChunk {
    pub stream_id: String,
    pub delta: String,
    pub is_done: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Deserialize, Debug)]
struct ChatCompletionChunk {
    choices: Vec<ChoiceChunk>,
}

#[derive(Deserialize, Debug)]
struct ChoiceChunk {
    delta: DeltaChunk,
}

#[derive(Deserialize, Debug)]
struct DeltaChunk {
    content: Option<String>,
}

/// Parses an incoming SSE line from KIE AI chat completions
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

        match serde_json::from_str::<ChatCompletionChunk>(payload) {
            Ok(chunk) => {
                if let Some(first_choice) = chunk.choices.into_iter().next() {
                    Ok(first_choice.delta.content)
                } else {
                    Ok(None)
                }
            }
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
        let endpoint = format!("{}/chat/completions", self.base_url.trim_end_matches('/'));

        let system_instruction = "You are Docuopsy AI Assistant, powered by Claude Haiku 5.5 on KIE AI. You assist users in writing, refining, and analyzing text documents. Respond concisely, accurately, and follow instructions directly.";

        let user_message = if context.is_empty() {
            prompt
        } else {
            format!("Context:\n```\n{}\n```\n\nTask: {}", context, prompt)
        };

        let request_body = serde_json::json!({
            "model": self.model,
            "stream": true,
            "messages": [
                { "role": "system", "content": system_instruction },
                { "role": "user", "content": user_message }
            ]
        });

        tracing::info!("Starting KIE AI stream id={} with model={}", stream_id, self.model);

        let response = self
            .client
            .post(&endpoint)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| AppError::Network(format!("Failed to connect to KIE AI: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let err_body = response.text().await.unwrap_or_default();
            let err_msg = format!("KIE AI returned error HTTP {}: {}", status, err_body);
            tracing::error!("{}", err_msg);

            let _ = app_handle.emit(
                "ai:stream:chunk",
                AIStreamChunk {
                    stream_id: stream_id.clone(),
                    delta: String::new(),
                    is_done: true,
                    error: Some(err_msg.clone()),
                },
            );

            return Err(AppError::Network(err_msg));
        }

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
                error: None,
            },
        );

        Ok(())
    }
}
