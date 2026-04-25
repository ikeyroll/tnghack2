# Tango Wallet - Wear OS App

A Wear OS companion app for the Tango Wallet that enables quick merchant payments and secure transfer handoffs to the phone.

## Quick Start

### Prerequisites
- Android Studio (latest version)
- Wear OS emulator or physical Wear OS device
- JDK 11+

### Run the Watch App

1. **Open project in Android Studio**:
   ```bash
   cd watch-app
   # Open this folder in Android Studio
   ```

2. **Create Wear OS emulator** (if needed):
   - Tools → Device Manager → Create Device
   - Select "Wear OS" tab
   - Choose "Pixel Watch" or similar
   - Download system image (API 33+)
   - Click Finish

3. **Select run configuration**:
   - In Android Studio toolbar, select **wear** from module dropdown
   - Select your Wear OS emulator/device
   - Click Run ▶️

4. **App launches** on watch showing Tango home screen

## Features

### ✅ Merchant Payments
Pay at merchants directly from your watch without phone authentication.
- "Pay merchant RM10" → Kopi Corner
- "Pay merchant RM25" → MRT Touch Pay

### 🔒 Secure Transfers
Large transfers that require phone authentication for security.
- "Transfer RM500 to Rizwan" → Hands off to phone
- "Transfer RM50 to Rizwan" → Hands off to phone

## Architecture

### Modules
- **wear**: Wear OS app (Kotlin + Jetpack Compose for Wear)
- **mobile**: Phone companion app (handles deep links)

### Tech Stack
- **Language**: Kotlin
- **UI**: Jetpack Compose for Wear Material 3
- **Communication**: Wearable Data Layer (Google Play Services)
- **Min SDK**: 33 (Wear OS 4.0+)

### Communication Flow
```
Watch App → Wearable Data Layer → Phone App → Deep Link → Web App
```

## Project Structure

```
watch-app/
├── wear/                          # Wear OS module
│   └── src/main/java/com/tango/wallet/wear/
│       ├── data/
│       │   └── Models.kt         # Data models
│       ├── service/
│       │   └── PhoneHandoffService.kt
│       ├── presentation/
│       │   ├── MainActivity.kt
│       │   ├── theme/Theme.kt
│       │   └── screens/          # All UI screens
│       └── AndroidManifest.xml
│
├── mobile/                        # Phone companion module
│   └── src/main/java/com/example/myapplication/
│       ├── MainActivity.kt       # Deep link handler
│       ├── WearMessageListenerService.kt
│       └── AndroidManifest.xml
│
├── DEMO_FLOW.md                  # Detailed demo instructions
└── README.md                     # This file
```

## Demo Flow

See [DEMO_FLOW.md](./DEMO_FLOW.md) for complete demo instructions.

### Quick Demo (2 minutes)

1. **Launch app** on Wear OS emulator
2. **Tap "Pay merchant RM10"**
   - Watch shows listening → payment → success
   - Completes entirely on watch
3. **Tap "Transfer RM500 to Rizwan"**
   - Watch shows handoff screen
   - Sends message to phone
   - Phone would open web app (in production)

## Integration with Web App

The watch app integrates with the Tango web app at `http://localhost:3000` (or production URL).

### Deep Link Format
```
tango://transfer?to={recipient}&amount={amount}
```

### Example
```
tango://transfer?to=Rizwan&amount=500
```

When the phone receives this deep link, it should:
1. Open the Tango web app
2. Prefill the transfer form
3. Request user authentication
4. Complete the transfer

## Development

### Build
```bash
./gradlew :wear:build
```

### Install on Device
```bash
./gradlew :wear:installDebug
```

### Run Tests
```bash
./gradlew :wear:test
```

## Configuration

### Package Names
- Wear app: `com.tango.wallet.wear`
- Mobile app: `com.example.myapplication`

### Deep Link Scheme
- Scheme: `tango`
- Host: `transfer`
- Parameters: `to`, `amount`

## Troubleshooting

### "No run configurations added"
- Make sure you select **wear** module in the run configuration dropdown
- Click "Edit Configurations" → Add New → Android App → Select wear module

### Watch emulator not showing
- Ensure you created a Wear OS emulator (not phone emulator)
- Check that system image is downloaded
- Restart Android Studio if needed

### App crashes on launch
- Check that all dependencies are synced
- Clean and rebuild: Build → Clean Project → Rebuild Project
- Check logcat for error messages

### Phone not receiving watch messages
- Ensure both watch and phone emulators are running
- Verify Google Play Services is installed on both
- Check Wearable Data Layer connection in logcat

## Next Steps

### For Demo
1. Run web app: `cd .. && npm run dev`
2. Run watch app in Android Studio
3. Follow [DEMO_FLOW.md](./DEMO_FLOW.md) script

### For Development
1. Add real voice input (Google Assistant integration)
2. Implement biometric auth on watch
3. Add transaction history screen
4. Create custom watch face with balance
5. Add push notifications for confirmations

## Resources

- [Wear OS Documentation](https://developer.android.com/training/wearables)
- [Jetpack Compose for Wear](https://developer.android.com/training/wearables/compose)
- [Wearable Data Layer](https://developer.android.com/training/wearables/data-layer)
- [Wear OS Samples](https://github.com/android/wear-os-samples)

## License

Demo project for TNG Hack 2026
