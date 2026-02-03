// Integration test for transcription workflow
// Note: These tests require FFmpeg and optionally the FluidAudio sidecar

#[cfg(test)]
mod transcription_integration_tests {
    use std::path::PathBuf;

    #[tokio::test]
    async fn test_audio_extraction_pipeline() {
        // This test verifies the audio extraction works with test fixtures
        // Uses sample-h264-audio.mp4 which has both video and audio tracks
        let test_video = PathBuf::from("test-assets/fixtures/sample-h264-audio.mp4");

        if !test_video.exists() {
            eprintln!("⚠️  Skipping test: test video fixture not found");
            return;
        }

        let output_wav = PathBuf::from("/tmp/test_audio_integration.wav");

        // Import the AudioExtractor from the crate
        use splice::infrastructure::adapters::AudioExtractor;

        let result = AudioExtractor::extract_audio(&test_video, &output_wav).await;
        assert!(result.is_ok(), "Audio extraction should succeed: {:?}", result.err());

        // Verify output file exists and has content
        assert!(
            output_wav.exists(),
            "Output WAV file should exist after extraction"
        );

        let metadata = std::fs::metadata(&output_wav).unwrap();
        assert!(metadata.len() > 0, "Output WAV file should have content");

        // Cleanup
        std::fs::remove_file(&output_wav).ok();

        println!("✅ Audio extraction pipeline test passed");
    }

    #[tokio::test]
    async fn test_full_transcription_workflow() {
        // This test verifies the full transcription workflow
        // Requires: FFmpeg + FluidAudio sidecar binary + test video fixture with audio
        let test_video = PathBuf::from("test-assets/fixtures/sample-h264-audio.mp4");

        if !test_video.exists() {
            eprintln!("⚠️  Skipping test: test video fixture not found");
            return;
        }

        use splice::infrastructure::adapters::{AudioExtractor, FluidAudioTranscriptionService};
        use splice::application::ports::transcription_service::TranscriptionService;
        use std::path::Path;

        // Step 1: Extract audio
        let temp_wav = PathBuf::from("/tmp/test_transcription_full.wav");
        let extract_result = AudioExtractor::extract_audio(&test_video, &temp_wav).await;
        if extract_result.is_err() {
            eprintln!("⚠️  Skipping test: audio extraction failed (FFmpeg not available?)");
            return;
        }

        // Step 2: Transcribe using FluidAudio service (file-based API)
        let service = FluidAudioTranscriptionService;
        let result = service
            .transcribe_file(
                Path::new(&temp_wav),
                "test-video-123".to_string(),
            )
            .await;

        // Cleanup
        std::fs::remove_file(&temp_wav).ok();

        // FluidAudio sidecar may not be available in CI
        if let Err(ref e) = result {
            let err_str = e.to_string();
            if err_str.contains("Impossible de lancer") || err_str.contains("No such file") {
                eprintln!("⚠️  Skipping test: FluidAudio sidecar not available");
                return;
            }
        }

        assert!(result.is_ok(), "Transcription should succeed: {:?}", result.err());

        let transcription = result.unwrap();

        // Verify result structure
        assert_eq!(transcription.video_id, "test-video-123");
        assert!(!transcription.text.is_empty(), "Text should not be empty");
        assert!(!transcription.words.is_empty(), "Should have words with timestamps");

        // Verify word timestamps are increasing
        for i in 1..transcription.words.len() {
            assert!(
                transcription.words[i].start >= transcription.words[i - 1].start,
                "Word timestamps should be increasing"
            );
        }

        // Verify confidence scores are present and valid
        for (i, word) in transcription.words.iter().enumerate() {
            assert!(
                word.confidence >= 0.0 && word.confidence <= 1.0,
                "Word {} confidence {} should be in range [0.0, 1.0]",
                i,
                word.confidence
            );
        }

        println!("✅ Full transcription workflow test passed");
        println!("   Transcribed {} words", transcription.words.len());
        println!("   Duration: {:.2}s", transcription.duration_seconds);
    }
}
