#[cfg(test)]
mod tests {
    use crate::services::fs::{atomic_save_file, read_file_content, validate_path};
    use std::path::Path;

    #[test]
    fn test_reject_directory_traversal_double_dot() {
        let malicious = Path::new("../../Windows/System32/cmd.exe");
        let result = validate_path(malicious);
        assert!(result.is_err(), "Must reject path with leading '..' traversal");
    }

    #[test]
    fn test_reject_embedded_directory_traversal() {
        let malicious = Path::new("subfolder/../../sensitive.txt");
        let result = validate_path(malicious);
        assert!(result.is_err(), "Must reject path with embedded '..' traversal");
    }

    #[tokio::test]
    async fn test_atomic_save_and_read() {
        let temp_dir = tempfile::tempdir().unwrap();
        let target_file = temp_dir.path().join("forensic_evidence.md");
        let content = "# Confidential Document\nForensic text line.";

        let bytes = atomic_save_file(&target_file, content).unwrap();
        assert_eq!(bytes, content.len() as u64);

        let read_back = read_file_content(&target_file).unwrap();
        assert_eq!(read_back, content);
    }
}

