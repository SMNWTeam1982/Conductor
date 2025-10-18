use tauri::{AppHandle, LogicalSize, Manager, PhysicalSize};

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
