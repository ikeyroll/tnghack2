package com.tango.wallet.wear.presentation.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material3.*
import com.tango.wallet.wear.R

@Composable
fun BalanceScreen(
    balance: Double = 1234.56,
    onBackToMenu: () -> Unit = {}
) {
    val configuration = LocalConfiguration.current
    val screenWidth = configuration.screenWidthDp
    val isSmall = screenWidth < 200
    val isMedium = screenWidth in 200..240
    
    val logoSize = when {
        isSmall -> 40.dp
        isMedium -> 48.dp
        else -> 56.dp
    }
    
    val balanceTextSize = when {
        isSmall -> 24.sp
        isMedium -> 28.sp
        else -> 32.sp
    }
    
    val labelSize = when {
        isSmall -> 10.sp
        isMedium -> 11.sp
        else -> 12.sp
    }
    
    val padding = when {
        isSmall -> 12.dp
        isMedium -> 16.dp
        else -> 20.dp
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF1E3A8A),
                        Color.Black
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(padding)
        ) {
            // TnG Logo
            Box(
                modifier = Modifier
                    .size(logoSize)
                    .clip(RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painter = painterResource(id = R.drawable.tango_logo),
                    contentDescription = "Tango Logo",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Fit
                )
            }
            
            Spacer(modifier = Modifier.height(if (isSmall) 12.dp else 16.dp))
            
            // Balance label
            Text(
                text = "Balance",
                fontSize = labelSize,
                color = Color.White.copy(alpha = 0.7f),
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            // Balance amount
            Text(
                text = "RM ${String.format("%.2f", balance)}",
                fontSize = balanceTextSize,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(if (isSmall) 16.dp else 24.dp))
            
            // Menu reveal button
            Button(
                onClick = onBackToMenu,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White.copy(alpha = 0.1f)
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(if (isSmall) 52.dp else 58.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "See more",
                        fontSize = if (isSmall) 10.sp else 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = "↓ Swipe for menu",
                        fontSize = if (isSmall) 8.sp else 9.sp,
                        color = Color.White.copy(alpha = 0.75f),
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}
