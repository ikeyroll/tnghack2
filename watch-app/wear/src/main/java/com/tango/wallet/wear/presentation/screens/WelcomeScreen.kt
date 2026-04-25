package com.tango.wallet.wear.presentation.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
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
import kotlinx.coroutines.delay

@Composable
fun WelcomeScreen(
    onWelcomeComplete: () -> Unit
) {
    val configuration = LocalConfiguration.current
    val screenWidth = configuration.screenWidthDp
    
    // Responsive sizing based on screen width
    val isSmall = screenWidth < 200
    val isMedium = screenWidth in 200..240
    
    val logoSize = when {
        isSmall -> 50.dp
        isMedium -> 60.dp
        else -> 70.dp
    }
    
    val iconSize = when {
        isSmall -> 28.sp
        isMedium -> 34.sp
        else -> 40.sp
    }
    
    val titleSize = when {
        isSmall -> MaterialTheme.typography.titleLarge
        isMedium -> MaterialTheme.typography.displaySmall
        else -> MaterialTheme.typography.displayMedium
    }
    
    val subtitleSize = when {
        isSmall -> MaterialTheme.typography.bodyMedium
        isMedium -> MaterialTheme.typography.titleSmall
        else -> MaterialTheme.typography.titleMedium
    }
    
    val verticalPadding = when {
        isSmall -> 12.dp
        isMedium -> 16.dp
        else -> 20.dp
    }
    
    val spacerHeight = when {
        isSmall -> 8.dp
        isMedium -> 12.dp
        else -> 16.dp
    }
    
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )
    
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.7f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )

    LaunchedEffect(Unit) {
        delay(2500)
        onWelcomeComplete()
    }

    AppScaffold {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            Color(0xFF1E88E5).copy(alpha = 0.3f),
                            Color.Black
                        )
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = verticalPadding)
            ) {
                // Animated TnG logo
                Box(
                    modifier = Modifier
                        .size(logoSize)
                        .scale(scale),
                    contentAlignment = Alignment.Center
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.tango_logo),
                        contentDescription = "Tango Logo",
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(RoundedCornerShape(12.dp)),
                        contentScale = ContentScale.Fit
                    )
                }
                
                Spacer(modifier = Modifier.height(spacerHeight))
                
                // Tagline
                Text(
                    text = "by TnG DIGITAL",
                    style = subtitleSize,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
                    textAlign = TextAlign.Center,
                    fontWeight = FontWeight.Medium
                )
                
                Spacer(modifier = Modifier.height(spacerHeight))
                
                // Loading indicator
                CircularProgressIndicator(
                    modifier = Modifier.size(if (isSmall) 18.dp else 22.dp),
                    strokeWidth = 2.dp
                )
            }
        }
    }
}
