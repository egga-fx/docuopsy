use crate::error::AppError;
use crate::models::session::AppSession;
use crate::services::fs::{atomic_save_file, read_file_content};
use std::fs;
use std::path::PathBuf;

pub struct PersistenceService {
    root_dir: PathBuf,
}

impl Default for PersistenceService {
    fn default() -> Self {
        Self::new()
    }
}

impl PersistenceService {
    pub fn new() -> Self {
        let root = dirs::config_dir()
            .map(|p| p.join("Docuopsy"))
            .unwrap_or_else(|| PathBuf::from("./data"));
        Self::new_with_dir(root)
    }

    pub fn new_with_dir(root_dir: PathBuf) -> Self {
        let _ = fs::create_dir_all(&root_dir);
        let drafts_dir = root_dir.join("drafts");
        let _ = fs::create_dir_all(&drafts_dir);
        Self { root_dir }
    }

    pub fn session_file_path(&self) -> PathBuf {
        self.root_dir.join("session.json")
    }

    pub fn drafts_dir_path(&self) -> PathBuf {
        self.root_dir.join("drafts")
    }

    pub fn draft_file_path(&self, tab_id: &str) -> PathBuf {
        // Sanitize tab_id to avoid path traversal in draft file name
        let sanitized_id: String = tab_id
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
            .collect();
        self.drafts_dir_path().join(format!("{}.draft", sanitized_id))
    }

    pub async fn save_session(&self, session: &AppSession) -> Result<(), AppError> {
        let json_str = serde_json::to_string_pretty(session)?;
        let session_file = self.session_file_path();
        atomic_save_file(&session_file, &json_str)?;
        tracing::debug!("Persisted session state to {:?}", session_file);
        Ok(())
    }

    pub async fn load_session(&self) -> Result<AppSession, AppError> {
        let session_file = self.session_file_path();
        if !session_file.exists() {
            tracing::info!("No existing session found at {:?}, initializing default", session_file);
            return Ok(AppSession::default());
        }

        match read_file_content(&session_file) {
            Ok(content) => match serde_json::from_str::<AppSession>(&content) {
                Ok(session) => {
                    tracing::info!("Restored session with {} tabs", session.tabs.len());
                    Ok(session)
                }
                Err(err) => {
                    tracing::warn!("Corrupted session file at {:?}: {}. Falling back to default.", session_file, err);
                    Ok(AppSession::default())
                }
            },
            Err(err) => {
                tracing::warn!("Failed reading session file {:?}: {}. Falling back to default.", session_file, err);
                Ok(AppSession::default())
            }
        }
    }

    pub async fn save_draft(&self, tab_id: &str, content: &str) -> Result<PathBuf, AppError> {
        let draft_path = self.draft_file_path(tab_id);
        atomic_save_file(&draft_path, content)?;
        tracing::debug!("Saved dirty buffer draft for tab '{}' at {:?}", tab_id, draft_path);
        Ok(draft_path)
    }

    pub async fn load_draft(&self, tab_id: &str) -> Result<Option<String>, AppError> {
        let draft_path = self.draft_file_path(tab_id);
        if draft_path.exists() {
            let content = read_file_content(&draft_path)?;
            Ok(Some(content))
        } else {
            Ok(None)
        }
    }

    pub async fn remove_draft(&self, tab_id: &str) -> Result<(), AppError> {
        let draft_path = self.draft_file_path(tab_id);
        if draft_path.exists() {
            fs::remove_file(&draft_path)?;
            tracing::debug!("Removed draft for tab '{}'", tab_id);
        }
        Ok(())
    }
}
