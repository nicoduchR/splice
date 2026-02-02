import Foundation
import FluidAudio

// MARK: - Output Types

struct WordTimestamp: Codable {
    let text: String
    let start: Double
    let end: Double
    let confidence: Double
}

struct TranscriptionOutput: Codable {
    let text: String
    let words: [WordTimestamp]
    let duration_seconds: Double
    let language: String
}

struct ProgressUpdate: Codable {
    let stage: String
    let progress: Double
    let message: String
}

// MARK: - Helpers

func emitProgress(_ stage: String, _ progress: Double, _ message: String) {
    let update = ProgressUpdate(stage: stage, progress: progress, message: message)
    if let data = try? JSONEncoder().encode(update),
       let json = String(data: data, encoding: .utf8) {
        FileHandle.standardError.write(Data((json + "\n").utf8))
    }
}

func exitWithError(_ message: String) -> Never {
    let errorOutput: [String: String] = ["error": message]
    if let data = try? JSONSerialization.data(withJSONObject: errorOutput),
       let json = String(data: data, encoding: .utf8) {
        FileHandle.standardError.write(Data((json + "\n").utf8))
    }
    exit(1)
}

// MARK: - Main

func run() async {
    let args = CommandLine.arguments

    // Parse command: fluidaudio-sidecar transcribe <audio.wav> [--output json]
    guard args.count >= 3, args[1] == "transcribe" else {
        exitWithError("Usage: fluidaudio-sidecar transcribe <audio.wav> [--output json]")
    }

    let audioPath = args[2]

    guard FileManager.default.fileExists(atPath: audioPath) else {
        exitWithError("Audio file not found: \(audioPath)")
    }

    let audioURL = URL(fileURLWithPath: audioPath)

    do {
        // Step 1: Download and load CoreML models (cached after first run)
        emitProgress("loading_model", 0.1, "Downloading/loading CoreML model...")
        let models = try await AsrModels.downloadAndLoad(version: .v3)

        // Step 2: Initialize ASR manager
        emitProgress("initializing", 0.3, "Initializing ASR engine...")
        let asrManager = AsrManager(config: .default)
        try await asrManager.initialize(models: models)

        // Step 3: Transcribe
        emitProgress("transcribing", 0.4, "Transcribing audio...")
        let result = try await asrManager.transcribe(audioURL, source: .system)

        emitProgress("processing", 0.9, "Processing results...")

        // Step 4: Convert tokenTimings to our output format
        var words: [WordTimestamp] = []

        if let timings = result.tokenTimings {
            words = timings.map { timing in
                WordTimestamp(
                    text: timing.token,
                    start: timing.startTime,
                    end: timing.endTime,
                    confidence: Double(timing.confidence)
                )
            }
        }

        let output = TranscriptionOutput(
            text: result.text,
            words: words,
            duration_seconds: result.duration,
            language: "en"
        )

        // Output JSON to stdout
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        let jsonData = try encoder.encode(output)
        if let jsonString = String(data: jsonData, encoding: .utf8) {
            print(jsonString)
        }

        emitProgress("completed", 1.0, "Transcription complete")

    } catch {
        exitWithError("Transcription failed: \(error.localizedDescription)")
    }
}

// Entry point
if #available(macOS 14.0, *) {
    await run()
} else {
    exitWithError("macOS 14.0+ required for FluidAudio CoreML")
}
