import { NextResponse } from "next/server"
import { createCommande } from "@/features/commandes/actions/create-commande"
import { withApiGuard } from "@/lib/api-guard"

async function createCommandeApi(request: Request) {
  try {
    const data = await request.json()
    const response = await createCommande(data)
    if (response.success) {
      return NextResponse.json(response.data, { status: 201 })
    }
    return NextResponse.json({ error: response.error ?? "Failed to create commande" }, { status: 400 })
  } catch (error: unknown) {
    console.error("[api/commandes] Unhandled error:", error);
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  }
}

export const POST = withApiGuard(createCommandeApi)
