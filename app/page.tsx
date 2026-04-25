"use client";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PhoneShell from "@/components/PhoneShell";
import WalletHome from "@/components/WalletHome";
import TransferSheet from "@/components/TransferSheet";
import TransferRecipient from "@/components/TransferRecipient";
import TransferMoney from "@/components/TransferMoney";
import AuthModal from "@/components/AuthModal";
import Processing from "@/components/Processing";
import Receipt from "@/components/Receipt";
import TangoAssistant from "@/components/TangoAssistant";
import WatchSimulator from "@/components/WatchSimulator";
import PrepaidScreen from "@/components/PrepaidScreen";
import DonationScreen from "@/components/DonationScreen";
import DonationPayScreen from "@/components/DonationPayScreen";
import CashLoanScreen from "@/components/CashLoanScreen";
import ScanScreen from "@/components/ScanScreen";
import AddMoneyScreen from "@/components/AddMoneyScreen";
import RemoteBridge from "@/components/RemoteBridge";
import SmartWatchScreen from "@/components/SmartWatchScreen";
import MerchantPay from "@/components/MerchantPay";
import { useApp } from "@/lib/store";

export default function Page() {
  const { screen, handoffMessage, setHandoff, isPhoneLocked, setPhoneLocked, setScreen, pairCode } = useApp();

  const clearWatchProximity = async () => {
    const room = (pairCode || "DEMO").toUpperCase();
    try {
      await fetch("/api/remote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room, cmd: "proximity-clear", payload: {} }),
      });
    } catch {}
  };
  // Collapse the Scan/Pay/Receive sibling screens into one key so switching
  // tabs inside ScanScreen doesn't trigger a slide animation.
  const animKey = screen === "pay" || screen === "receive" ? "scan" : screen === "money-packet" || screen === "gift" || screen === "transfer-receive" ? "transfer-recipient" : screen;
  useEffect(() => {
    if (handoffMessage) {
      const t = setTimeout(() => setHandoff(undefined), 5000);
      return () => clearTimeout(t);
    }
  }, [handoffMessage, setHandoff]);
  return (
    <main className="min-h-[100dvh] w-full flex items-center justify-center p-4">
      <div className="flex flex-col items-center">
        <div className="hidden md:block text-white/80 text-xs mb-3 font-medium tracking-wide">
          Tango Guardian · Wearable AI Financial Defense
        </div>
        <PhoneShell>
          <AnimatePresence mode="wait">
            <motion.div
              key={animKey}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
              className="h-full w-full absolute inset-0"
            >
              {screen === "home" && <WalletHome />}
              {(screen === "transfer-recipient" || screen === "money-packet" || screen === "gift" || screen === "transfer-receive") && (
                <TransferRecipient
                  initialTab={screen === "transfer-receive" ? "Receive" : screen === "money-packet" ? "Money Packet" : screen === "gift" ? "Gift" : "Transfer"}
                />
              )}
              {screen === "transfer-money" && <TransferMoney />}
              {screen === "processing" && <Processing />}
              {screen === "receipt" && <Receipt />}
              {screen === "watch" && <WatchSimulator />}
              {screen === "prepaid" && <PrepaidScreen />}
              {screen === "donation" && <DonationScreen />}
              {screen === "pay-donation" && <DonationPayScreen />}
              {screen === "cashloan" && <CashLoanScreen />}
              {(screen === "scan" || screen === "pay" || screen === "receive") && (
                <ScanScreen
                  initialTab={screen === "pay" ? "Pay" : screen === "receive" ? "Receive" : "Scan"}
                />
              )}
              {screen === "add-money" && <AddMoneyScreen />}
              {screen === "smartwatch" && <SmartWatchScreen />}
              {screen === "pay-merchant" && <MerchantPay />}
              {/* AuthModal handles its own visibility at screen==="auth" */}
              {screen === "auth" && <TransferMoney />}
            </motion.div>
          </AnimatePresence>

          <TransferSheet />
          <AuthModal />
          <TangoAssistant />
          <RemoteBridge />

          {/* Handoff banner from watch */}
          <AnimatePresence>
            {handoffMessage && (
              <motion.div
                initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
                className="absolute top-2 inset-x-3 z-[70] bg-tng-blue text-white text-xs px-3 py-2 rounded-xl shadow-lg flex items-center justify-between gap-2"
              >
                <span className="truncate">📱 {handoffMessage}</span>
                <button onClick={() => setHandoff(undefined)} className="opacity-80">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Full-black lock screen triggered from watch */}
          <AnimatePresence>
            {isPhoneLocked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </div>
                  <div className="text-white/30 text-sm font-medium tracking-wide">
                    Phone Locked by Watch
                  </div>
                  <div className="text-white/15 text-xs text-center px-10 leading-relaxed">
                    This device has been remotely locked via Tango Guardian.
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPhoneLocked(false);
                    clearWatchProximity();
                    setScreen("auth");
                  }}
                  className="absolute bottom-12 inset-x-10 py-3 rounded-full border border-white/15 text-white/40 text-sm font-medium"
                >
                  Authenticate to Unlock
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </PhoneShell>
        <div className="hidden md:block text-white/40 text-[11px] mt-3">
          Real-time fraud interception · stress-aware control · mutual device trust
        </div>
      </div>
    </main>
  );
}
