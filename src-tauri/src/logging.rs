use regex::Regex;
use std::path::PathBuf;
use std::sync::OnceLock;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

static BEARER_REGEX: OnceLock<Regex> = OnceLock::new();
static HEX_KEY_REGEX: OnceLock<Regex> = OnceLock::new();

/// Redacts API keys and sensitive tokens from log messages.
pub fn redact_secrets(input: &str) -> String {
    let bearer_re = BEARER_REGEX.get_or_init(|| {
        Regex::new(r"(?i)bearer\s+([a-zA-Z0-9_\-\.]{16,})").expect("valid bearer regex")
    });
    let hex_key_re = HEX_KEY_REGEX.get_or_init(|| {
        Regex::new(r"\b([a-fA-F0-9]{32})\b").expect("valid hex key regex")
    });

    // Redact bearer tokens
    let step1 = bearer_re.replace_all(input, |caps: &regex::Captures| {
        let token = &caps[1];
        if token.len() > 8 {
            format!("Bearer {}...{}", &token[..4], &token[token.len() - 3..])
        } else {
            "Bearer [REDACTED]".to_string()
        }
    });

    // Redact 32-char hex keys (like our KIE AI key)
    let step2 = hex_key_re.replace_all(&step1, |caps: &regex::Captures| {
        let key = &caps[1];
        format!("{}...{}", &key[..4], &key[key.len() - 3..])
    });

    step2.to_string()
}

/// Initializes tracing subscriber with live terminal output and daily rolling file appender.
pub fn init_tracing() -> Result<Option<WorkerGuard>, Box<dyn std::error::Error>> {
    let log_dir = dirs::data_local_dir()
        .map(|p| p.join("Docuopsy").join("logs"))
        .unwrap_or_else(|| PathBuf::from("./logs"));

    std::fs::create_dir_all(&log_dir)?;

    let file_appender = tracing_appender::rolling::daily(&log_dir, "docuopsy.log");
    let (non_blocking_file, guard) = tracing_appender::non_blocking(file_appender);

    let env_filter = EnvFilter::try_from_default_env()
        .or_else(|_| EnvFilter::try_new("info,docuopsy=debug"))?;

    let stdout_layer = fmt::layer()
        .with_ansi(true)
        .with_target(true);

    let file_layer = fmt::layer()
        .with_ansi(false)
        .with_writer(non_blocking_file)
        .with_target(true);

    tracing_subscriber::registry()
        .with(env_filter)
        .with(stdout_layer)
        .with(file_layer)
        .try_init()
        .ok(); // allow multiple init calls in test suites

    tracing::info!("Tracing initialized. Log directory: {:?}", log_dir);
    Ok(Some(guard))
}

