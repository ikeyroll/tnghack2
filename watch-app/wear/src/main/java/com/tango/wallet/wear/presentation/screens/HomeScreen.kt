package com.tango.wallet.wear.presentation.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.wear.compose.material3.*
import com.tango.wallet.wear.data.WatchCommand

@Composable
fun HomeScreen(
    commands: List<WatchCommand>,
    onCommandSelected: (WatchCommand) -> Unit
) {
    val configuration = LocalConfiguration.current
    val screenWidth = configuration.screenWidthDp
    
    val isSmall = screenWidth < 200
    val isMedium = screenWidth in 200..240
    
    val horizontalPadding = when {
        isSmall -> 8.dp
        isMedium -> 10.dp
        else -> 12.dp
    }
    
    val verticalPadding = when {
        isSmall -> 16.dp
        isMedium -> 24.dp
        else -> 32.dp
    }
    
    val titleStyle = when {
        isSmall -> MaterialTheme.typography.titleSmall
        isMedium -> MaterialTheme.typography.titleMedium
        else -> MaterialTheme.typography.titleLarge
    }
    
    val buttonVerticalPadding = when {
        isSmall -> 2.dp
        else -> 4.dp
    }
    
    AppScaffold {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = horizontalPadding, vertical = verticalPadding),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Tango Watch",
                style = titleStyle,
                color = MaterialTheme.colorScheme.primary,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(if (isSmall) 2.dp else 4.dp))

            Text(
                text = "Tap to speak",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(if (isSmall) 8.dp else 12.dp))

            commands.forEach { command ->
                Button(
                    onClick = { onCommandSelected(command) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = buttonVerticalPadding)
                ) {
                    Text(
                        text = "\"${command.phrase}\"",
                        style = MaterialTheme.typography.bodySmall,
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }
}
