package com.tango.wallet.wear.service

import android.content.Context
import android.net.Uri
import com.google.android.gms.wearable.MessageClient
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.tasks.await

class PhoneHandoffService(private val context: Context) {
    private val messageClient: MessageClient = Wearable.getMessageClient(context)

    suspend fun sendTransferRequest(recipientQuery: String, amount: Double): Boolean {
        return try {
            val nodes = Wearable.getNodeClient(context).connectedNodes.await()
            val message = "transfer:$recipientQuery:$amount"
            
            nodes.forEach { node ->
                messageClient.sendMessage(
                    node.id,
                    "/tango/transfer",
                    message.toByteArray()
                ).await()
            }
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    fun buildDeepLink(recipientQuery: String, amount: Double): Uri {
        return Uri.parse("tango://transfer")
            .buildUpon()
            .appendQueryParameter("to", recipientQuery)
            .appendQueryParameter("amount", amount.toString())
            .build()
    }
}
