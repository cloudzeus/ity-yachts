import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      status: "ok",
      message: "Debug endpoint working"
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
