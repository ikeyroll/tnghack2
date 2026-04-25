package com.example.myapplication

import android.content.Intent
import android.os.Bundle
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
        
        handleIntent(intent)
    }
    
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }
    
    private fun handleIntent(intent: Intent?) {
        if (intent?.action == Intent.ACTION_VIEW) {
            val uri = intent.data
            if (uri?.scheme == "tango" && uri.host == "transfer") {
                val recipientQuery = uri.getQueryParameter("to") ?: ""
                val amount = uri.getQueryParameter("amount") ?: "0"
                
                val textView = findViewById<TextView>(R.id.textView)
                textView?.text = """
                    Transfer Request from Watch
                    
                    To: $recipientQuery
                    Amount: RM $amount
                    
                    This would open the web app at:
                    http://localhost:3000
                    
                    In production, this would:
                    1. Open the Tango web app
                    2. Prefill the transfer form
                    3. Request authentication
                """.trimIndent()
            }
        }
    }
}