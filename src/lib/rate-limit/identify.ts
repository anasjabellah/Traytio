import { auth } from "@clerk/nextjs/server";

export async function identify(request: Request): Promise<string> {
  const { userId } = await auth();
  if (userId) return `user:${userId}`;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (ip) return `ip:${ip}`;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return `ip:${realIp}`;

  return "ip:unknown";
}
