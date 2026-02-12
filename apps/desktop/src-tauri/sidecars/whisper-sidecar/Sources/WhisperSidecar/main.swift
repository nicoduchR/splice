import Foundation
import FluidAudio

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

func normalizeLanguage(_ language: String) -> String {
    let lower = language.lowercased()
    if ["fr", "en", "auto"].contains(lower) {
        return lower
    }
    return "auto"
}

func detectLanguageFromText(_ text: String) -> String {
    let frStopwords: Set<String> = [
        "le", "la", "les", "de", "des", "du", "un", "une", "et", "en",
        "que", "qui", "dans", "pour", "pas", "est", "je", "tu", "il", "elle",
        "on", "nous", "vous", "ils", "elles", "au", "aux", "ce", "cette",
        "sur", "avec", "mais", "donc", "ou", "car"
    ]
    let enStopwords: Set<String> = [
        "the", "a", "an", "and", "or", "to", "of", "in", "on", "for",
        "is", "are", "was", "were", "be", "been", "this", "that", "these",
        "those", "with", "but", "so", "because", "as", "if", "i", "you",
        "he", "she", "we", "they", "it", "do", "does", "did", "not"
    ]

    var frHits = 0
    var enHits = 0

    let tokens = text.lowercased().split(separator: " ")
    for rawToken in tokens {
        let token = rawToken.trimmingCharacters(in: CharacterSet.letters.inverted)
        if token.isEmpty { continue }
        if frStopwords.contains(token) { frHits += 1 }
        if enStopwords.contains(token) { enHits += 1 }
    }

    let total = frHits + enHits
    if total < 3 {
        return "auto"
    }

    let confidence = Double(max(frHits, enHits)) / Double(total)
    if confidence < 0.65 {
        return "auto"
    }

    return frHits >= enHits ? "fr" : "en"
}

func run() async {
    let args = CommandLine.arguments

    guard args.count >= 3, args[1] == "transcribe" else {
        exitWithError("Usage: whisper-sidecar transcribe <audio.wav> [--language fr|en|auto] [--profile fast] [--output json]")
    }

    let audioPath = args[2]
    var language = "auto"
    var profile = "fast"
    var output = "json"

    var i = 3
    while i < args.count {
        let flag = args[i]
        switch flag {
        case "--language":
            guard i + 1 < args.count else {
                exitWithError("Missing value for --language")
            }
            language = args[i + 1]
            i += 2
        case "--profile":
            guard i + 1 < args.count else {
                exitWithError("Missing value for --profile")
            }
            profile = args[i + 1]
            i += 2
        case "--output":
            guard i + 1 < args.count else {
                exitWithError("Missing value for --output")
            }
            output = args[i + 1]
            i += 2
        default:
            exitWithError("Unknown argument: \(flag)")
        }
    }

    let normalizedLanguage = normalizeLanguage(language)

    if profile.lowercased() != "fast" {
        exitWithError("Unsupported profile: \(profile). Only 'fast' is supported in v1.")
    }

    if output.lowercased() != "json" {
        exitWithError("Unsupported output format: \(output). Only 'json' is supported.")
    }

    guard FileManager.default.fileExists(atPath: audioPath) else {
        exitWithError("Audio file not found: \(audioPath)")
    }

    let audioURL = URL(fileURLWithPath: audioPath)

    do {
        emitProgress("loading_model", 0.1, "Loading Whisper local model...")
        let models = try await AsrModels.downloadAndLoad(version: .v3)

        emitProgress("initializing", 0.3, "Initializing Whisper engine...")
        let asrManager = AsrManager(config: .default)
        try await asrManager.initialize(models: models)

        emitProgress("transcribing", 0.5, "Transcribing audio...")
        let result = try await asrManager.transcribe(audioURL, source: .system)

        emitProgress("processing", 0.9, "Processing results...")

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

        let outputLanguage = normalizedLanguage == "auto"
            ? detectLanguageFromText(result.text)
            : normalizedLanguage

        let outputPayload = TranscriptionOutput(
            text: result.text,
            words: words,
            duration_seconds: result.duration,
            language: outputLanguage
        )

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        let jsonData = try encoder.encode(outputPayload)
        if let jsonString = String(data: jsonData, encoding: .utf8) {
            print(jsonString)
        }

        emitProgress("completed", 1.0, "Whisper correction complete")
    } catch {
        exitWithError("Whisper transcription failed: \(error.localizedDescription)")
    }
}

if #available(macOS 14.0, *) {
    await run()
} else {
    exitWithError("macOS 14.0+ required")
}
