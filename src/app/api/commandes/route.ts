import { NextResponse } from "next/server"
import { createCommande } from "@/features/commandes/actions/create-commande"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const response = await createCommande(data)
    if (response.success) {
      return NextResponse.json(response.data, { status: 201 })
    }
    return NextResponse.json({ error: response.error ?? "Failed to create commande" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Invalid request" }, { status: 400 })
  }
}
