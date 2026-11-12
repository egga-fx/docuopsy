use crate::error::AppError;
use crate::services::fs::{atomic_save_file, authorize_path, ensure_authorized, read_file_content};
use std::path::PathBuf;

#[tauri::command]
pub async fn read_document(path: String) -> Result<String, AppError> {
    let p = PathBuf::from(&path);
    let safe = ensure_authorized(&p)?;
    tokio::task::spawn_blocking(move || read_file_content(&safe))
        .await
        .map_err(|e| AppError::Io(std::io::Error::other(e)))?
}

/// Streams raw file bytes for binary formats (e.g. PDF) that PDF.js must parse
/// itself. Gated by the same authorization + traversal checks as text reads.
#[tauri::command]
pub async fn read_document_bytes(path: String) -> Result<tauri::ipc::Response, AppError> {
    let p = PathBuf::from(&path);
    let safe = ensure_authorized(&p)?;
    let bytes = tokio::task::spawn_blocking(move || std::fs::read(&safe))
        .await
        .map_err(|e| AppError::Io(std::io::Error::other(e)))??;
    Ok(tauri::ipc::Response::new(bytes))
}

#[tauri::command]
pub async fn save_document(path: String, content: String) -> Result<u64, AppError> {
    let p = PathBuf::from(&path);
    let safe = ensure_authorized(&p)?;
    tokio::task::spawn_blocking(move || atomic_save_file(&safe, &content))
        .await
        .map_err(|e| AppError::Io(std::io::Error::other(e)))?
}

/// Registers paths the user handed to the app outside the native pickers
/// (drag-and-drop, restored session tabs) so the containment gate accepts them.
#[tauri::command]
pub async fn allow_paths(paths: Vec<String>) -> Result<u32, AppError> {
    let mut count = 0u32;
    for path in paths {
        if authorize_path(std::path::Path::new(&path)).is_ok() {
            count += 1;
        }
    }
    Ok(count)
}

#[tauri::command]
pub async fn pick_file_to_open() -> Result<Option<String>, AppError> {
    let file = rfd::AsyncFileDialog::new()
        .add_filter("Supported Documents", &["md", "markdown", "txt", "pdf", "json", "rs", "ts", "js", "html", "css"])
        .add_filter("Markdown (*.md)", &["md", "markdown"])
        .add_filter("PDF (*.pdf)", &["pdf"])
        .add_filter("Plain Text (*.txt)", &["txt"])
        .add_filter("All Files (*.*)", &["*"])
        .pick_file()
        .await;

    Ok(file.map(|handle| {
        let path = handle.path().to_string_lossy().to_string();
        // A picker selection is explicit user authorization for this file.
        let _ = authorize_path(handle.path());
        path
    }))
}

#[tauri::command]
pub async fn pick_file_to_save(default_name: Option<String>) -> Result<Option<String>, AppError> {
    let mut dialog = rfd::AsyncFileDialog::new()
        .add_filter("Markdown (*.md)", &["md", "markdown"])
        .add_filter("Plain Text (*.txt)", &["txt"])
        .add_filter("All Files (*.*)", &["*"]);

    if let Some(ref name) = default_name {
        dialog = dialog.set_file_name(name);
    }

    let file = dialog.save_file().await;
    Ok(file.map(|handle| {
        let path = handle.path().to_string_lossy().to_string();
        let _ = authorize_path(handle.path());
        path
    }))
}
