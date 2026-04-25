package com.tango.wallet.wear.presentation.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material3.Icon
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.Text

private val TangoBlue = Color(0xFF1E3A8A)
private val TangoBlueLight = Color(0xFF3B82F6)

data class MenuPage(
    val id: String,
    val label: String,
    val description: String,
    val icon: ImageVector,
    val gradient: List<Color>,
    val action: () -> Unit
)

@Composable
fun MainMenuScreen(
    onNavigateToVoice: () -> Unit,
    onNavigateToTransfer: () -> Unit,
    onNavigateToPay: () -> Unit = {},
    onNavigateToAlerts: () -> Unit = {}
) {
    val configuration = LocalConfiguration.current
    val screenWidth = configuration.screenWidthDp
    val isSmall = screenWidth < 200

    val pages = listOf(
        MenuPage(
            id = "pay",
            label = "Pay",
            description = "Show QR to merchant",
            icon = Icons.Outlined.QrCode2,
            gradient = listOf(TangoBlue, Color.Black),
            action = onNavigateToPay
        ),
        MenuPage(
            id = "alerts",
            label = "Alerts",
            description = "Notifications & updates",
            icon = Icons.Outlined.Notifications,
            gradient = listOf(TangoBlue, Color.Black),
            action = onNavigateToAlerts
        ),
        MenuPage(
            id = "transfer",
            label = "Transfer",
            description = "Send money to contacts",
            icon = Icons.Outlined.Send,
            gradient = listOf(TangoBlue, Color.Black),
            action = onNavigateToTransfer
        ),
        MenuPage(
            id = "tango",
            label = "Tango AI",
            description = "Voice assistant",
            icon = Icons.Outlined.AutoAwesome,
            gradient = listOf(TangoBlue, Color.Black),
            action = onNavigateToVoice
        )
    )
    
    val pagerState = rememberPagerState(pageCount = { pages.size })
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize()
        ) { page ->
            MenuPageContent(
                page = pages[page],
                isSmall = isSmall
            )
        }
        
        PageIndicator(
            pageCount = pages.size,
            currentPage = pagerState.currentPage,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = if (isSmall) 12.dp else 16.dp)
        )
    }
}

@Composable
private fun MenuPageContent(
    page: MenuPage,
    isSmall: Boolean
) {
    val configuration = LocalConfiguration.current
    val screenWidth = configuration.screenWidthDp
    val isMedium = screenWidth in 200..240
    
    val iconSize = when {
        isSmall -> 40.dp
        isMedium -> 48.dp
        else -> 56.dp
    }
    
    val titleSize = when {
        isSmall -> 18.sp
        isMedium -> 20.sp
        else -> 22.sp
    }
    
    val descSize = when {
        isSmall -> 10.sp
        isMedium -> 11.sp
        else -> 12.sp
    }
    
    val verticalPadding = when {
        isSmall -> 16.dp
        isMedium -> 20.dp
        else -> 24.dp
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = page.gradient
                )
            )
            .clickable(onClick = page.action),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = verticalPadding)
        ) {
            Box(
                modifier = Modifier
                    .size(iconSize + 24.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = page.icon,
                    contentDescription = page.label,
                    tint = Color.White,
                    modifier = Modifier.size(iconSize)
                )
            }
            
            Spacer(modifier = Modifier.height(if (isSmall) 12.dp else 16.dp))
            
            Text(
                text = page.label,
                fontSize = titleSize,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                maxLines = 1
            )
            
            Spacer(modifier = Modifier.height(6.dp))
            
            Text(
                text = page.description,
                fontSize = descSize,
                color = Color.White.copy(alpha = 0.7f),
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center,
                maxLines = 2
            )
            
            Spacer(modifier = Modifier.height(if (isSmall) 16.dp else 20.dp))
            
            Text(
                text = "← Swipe →",
                fontSize = if (isSmall) 8.sp else 9.sp,
                color = Color.White.copy(alpha = 0.5f),
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
private fun PageIndicator(
    pageCount: Int,
    currentPage: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(5.dp)
    ) {
        repeat(pageCount) { index ->
            Box(
                modifier = Modifier
                    .size(
                        width = if (index == currentPage) 14.dp else 5.dp,
                        height = 5.dp
                    )
                    .clip(RoundedCornerShape(2.5.dp))
                    .background(
                        if (index == currentPage) 
                            Color.White 
                        else 
                            Color.White.copy(alpha = 0.35f)
                    )
            )
        }
    }
}
