package com.tango.wallet.wear.presentation.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ArrowBack
import androidx.compose.material.icons.outlined.QrCode2
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material3.Icon
import androidx.wear.compose.material3.IconButton
import androidx.wear.compose.material3.Text

private val TangoBlue = Color(0xFF1E3A8A)
private val TangoBlueLight = Color(0xFF3B82F6)

/**
 * Pay screen — shows the user's QR code so the merchant can scan it.
 * Uses a deterministic mosaic pattern so it looks like a real QR without
 * pulling in a QR library (this is a demo, not used for real transactions).
 */
@Composable
fun PayScreen(
    onBack: () -> Unit
) {
    val configuration = LocalConfiguration.current
    val screenWidth = configuration.screenWidthDp
    val isSmall = screenWidth < 200
    val isMedium = screenWidth in 200..240

    val qrSize = when {
        isSmall -> 100.dp
        isMedium -> 120.dp
        else -> 140.dp
    }
    val padding = when {
        isSmall -> 12.dp
        isMedium -> 14.dp
        else -> 16.dp
    }
    val titleSize = when {
        isSmall -> 11.sp
        isMedium -> 12.sp
        else -> 13.sp
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(TangoBlue, Color.Black)
                )
            )
    ) {
        // Back button
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
                .padding(horizontal = padding, vertical = if (isSmall) 20.dp else 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    imageVector = Icons.Outlined.QrCode2,
                    contentDescription = null,
                    tint = TangoBlueLight,
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text = "Pay QR",
                    fontSize = titleSize,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(if (isSmall) 12.dp else 16.dp))

            // QR card with BNM-style frame
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.White)
                    .padding(10.dp)
            ) {
                FakeQr(size = qrSize)
            }

            Spacer(modifier = Modifier.height(if (isSmall) 10.dp else 14.dp))

            // Merchant label
            Text(
                text = "Tango Guardian",
                fontSize = if (isSmall) 10.sp else 11.sp,
                color = Color.White,
                fontWeight = FontWeight.SemiBold
            )

            Spacer(modifier = Modifier.height(2.dp))

            Text(
                text = "Scan to pay",
                fontSize = if (isSmall) 8.sp else 9.sp,
                color = Color.White.copy(alpha = 0.65f)
            )
        }
    }
}

/**
 * Deterministic visual-only QR. Same algorithm as the web /remote PayFace
 * so the watch UI matches the phone demo.
 */
@Composable
private fun FakeQr(size: androidx.compose.ui.unit.Dp) {
    val cols = 25
    val cellSize = size / cols

    Column(
        modifier = Modifier.size(size),
        verticalArrangement = Arrangement.spacedBy(0.dp)
    ) {
        for (y in 0 until cols) {
            Row(horizontalArrangement = Arrangement.spacedBy(0.dp)) {
                for (x in 0 until cols) {
                    val inFinder = (x < 7 && y < 7) ||
                        (x > 17 && y < 7) ||
                        (x < 7 && y > 17)
                    val on = ((x * 73856093) xor (y * 19349663)) % 5 < 2
                    val draw = on || inFinder
                    Box(
                        modifier = Modifier
                            .size(cellSize)
                            .background(if (draw) TangoBlue else Color.White)
                    )
                }
            }
        }
    }
}
