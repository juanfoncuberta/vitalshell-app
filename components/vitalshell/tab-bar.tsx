"use client"

import { Home, ThermometerSun, PiggyBank, ListChecks, Leaf, MessageCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type TabId = "home" | "comfort" | "savings" | "plans" | "environment" | "assistant"

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "comfort", label: "Comfort", icon: ThermometerSun },
  { id: "savings", label: "Savings", icon: PiggyBank },
  { id: "plans", label: "Plans", icon: ListChecks },
  { id: "environment", label: "Environment", icon: Leaf },
  { id: "assistant", label: "Assistant", icon: MessageCircle },
]

export function TabBar({
  active,
  onChange,
}: {
  active: TabId
  onChange: (id: TabId) => void
}) {
  return (
    <nav
      className="absolute inset-x-0 bottom-0 z-20 flex items-stretch border-t border-edge bg-card/95 backdrop-blur"
      aria-label="Main navigation"
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = id === active
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={isActive ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors"
            style={{ color: isActive ? "var(--color-primary)" : "var(--color-fg-subtle)" }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
            <span className="text-[9px] font-medium leading-none">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
