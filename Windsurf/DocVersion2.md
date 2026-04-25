# Tango Wallet Assistant - AI Documentation (Version 2)

This file provides a comprehensive overview of the Tango Wallet Assistant codebase for AI-assisted understanding and modification, including the new Wear OS integration.

## Project Overview

Tango Wallet Assistant is a hackathon-ready fintech demo featuring both a web application and a native Wear OS app. It's inspired by Malaysian e-wallet user flows with a blue-themed fintech interface and an AI financial assistant named "Tango" that works like a ChatGPT-style assistant within the wallet app.

**Key Features:**
- FAQ answering about wallet limits, balance, security, and fees
- Transfer command interpretation with natural language parsing
- Recipient matching with phonetic fuzzy matching
- WhatsApp screenshot interpretation with scam detection
- Behavior anomaly detection with risk scoring
- Confidence scoring for AI decisions
- Action confirmation before transfers
- **Native Wear OS app** with real watch functionality
- **Phone-watch communication** via Wearable Data Layer
- **Deep link handoff** for secure transfers (watch → phone)
- Persistent action history with localStorage
- Responsive watch UI for small, medium, and large screens

## Tech Stack

### Web Application
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand with persist middleware
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **AI:** Google Gemini API via `@google/genai` (with mock fallbacks)
- **Persistence:** localStorage (via Zustand persist)

### Wear OS Application
- **Language:** Kotlin
- **UI Framework:** Jetpack Compose for Wear Material 3
- **Build System:** Gradle with Kotlin DSL
- **Min SDK:** 33 (Wear OS 4.0)
- **Target SDK:** 36
- **Communication:** Wearable Data Layer API
- **Coroutines:** kotlinx-coroutines-play-services
- **Icons:** Material Icons Extended

## Architecture

### Web Application - Single-Page Application (SPA) Pattern
The web app uses a state-driven phone shell UI where screens are rendered conditionally based on a `screen` state in the Zustand store. This allows for smooth transitions between screens without page reloads.

### Wear OS Application - Multi-Module Android Project
The Wear OS app is structured as a multi-module Gradle project with two modules:
- **wear:** The Wear OS app with watch UI and functionality
- **mobile:** Companion Android app for deep link handling and watch communication

### Component Hierarchy (Web)

```
app/page.tsx (Main orchestrator)
├── PhoneShell (Mobile phone frame)
│   ├── Screen Components (conditional rendering)
│   │   ├── WalletHome
│   │   ├── TransferRecipient
│   │   ├── TransferMoney
│   │   ├── ReceiveScreen
│   │   ├── PrepaidScreen
│   │   ├── DonationScreen
│   │   ├── CashLoanScreen
│   │   ├── WatchSimulator (deprecated - use real Wear OS app)
│   │   ├── Processing
│   │   └── Receipt
│   ├── TransferSheet (Bottom sheet overlay)
│   ├── AuthModal (Biometric/PIN verification overlay)
│   └── TangoAssistant (AI chat overlay with history drawer)
└── Handoff banner (Watch → phone notification)
```

### Component Hierarchy (Wear OS)

```
MainActivity
└── TangoWatchApp (Navigation host)
    ├── WelcomeScreen (2.5s splash with animation)
    ├── MainMenuScreen (Grid menu with 11 features)
    ├── HomeScreen (Voice command selection - legacy)
    ├── ListeningScreen (Microphone animation)
    ├── MerchantPaymentScreen (QR code display)
    ├── MerchantSuccessScreen (Green checkmark)
    └── HandoffScreen (Phone transfer indicator)
```

## File Structure

