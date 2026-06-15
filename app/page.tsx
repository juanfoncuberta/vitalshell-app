"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { TabBar, type TabId } from "@/components/vitalshell/tab-bar"
import { Onboarding } from "@/components/vitalshell/onboarding"
import { HomeScreen } from "@/components/vitalshell/screens/home-screen"
import { ComfortScreen } from "@/components/vitalshell/screens/comfort-screen"
import { SavingsScreen } from "@/components/vitalshell/screens/savings-screen"
import { PlansScreen } from "@/components/vitalshell/screens/plans-screen"
import { EnvironmentScreen } from "@/components/vitalshell/screens/environment-screen"
import { AssistantScreen } from "@/components/vitalshell/screens/assistant-screen"
import { VitalShellProvider, useVitalShell } from "@/lib/vitalshell-context"

function ToastLayer() {
  const { toasts, dismissToast } = useVitalShell()
  if (!toasts.length) return null
  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-xl"
          style={{
            backgroundColor: t.level === "danger" ? "var(--color-danger)" : "var(--color-warning)",
            color: "#fff",
          }}
        >
          <span className="flex-1 leading-snug">{t.message}</span>
          {t.level === "danger" && (
            <button
              onClick={() => dismissToast(t.id)}
              className="shrink-0 opacity-80 hover:opacity-100"
              aria-label="Cerrar alerta"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function AppShell() {
  const [entered, setEntered] = useState(false)
  const [tab, setTab] = useState<TabId>("home")
  const isAssistant = tab === "assistant"

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-background p-0 sm:p-6">
      <div
        className="relative flex flex-col overflow-hidden bg-background sm:rounded-[2.25rem] sm:border sm:border-edge sm:shadow-2xl"
        style={{ width: 390, height: 844, maxWidth: "100vw", maxHeight: "100dvh" }}
      >
        <ToastLayer />
        {!entered ? (
          <Onboarding onEnter={() => setEntered(true)} />
        ) : (
          <>
            <div
              className={
                isAssistant
                  ? "flex-1 overflow-hidden px-5 pt-6 pb-[68px]"
                  : "no-scrollbar flex-1 overflow-y-auto px-5 pt-6 pb-[84px]"
              }
            >
              {tab === "home" && <HomeScreen />}
              {tab === "comfort" && <ComfortScreen />}
              {tab === "savings" && <SavingsScreen />}
              {tab === "plans" && <PlansScreen />}
              {tab === "environment" && <EnvironmentScreen />}
              {isAssistant && <AssistantScreen />}
            </div>
            <TabBar active={tab} onChange={setTab} />
          </>
        )}
      </div>
    </main>
  )
}

export default function Page() {
  return (
    <VitalShellProvider>
      <AppShell />
    </VitalShellProvider>
  )
}
