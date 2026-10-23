use tauri::{Manager, Runtime};
use tauri_plugin_sql::{Migration, MigrationKind};

/// 把 AI 对话子 webview 的 prefers-color-scheme 同步为外壳主题：
/// dark/light 强制指定，None 交还系统跟随。豆包等站点"跟随系统"的默认主题据此切换。
#[tauri::command]
fn set_chat_webviews_theme<R: Runtime>(app: tauri::AppHandle<R>, theme: Option<String>) {
    for (label, webview) in app.webview_windows() {
        if !label.starts_with("ai-chat-embed-") {
            continue;
        }
        #[cfg(windows)]
        {
            let theme = theme.clone();
            let _ = webview.with_webview(move |platform| {
                set_windows_webview_theme(&platform, theme.as_deref());
            });
        }
        #[cfg(not(windows))]
        {
            let _ = (&label, &webview, &theme);
        }
    }
}

/// Tauri 未暴露子 webview 的主题 API，这里借 with_webview 的平台句柄
/// 直接调 WebView2 Profile::SetPreferredColorScheme（与 wry 内部实现一致）。
#[cfg(windows)]
fn set_windows_webview_theme(platform: &tauri::webview::PlatformWebview, theme: Option<&str>) {
    use webview2_com::Microsoft::Web::WebView2::Win32::{
        ICoreWebView2, ICoreWebView2_13, COREWEBVIEW2_PREFERRED_COLOR_SCHEME_AUTO,
        COREWEBVIEW2_PREFERRED_COLOR_SCHEME_DARK, COREWEBVIEW2_PREFERRED_COLOR_SCHEME_LIGHT,
    };
    use windows::core::Interface;

    let scheme = match theme {
        Some("dark") => COREWEBVIEW2_PREFERRED_COLOR_SCHEME_DARK,
        Some("light") => COREWEBVIEW2_PREFERRED_COLOR_SCHEME_LIGHT,
        _ => COREWEBVIEW2_PREFERRED_COLOR_SCHEME_AUTO,
    };
    if let Ok(core) = platform.controller().cast::<ICoreWebView2>() {
        if let Ok(profile_host) = core.cast::<ICoreWebView2_13>() {
            if let Ok(profile) = unsafe { profile_host.Profile() } {
                let _ = unsafe { profile.SetPreferredColorScheme(scheme) };
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // AI 对话入口表：内置入口由前端在启动时以 INSERT OR IGNORE 播种（保持 TS 单一数据源），
    // 自定义/启停状态全部落在这一张表里
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_ai_entries",
            sql: "CREATE TABLE ai_entries (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                color TEXT NOT NULL,
                logo TEXT,
                sort INTEGER NOT NULL DEFAULT 0,
                enabled INTEGER NOT NULL DEFAULT 1,
                origin TEXT NOT NULL DEFAULT 'custom'
              )",
            kind: MigrationKind::Up,
        },
        // 网站导航：预设站点首次由前端播种（app_meta 打标记防止重复播种覆盖用户删除），
        // 站点与自定义分类均为整表读写
        Migration {
            version: 2,
            description: "create_website_sites",
            sql: "CREATE TABLE website_sites (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                category TEXT NOT NULL,
                sort INTEGER NOT NULL DEFAULT 0
              )",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_website_categories",
            sql: "CREATE TABLE website_categories (
                name TEXT PRIMARY KEY,
                sort INTEGER NOT NULL DEFAULT 0
              )",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "create_app_meta",
            sql: "CREATE TABLE app_meta (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
              )",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "add_ai_entries_pinned",
            sql: "ALTER TABLE ai_entries ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:my-tools.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![set_chat_webviews_theme])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