### Web Application
```
tngfinhack/
├── app/
│   ├── page.tsx              # Main app shell with screen routing
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles + phone frame CSS
│   └── api/
│       ├── tango/route.ts           # AI assistant endpoint
│       ├── analyze-whatsapp/route.ts # WhatsApp OCR + scam detection
│       └── detect-risk/route.ts     # Behavior anomaly detection
├── components/
│   ├── PhoneShell.tsx       # Mobile phone frame component
│   ├── WalletHome.tsx       # Home dashboard with shortcuts
│   ├── TransferSheet.tsx    # Transfer options bottom sheet
│   ├── TransferRecipient.tsx # Recipient selection screen
│   ├── TransferMoney.tsx    # Amount entry screen
│   ├── AuthModal.tsx        # Biometric/PIN verification
│   ├── Processing.tsx       # Transfer processing animation
│   ├── Receipt.tsx          # Success receipt screen
│   ├── ReceiveScreen.tsx    # QR code display for receiving money
│   ├── PrepaidScreen.tsx    # Mobile prepaid top-up
│   ├── DonationScreen.tsx   # Charity donations
│   ├── CashLoanScreen.tsx   # Personal financing application
│   ├── TangoAssistant.tsx   # AI chat overlay + history drawer
│   └── WatchSimulator.tsx   # Legacy web-based watch simulator
├── lib/
│   ├── db.ts                # Mock data (recipients, transactions, FAQs)
│   ├── store.ts             # Zustand state management with persist
│   ├── gemini.ts            # Gemini API wrapper
│   └── utils.ts             # Utility functions
├── .env.local               # Environment variables (Gemini API key)
├── .gitignore               # Git ignore patterns
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── tailwind.config.ts       # Tailwind config with custom TNG colors
└── next.config.mjs          # Next.js config
```

### Wear OS Application
```
watch-app/
├── settings.gradle.kts      # Multi-module project configuration
├── gradle/
│   └── libs.versions.toml   # Centralized dependency versions
├── wear/                    # Wear OS module
│   ├── build.gradle.kts     # Wear module build configuration
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   └── java/com/tango/wallet/wear/
│   │       ├── data/
│   │       │   └── Models.kt           # Data models (Merchant, WatchCommand)
│   │       ├── service/
│   │       │   └── PhoneHandoffService.kt  # Wearable Data Layer communication
│   │       └── presentation/
│   │           ├── MainActivity.kt     # Entry point
│   │           ├── theme/
│   │           │   └── Theme.kt        # Tango blue theme
│   │           └── screens/
│   │               ├── TangoWatchApp.kt      # Navigation controller
│   │               ├── WelcomeScreen.kt      # Animated splash screen
│   │               ├── MainMenuScreen.kt     # Grid menu (11 features)
│   │               ├── HomeScreen.kt         # Voice commands (legacy)
│   │               ├── ListeningScreen.kt    # Microphone animation
│   │               ├── MerchantScreens.kt    # Payment & success screens
│   │               └── HandoffScreen.kt      # Phone handoff indicator
├── mobile/                  # Companion mobile module
│   ├── build.gradle.kts     # Mobile module build configuration
│   └── src/main/
│       ├── AndroidManifest.xml  # Deep link intent filters
│       └── java/com/example/myapplication/
│           ├── MainActivity.kt              # Deep link handler
│           └── WearMessageListenerService.kt # Wearable Data Layer listener
├── README.md                # Quick start guide
└── DEMO_FLOW.md            # Detailed demo instructions
```

## State Management (Zustand Store)

**File:** `lib/store.ts`

### State Schema

