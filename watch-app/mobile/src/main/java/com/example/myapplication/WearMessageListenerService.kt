package com.example.myapplication

import android.content.Intent
import android.net.Uri
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService

class WearMessageListenerService : WearableListenerService() {
    
    override fun onMessageReceived(messageEvent: MessageEvent) {
        super.onMessageReceived(messageEvent)
        
        when (messageEvent.path) {
            "/tango/transfer" -> {
                val message = String(messageEvent.data)
                handleTransferRequest(message)
            }
        }
    }
    
    private fun handleTransferRequest(message: String) {
        val parts = message.split(":")
        if (parts.size >= 3) {
            val recipientQuery = parts[1]
            val amount = parts[2]
            
            val deepLinkUri = Uri.parse("tango://transfer")
                .buildUpon()
                .appendQueryParameter("to", recipientQuery)
                .appendQueryParameter("amount", amount)
                .build()
            
            val intent = Intent(Intent.ACTION_VIEW, deepLinkUri).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
            
            startActivity(intent)
        }
    }
}
