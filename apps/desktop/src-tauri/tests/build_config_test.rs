// Story 1.8 - macOS Universal Binary Build Configuration Tests
use std::path::Path;
use std::fs;

#[test]
fn test_tauri_config_exists() {
    let config_path = Path::new(env!("CARGO_MANIFEST_DIR")).join("tauri.conf.json");
    assert!(
        config_path.exists(),
        "tauri.conf.json should exist at {:?}",
        config_path
    );
}

#[test]
fn test_tauri_config_has_macos_settings() {
    let config_path = Path::new(env!("CARGO_MANIFEST_DIR")).join("tauri.conf.json");
    let config_content = fs::read_to_string(config_path)
        .expect("Failed to read tauri.conf.json");

    // Verify macOS section exists
    assert!(
        config_content.contains("\"macOS\""),
        "Config should have macOS section"
    );

    // Verify minimum system version
    assert!(
        config_content.contains("\"minimumSystemVersion\""),
        "Config should specify minimumSystemVersion"
    );

    assert!(
        config_content.contains("\"13.0\""),
        "Minimum system version should be 13.0 (Ventura)"
    );
}

#[test]
fn test_tauri_config_product_name() {
    let config_path = Path::new(env!("CARGO_MANIFEST_DIR")).join("tauri.conf.json");
    let config_content = fs::read_to_string(config_path)
        .expect("Failed to read tauri.conf.json");

    assert!(
        config_content.contains("\"productName\": \"Splice\""),
        "Product name should be 'Splice' (capitalized)"
    );
}

#[test]
fn test_tauri_config_bundle_identifier() {
    let config_path = Path::new(env!("CARGO_MANIFEST_DIR")).join("tauri.conf.json");
    let config_content = fs::read_to_string(config_path)
        .expect("Failed to read tauri.conf.json");

    assert!(
        config_content.contains("\"identifier\": \"com.splice.app\""),
        "Bundle identifier should be com.splice.app"
    );
}

#[test]
fn test_ffmpeg_aarch64_binary_exists() {
    let binary_path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("binaries/ffmpeg-aarch64-apple-darwin");

    assert!(
        binary_path.exists(),
        "FFmpeg aarch64 binary should exist at {:?}",
        binary_path
    );

    // Check if executable
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let metadata = fs::metadata(&binary_path).expect("Failed to get binary metadata");
        let permissions = metadata.permissions();
        assert!(
            permissions.mode() & 0o111 != 0,
            "FFmpeg aarch64 binary should be executable"
        );
    }
}

#[test]
fn test_ffprobe_aarch64_binary_exists() {
    let binary_path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("binaries/ffprobe-aarch64-apple-darwin");

    assert!(
        binary_path.exists(),
        "FFprobe aarch64 binary should exist at {:?}",
        binary_path
    );

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let metadata = fs::metadata(&binary_path).expect("Failed to get binary metadata");
        let permissions = metadata.permissions();
        assert!(
            permissions.mode() & 0o111 != 0,
            "FFprobe aarch64 binary should be executable"
        );
    }
}

#[test]
fn test_ffmpeg_x86_64_binary_exists() {
    let binary_path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("binaries/ffmpeg-x86_64-apple-darwin");

    assert!(
        binary_path.exists(),
        "FFmpeg x86_64 binary should exist at {:?}",
        binary_path
    );

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let metadata = fs::metadata(&binary_path).expect("Failed to get binary metadata");
        let permissions = metadata.permissions();
        assert!(
            permissions.mode() & 0o111 != 0,
            "FFmpeg x86_64 binary should be executable"
        );
    }
}

#[test]
fn test_ffprobe_x86_64_binary_exists() {
    let binary_path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("binaries/ffprobe-x86_64-apple-darwin");

    assert!(
        binary_path.exists(),
        "FFprobe x86_64 binary should exist at {:?}",
        binary_path
    );

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let metadata = fs::metadata(&binary_path).expect("Failed to get binary metadata");
        let permissions = metadata.permissions();
        assert!(
            permissions.mode() & 0o111 != 0,
            "FFprobe x86_64 binary should be executable"
        );
    }
}

#[test]
fn test_external_bin_config_includes_both_architectures() {
    let config_path = Path::new(env!("CARGO_MANIFEST_DIR")).join("tauri.conf.json");
    let config_content = fs::read_to_string(config_path)
        .expect("Failed to read tauri.conf.json");

    // Verify all architecture-specific binaries are listed
    assert!(
        config_content.contains("binaries/ffmpeg-aarch64-apple-darwin"),
        "Config should include ffmpeg aarch64 binary"
    );
    assert!(
        config_content.contains("binaries/ffprobe-aarch64-apple-darwin"),
        "Config should include ffprobe aarch64 binary"
    );
    assert!(
        config_content.contains("binaries/ffmpeg-x86_64-apple-darwin"),
        "Config should include ffmpeg x86_64 binary"
    );
    assert!(
        config_content.contains("binaries/ffprobe-x86_64-apple-darwin"),
        "Config should include ffprobe x86_64 binary"
    );
}

#[test]
fn test_bundle_targets_include_dmg() {
    let config_path = Path::new(env!("CARGO_MANIFEST_DIR")).join("tauri.conf.json");
    let config_content = fs::read_to_string(config_path)
        .expect("Failed to read tauri.conf.json");

    assert!(
        config_content.contains("\"dmg\""),
        "Bundle targets should include dmg for macOS"
    );
}

#[test]
fn test_icon_icns_exists() {
    let icon_path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("icons/icon.icns");

    assert!(
        icon_path.exists(),
        "macOS icon file icon.icns should exist at {:?}",
        icon_path
    );
}
