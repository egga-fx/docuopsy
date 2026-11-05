use crate::error::AppError;
use crate::services::ai::KIEAiService;
use tauri::AppHandle;

#[tauri::command]
pub async fn ai_generate_stream(
    stream_id: String,
    prompt: String,
    context: String,
    app_handle: AppHandle,
) -> Result<String, AppError> {
    let service = KIEAiService::new();
    service
        .stream_completion(stream_id, prompt, context, app_handle)
        .await
}

