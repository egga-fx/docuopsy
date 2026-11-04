#[cfg(test)]
mod tests {
    use crate::logging::redact_secrets;

    #[test]
    fn test_redact_api_key_bearer() {
        let raw = "Authorization: Bearer e003b0c015d233ea848997456242e97b";
        let scrubbed = redact_secrets(raw);
        assert!(!scrubbed.contains("e003b0c015d233ea848997456242e97b"));
        assert!(scrubbed.contains("[REDACTED]") || scrubbed.contains("e003...97b"));
    }

    #[test]
    fn test_redact_hex_key_standalone() {
        let raw = "Sending request with key=e003b0c015d233ea848997456242e97b to KIE AI";
        let scrubbed = redact_secrets(raw);
        assert!(!scrubbed.contains("e003b0c015d233ea848997456242e97b"));
    }

    #[test]
    fn test_leave_regular_text_intact() {
        let raw = "Docuopsy opened file: C:/Users/documents/notes.md with 142 lines.";
        let scrubbed = redact_secrets(raw);
        assert_eq!(scrubbed, raw);
    }
}

