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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _log_guard = logging::init_tracing().ok().flatten();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::fs::read_document,
            commands::fs::save_document,
            commands::state::save_session,
            commands::state::load_session,
            commands::state::save_draft,
            commands::state::load_draft,
            commands::state::remove_draft,
            commands::ai::ai_generate_stream,
            commands::logging::log_event,
        ])
        .run(tauri::generate_context!())
        .expect("error while running docuopsy application");
}
