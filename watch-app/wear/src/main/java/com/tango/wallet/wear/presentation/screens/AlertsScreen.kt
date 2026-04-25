package com.tango.wallet.wear.presentation.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Link
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material3.Button
import androidx.wear.compose.material3.ButtonDefaults
import androidx.wear.compose.material3.Icon
import androidx.wear.compose.material3.IconButton
import androidx.wear.compose.material3.Text
import com.tango.wallet.wear.service.RemoteNotification
import com.tango.wallet.wear.service.RemoteService
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val TangoBlue = Color(0xFF1E3A8A)
private val TangoBlueLight = Color(0xFF3B82F6)

@Composable
fun AlertsScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val state by RemoteService.state.collectAsState()
    val room by RemoteService.room.collectAsState()

    val configuration = LocalConfiguration.current
    val isSmall = configuration.screenWidthDp < 200

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(listOf(TangoBlue, Color.Black))
            )
    ) {
        IconButton(
            onClick = onBack,
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(top = 8.dp, start = 8.dp)
                .size(28.dp)
        ) {
            Icon(
                imageVector = Icons.Outlined.ArrowBack,
                contentDescription = "Back",
                tint = Color.White
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(top = 38.dp, start = 12.dp, end = 12.dp, bottom = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Icon(
                    imageVector = Icons.Outlined.Notifications,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(14.dp)
                )
                Text(
                    text = "Alerts",
                    fontSize = if (isSmall) 12.sp else 13.sp,
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            if (room.isBlank()) {
                PairPrompt(onPair = { code -> RemoteService.setRoom(context, code) })
            } else if (state.notifications.isEmpty()) {
                Spacer(modifier = Modifier.height(20.dp))
                Text(
                    text = "No alerts yet",
                    fontSize = 11.sp,
                    color = Color.White.copy(alpha = 0.65f)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Paired · $room",
                    fontSize = 9.sp,
                    color = Color.White.copy(alpha = 0.45f)
                )
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(state.notifications, key = { it.id }) { n ->
                        NotificationCard(n)
                    }
                }
            }
        }
    }
}

@Composable
private fun NotificationCard(n: RemoteNotification) {
    val time = remember(n.ts) {
        if (n.ts <= 0) "" else SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(n.ts))
    }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(Color.White)
            .padding(10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // App icon
        Box(
            modifier = Modifier
                .size(20.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(TangoBlue),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Outlined.Notifications,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(12.dp)
            )
        }
        Spacer(modifier = Modifier.width(8.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = n.title,
                fontSize = 11.sp,
                color = Color.Black,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1
            )
            n.body?.takeIf { it.isNotBlank() }?.let { body ->
                Text(
                    text = body,
                    fontSize = 10.sp,
                    color = Color.DarkGray,
                    maxLines = 1
                )
            }
        }
        if (time.isNotEmpty()) {
            Text(
                text = time,
                fontSize = 9.sp,
                color = Color.Gray
            )
        }
    }
}

@Composable
private fun PairPrompt(onPair: (String) -> Unit) {
    var draft by remember { mutableStateOf("") }
    val sample = listOf("DEMO", "ABCD", "1234")
    Spacer(modifier = Modifier.height(6.dp))
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(
            imageVector = Icons.Outlined.Link,
            contentDescription = null,
            tint = Color.White.copy(alpha = 0.85f),
            modifier = Modifier.size(12.dp)
        )
        Text(
            text = "Tap a code on phone",
            fontSize = 10.sp,
            color = Color.White.copy(alpha = 0.85f)
        )
    }
    Spacer(modifier = Modifier.height(6.dp))
    Text(
        text = if (draft.isBlank()) "----" else draft,
        fontSize = 18.sp,
        color = Color.White,
        fontWeight = FontWeight.Bold
    )
    Spacer(modifier = Modifier.height(6.dp))

    // Quick chips for faster demo entry — taps each character into the draft
    val chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        sample.forEach { code ->
            Button(
                onClick = { draft = code },
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White.copy(alpha = 0.12f)
                ),
                modifier = Modifier.height(28.dp)
            ) {
                Text(text = code, fontSize = 9.sp, color = Color.White)
            }
        }
    }
    Spacer(modifier = Modifier.height(4.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Button(
            onClick = { if (draft.length < 6) draft += "A" else Unit },
            colors = ButtonDefaults.buttonColors(
                containerColor = Color.White.copy(alpha = 0.10f)
            ),
            modifier = Modifier.height(26.dp)
        ) { Text("+A", fontSize = 9.sp, color = Color.White) }
        Button(
            onClick = { if (draft.isNotEmpty()) draft = draft.dropLast(1) },
            colors = ButtonDefaults.buttonColors(
                containerColor = Color.White.copy(alpha = 0.10f)
            ),
            modifier = Modifier.height(26.dp)
        ) { Text("⌫", fontSize = 9.sp, color = Color.White) }
        Button(
            onClick = { if (draft.isNotBlank()) onPair(draft) },
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFF22C55E)
            ),
            modifier = Modifier.height(26.dp)
        ) { Text("Pair", fontSize = 9.sp, color = Color.White) }
    }
    // Suppress unused warning — chars reserved for future custom keypad expansion
    @Suppress("UNUSED_EXPRESSION") chars
}
