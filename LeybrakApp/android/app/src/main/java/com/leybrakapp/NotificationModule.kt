package com.leybrakapp

import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import com.facebook.react.bridge.*

class NotificationModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "NotificationModule"

    init {
        YapeNotificationService.reactContext = reactContext
    }

    @ReactMethod
    fun tienePermisoNotificaciones(promise: Promise) {
        try {
            val pkgName = reactContext.packageName
            val flat = Settings.Secure.getString(
                reactContext.contentResolver,
                "enabled_notification_listeners"
            )
            val tienePermiso = !TextUtils.isEmpty(flat) && flat.contains(pkgName)
            promise.resolve(tienePermiso)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun abrirConfiguracionPermisos(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
