package com.tango.wallet.wear.data

data class Merchant(
    val id: String,
    val name: String,
    val category: String
)

data class WatchCommand(
    val phrase: String,
    val type: CommandType,
    val amount: Double,
    val merchantId: String? = null,
    val recipientQuery: String? = null
)

enum class CommandType {
    MERCHANT,
    TRANSFER
}

object WalletData {
    val merchants = listOf(
        Merchant("m1", "Kopi Corner", "F&B"),
        Merchant("m2", "MRT Touch Pay", "Transport"),
        Merchant("m3", "Seven Mart", "Retail")
    )

    val watchCommands = listOf(
        WatchCommand("Pay merchant RM10", CommandType.MERCHANT, 10.0, "m1"),
        WatchCommand("Pay merchant RM25", CommandType.MERCHANT, 25.0, "m2"),
        WatchCommand("Transfer RM500 to Rizwan", CommandType.TRANSFER, 500.0, recipientQuery = "Rizwan"),
        WatchCommand("Transfer RM50 to Rizwan", CommandType.TRANSFER, 50.0, recipientQuery = "Rizwan")
    )

    fun getMerchant(id: String): Merchant? = merchants.find { it.id == id }
}
