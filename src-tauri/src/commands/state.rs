use crate::error::AppError;
use crate::models::session::AppSession;
use crate::services::persistence::PersistenceService;

#[tauri::command]
pub async fn save_session(session: AppSession) -> Result<(), AppError> {
    let service = PersistenceService::new();
    service.save_session(&session).await
}

#[tauri::command]
pub async fn load_session() -> Result<AppSession, AppError> {
    let service = PersistenceService::new();
    service.load_session().await
}

#[tauri::command]
pub async fn save_draft(tab_id: String, content: String) -> Result<String, AppError> {
    let service = PersistenceService::new();
    let path = service.save_draft(&tab_id, &content).await?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn load_draft(tab_id: String) -> Result<Option<String>, AppError> {
    let service = PersistenceService::new();
    service.load_draft(&tab_id).await
}

#[tauri::command]
pub async fn remove_draft(tab_id: String) -> Result<(), AppError> {
    let service = PersistenceService::new();
    service.remove_draft(&tab_id).await
}

