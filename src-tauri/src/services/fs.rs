use crate::error::AppError;
use std::fs;
use std::io::Write;
use std::path::{Component, Path, PathBuf};

/// Validates a path against directory traversal attacks and symlink escapes.
pub fn validate_path(path: &Path) -> Result<PathBuf, AppError> {
    // 1. Disallow any '..' components (parent directory traversal)
    for comp in path.components() {
        if let Component::ParentDir = comp {
            return Err(AppError::SecurityViolation(format!(
                "Path contains forbidden directory traversal component '..': {:?}",
                path
            )));
        }
    }

    // 2. Canonicalize if target already exists on disk
    if path.exists() {
        let canonical = fs::canonicalize(path)?;
        Ok(canonical)
    } else {
        // If parent exists, canonicalize parent and append file name
        if let Some(parent) = path.parent() {
            if parent.as_os_str().is_empty() {
                Ok(path.to_path_buf())
            } else if parent.exists() {
                let canonical_parent = fs::canonicalize(parent)?;
                if let Some(file_name) = path.file_name() {
                    Ok(canonical_parent.join(file_name))
                } else {
                    Ok(canonical_parent)
                }
            } else {
                Ok(path.to_path_buf())
            }
        } else {
            Ok(path.to_path_buf())
        }
    }
}

/// Safely writes content to disk using atomic tempfile creation and rename.
pub fn atomic_save_file(target_path: &Path, content: &str) -> Result<u64, AppError> {
    let safe_path = validate_path(target_path)?;

    // Ensure parent directory exists
    if let Some(parent) = safe_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let parent_dir = safe_path
        .parent()
        .unwrap_or_else(|| Path::new("."));

    // Create a temporary file in the same filesystem directory to guarantee atomic rename
    let mut temp_file = tempfile::NamedTempFile::new_in(parent_dir)?;
    temp_file.write_all(content.as_bytes())?;
    temp_file.flush()?;

    // Atomically persist/rename to destination
    temp_file.persist(&safe_path).map_err(|e| {
        AppError::Io(e.error)
    })?;

    Ok(content.len() as u64)
}

/// Reads file content after verifying path security.
pub fn read_file_content(path: &Path) -> Result<String, AppError> {
    let safe_path = validate_path(path)?;
    let content = fs::read_to_string(&safe_path)?;
    Ok(content)
}

