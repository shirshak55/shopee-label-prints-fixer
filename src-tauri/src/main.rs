#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
#![feature(path_try_exists)]

use std::process::Command;
use std::{os::windows::process::CommandExt, path::PathBuf, process::Stdio};

fn main() {
    let file_appender =
        tracing_appender::rolling::never(std::env::current_dir().unwrap().as_path(), "gui.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);
    //  tracing_subscriber::fmt().with_writer(non_blocking).init();
    tracing_subscriber::fmt()
        .with_writer(std::io::stdout)
        .init();

    std::thread::spawn(move || {
        handle_webserver();
    });

    tracing::info!("Starting the gui");
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|argv, cwd| {
            tracing::info!("{argv:?}, {cwd}");
        }))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn handle_webserver() {
    tracing::info!("Starting to run webserver");
    let nodejs_main_file = folder_finder("webserver");

    if nodejs_main_file.is_none() {
        tracing::info!("Node JS main.js file not found {:?}", nodejs_main_file);
        return ();
    }

    let mut nodejs_main_file = nodejs_main_file.unwrap();
    tracing::info!("Node JS main file {:?}", nodejs_main_file);
    nodejs_main_file.pop();
    nodejs_main_file.push("webserver");
    nodejs_main_file.push("dist");
    nodejs_main_file.push("main.js");

    let nodejs_main_file = &*nodejs_main_file.to_string_lossy();
    tracing::info!("Node JS File {}", nodejs_main_file);

    if std::fs::try_exists(nodejs_main_file).is_err() {
        tracing::error!("Invalid node js file");
        return ();
    };

    let cwd = folder_finder("webserver");

    if cwd.is_none() {
        tracing::info!("Webserver folder not found");
        return ();
    }
    let cwd = cwd.unwrap();

    tracing::info!(current_working_dir = ?cwd, "Current Working Dir");

    let mut killer = Command::new("wmic")
        .args([
            "process",
            "where",
            "name like '%node%' and commandline like '%main%'",
            "delete",
        ])
        .spawn()
        .unwrap();

    let _ = killer.wait();

    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let child = Command::new("node")
        .arg(nodejs_main_file)
        .current_dir(cwd)
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .creation_flags(CREATE_NO_WINDOW)
        .spawn();

    if child.is_err() {
        tracing::error!("Unable to spawn child process");
    }

    let mut child = child.unwrap();
    tracing::info!("starting node.js process & waiting for it");

    ctrlc::set_handler(move || {
        let _ = child.kill();
    })
    .expect("Error setting Ctrl-C handler");

    tracing::error!("Web server stopped");
}

fn folder_finder(folder_name: &str) -> Option<PathBuf> {
    let mut cwd = std::env::current_dir().unwrap();
    for _ in 0..30 {
        cwd.push(folder_name);
        if cwd.exists() {
            return Some(cwd);
        }
        cwd.pop();
        cwd.pop();

        tracing::info!("tryin to file foldername {} using {:?}", folder_name, cwd);
        if cwd.ends_with("/") {
            break;
        }
    }

    None
}
