import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Client } from "@/features/clients/types";

export async function GET() {
  const clients = await prisma.client.findMany({
    select: { id: true, name: true, email: true, phone: true, createdAt: true, organizationId: true, totalSpent: true },
    orderBy: { createdAt: "desc" },
  });
  const result = clients.map(c => ({
    id: c.id,
    organizationId: c.organizationId,
    name: c.name,
    email: c.email,
    phone: c.phone,
    createdAt: c.createdAt,
    totalSpent: Number(c.totalSpent),
  } as import("@/features/clients/types").Client));
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const { name, email, phone, organizationId } = await request.json();

  if (!name || !organizationId) {
    return NextResponse.json({ error: "name and organizationId required" }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: { name, email, phone, organizationId },
    select: { id: true, name: true, email: true, phone: true, createdAt: true, organizationId: true, totalSpent: true },
  });

  const result = {
    id: client.id,
    organizationId: client.organizationId,
    name: client.name,
    email: client.email,
    phone: client.phone,
    createdAt: client.createdAt,
    totalSpent: Number(client.totalSpent),
  } as import("@/features/clients/types").Client;

  return NextResponse.json(result, { status: 201 });
}
