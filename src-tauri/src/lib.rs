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
use commands::fs::{
    allow_paths, pick_file_to_open, pick_file_to_save, read_document, read_document_bytes,
    save_document,
};
use commands::logging::log_event;
use commands::state::{load_draft, load_session, remove_draft, save_draft, save_session};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _log_guard = logging::init_tracing();

    tauri::Builder::default()
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let monitor_opt = window
                    .current_monitor()
                    .ok()
                    .flatten()
                    .or_else(|| window.primary_monitor().ok().flatten());

                if let Some(monitor) = monitor_opt {
                    let size = monitor.size();
                    let target_w = (size.width as f64 * 0.70).round() as u32;
                    let target_h = (size.height as f64 * 0.70).round() as u32;

                    let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                        width: target_w,
                        height: target_h,
                    }));
                    let _ = window.center();
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            read_document,
            read_document_bytes,
            save_document,
            allow_paths,
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
