import { type NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_API_URL
const API_KEY = process.env.NEXT_PUBLIC_API_KEY

type Ctx = { params: Promise<{ path: string[] }> }

async function forward(req: NextRequest, ctx: Ctx, method: string) {
  const { path } = await ctx.params
  const search = req.nextUrl.search
  const url = `${BACKEND}/api/${path.join("/")}${search}`

  try {
    const body = method !== "GET" ? await req.text() : undefined
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY!,
      },
      body,
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 })
  }
}

export function GET(req: NextRequest, ctx: Ctx) { return forward(req, ctx, "GET") }
export function POST(req: NextRequest, ctx: Ctx) { return forward(req, ctx, "POST") }
