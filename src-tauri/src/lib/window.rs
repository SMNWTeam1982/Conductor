use tauri::{AppHandle, LogicalSize, Manager, PhysicalSize, WebviewUrl, WebviewWindowBuilder};

pub fn calculate_window_size(app: &AppHandle) -> (f64, f64) {
    let monitor = app.app_handle().primary_monitor().ok().flatten();

    let (width, height) = if let Some(monitor) = monitor {
        let monitor_size = PhysicalSize {
            width: monitor.size().width as f64,
            height: monitor.size().height as f64,
        };
        let size: LogicalSize<f64> =
            LogicalSize::from_physical(monitor_size, monitor.scale_factor());
        (size.width * 0.7906295754026355, size.height * 0.42)
    } else {
        (581.0 * 2.0, 201.0 * 2.0)
    };
    return (width, height);
}

#[tauri::command]
pub fn create_console_window(app: AppHandle) -> Result<(), String> {
    if app.get_webview_window("console").is_some() {
        return Err(format!("Console Window already exists."));
    }

    WebviewWindowBuilder::new(
        &app,
        "console",
        WebviewUrl::App("index.html#console".into()),
    )
    .title("Conductor - Robot Console")
    .min_inner_size(820.0, 320.0)
    .inner_size(820.0, 320.0)
    .resizable(true)
    .build()
    .expect("Failed to create console window");

    Ok(())
}
