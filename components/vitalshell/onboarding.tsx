"use client"

import { useState } from "react"

export function Onboarding({ onEnter }: { onEnter: (name: string) => void }) {
  const [name, setName] = useState("")

  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <h1 className="text-4xl font-bold tracking-tight text-fg">VitalShell</h1>
        <p className="max-w-xs text-lg leading-relaxed text-fg text-balance">
          Las paredes ahora ya tienen una historia que contar.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          const finalName = name.trim()
          if (finalName) {
            localStorage.setItem("vitalshell_name", finalName)
          } else {
            localStorage.removeItem("vitalshell_name")
          }
          onEnter(finalName)
        }}
        className="w-full max-w-xs space-y-3 pb-12"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          aria-label="Tu nombre"
          className="w-full rounded-xl border border-edge bg-card px-4 py-3 text-center text-sm text-fg placeholder:text-fg-subtle focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)", color: "var(--color-fg)" }}
        >
          Entrar
        </button>
      </form>
    </div>
  )
}
