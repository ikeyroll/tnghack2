# Tango Wallet - Wear OS Demo Flow

## Overview
This Wear OS app demonstrates the Tango Wallet watch experience with merchant payments and secure phone handoff for transfers.

## Architecture

### Modules
- **wear**: Wear OS app (Jetpack Compose for Wear)
- **mobile**: Phone companion app (handles deep links from watch)

### Communication
- **Wearable Data Layer**: Watch sends messages to phone via Google Play Services
- **Deep Links**: `tango://transfer?to={recipient}&amount={amount}`

## Features

### 1. Merchant Payment (Watch Only)
Small transactions that can be completed entirely on the watch without phone authentication.

**Flow:**
1. User selects "Pay merchant RM10" or "Pay merchant RM25"
2. Watch shows listening animation
3. Merchant payment screen displays (QR code simulation)
4. Success confirmation
5. Done - returns to home

**Use Cases:**
- Coffee shop payments
- Public transport
- Convenience store purchases

### 2. Secure Transfer (Watch → Phone Handoff)
Larger transactions that require phone authentication for security.

**Flow:**
1. User selects "Transfer RM500 to Rizwan" or "Transfer RM50 to Rizwan"
2. Watch shows listening animation
3. Handoff screen displays "Secure auth required"
4. Watch sends message to phone via Wearable Data Layer
5. Phone receives deep link and opens web app
6. Web app prefills transfer form with recipient and amount
7. User completes authentication on phone

## Demo Instructions

### Setup

#### 1. Start Web App (Terminal)
```bash
cd /Users/rylin/Documents/GitHub/tnghack2
npm install
npm run dev
```
Open http://localhost:3000 in browser

#### 2. Open Watch App in Android Studio
```bash
cd /Users/rylin/Documents/GitHub/tnghack2/watch-app
```
- Open project in Android Studio
- Select **wear** module in run configuration dropdown
- Create Wear OS emulator if needed:
  - Tools → Device Manager → Create Device
  - Select "Wear OS" tab → Choose "Pixel Watch"
  - Download system image (API 33+)
- Click Run ▶️

### Demo Script

#### Part 1: Merchant Payment (Watch Only)
1. **Launch Tango Watch app** on Wear OS emulator
2. **Home screen** shows:
   - "Tango Watch" title
   - "Tap to speak" subtitle
   - 4 voice command buttons
3. **Tap "Pay merchant RM10"**
4. **Listening screen** appears with pulsing microphone
5. **Merchant payment screen** shows:
   - "Kopi Corner"
   - "RM 10.00"
   - QR code simulation
   - "Confirming..." status
6. **Success screen** displays:
   - Green checkmark
   - "Paid"
   - "RM 10.00 • Kopi Corner"
7. **Tap "Done"** to return to home

#### Part 2: Secure Transfer (Watch → Phone)
1. **From watch home**, tap **"Transfer RM500 to Rizwan"**
2. **Listening screen** appears
3. **Handoff screen** shows:
   - Phone icon
   - "Secure auth required"
   - "Please continue on your phone"
   - Progress indicator
   - "RM 500.00 to Rizwan"
4. **Watch sends message** to phone (via Wearable Data Layer)
5. **Phone app receives deep link**: `tango://transfer?to=Rizwan&amount=500`
6. **In production**: Phone would open web app at localhost:3000 with prefilled data
7. **Current demo**: Mobile app shows transfer details

#### Part 3: Web App Integration (Manual)
Since the watch and web app run separately in this demo:

1. **Open web app** at http://localhost:3000
2. **Tap floating sparkle button** (Tango AI)
3. **Say**: "Pay RM500 to Rizwan"
4. **Select recipient** from matches
5. **Transfer Money screen** opens (prefilled from Tango)
6. **Tap Next** → Authenticate → Processing → Receipt

## Voice Commands Available

### Merchant Payments (Watch Only)
- ✅ "Pay merchant RM10" → Kopi Corner
- ✅ "Pay merchant RM25" → MRT Touch Pay

### Secure Transfers (Phone Handoff)
- 🔒 "Transfer RM500 to Rizwan" → Requires phone auth
- 🔒 "Transfer RM50 to Rizwan" → Requires phone auth

## Technical Details

### Wear OS App Structure
```
wear/src/main/java/com/tango/wallet/wear/
├── data/
│   └── Models.kt              # Data models and constants
├── service/
│   └── PhoneHandoffService.kt # Wearable Data Layer communication
├── presentation/
│   ├── MainActivity.kt        # Entry point
│   ├── theme/
│   │   └── Theme.kt          # Tango blue theme
│   └── screens/
│       ├── TangoWatchApp.kt  # Main navigation
│       ├── HomeScreen.kt     # Command selection
│       ├── ListeningScreen.kt # Voice input simulation
│       ├── MerchantScreens.kt # Payment & success
│       └── HandoffScreen.kt  # Phone handoff UI
```

### Mobile App Structure
```
mobile/src/main/java/com/example/myapplication/
├── MainActivity.kt                  # Deep link handler
└── WearMessageListenerService.kt   # Wearable message receiver
```

### Data Flow

#### Merchant Payment
```
Watch Home
  → Select Command
  → Listening (1.2s)
  → Merchant Payment (2s)
  → Success
  → Done → Home
```

#### Secure Transfer
```
Watch Home
  → Select Command
  → Listening (1.2s)
  → Handoff Screen (2s)
  → Send Wearable Message
  → Phone receives message
  → Phone opens deep link
  → [Web app opens with prefilled data]
```

## Integration with Web App

### Current State
- **Watch app**: Standalone Wear OS app
- **Web app**: Next.js app at localhost:3000
- **Connection**: Manual (separate demos)

### Production Integration
To fully integrate watch and web app:

1. **Mobile app opens web app**:
   ```kotlin
   val webIntent = Intent(Intent.ACTION_VIEW).apply {
       data = Uri.parse("http://localhost:3000")
       // In production: https://tango-wallet.app
   }
   startActivity(webIntent)
   ```

2. **Web app receives deep link params**:
   ```typescript
   // app/page.tsx
   const searchParams = useSearchParams()
   const recipient = searchParams.get('to')
   const amount = searchParams.get('amount')
   
   // Prefill transfer form
   if (recipient && amount) {
     startTransfer(findRecipient(recipient), parseFloat(amount))
   }
   ```

3. **Full handoff flow**:
   - Watch detects secure transfer needed
   - Sends message to phone
   - Phone opens browser with deep link
   - Web app auto-opens transfer screen
   - User authenticates and completes

## Troubleshooting

### Watch app won't run
- Ensure Wear OS emulator is created (API 33+)
- Select **wear** module in run configuration
- Clean and rebuild project

### Phone app won't receive messages
- Ensure both watch and phone emulators are running
- Check Wearable Data Layer connection
- Verify Google Play Services is installed

### Web app not opening
- Ensure `npm run dev` is running
- Check http://localhost:3000 is accessible
- In production, use HTTPS URL

## Next Steps

### Enhancements
1. **Real voice input**: Integrate Google Assistant
2. **Biometric auth on watch**: For small transfers
3. **Transaction history**: View recent payments on watch
4. **Balance display**: Show wallet balance on watch face
5. **Notifications**: Payment confirmations via watch

### Production Deployment
1. **Web app**: Deploy to Vercel/Netlify
2. **Mobile app**: Publish to Google Play
3. **Watch app**: Publish to Google Play (Wear OS)
4. **Backend**: Add real payment processing
5. **Security**: Implement proper authentication & encryption
