package com.tango.wallet.wear.presentation.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material3.*
import com.tango.wallet.wear.data.WatchCommand

@Composable
fun HandoffScreen(
    command: WatchCommand?
) {
    val configuration = LocalConfiguration.current
    val screenWidth = configuration.screenWidthDp
    val isSmall = screenWidth < 200
    
    val infiniteTransition = rememberInfiniteTransition(label = "progress")
    val progress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "progress"
    )

    AppScaffold {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.padding(if (isSmall) 12.dp else 16.dp)
            ) {
                Text(
                    text = "\uD83D\uDCF1",
                    fontSize = if (isSmall) 32.sp else 40.sp,
                    textAlign = TextAlign.Center
                )
                
                Spacer(modifier = Modifier.height(if (isSmall) 12.dp else 16.dp))
                
                Text(
                    text = "Secure auth required",
                    style = if (isSmall) MaterialTheme.typography.bodyLarge else MaterialTheme.typography.titleSmall,
                    textAlign = TextAlign.Center
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = "Please continue on your phone",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 8.dp)
                )
                
                Spacer(modifier = Modifier.height(if (isSmall) 16.dp else 24.dp))
                
                CircularProgressIndicator(
                    progress = { progress },
                    modifier = Modifier.size(if (isSmall) 24.dp else 32.dp),
                    strokeWidth = 3.dp,
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                command?.let {
                    Text(
                        text = "RM ${String.format("%.2f", it.amount)} to ${it.recipientQuery}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f),
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }
}
