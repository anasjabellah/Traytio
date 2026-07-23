import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const services: Record<string, string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    services.database = "healthy";
  } catch {
    services.database = "unhealthy";
  }

  const healthy = services.database === "healthy";

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV,
      services,
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    },
  );
}
