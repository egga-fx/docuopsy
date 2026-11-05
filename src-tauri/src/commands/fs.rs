use crate::error::AppError;
use crate::services::fs::{atomic_save_file, read_file_content};
use std::path::Path;

#[tauri::command]
pub async fn read_document(path: String) -> Result<String, AppError> {
    let p = Path::new(&path);
    read_file_content(p)
}

#[tauri::command]
pub async fn save_document(path: String, content: String) -> Result<u64, AppError> {
    let p = Path::new(&path);
    atomic_save_file(p, &content)
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

    Ok(file.map(|handle| handle.path().to_string_lossy().to_string()))
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
    Ok(file.map(|handle| handle.path().to_string_lossy().to_string()))
}