```typescript
type FlowState = {
  // Navigation
  screen: Screen;              // Current active screen
  device: "phone" | "watch";   // Current device context
  showTransferSheet: boolean;  // Transfer bottom sheet visibility
  showTango: boolean;          // Tango AI overlay visibility

  // Transfer flow
  recipient?: Recipient;       // Selected recipient
  amount?: number;            // Transfer amount
  note: string;               // Transfer note/memo

  // Wallet state
  balance: number;             // Current wallet balance
  lastReceiptId?: string;      // Last transaction reference

  // Persistent action history
  actionLog: ActionLogEntry[]; // List of logged actions

  // Watch handoff
  handoffMessage?: string;     // Message from watch to phone

  // Actions
  setScreen: (s: Screen) => void;
  setDevice: (d: Device) => void;
  setShowTransferSheet: (v: boolean) => void;
  setShowTango: (v: boolean) => void;
  setRecipient: (r?: Recipient) => void;
  setAmount: (n?: number) => void;
  setNote: (n: string) => void;
  setHandoff: (msg?: string) => void;
  logAction: (entry: Omit<ActionLogEntry, "id" | "ts">) => void;
  clearActionLog: () => void;
  startTransfer: (r: Recipient, amount?: number, note?: string) => void;
  confirmAmount: () => void;
  authenticate: () => Promise<void>;
  completeProcessing: () => void;
  resetToHome: () => void;
};
```

## Wear OS Data Models

**File:** `watch-app/wear/src/main/java/com/tango/wallet/wear/data/Models.kt`

```kotlin
data class Merchant(
    val id: String,
    val name: String,
    val category: String
)

enum class CommandType {
    MERCHANT,
    TRANSFER
}

data class WatchCommand(
    val phrase: String,
    val type: CommandType,
    val amount: Double,
    val merchantId: String? = null,
    val recipientQuery: String? = null
)

object WalletData {
    val merchants: List<Merchant>
    val watchCommands: List<WatchCommand>
    fun getMerchant(id: String): Merchant?
}
```

## Wear OS Navigation

**File:** `watch-app/wear/src/main/java/com/tango/wallet/wear/presentation/screens/TangoWatchApp.kt`

### Screen Flow

```
WELCOME (2.5s auto-advance)
    ↓
MAIN_MENU (grid with 11 features)
    ├─→ Tango → HOME (voice commands)
    │              ↓
    │          LISTENING (1.2s)
    │              ↓
    │      ┌──────┴──────┐
    │      ↓             ↓
    │  MERCHANT_PAYMENT  HANDOFF
    │      ↓             ↓
    │  MERCHANT_SUCCESS  (sends to phone)
    │      ↓
    │  MAIN_MENU (reset)
    │
    └─→ Transfer → HANDOFF (direct)
                      ↓
                  (sends to phone)
```

### WatchScreen Enum

```kotlin
enum class WatchScreen {
    WELCOME,        // Animated splash with Tango branding
    MAIN_MENU,      // Grid menu with 11 features
    HOME,           // Voice command selection (legacy)
    LISTENING,      // Microphone animation
    MERCHANT_PAYMENT, // QR code + amount display
    MERCHANT_SUCCESS, // Green checkmark
    HANDOFF         // Phone icon + progress indicator
}
```

## Phone-Watch Communication

### Deep Link Protocol

**Scheme:** `tango://transfer`

**Parameters:**
- `to`: Recipient query (e.g., "Rizwan")
- `amount`: Transfer amount (e.g., "500")

**Example:** `tango://transfer?to=Rizwan&amount=500`

### Wearable Data Layer

**Message Path:** `/tango/transfer`

**Message Format:** `transfer:{recipientQuery}:{amount}`

**Example:** `transfer:Rizwan:500`

### Communication Flow

1. **Watch → Phone (Wearable Data Layer)**
   - `PhoneHandoffService.sendTransferRequest()` sends message to all connected nodes
   - Uses `Wearable.getMessageClient()` and `Wearable.getNodeClient()`

2. **Phone Receives Message**
   - `WearMessageListenerService` listens for `/tango/transfer` messages
   - Parses message and constructs deep link URI

3. **Phone Opens Deep Link**
   - `MainActivity` handles `tango://transfer` intent
   - Extracts `to` and `amount` parameters
   - In production: Opens web app with prefilled transfer form

## Responsive Watch UI

All watch screens adapt to three screen size categories:

### Screen Size Breakpoints
- **Small:** < 200dp (e.g., Wear OS Small Round)
- **Medium:** 200-240dp (e.g., standard watches)
- **Large:** > 240dp (e.g., larger watches)

