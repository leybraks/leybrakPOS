package com.leybrakapp

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONObject
import java.util.regex.Pattern

class YapeNotificationService : NotificationListenerService() {

    companion object {
        private const val TAG = "YapeNotifService"

        private val PAQUETES_YAPE = listOf("com.bcp.yape", "pe.com.interbank.yape")
        private val PAQUETES_PLIN = listOf("com.bbva.plin", "com.scotiabank.plin", "pe.com.viabcp.plin")
        private val PATRON_MONTO  = Pattern.compile("S/\\s*(\\d+(?:[.,]\\d{1,2})?)", Pattern.CASE_INSENSITIVE)
        private val PATRON_CODIGO = Pattern.compile("\\b(\\d{4})\\b")

        var reactContext: ReactApplicationContext? = null
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        try {
            val paquete = sbn.packageName ?: return
            val esYape  = PAQUETES_YAPE.any { paquete.contains(it, ignoreCase = true) }
            val esPlin  = PAQUETES_PLIN.any { paquete.contains(it, ignoreCase = true) }
            if (!esYape && !esPlin) return

            val extras = sbn.notification?.extras ?: return
            val titulo = extras.getString(Notification.EXTRA_TITLE) ?: ""
            val texto  = extras.getString(Notification.EXTRA_TEXT)
                      ?: extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
            val textoCompleto = "$titulo $texto"

            val matcherMonto = PATRON_MONTO.matcher(textoCompleto)
            if (!matcherMonto.find()) return

            val monto = matcherMonto.group(1)?.replace(",", ".")?.toDoubleOrNull() ?: return
            if (monto < 0.10 || monto > 9999.0) return

            var codigoSeguridad = ""
            if (esYape) {
                val m = PATRON_CODIGO.matcher(textoCompleto)
                if (m.find()) codigoSeguridad = m.group(1) ?: ""
            }

            val payload = JSONObject().apply {
                put("tipo",              if (esYape) "YAPE" else "PLIN")
                put("monto",            monto)
                put("nombre_cliente",   if (esYape) "Cliente Yape" else "Cliente Plin")
                put("codigo_seguridad", codigoSeguridad)
                put("notificacion_id",  "${sbn.id}_${System.currentTimeMillis()}")
                put("texto_original",   textoCompleto)
            }

            reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("PagoYapePlinRecibido", payload.toString())

        } catch (e: Exception) {
            Log.e(TAG, "Error: ${e.message}")
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {}
}
