use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    webview::WebviewWindowBuilder,
    AppHandle, Manager, WindowEvent,
};

struct AppState {
    is_blocked: Mutex<bool>,
    was_main_visible: Mutex<bool>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn create_blocked_window(app: &AppHandle) -> Result<(), String> {
    if app.get_webview_window("blocked").is_none() {
        WebviewWindowBuilder::new(
            app,
            "blocked",
            tauri::WebviewUrl::App("index.html#/blocked".into()),
        )
        .title("Monexa - Blocked")
        .fullscreen(true)
        .always_on_top(true)
        .decorations(false)
        .resizable(false)
        .visible(true)
        .build()
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn toggle_block_window(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    blocked: bool,
) -> Result<(), String> {
    let mut is_blocked = state.is_blocked.lock().unwrap();
    *is_blocked = blocked;

    if blocked {
        // Hide main window and remember visibility
        if let Some(main_window) = app.get_webview_window("main") {
            let visible = main_window.is_visible().unwrap_or(true);
            let mut was_visible = state.was_main_visible.lock().unwrap();
            *was_visible = visible;
            let _ = main_window.hide();
        }
        create_blocked_window(&app)?;
    } else {
        // Close blocked window
        if let Some(blocked_window) = app.get_webview_window("blocked") {
            let _ = blocked_window.close();
        }

        // Show main window only if it was visible before
        let was_visible = *state.was_main_visible.lock().unwrap();
        if was_visible {
            if let Some(main_window) = app.get_webview_window("main") {
                let _ = main_window.show();
                let _ = main_window.set_focus();
            }
        }
    }
    Ok(())
}

#[tauri::command]
async fn close_secondary_windows(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    // Reset blocked state to prevent self-healing from re-opening windows
    let mut is_blocked = state.is_blocked.lock().unwrap();
    *is_blocked = false;

    for window in app.webview_windows().values() {
        if window.label() != "main" {
            let _ = window.close();
        }
    }

    // Restore main window only if it was visible
    let was_visible = *state.was_main_visible.lock().unwrap();
    if was_visible {
        if let Some(main_window) = app.get_webview_window("main") {
            let _ = main_window.show();
            let _ = main_window.set_focus();
        }
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            is_blocked: Mutex::new(false),
            was_main_visible: Mutex::new(true), // Starts visible by default
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            let open_i = MenuItem::with_id(app, "open", "Open Monexa", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            let app = window.app_handle();
            let state = app.state::<AppState>();
            let is_blocked = *state.is_blocked.lock().unwrap();

            match event {
                WindowEvent::CloseRequested { api, .. } => {
                    if window.label() == "main" {
                        api.prevent_close();
                        window.hide().unwrap();
                    } else if window.label() == "blocked" && is_blocked {
                        // Prevent Alt+F4/Close on the blocked window
                        api.prevent_close();
                    }
                }
                WindowEvent::Destroyed => {
                    if window.label() == "blocked" && is_blocked {
                        // If the window was somehow destroyed while still blocked, recreate it.
                        let app_handle = app.clone();
                        let _ = create_blocked_window(&app_handle);
                    }
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            toggle_block_window,
            close_secondary_windows
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
