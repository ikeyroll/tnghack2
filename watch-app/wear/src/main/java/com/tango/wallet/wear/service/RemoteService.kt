package com.tango.wallet.wear.service

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.tango.wallet.wear.R
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

data class RemoteNotification(
    val id: String,
    val ts: Long,
    val title: String,
    val body: String?
)

data class RemoteState(
    val balance: Double? = null,
    val notifications: List<RemoteNotification> = emptyList(),
    val updatedAt: Long = 0L
)

/**
 * Polls the paired phone's /api/remote/state every few seconds and:
 *  - exposes balance + notifications as a StateFlow
 *  - posts every new notification as a Wear OS system notification with sound
 *
 * Pair code (room) and base URL are persisted in SharedPreferences so the
 * watch keeps syncing across launches.
 */
object RemoteService {
    private const val PREFS = "tango_remote"
    private const val KEY_ROOM = "room"
    private const val KEY_BASE_URL = "baseUrl"
    private const val DEFAULT_BASE_URL = "http://10.0.2.2:3000"
    const val CHANNEL_ID = "tango_alerts"
    const val CHANNEL_NAME = "Tango Alerts"

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var pollJob: Job? = null
    private val seenIds = mutableSetOf<String>()
    @Volatile private var initialSyncDone = false

    private val _state = MutableStateFlow(RemoteState())
    val state: StateFlow<RemoteState> = _state.asStateFlow()

    private val _room = MutableStateFlow("")
    val room: StateFlow<String> = _room.asStateFlow()

    fun init(context: Context) {
        ensureChannel(context)
        val prefs = prefs(context)
        _room.value = prefs.getString(KEY_ROOM, "") ?: ""
        if (_room.value.isNotBlank()) start(context)
    }

    fun setRoom(context: Context, code: String) {
        val normalized = code.uppercase().trim()
        prefs(context).edit().putString(KEY_ROOM, normalized).apply()
        _room.value = normalized
        seenIds.clear()
        initialSyncDone = false
        if (normalized.isBlank()) {
            stop()
        } else {
            start(context)
        }
    }

    fun setBaseUrl(context: Context, url: String) {
        prefs(context).edit().putString(KEY_BASE_URL, url.trimEnd('/')).apply()
        if (_room.value.isNotBlank()) start(context)
    }

    fun baseUrl(context: Context): String =
        prefs(context).getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL

    private fun prefs(context: Context): SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun start(context: Context) {
        pollJob?.cancel()
        val app = context.applicationContext
        pollJob = scope.launch {
            while (true) {
                val room = _room.value
                if (room.isBlank()) break
                try {
                    val s = fetchState(app, room)
                    if (s != null) handleState(app, s)
                } catch (_: Exception) { }
                delay(2_500)
            }
        }
    }

    private fun stop() {
        pollJob?.cancel()
        pollJob = null
    }

    private suspend fun fetchState(context: Context, room: String): RemoteState? =
        withContext(Dispatchers.IO) {
            val url = URL("${baseUrl(context)}/api/remote/state?room=$room")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                connectTimeout = 4_000
                readTimeout = 4_000
                requestMethod = "GET"
            }
            try {
                if (conn.responseCode != 200) return@withContext null
                val text = conn.inputStream.bufferedReader().use { it.readText() }
                parseState(text)
            } finally {
                conn.disconnect()
            }
        }

    private fun parseState(text: String): RemoteState {
        val obj = JSONObject(text)
        val balance = if (obj.isNull("balance")) null else obj.optDouble("balance")
        val arr: JSONArray = obj.optJSONArray("notifications") ?: JSONArray()
        val list = (0 until arr.length()).mapNotNull { i ->
            val n = arr.optJSONObject(i) ?: return@mapNotNull null
            RemoteNotification(
                id = n.optString("id"),
                ts = n.optLong("ts"),
                title = n.optString("title"),
                body = if (n.isNull("body")) null else n.optString("body")
            )
        }
        return RemoteState(
            balance = balance,
            notifications = list,
            updatedAt = obj.optLong("updatedAt", 0L)
        )
    }

    private fun handleState(context: Context, s: RemoteState) {
        val previous = _state.value
        _state.value = s

        // First sync after pairing — seed the seen set so we don't blast the user
        // with historical alerts. Real-time alerts only.
        if (!initialSyncDone) {
            seenIds.clear()
            seenIds.addAll(s.notifications.map { it.id })
            initialSyncDone = true
            return
        }

        val newOnes = s.notifications.filter { it.id !in seenIds }
        if (newOnes.isEmpty()) return
        newOnes.forEach { n ->
            seenIds.add(n.id)
            postSystemNotification(context, n)
        }
    }

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (nm.getNotificationChannel(CHANNEL_ID) != null) return
        val attrs = AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .build()
        val sound: Uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        val channel = NotificationChannel(
            CHANNEL_ID,
            CHANNEL_NAME,
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Real-time alerts pushed from your paired phone"
            enableLights(true)
            enableVibration(true)
            setSound(sound, attrs)
        }
        nm.createNotificationChannel(channel)
    }

    private fun postSystemNotification(context: Context, n: RemoteNotification) {
        val granted = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(
                context, Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        if (!granted) return

        // Tapping the notification opens the watch app
        val launch = context.packageManager
            .getLaunchIntentForPackage(context.packageName)
            ?.apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP }
        val pi = launch?.let {
            PendingIntent.getActivity(
                context,
                n.id.hashCode(),
                it,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
        }

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.tango_logo)
            .setContentTitle(n.title)
            .setContentText(n.body ?: "")
            .setStyle(NotificationCompat.BigTextStyle().bigText(n.body ?: ""))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setAutoCancel(true)
            .setWhen(n.ts.takeIf { it > 0 } ?: System.currentTimeMillis())

        if (pi != null) builder.setContentIntent(pi)

        try {
            NotificationManagerCompat.from(context).notify(n.id.hashCode(), builder.build())
        } catch (_: SecurityException) { }
    }
}
