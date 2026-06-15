"use client"

import { useEffect, useRef, useState } from "react"
import { Send, Headset } from "lucide-react"
import { ScreenHeader } from "@/components/vitalshell/primitives"
import { quickChips, type ChatMessage } from "@/lib/vitalshell-data"
import { PROXY } from "@/lib/api"

const WELCOME: ChatMessage = {
  id: 0,
  role: "system",
  text: "Soy VitalShell. ¿En qué puedo ayudarte?",
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: "var(--color-fg-muted)", animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )
}

export function AssistantScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || typing) return

    const userMsg: ChatMessage = { id: Date.now(), role: "user", text: trimmed }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setTyping(true)

    try {
      const res = await fetch(`${PROXY}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      })
      const json = (await res.json()) as Record<string, unknown>
      const reply =
        (json?.response as string) ??
        (json?.message as string) ??
        (json?.reply as string) ??
        "Lo siento, no tengo respuesta en este momento."
      setMessages((m) => [...m, { id: Date.now() + 1, role: "system", text: reply }])
    } catch {
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, role: "system", text: "Error de conexión. Inténtalo de nuevo." },
      ])
    } finally {
      setTyping(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0">
        <ScreenHeader title="Asistente" subtitle="Pregunta sobre tu edificio" />
      </div>

      <div className="no-scrollbar mt-4 flex flex-wrap gap-2">
        {quickChips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => void send(chip)}
            disabled={typing}
            className="rounded-full border border-edge bg-card px-3 py-1.5 text-xs text-fg-muted transition-colors hover:text-fg disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="no-scrollbar mt-4 flex-1 space-y-3 overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
              style={{
                backgroundColor:
                  m.role === "user" ? "var(--color-bubble-user)" : "var(--color-card)",
                color: "var(--color-fg)",
                border: m.role === "user" ? "none" : "1px solid var(--color-edge)",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing ? (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-edge bg-card px-2">
              <TypingDots />
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send(input)
        }}
        className="mt-3 flex shrink-0 items-center gap-2 rounded-full border border-edge bg-card px-2 py-1.5"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregunta a VitalShell…"
          className="min-w-0 flex-1 bg-transparent px-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
          aria-label="Mensaje"
          disabled={typing}
        />
        <button
          type="submit"
          disabled={typing || !input.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)", color: "var(--color-fg)" }}
          aria-label="Enviar mensaje"
        >
          <Send size={16} />
        </button>
      </form>

      <div className="mt-4 shrink-0">
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-fg-subtle">
          <span className="h-px flex-1 bg-edge" />
          Soporte técnico
          <span className="h-px flex-1 bg-edge" />
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-edge bg-card p-3.5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: "rgba(0,128,128,0.18)", color: "var(--color-secondary)" }}
          >
            <Headset size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-fg">Habla con un especialista</p>
            <p className="text-xs text-fg-muted">Respuesta media menor a 5 min · Lun–Sáb</p>
          </div>
        </div>
      </div>
    </div>
  )
}
