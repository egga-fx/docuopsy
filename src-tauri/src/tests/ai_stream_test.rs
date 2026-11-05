#[cfg(test)]
mod tests {
    use crate::services::ai::{parse_sse_line, AIStreamChunk};

    #[test]
    fn test_parse_valid_sse_content() {
        let line = r#"data: {"choices":[{"delta":{"content":"Hello Docuopsy!"}}]}"#;
        let delta = parse_sse_line(line).unwrap();
        assert_eq!(delta, Some("Hello Docuopsy!".to_string()));
    }

    #[test]
    fn test_parse_anthropic_sse_content() {
        let line = r#"data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello Anthropic!"}}"#;
        let delta = parse_sse_line(line).unwrap();
        assert_eq!(delta, Some("Hello Anthropic!".to_string()));
    }

    #[test]
    fn test_parse_done_signal() {
        let line = "data: [DONE]";
        let delta = parse_sse_line(line).unwrap();
        assert_eq!(delta, None);
    }

    #[test]
    fn test_parse_empty_or_ping_line() {
        let line = ": ping";
        let delta = parse_sse_line(line).unwrap();
        assert_eq!(delta, None);
    }

    #[test]
    fn test_stream_chunk_serialization() {
        let chunk = AIStreamChunk {
            stream_id: "stream-123".to_string(),
            delta: "token".to_string(),
            is_done: false,
            status: None,
            error: None,
        };
        let json = serde_json::to_string(&chunk).unwrap();
        assert!(json.contains("streamId"));
        assert!(json.contains("token"));
    }
}

