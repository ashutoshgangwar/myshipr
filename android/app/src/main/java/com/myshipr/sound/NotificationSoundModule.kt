package com.myshipr.sound

import android.media.AudioAttributes
import android.media.Ringtone
import android.media.RingtoneManager
import android.net.Uri
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Plays the app's alert tone.
 *
 * The fuel sheet can open on its own while the driver is out at the pumps and
 * not looking at the phone, so it needs to make a noise. That is the app's own
 * sound when one is bundled (see [CUSTOM_SOUND]), and otherwise the tone the
 * driver already set for notifications — which is the better default than any
 * sound we could pick, and costs nothing to ship.
 *
 * Either way it plays as a notification, so it follows the driver's
 * notification volume and stays silent in silent mode.
 *
 * iOS counterpart: `ios/myshipr/NotificationSoundModule.swift` — same method
 * name, so `src/services/notificationSound.ts` drives both without branching.
 */
class NotificationSoundModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "NotificationSound"
        const val MODULE_NAME = "NotificationSoundModule"

        /**
         * The app's own alert sound: `res/raw/fuel_alert.<ext>`, in any format
         * Android plays (mp3, ogg, wav). Dropping the file in is the whole
         * installation — nothing here needs editing, and with no file the
         * system notification tone is used instead.
         */
        private const val CUSTOM_SOUND = "fuel_alert"

        /**
         * Sounds [playNamed] will play, by the name JS asks for. Only these,
         * because the name crosses the bridge: an arbitrary string would let a
         * caller reach for any raw resource in the app.
         */
        private val NAMED_SOUNDS = setOf("celebration", "fuel_alert")
    }

    /** Held so a second alert cuts the first off instead of layering on it. */
    private var ringtone: Ringtone? = null

    override fun getName(): String = MODULE_NAME

    /**
     * The bundled sound, or null when none was shipped.
     *
     * Looked up by name rather than as `R.raw.fuel_alert`, because the resource
     * constant only exists once the file does — and this has to compile either
     * way.
     */
    private fun customSoundUri(): Uri? = rawSoundUri(CUSTOM_SOUND)

    /**
     * A bundled sound by name, or null when it was not shipped.
     *
     * Looked up by name rather than as `R.raw.<name>`, because the resource
     * constant only exists once the file does — and this has to compile either
     * way.
     */
    private fun rawSoundUri(name: String): Uri? {
        val context = reactApplicationContext
        @Suppress("DiscouragedApi")
        val id = context.resources.getIdentifier(name, "raw", context.packageName)
        if (id == 0) return null
        return Uri.parse("android.resource://${context.packageName}/$id")
    }

    /** Starts [uri], cutting off whatever this module had playing. */
    private fun start(uri: Uri) {
        ringtone?.let { if (it.isPlaying) it.stop() }

        val tone = RingtoneManager.getRingtone(reactApplicationContext, uri) ?: return
        tone.audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        tone.play()
        ringtone = tone
    }

    /**
     * Plays the tone, or does nothing when there is none to play — a driver who
     * set their notification sound to Silent has asked for exactly that.
     */
    @ReactMethod
    fun play() {
        try {
            val uri = customSoundUri()
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: return

            start(uri)
        } catch (e: Exception) {
            // A missing or unreadable tone is not worth failing the alert over;
            // the sheet still opens.
            Log.w(TAG, "could not play the notification tone: ${e.message}")
        }
    }

    /**
     * Plays one of [NAMED_SOUNDS], and nothing at all when that file was not
     * bundled.
     *
     * Unlike [play] this has no system fallback on purpose: these are sounds
     * that decorate something the driver is already looking at, and the device's
     * notification ding in place of a missing celebration would read as an
     * alert that never happened.
     */
    @ReactMethod
    fun playNamed(name: String?) {
        try {
            if (name == null || name !in NAMED_SOUNDS) {
                Log.w(TAG, "no sound named $name")
                return
            }
            start(rawSoundUri(name) ?: return)
        } catch (e: Exception) {
            Log.w(TAG, "could not play $name: ${e.message}")
        }
    }

    override fun invalidate() {
        try {
            ringtone?.let { if (it.isPlaying) it.stop() }
        } catch (e: Exception) {
            Log.w(TAG, "stop failed: ${e.message}")
        }
        ringtone = null
        super.invalidate()
    }
}
