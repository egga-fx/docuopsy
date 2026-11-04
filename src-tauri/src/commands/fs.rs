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

