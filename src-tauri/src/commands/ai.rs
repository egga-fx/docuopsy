use crate::error::AppError;
use crate::services::ai::KIEAiService;
use tauri::AppHandle;

#[tauri::command]
pub async fn ai_generate_stream(
    stream_id: String,
    prompt: String,
    context: String,
    active_file_name: Option<String>,
    client_date_time: Option<String>,
    app_handle: AppHandle,
) -> Result<String, AppError> {
    let service = KIEAiService::new();
    service
        .stream_completion(
            stream_id,
            prompt,
            context,
            active_file_name,
            client_date_time,
            app_handle,
        )
        .await
}

