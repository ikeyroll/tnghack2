package com.tango.wallet.wear.presentation.screens

import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import com.tango.wallet.wear.data.CommandType
import com.tango.wallet.wear.data.WalletData
import com.tango.wallet.wear.data.WatchCommand
import com.tango.wallet.wear.service.PhoneHandoffService
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

enum class WatchScreen {
    WELCOME,
    BALANCE,
    MAIN_MENU,
    PAY,
    ALERTS,
    HOME,
    LISTENING,
    MERCHANT_PAYMENT,
    MERCHANT_SUCCESS,
    HANDOFF
}

@Composable
fun TangoWatchApp() {
    var currentScreen by remember { mutableStateOf(WatchScreen.WELCOME) }
    var currentCommand by remember { mutableStateOf<WatchCommand?>(null) }
    val context = LocalContext.current
    val handoffService = remember { PhoneHandoffService(context) }
    val coroutineScope = rememberCoroutineScope()

    val onCommandSelected: (WatchCommand) -> Unit = { command ->
        currentCommand = command
        currentScreen = WatchScreen.LISTENING
        
        coroutineScope.launch {
            delay(1200)
            when (command.type) {
                CommandType.MERCHANT -> {
                    currentScreen = WatchScreen.MERCHANT_PAYMENT
                    delay(2000)
                    currentScreen = WatchScreen.MERCHANT_SUCCESS
                }
                CommandType.TRANSFER -> {
                    currentScreen = WatchScreen.HANDOFF
                    delay(2000)
                    command.recipientQuery?.let { query ->
                        handoffService.sendTransferRequest(query, command.amount)
                    }
                }
            }
        }
    }

    val onReset = {
        currentScreen = WatchScreen.MAIN_MENU
        currentCommand = null
    }

    val navigateToVoice = {
        currentScreen = WatchScreen.HOME
    }
    
    val navigateToBalance = {
        currentScreen = WatchScreen.BALANCE
    }

    val navigateToPay = {
        currentScreen = WatchScreen.PAY
    }

    val navigateToAlerts = {
        currentScreen = WatchScreen.ALERTS
    }

    val navigateToTransfer: () -> Unit = {
        // Pre-fill a transfer command and navigate directly to listening/handoff
        val transferCommand = WatchCommand("Transfer RM500 to Rizwan", CommandType.TRANSFER, 500.0, recipientQuery = "Rizwan")
        currentCommand = transferCommand
        currentScreen = WatchScreen.HANDOFF
        coroutineScope.launch {
            delay(2000)
            handoffService.sendTransferRequest("Rizwan", 500.0)
        }
    }

    when (currentScreen) {
        WatchScreen.WELCOME -> WelcomeScreen(
            onWelcomeComplete = { currentScreen = WatchScreen.BALANCE }
        )
        WatchScreen.BALANCE -> BalanceScreen(
            onBackToMenu = { currentScreen = WatchScreen.MAIN_MENU }
        )
        WatchScreen.MAIN_MENU -> MainMenuScreen(
            onNavigateToVoice = navigateToVoice,
            onNavigateToTransfer = navigateToTransfer,
            onNavigateToPay = navigateToPay,
            onNavigateToAlerts = navigateToAlerts
        )
        WatchScreen.PAY -> PayScreen(
            onBack = { currentScreen = WatchScreen.MAIN_MENU }
        )
        WatchScreen.ALERTS -> AlertsScreen(
            onBack = { currentScreen = WatchScreen.MAIN_MENU }
        )
        WatchScreen.HOME -> HomeScreen(
            commands = WalletData.watchCommands,
            onCommandSelected = onCommandSelected
        )
        WatchScreen.LISTENING -> ListeningScreen(
            command = currentCommand
        )
        WatchScreen.MERCHANT_PAYMENT -> MerchantPaymentScreen(
            command = currentCommand
        )
        WatchScreen.MERCHANT_SUCCESS -> MerchantSuccessScreen(
            command = currentCommand,
            onDone = onReset
        )
        WatchScreen.HANDOFF -> HandoffScreen(
            command = currentCommand
        )
    }
}
