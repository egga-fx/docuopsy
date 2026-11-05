#[cfg(test)]
mod tests {
    use crate::models::session::{AppSession, LayoutMode, TabState};
    use crate::services::persistence::PersistenceService;

    #[tokio::test]
    async fn test_atomic_draft_save_and_recovery() {
        let temp_dir = tempfile::tempdir().unwrap();
        let service = PersistenceService::new_with_dir(temp_dir.path().to_path_buf());

        let tab_id = "test-tab-123";
        let draft_content = "# Unsaved Forensic Notes\nTesting crash recovery.";

        service.save_draft(tab_id, draft_content).await.unwrap();
        let recovered = service.load_draft(tab_id).await.unwrap();

        assert_eq!(recovered, Some(draft_content.to_string()));

        // Test removing draft
        service.remove_draft(tab_id).await.unwrap();
        let after_removal = service.load_draft(tab_id).await.unwrap();
        assert_eq!(after_removal, None);
    }

    #[tokio::test]
    async fn test_session_save_and_restore() {
        let temp_dir = tempfile::tempdir().unwrap();
        let service = PersistenceService::new_with_dir(temp_dir.path().to_path_buf());

        let custom_session = AppSession {
            version: 1,
            active_tab_id: "tab-omega".to_string(),
            layout_mode: LayoutMode::FullPreview,
            split_ratio: 0.65,
            theme: Some("light".to_string()),
            accent_color: Some("#0E9F8A".to_string()),
            is_ai_sidebar_open: Some(true),
            ai_sidebar_width: Some(380),
            tabs: vec![
                TabState {
                    id: "tab-alpha".to_string(),
                    file_path: Some("C:/docs/paper.pdf".to_string()),
                    title: "paper.pdf".to_string(),
                    is_dirty: false,
                    cursor_line: 1,
                    cursor_col: 1,
                    scroll_top: 150.0,
                    draft_path: None,
                },
                TabState {
                    id: "tab-omega".to_string(),
                    file_path: None,
                    title: "Untitled-2".to_string(),
                    is_dirty: true,
                    cursor_line: 42,
                    cursor_col: 10,
                    scroll_top: 300.0,
                    draft_path: Some("tab-omega.draft".to_string()),
                },
            ],
        };

        service.save_session(&custom_session).await.unwrap();
        let restored = service.load_session().await.unwrap();

        assert_eq!(restored.active_tab_id, "tab-omega");
        assert_eq!(restored.layout_mode, LayoutMode::FullPreview);
        assert_eq!(restored.split_ratio, 0.65);
        assert_eq!(restored.theme, Some("light".to_string()));
        assert_eq!(restored.tabs.len(), 2);
        assert_eq!(restored.tabs[1].cursor_line, 42);
    }

    #[tokio::test]
    async fn test_fallback_on_corrupted_session() {
        let temp_dir = tempfile::tempdir().unwrap();
        let service = PersistenceService::new_with_dir(temp_dir.path().to_path_buf());

        // Write corrupt JSON to session file
        let session_file = service.session_file_path();
        std::fs::write(&session_file, "{ corrupted_invalid_json }").unwrap();

        let session = service.load_session().await.unwrap();
        // Should safely fallback to default without crashing
        assert_eq!(session.version, 1);
        assert_eq!(session.tabs.len(), 1);
        assert_eq!(session.tabs[0].title, "Untitled-1");
    }
}

