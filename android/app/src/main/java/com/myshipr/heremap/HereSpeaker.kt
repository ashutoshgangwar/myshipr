package com.myshipr.heremap

import android.content.Context
import android.media.AudioAttributes
import android.speech.tts.TextToSpeech
import android.util.Log
import java.util.Locale

/**
 * Speaks turn-by-turn guidance.
 *
 * The HERE SDK writes the instruction ("Turn right onto Elm Street") but has no
 * voice of its own — saying it out loud is the app's job. This wraps Android's
 * [TextToSpeech] and is driven straight from the navigator's event listener, so
 * a maneuver is spoken without a round trip through JS.
 *
 * The engine is declared as navigation guidance rather than plain media, which
 * is what makes the system duck music and route the audio to the car over
 * Bluetooth instead of interrupting a call.
 */
internal class HereSpeaker(context: Context) {

    companion object {
        private const val TAG = "HereSpeaker"
        private const val UTTERANCE_ID = "here-guidance"
    }

    private var engine: TextToSpeech? = null
    private var ready = false

    /** Spoken as soon as the engine finishes starting up. */
    private var pending: String? = null

    private var locale: Locale = Locale.US

    /** Muted sessions still receive text; they just do not say it. */
    var enabled: Boolean = true
        set(value) {
            field = value
            if (!value) stop()
        }

    init {
        engine = TextToSpeech(context.applicationContext) { status ->
            if (status != TextToSpeech.SUCCESS) {
                Log.w(TAG, "TextToSpeech unavailable (status $status) — guidance will be silent")
                return@TextToSpeech
            }
            engine?.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )
            applyLanguage()
            ready = true
            // The first instruction usually arrives before the engine is up.
            pending?.let { text ->
                pending = null
                speak(text)
            }
        }
    }

    /** @param code a HERE LanguageCode name such as `EN_US`. */
    fun setLanguage(code: String?) {
        locale = parseLocale(code)
        if (ready) applyLanguage()
    }

    /**
     * Says [text], cutting off whatever is still being spoken.
     *
     * Guidance is only useful while it is still true — queueing would leave the
     * driver hearing the previous turn after taking it.
     */
    fun speak(text: String?) {
        if (!enabled || text.isNullOrBlank()) return
        if (!ready) {
            pending = text
            return
        }
        engine?.speak(text, TextToSpeech.QUEUE_FLUSH, null, UTTERANCE_ID)
    }

    fun stop() {
        pending = null
        try {
            engine?.stop()
        } catch (e: Exception) {
            Log.w(TAG, "stop failed: ${e.message}")
        }
    }

    fun shutdown() {
        stop()
        try {
            engine?.shutdown()
        } catch (e: Exception) {
            Log.w(TAG, "shutdown failed: ${e.message}")
        }
        engine = null
        ready = false
    }

    private fun applyLanguage() {
        val result = engine?.setLanguage(locale)
        if (result == TextToSpeech.LANG_MISSING_DATA ||
            result == TextToSpeech.LANG_NOT_SUPPORTED
        ) {
            // The voice data is a per-device download, so this is a normal
            // outcome rather than a fault. English is always present.
            Log.w(TAG, "no voice data for $locale — falling back to ${Locale.US}")
            engine?.setLanguage(Locale.US)
        }
    }

    /** `EN_US` / `en-US` → [Locale]; anything unrecognised falls back to US English. */
    private fun parseLocale(code: String?): Locale {
        if (code.isNullOrBlank()) return Locale.US
        val parts = code.replace('-', '_').split('_')
        return when {
            parts.size >= 2 -> Locale(parts[0].lowercase(), parts[1].uppercase())
            else -> Locale(parts[0].lowercase())
        }
    }
}
