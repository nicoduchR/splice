// Integration test for transcription workflow
// Note: These tests require the Parakeet model to be downloaded first

#[cfg(test)]
mod transcription_integration_tests {
    use std::path::PathBuf;

    #[tokio::test]
    async fn test_audio_extraction_pipeline() {
        // This test verifies the audio extraction works with test fixtures
        let test_video = PathBuf::from("test-assets/fixtures/sample-h264.mp4");

        if !test_video.exists() {
            eprintln!("⚠️  Skipping test: test video fixture not found");
            return;
        }

        let output_wav = PathBuf::from("/tmp/test_audio_integration.wav");

        // Import the AudioExtractor from the crate
        use splice::infrastructure::adapters::AudioExtractor;

        let result = AudioExtractor::extract_audio(&test_video, &output_wav).await;
        assert!(result.is_ok(), "Audio extraction should succeed: {:?}", result.err());

        // Verify output file exists
        assert!(
            output_wav.exists(),
            "Output WAV file should exist after extraction"
        );

        // Load and verify audio data
        let load_result = AudioExtractor::load_wav_as_f32(&output_wav);
        assert!(load_result.is_ok(), "WAV loading should succeed: {:?}", load_result.err());

        let (samples, sample_rate, channels) = load_result.unwrap();

        // Verify format
        assert_eq!(sample_rate, 16000, "Sample rate should be 16kHz");
        assert_eq!(channels, 1, "Should be mono (1 channel)");
        assert!(!samples.is_empty(), "Should have audio samples");

        // Verify all samples are normalized
        for (i, sample) in samples.iter().enumerate() {
            assert!(
                *sample >= -1.0 && *sample <= 1.0,
                "Sample {} out of range: {}",
                i,
                sample
            );
        }

        // Cleanup
        std::fs::remove_file(&output_wav).ok();

        println!("✅ Audio extraction pipeline test passed");
    }

    #[tokio::test]
    async fn test_full_transcription_workflow() {
        // This test verifies the full transcription workflow (requires model)
        let model_dir = dirs::home_dir()
            .unwrap()
            .join(".splice")
            .join("models")
            .join("parakeet-tdt-0.6b-v3");

        if !model_dir.exists() {
            eprintln!("⚠️  Skipping test: Parakeet model not downloaded");
            eprintln!("   Run the model download first to enable this test");
            return;
        }

        let test_video = PathBuf::from("test-assets/fixtures/sample-h264.mp4");

        if !test_video.exists() {
            eprintln!("⚠️  Skipping test: test video fixture not found");
            return;
        }

        // Import necessary types
        use splice::infrastructure::adapters::{AudioExtractor, ParakeetTranscriptionService};
        use splice::application::ports::transcription_service::TranscriptionService;

        // Step 1: Extract audio
        let temp_wav = PathBuf::from("/tmp/test_transcription_full.wav");
        AudioExtractor::extract_audio(&test_video, &temp_wav)
            .await
            .expect("Audio extraction failed");

        // Step 2: Load audio
        let (audio_samples, sample_rate, channels) =
            AudioExtractor::load_wav_as_f32(&temp_wav).expect("WAV loading failed");

        // Step 3: Transcribe
        let service = ParakeetTranscriptionService;
        let result = service
            .transcribe_audio(
                audio_samples,
                sample_rate,
                channels,
                "test-video-123".to_string(),
            )
            .await;

        // Cleanup
        std::fs::remove_file(&temp_wav).ok();

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
        // Note: Parakeet TDT v3 via parakeet-rs doesn't expose per-word confidence,
        // so all words have default confidence of 1.0
        for (i, word) in transcription.words.iter().enumerate() {
            assert!(
                word.confidence >= 0.0 && word.confidence <= 1.0,
                "Word {} confidence {} should be in range [0.0, 1.0]",
                i,
                word.confidence
            );
            // Currently all words have confidence 1.0 due to parakeet-rs API limitation
            assert_eq!(
                word.confidence, 1.0,
                "Word {} confidence should be 1.0 (parakeet-rs default)",
                i
            );
        }

        println!("✅ Full transcription workflow test passed");
        println!("   Transcribed {} words", transcription.words.len());
        println!("   Duration: {:.2}s", transcription.duration_seconds);
    }
}
