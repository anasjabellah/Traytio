import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Client } from "@/features/clients/types";

import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { organizations: { include: { organization: true } } },
    });

    if (!user || user.organizations.length === 0) {
      return NextResponse.json([]);
    }

    const organizationId = user.organizations[0].organizationId;

    const clients = await prisma.client.findMany({
      where: { organizationId },
      select: { id: true, name: true, email: true, phone: true, createdAt: true, organizationId: true, totalSpent: true },
      orderBy: { createdAt: 'desc' },
    });

    const result = clients.map(c => ({
      id: c.id,
      organizationId: c.organizationId,
      name: c.name,
      email: c.email,
      phone: c.phone,
      createdAt: c.createdAt,
      totalSpent: Number(c.totalSpent),
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
