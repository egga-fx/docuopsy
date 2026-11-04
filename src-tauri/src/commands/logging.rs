use crate::logging::redact_secrets;

#[tauri::command]
pub fn log_event(level: String, message: String, context: Option<String>) {
    let clean_msg = redact_secrets(&message);
    let ctx_str = context.map(|c| format!(" [{}]", redact_secrets(&c))).unwrap_or_default();

    match level.to_lowercase().as_str() {
        "error" => tracing::error!("(Frontend){}: {}", ctx_str, clean_msg),
        "warn" => tracing::warn!("(Frontend){}: {}", ctx_str, clean_msg),
        "debug" => tracing::debug!("(Frontend){}: {}", ctx_str, clean_msg),
        _ => tracing::info!("(Frontend){}: {}", ctx_str, clean_msg),
    }
}

