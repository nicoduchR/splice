# Test Video Fixtures

This directory contains **minimal test video files** for FFmpeg validation tests.

## 📦 Total Size: ~48KB

These fixtures are intentionally **very small** (< 50KB total) so they can be safely committed to Git without bloating the repository.

## 📹 Files

### Valid Codecs (should pass validation)
- **`sample-h264.mp4`** (~14KB) - H.264 codec, 2 seconds, 320x240
- **`sample-h265.mov`** (~7KB) - H.265/HEVC codec, 1 second, 320x240
- **`sample-h265.mp4`** (~7KB) - H.265/HEVC codec, 1 second, 320x240

### Invalid Codecs (should be rejected)
- **`sample-vp9.webm`** (~11KB) - VP9 codec (unsupported), should trigger `UnsupportedVideoCodec`

### Corrupted Files (should be rejected)
- **`corrupted.mp4`** (~69B) - Fake data, should trigger `VideoCorrupted`

## 🔄 Regenerating Fixtures

If you need to regenerate these files:

```bash
cd apps/desktop/src-tauri/test-assets/fixtures
./generate-minimal-videos.sh
```

**Requirements:** FFmpeg must be installed
- macOS: `brew install ffmpeg`
- Windows: Download from https://ffmpeg.org/

## 🎯 Usage in Tests

```rust
#[tokio::test]
async fn test_h264_validation() {
    let service = FfmpegService::new();
    let app = tauri::test::mock_app();

    let result = service.probe_video_format(
        &app,
        "test-assets/fixtures/sample-h264.mp4"
    ).await;

    assert!(result.is_ok());
    let metadata = result.unwrap();
    assert_eq!(metadata.codec_name, "h264");
}
```

## ✅ Why These Are Committed to Git

1. **Tiny size** - Only 48KB total (less than a single PNG image)
2. **No copyright issues** - Generated with FFmpeg's `testsrc` filter
3. **Reproducible tests** - Everyone tests with identical files
4. **CI/CD ready** - Tests work immediately after `git clone`
5. **No external dependencies** - No need to download fixtures separately

## 📝 Notes

- Videos use FFmpeg's synthetic `testsrc` pattern (no real content)
- Encoded with `ultrafast` preset and high CRF (40) for minimal size
- Duration kept to 1-2 seconds only
- Resolution limited to 320x240
- Marked as binary in `.gitattributes` to prevent diff attempts
