pub mod commands;
pub mod error;
pub mod logging;
pub mod models;
pub mod services;

#[cfg(test)]
#[path = "tests/smoke_test.rs"]
mod smoke_test;

#[cfg(test)]
#[path = "tests/logging_test.rs"]
mod logging_test;

#[cfg(test)]
#[path = "tests/fs_security_test.rs"]
mod fs_security_test;

#[cfg(test)]
#[path = "tests/persistence_test.rs"]
mod persistence_test;

#[cfg(test)]
#[path = "tests/ai_stream_test.rs"]
mod ai_stream_test;

use commands::ai::ai_generate_stream;
use commands::fs::{pick_file_to_open, pick_file_to_save, read_document, save_document};
use commands::logging::log_event;
use commands::state::{load_draft, load_session, remove_draft, save_draft, save_session};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|_app| {
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            read_document,
            save_document,
            pick_file_to_open,
            pick_file_to_save,
            save_session,
            load_session,
            save_draft,
            load_draft,
            remove_draft,
            ai_generate_stream,
            log_event
        ])
        .run(tauri::generate_context!())
        .expect("error while running docuopsy application");
}
