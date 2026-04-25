package com.tango.wallet.wear.presentation.theme

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.wear.compose.material3.ColorScheme
import androidx.wear.compose.material3.MaterialTheme

private val TangoBlue = Color(0xFF1E88E5)
private val TangoDarkBlue = Color(0xFF0D47A1)

private val TangoColorScheme = ColorScheme(
    primary = TangoBlue,
    primaryContainer = TangoDarkBlue,
    onPrimary = Color.White,
    onPrimaryContainer = Color.White,
    secondary = Color(0xFF64B5F6),
    onSecondary = Color.White,
    background = Color.Black,
    onBackground = Color.White
)

@Composable
fun TangoWearTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = TangoColorScheme,
        content = content
    )
}