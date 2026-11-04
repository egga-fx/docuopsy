use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub enum LayoutMode {
    #[default]
    Split,
    FullEditor,
    FullPreview,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TabState {
    pub id: String,
    pub file_path: Option<String>,
    pub title: String,
    pub is_dirty: bool,
    pub cursor_line: u32,
    pub cursor_col: u32,
    pub scroll_top: f64,
    pub draft_path: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppSession {
    pub version: u32,
    pub active_tab_id: String,
    pub layout_mode: LayoutMode,
    pub split_ratio: f32,
    pub theme: Option<String>,
    pub tabs: Vec<TabState>,
}

impl Default for AppSession {
    fn default() -> Self {
        let initial_tab_id = "initial-scratch-tab".to_string();
        Self {
            version: 1,
            active_tab_id: initial_tab_id.clone(),
            layout_mode: LayoutMode::Split,
            split_ratio: 0.50,
            theme: Some("dark".to_string()),
            tabs: vec![TabState {
                id: initial_tab_id,
                file_path: None,
                title: "Untitled-1".to_string(),
                is_dirty: false,
                cursor_line: 1,
                cursor_col: 1,
                scroll_top: 0.0,
                draft_path: None,
            }],
        }
    }
}

