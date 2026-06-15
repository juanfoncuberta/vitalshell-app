"use client"

import { useEffect, useState } from "react"
import { User } from "lucide-react"

export function HeaderAvatar() {
  const [initial, setInitial] = useState<string | null>(null)

  useEffect(() => {
    const name = (localStorage.getItem("vitalshell_name") || "").trim()
    setInitial(name ? name.charAt(0).toUpperCase() : null)
  }, [])

  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
      style={{ backgroundColor: "#008080", color: "#ffffff" }}
      aria-label={initial ? `Profile ${initial}` : "Profile"}
    >
      {initial ?? <User size={18} aria-hidden="true" />}
    </div>
  )
}
