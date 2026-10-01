import AudioToolbox
import Foundation
import React

/// Plays the app's alert tone.
///
/// The fuel sheet can open on its own while the driver is out at the pumps and
/// not looking at the phone, so it needs to make a noise. That is the app's own
/// sound when one is bundled (see `customSoundName`), and otherwise a system
/// tone.
///
/// `AudioServices` plays this down the system alert path, which means it
/// follows the ring/silent switch and — unlike `AVAudioPlayer` — never takes
/// the audio session away from `HereSpeaker`, so a chime cannot cut off turn
/// guidance mid-sentence. The trade is that path's format rules: uncompressed
/// audio (Linear PCM or IMA4) in a `.caf`, `.wav` or `.aif`, up to 30 seconds.
/// An mp3 will not play, which is why `customSoundTypes` lists no compressed
/// container.
///
/// Android counterpart: `android/.../sound/NotificationSoundModule.kt` — same
/// method name, so `src/services/notificationSound.ts` drives both without
/// branching.
@objc(NotificationSoundModule)
class NotificationSoundModule: NSObject {

    /// The app's own alert sound, added to the app target. Adding the file is
    /// the whole installation — nothing here needs editing, and with no file
    /// the system tone below is used instead.
    private static let customSoundName = "fuel_alert"

    /// Tried in order, so a `.caf` wins over a `.wav` of the same name.
    private static let customSoundTypes = ["caf", "wav", "aif", "aiff"]

    /// Tri-tone, the tone iOS itself uses for a received message. iOS has no
    /// API for reading the driver's chosen notification sound, so this stands
    /// in for it.
    private static let systemToneID: SystemSoundID = 1007

    /// Sounds `playNamed` will play, by the name JS asks for. Only these,
    /// because the name crosses the bridge: an arbitrary string would let a
    /// caller reach for any resource in the bundle.
    private static let namedSounds: Set<String> = ["celebration", "fuel_alert"]

    /// Registered sounds, kept for the life of the app: registering one again
    /// on every alert would be work repeated for no gain. A name maps to nil
    /// once it is known to be missing or unplayable, so that is not retried
    /// either.
    ///
    /// The bridge calls this module on one serial queue (see
    /// `requiresMainQueueSetup`), so the dictionary needs no lock of its own.
    private static var toneIDs: [String: SystemSoundID?] = [:]

    /// The bundled sound of that name, or nil when there is none to play.
    private static func toneID(for name: String) -> SystemSoundID? {
        if let cached = toneIDs[name] { return cached }

        var resolved: SystemSoundID?
        for type in customSoundTypes {
            guard let url = Bundle.main.url(
                forResource: name, withExtension: type
            ) else { continue }

            var id: SystemSoundID = 0
            if AudioServicesCreateSystemSoundID(url as CFURL, &id) == kAudioServicesNoError {
                resolved = id
                break
            }
            NSLog("[NotificationSound] \(name).\(type) is not a format "
                + "AudioServices plays — it must be uncompressed and under 30s")
        }
        toneIDs[name] = resolved
        return resolved
    }

    @objc(play)
    func play() {
        AudioServicesPlaySystemSound(
            Self.toneID(for: Self.customSoundName) ?? Self.systemToneID
        )
    }

    /// Plays one of `namedSounds`, and nothing at all when that file was not
    /// added to the target.
    ///
    /// Unlike `play` this has no system fallback on purpose: these are sounds
    /// that decorate something the driver is already looking at, and a tri-tone
    /// in place of a missing celebration would read as an alert that never
    /// happened.
    @objc(playNamed:)
    func playNamed(_ name: String) {
        guard Self.namedSounds.contains(name) else {
            NSLog("[NotificationSound] no sound named \(name)")
            return
        }
        guard let id = Self.toneID(for: name) else { return }
        AudioServicesPlaySystemSound(id)
    }

    /// Nothing here touches the UI, so the bridge need not serialise onto main.
    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
