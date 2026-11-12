#[cfg(test)]
mod tests {
    use crate::logging::redact_secrets;

    #[test]
    fn test_redact_api_key_bearer() {
        let raw = "Authorization: Bearer a1b2c3d4e5f60718293a4b5c6d7e8f90";
        let scrubbed = redact_secrets(raw);
        assert!(!scrubbed.contains("a1b2c3d4e5f60718293a4b5c6d7e8f90"));
        assert!(scrubbed.contains("[REDACTED]") || scrubbed.contains("a1b2...f90"));
    }

    #[test]
    fn test_redact_hex_key_standalone() {
        let raw = "Sending request with key=a1b2c3d4e5f60718293a4b5c6d7e8f90 to KIE AI";
        let scrubbed = redact_secrets(raw);
        assert!(!scrubbed.contains("a1b2c3d4e5f60718293a4b5c6d7e8f90"));
    }

    #[test]
    fn test_leave_regular_text_intact() {
        let raw = "Docuopsy opened file: C:/Users/documents/notes.md with 142 lines.";
        let scrubbed = redact_secrets(raw);
        assert_eq!(scrubbed, raw);
    }
}