### Responsive Elements
- **Font sizes:** Scale from 8sp-28sp based on screen size
- **Icon sizes:** Scale from 14dp-48dp
- **Padding:** Adjusts from 4dp-32dp
- **Button heights:** 38dp-50dp
- **Spacing:** Tighter on small screens

### Main Menu Layout

**Pattern:** 3-4-4 grid (11 items total)

```
Row 1: [Pay] [Balance] [Notifications]
Row 2: [Transfer] [Scan] [Prepaid] [Donate]
Row 3: [Loan] [Home] [Receive] [Tango]
```

**Features:**
- Rounded rectangle tiles (12dp corners)
- Blue Material Icons (`#3B82F6`)
- Dark navy background (`#1A1F2E`)
- Equal weight distribution
- Responsive sizing for all screen sizes

## API Routes

### POST /api/tango

**Purpose:** Interpret user messages and determine intent

**Request:**
```json
{
  "message": "Pay RM50 to Rizwan"
}
```

**Response:**
```json
{
  "intent": "transfer",
  "amount": 50,
  "recipientQuery": "Rizwan",
  "confidence": 0.92,
  "needsClarification": false,
  "message": "Ready to transfer RM50 to Rizwan Hakeem."
}
```

**Intents:**
- `faq`: Answer wallet-related questions
- `transfer`: Parse transfer commands with amount and recipient
- `unknown`: Fallback when intent cannot be determined

**Fallback:** Uses regex-based mock interpretation when Gemini API is unavailable

### POST /api/analyze-whatsapp

**Purpose:** Analyze WhatsApp screenshot OCR for scam detection

**Request:**
```json
{
  "sample": "normal" | "scam"
}
```

**Response:**
```json
{
  "intent": "transfer",
  "amount": 50,
  "recipientQuery": "Rizwan",
  "risk": "low",
  "reasons": [],
  "ocr": "Hey! Can you send RM50 to Rizwan...",
  "sender": "Aina (saved contact)",
  "message": "I detected a request to send RM50 to Rizwan. Continue?"
}
```

**Risk Levels:**
- `low`: Safe transfer request
- `medium`: Some suspicious elements
- `high`: Multiple scam indicators (blocks transfer)

### POST /api/detect-risk

**Purpose:** Calculate behavior anomaly risk for a transfer

**Request:**
```json
{
  "recipientId": "r1",
  "amount": 500
}
```

**Response:**
```json
{
  "risk": "high",
  "reasons": ["You usually send about RM51.67 to Rizwan Hakeem — RM500 is 9.7x higher."],
  "avg": 51.67,
  "multiplier": 9.7
}
```

## Wear OS Theme

**File:** `watch-app/wear/src/main/java/com/example/myapplication/presentation/theme/Theme.kt`

### Tango Color Scheme

```kotlin
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
```

## Demo Flow

### Web App - Basic Transfer Flow
1. Home → Tap "Transfer" quick action
2. Transfer Sheet → Tap "Send money"
3. Transfer Recipient → Search/select recipient
4. Transfer Money → Enter amount
5. Auth Modal → Choose verification method
6. Processing → Animated transfer
7. Receipt → Success confirmation
8. Done → Return to home

### Web App - Tango AI Transfer Flow
1. Home → Tap floating Tango button
2. Ask: "Pay RM50 to Rizwan"
3. Tango shows recipient options (fuzzy matching)
4. Tap recipient → Confirm bubble with risk assessment
5. Tap "Continue to transfer" → Prefilled Transfer Money
6. Auth → Processing → Receipt
7. Open Tango history → See logged transfer

### Wear OS - Main Menu Navigation
1. App Launch → Welcome screen (2.5s)
2. Main Menu → Grid with 11 features
3. Tap "Tango" → Voice commands screen
4. Tap "Transfer" → Direct handoff to phone

