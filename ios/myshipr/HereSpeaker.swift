import AVFoundation
import Foundation

/// Speaks turn-by-turn guidance.
///
/// The HERE SDK writes the instruction ("Turn right onto Elm Street") but has no
/// voice of its own — saying it out loud is the app's job. This wraps
/// `AVSpeechSynthesizer` and is driven straight from the navigator's event
/// delegate, so a maneuver is spoken without a round trip through JS.
///
/// The audio session is declared as spoken audio that ducks others, which is
/// what turns music down for the instruction instead of stopping it, and keeps
/// guidance audible over a car's Bluetooth connection.
/// `@unchecked Sendable`: every entry point is called from the main thread (the
/// navigation module marshals onto it), and `AVSpeechSynthesizer` is not itself
/// Sendable, so the compiler cannot verify what the call sites guarantee.
final class HereSpeaker: NSObject, @unchecked Sendable {

    private let synthesizer = AVSpeechSynthesizer()
    private var voiceLanguage = "en-US"

    /// Muted sessions still receive text; they just do not say it.
    var enabled: Bool = true {
        didSet { if !enabled { stop() } }
    }

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    /// - Parameter code: a HERE LanguageCode name such as `EN_US`.
    func setLanguage(_ code: String?) {
        voiceLanguage = Self.bcp47(from: code)
    }

    /// Says `text`, cutting off whatever is still being spoken.
    ///
    /// Guidance is only useful while it is still true — queueing would leave the
    /// driver hearing the previous turn after taking it.
    func speak(_ text: String?) {
        guard enabled, let text = text, !text.isEmpty else { return }

        activateSession()
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }

        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: voiceLanguage)
            ?? AVSpeechSynthesisVoice(language: "en-US")
        synthesizer.speak(utterance)
    }

    func stop() {
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        releaseSession()
    }

    // MARK: - Audio session

    private func activateSession() {
        let session = AVAudioSession.sharedInstance()
        do {
            // .duckOthers lowers music for the instruction rather than stopping
            // it; .mixWithOthers keeps this from seizing the session from any
            // other audio the app is running.
            try session.setCategory(
                .playback, mode: .voicePrompt,
                options: [.duckOthers, .mixWithOthers]
            )
            try session.setActive(true)
        } catch {
            NSLog("[HereSpeaker] could not activate the audio session: \(error)")
        }
    }

    /// Handing the session back is what restores music to full volume — without
    /// it everything else stays ducked for the rest of the trip.
    private func releaseSession() {
        do {
            try AVAudioSession.sharedInstance()
                .setActive(false, options: .notifyOthersOnDeactivation)
        } catch {
            // Another part of the app may still hold the session; that is fine.
        }
    }

    /// `EN_US` / `en_US` → `en-US`; anything unrecognised falls back to US English.
    private static func bcp47(from code: String?) -> String {
        guard let code = code, !code.isEmpty else { return "en-US" }
        let parts = code.replacingOccurrences(of: "-", with: "_").split(separator: "_")
        guard let language = parts.first else { return "en-US" }
        if parts.count >= 2 {
            return "\(language.lowercased())-\(parts[1].uppercased())"
        }
        return language.lowercased()
    }
}

extension HereSpeaker: AVSpeechSynthesizerDelegate {
    func speechSynthesizer(
        _ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance
    ) {
        releaseSession()
    }

    func speechSynthesizer(
        _ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance
    ) {
        // Cancels come from speak() replacing an instruction, so the session is
        // about to be used again — leave it active for the incoming utterance.
    }
}
