use crate::error::AppError;
use std::collections::HashSet;
use std::fs;
use std::io::Write;
use std::path::{Component, Path, PathBuf};
use std::sync::{Mutex, OnceLock};

/// Paths the user explicitly authorized (picker results, drops, restored session
/// tabs). Canonicalized on insert so symlink/reparse detours compare equal.
static ALLOWED_PATHS: OnceLock<Mutex<HashSet<PathBuf>>> = OnceLock::new();

fn allowed_set() -> std::sync::MutexGuard<'static, HashSet<PathBuf>> {
    ALLOWED_PATHS
        .get_or_init(|| Mutex::new(HashSet::new()))
        .lock()
        .unwrap_or_else(|e| e.into_inner())
}

/// Registers a user-authorized document path and returns its canonical form.
pub fn authorize_path(path: &Path) -> Result<PathBuf, AppError> {
    let canonical = validate_path(path)?;
    allowed_set().insert(canonical.clone());
    Ok(canonical)
}

/// Internal app state (session.json, drafts, logs) lives under the Docuopsy
/// config root and is always authorized.
fn is_internal_root(canonical: &Path) -> bool {
    let Some(cfg) = dirs::config_dir() else {
        return false;
    };
    let root = cfg.join("Docuopsy");
    if let Ok(canonical_root) = fs::canonicalize(&root) {
        if canonical.starts_with(&canonical_root) {
            return true;
        }
    }
    canonical.starts_with(&root)
}

/// Command-layer containment gate: a document path must either be inside the
/// internal app root or have been explicitly authorized by a user action
/// (picker, drop, or session restore). Canonicalization alone does not bound
/// what the renderer may read or write — this does (audit finding P1 #09).
pub fn ensure_authorized(path: &Path) -> Result<PathBuf, AppError> {
    let canonical = validate_path(path)?;
    validate_symlink_type(path, &canonical)?;
    if is_internal_root(&canonical) || allowed_set().contains(&canonical) {
        Ok(canonical)
    } else {
        Err(AppError::SecurityViolation(format!(
            "Path was not authorized by a user action: {:?}",
            path
        )))
    }
}

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

/// Rejects a symlink whose resolved target carries a different extension than the
/// link the caller named, e.g. an allow-listed `notes.md` that points at `secret.key`.
/// Front-end type checks run on the pre-resolution name, so this is the enforcement point.
fn validate_symlink_type(requested: &Path, canonical: &Path) -> Result<(), AppError> {
    if !requested.is_symlink() {
        return Ok(());
    }

    let requested_ext = requested.extension().and_then(|e| e.to_str()).unwrap_or("");
    let target_ext = canonical.extension().and_then(|e| e.to_str()).unwrap_or("");

    if requested_ext != target_ext {
        return Err(AppError::SecurityViolation(format!(
            "Symlink {:?} resolves to a differently typed target {:?}",
            requested, canonical
        )));
    }

    Ok(())
}

/// Safely writes content to disk using atomic tempfile creation and rename.
pub fn atomic_save_file(target_path: &Path, content: &str) -> Result<u64, AppError> {
    let safe_path = validate_path(target_path)?;
    validate_symlink_type(target_path, &safe_path)?;

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
    // sync_all (not just flush) so the bytes survive a power loss between the
    // write and the rename; flush alone leaves them in the OS cache.
    temp_file.as_file().sync_all()?;

    // Atomically persist/rename to destination
    temp_file.persist(&safe_path).map_err(|e| {
        AppError::Io(e.error)
    })?;

    Ok(content.len() as u64)
}

/// Reads file content after verifying path security.
pub fn read_file_content(path: &Path) -> Result<String, AppError> {
    let safe_path = validate_path(path)?;
    validate_symlink_type(path, &safe_path)?;
    let content = fs::read_to_string(&safe_path)?;
    Ok(content)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Symlink creation needs developer mode / SeCreateSymbolicLinkPrivilege on
    /// Windows, so the guard tests skip themselves instead of failing the suite.
    fn make_symlink(target: &Path, link: &Path) -> bool {
        #[cfg(windows)]
        let result = std::os::windows::fs::symlink_file(target, link);
        #[cfg(not(windows))]
        let result = std::os::unix::fs::symlink(target, link);
        result.is_ok()
    }

    fn scratch_dir_with_target(target_name: &str) -> (tempfile::TempDir, std::path::PathBuf) {
        let dir = tempfile::tempdir().unwrap();
        let target = dir.path().join(target_name);
        fs::write(&target, "payload").unwrap();
        (dir, target)
    }

    #[test]
    fn rejects_a_symlink_that_swaps_the_file_type() {
        let (dir, target) = scratch_dir_with_target("identity.key");
        let link = dir.path().join("notes.md");
        if !make_symlink(&target, &link) {
            eprintln!("skipping: symlinks unavailable without developer mode");
            return;
        }

        let err = read_file_content(&link).unwrap_err();
        assert!(matches!(err, AppError::SecurityViolation(_)));
    }

    #[test]
    fn allows_a_symlink_resolving_to_the_same_type() {
        let (dir, target) = scratch_dir_with_target("real.md");
        let link = dir.path().join("shortcut.md");
        if !make_symlink(&target, &link) {
            eprintln!("skipping: symlinks unavailable without developer mode");
            return;
        }

        assert_eq!(read_file_content(&link).unwrap(), "payload");
    }

    #[test]
    fn leaves_plain_files_untouched() {
        let (_dir, target) = scratch_dir_with_target("plain.md");
        assert_eq!(read_file_content(&target).unwrap(), "payload");
    }

    #[test]
    fn rejects_document_paths_never_authorized_by_the_user() {
        let (_dir, target) = scratch_dir_with_target("stranger.md");
        let err = ensure_authorized(&target).unwrap_err();
        assert!(matches!(err, AppError::SecurityViolation(_)));
    }

    #[test]
    fn allows_document_paths_after_explicit_authorization() {
        let (_dir, target) = scratch_dir_with_target("picked.md");
        authorize_path(&target).unwrap();
        assert!(ensure_authorized(&target).is_ok());
    }

    #[test]
    fn authorization_survives_a_renamed_but_canonical_equal_path() {
        let (dir, target) = scratch_dir_with_target("canonical.md");
        authorize_path(&target).unwrap();
        // Same file addressed through a redundant component-free alias
        let alias = dir.path().join(".").join("canonical.md");
        assert!(ensure_authorized(&alias).is_ok());
    }
}