### Wear OS - Merchant Payment Flow
1. Main Menu → Tap "Tango"
2. Voice Commands → Tap "Pay merchant RM10"
3. Listening animation (1.2s)
4. Merchant Payment → Shows QR + amount (2s)
5. Merchant Success → Green checkmark
6. Auto-return to Main Menu

### Wear OS - Transfer Handoff Flow
1. Main Menu → Tap "Transfer" (or "Tango" → "Transfer RM500")
2. Listening animation (1.2s, if from voice)
3. Handoff screen → Phone icon + progress
4. Sends message to phone via Wearable Data Layer (2s delay)
5. Phone receives deep link
6. **Production:** Web app opens with prefilled transfer form
7. **Demo:** Mobile app shows transfer details

## Environment Variables

**File:** `.env.local` (not committed to git)

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```

## How to Run

### Web Application

```bash
# Install dependencies
npm install

# (Optional) Set up environment variables
cp .env.example .env.local
# Edit .env.local and add GEMINI_API_KEY

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open http://localhost:3000 to view the app.

### Wear OS Application

**Prerequisites:**
- Android Studio (latest version)
- Wear OS emulator or physical Wear OS device

**Steps:**

1. **Open project in Android Studio**
   ```bash
   cd watch-app
   # Open this folder in Android Studio
   ```

2. **Create Wear OS emulator** (if needed)
   - Tools → Device Manager → Create Device
   - Select "Wear OS" tab → Choose "Pixel Watch" or similar
   - Download system image (API 33+)

3. **Sync Gradle**
   - Click elephant icon 🐘 or File → Sync Project with Gradle Files

4. **Run the wear module**
   - Select **wear** in run configuration dropdown
   - Click Run ▶️

5. **Test features**
   - Welcome screen appears for 2.5s
   - Main menu shows 11 features
   - Tap "Tango" for voice commands
   - Tap "Transfer" for phone handoff

**See `watch-app/DEMO_FLOW.md` for detailed demo instructions.**

## Key Design Decisions

1. **State-driven routing (Web):** Using Zustand screen state instead of Next.js routing for smoother transitions and easier state sharing between screens.

2. **Persistent action log:** localStorage persistence ensures users can see their history across sessions, useful for demonstrating the AI assistant's capabilities.

3. **Phonetic fuzzy matching:** Lightweight approach to handle Malaysian name variations (Ridzuan/Rizwan) without complex NLP libraries.

4. **Graceful AI degradation:** All AI features have deterministic mock fallbacks, ensuring the demo works reliably even without API keys.

5. **Single-page phone shell:** All screens render within a single phone frame component, maintaining the mobile app feel on desktop.

6. **Native Wear OS app:** Real Android app instead of web simulator for authentic watch experience and proper phone-watch communication.

7. **Responsive watch UI:** Adaptive sizing for small, medium, and large watch screens ensures compatibility across devices.

8. **Deep link protocol:** Standard Android deep links enable seamless handoff from watch to phone/web app.

9. **Material Design 3 for Wear:** Modern Wear OS UI components with Tango blue theming.

10. **Grid-based menu:** 3-4-4 layout optimized for round watch faces with all features visible without scrolling.

## Extension Points

### Web Application

#### Adding New Screens
1. Add screen type to `Screen` union in `lib/store.ts`
2. Create component in `components/`
3. Add conditional render in `app/page.tsx`
4. Add navigation from existing screens

#### Adding New Action Log Types
1. Add type to `ActionLogEntry["type"]` union in `lib/store.ts`
2. Add icon mapping in `TangoAssistant.tsx` `iconFor` function
3. Call `logAction` at appropriate event points

### Wear OS Application

#### Adding New Watch Screens
1. Add screen to `WatchScreen` enum in `TangoWatchApp.kt`
2. Create composable in `presentation/screens/`
3. Add navigation case in `when (currentScreen)` block
4. Add responsive sizing logic

