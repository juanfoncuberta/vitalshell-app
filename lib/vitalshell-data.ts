export const quickChips = [
  '¿Por qué hace calor?',
  '¿Cuánta energía he ahorrado?',
  '¿Qué hace VitalShell ahora?',
  '¿Cómo está el agua?',
]

export type ChatMessage = { id: number; role: 'system' | 'user'; text: string }