#### Adding New Menu Items
1. Add `MenuItem` to `menuItems` list in `MainMenuScreen.kt`
2. Choose appropriate Material Icon from `Icons.Outlined.*`
3. Implement action lambda (navigate or trigger feature)
4. Adjust grid layout if needed (currently 3-4-4)

#### Adding New Watch Commands
1. Add entry to `WalletData.watchCommands` in `Models.kt`
2. Update `onCommandSelected` handler in `TangoWatchApp.kt`
3. Add new screen for command if needed

## Testing Checklist

### Web Application
- [ ] Basic transfer flow completes end-to-end
- [ ] Tango AI responds to FAQ queries
- [ ] Tango AI parses transfer commands
- [ ] Fuzzy matching returns all Rizwan variants
- [ ] WhatsApp normal sample triggers transfer flow
- [ ] WhatsApp scam sample blocks with reasons
- [ ] Behavior anomaly detection shows high risk for unusual amounts
- [ ] Action history persists across page refresh
- [ ] All new screens (Receive, Prepaid, Donation, CashLoan) navigate correctly

### Wear OS Application
- [ ] Welcome screen displays for 2.5s and auto-advances
- [ ] Main menu shows all 11 features in 3-4-4 grid
- [ ] Tango button navigates to voice commands
- [ ] Transfer button triggers direct handoff
- [ ] Merchant payment shows QR and success animation
- [ ] Transfer handoff sends message to phone
- [ ] Phone receives deep link with correct parameters
- [ ] UI adapts correctly to small/medium/large screens
- [ ] All icons display correctly (Material Icons Extended)
- [ ] Theme colors match Tango blue branding

### Integration
- [ ] Watch handoff message reaches phone app
- [ ] Deep link opens with correct recipient and amount
- [ ] Mobile app displays transfer details from watch
- [ ] Action log shows "watch-handoff" entry (web app)

## Dependencies

### Web Application (package.json)
```json
{
  "@google/genai": "^0.21.0",
  "framer-motion": "^11.11.17",
  "lucide-react": "^0.468.0",
  "next": "15.1.3",
  "react": "^19.0.0",
  "zustand": "^5.0.2"
}
```

### Wear OS Application (libs.versions.toml)
```toml
[versions]
agp = "8.7.3"
kotlin = "2.1.0"
composeBom = "2024.12.01"
playServicesWearable = "18.2.0"

[libraries]
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-wear-compose-material3 = { group = "androidx.wear.compose", name = "compose-material3" }
play-services-wearable = { group = "com.google.android.gms", name = "play-services-wearable", version.ref = "playServicesWearable" }
kotlinx-coroutines-play-services = "1.7.3"
material-icons-extended = "1.7.5"
```

## Security Notes

- **No real payments:** All transactions are mock only
- **No real biometrics:** Face ID, fingerprint, and PIN are simulated
- **No real payment gateway:** No external payment processing
- **Demo mode:** Amount validation relaxed to allow exceeding wallet balance for anomaly testing
- **API keys:** Gemini API key should be kept secure and not committed to version control
- **Deep links:** In production, validate and sanitize all deep link parameters
- **Watch communication:** Wearable Data Layer messages are not encrypted by default

## Version History

### Version 2 (Current)
- Added native Wear OS application
- Implemented phone-watch communication via Wearable Data Layer
- Created deep link protocol for secure handoff
- Built responsive watch UI for multiple screen sizes
- Designed grid-based main menu with 11 features
- Integrated Material Icons Extended
- Added welcome screen with animations
- Created comprehensive demo documentation

### Version 1
- Initial web application with phone shell UI
- Tango AI assistant with Gemini integration
- Transfer flow with fuzzy recipient matching
- WhatsApp scam detection
- Behavior anomaly detection
- Web-based watch simulator (deprecated)
- Action history with localStorage persistence
- Multiple wallet features (Receive, Prepaid, Donation, CashLoan)
