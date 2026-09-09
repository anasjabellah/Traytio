import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationId } from "@/lib/get-organization-id";
import { assertCan } from "@/lib/assert-role";
import { EVENT, COMMON, AUTH } from "@/lib/notify/messages";
import { EventPDF } from "@/features/events/components/event-pdf";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  buildRateLimitKey,
  rateLimitExceededResponse,
  rateLimitUnavailableResponse,
} from "@/lib/api-guard";
import { checkRateLimit } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // The proxy middleware (src/proxy.ts) protects /api/**, so this route is only
  // reachable by authenticated users. getOrganizationId()/assertCan() re-check
  // auth + role server-side. We resolve the authenticated userId here only to
  // build the per-user rate-limit key — never from client-supplied input.
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: AUTH.SESSION.UNAUTHORIZED }, { status: 401 });
  }

  // Apply the dedicated PDF rate limit BEFORE any expensive rendering. The
  // check runs after auth but before renderToBuffer; a rejection never reaches
  // renderToBuffer. Uses the same trusted IP mechanism + fail-closed semantics
  // as the rest of the app (withApiGuard) — but applies to this GET route,
  // which the write-only guard does not cover.
  const rateLimitKey = buildRateLimitKey(request, userId, "pdf");
  const rateLimit = await checkRateLimit(rateLimitKey, "pdf");
  if (!rateLimit.ok) {
    return rateLimit.reason === "unavailable"
      ? rateLimitUnavailableResponse()
      : rateLimitExceededResponse(rateLimit);
  }

  try {
    const { id } = await params;

    const organizationId = await getOrganizationId();

    await assertCan("events", "read");

    const event = await prisma.event.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        location: true,
        guestCount: true,
        budget: true,
        contactPerson: true,
        contactPhone: true,
        notes: true,
        clientId: true,
        client: { select: { name: true, email: true, phone: true } },
        commandes: {
          select: { number: true, status: true, totalAmount: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: EVENT.NOT_FOUND }, { status: 404 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true,
        logo: true,
        address: true,
        city: true,
        country: true,
        phone: true,
        email: true,
        primaryColor: true,
        secondaryColor: true,
        pdfFontFamily: true,
        companyName: true,
        companyAddress: true,
        companyPhone: true,
        companyEmail: true,
        companyWebsite: true,
        companyICE: true,
        companyIF: true,
        companyRC: true,
        invoiceFooter: true,
      },
    });

    if (!org) {
      return NextResponse.json(
        { error: EVENT.NOT_FOUND },
        { status: 404 },
      );
    }

    const pdfBuffer = await renderToBuffer((
      <EventPDF
        settings={{
          primaryColor: org.primaryColor ?? "#C9A96E",
          secondaryColor: org.secondaryColor ?? "#1a1a1a",
          pdfFontFamily: org.pdfFontFamily ?? "DM Sans",
          companyName: org.companyName,
          companyAddress: org.companyAddress,
          companyPhone: org.companyPhone,
          companyEmail: org.companyEmail,
          companyWebsite: org.companyWebsite,
          companyICE: org.companyICE,
          companyIF: org.companyIF,
          companyRC: org.companyRC,
          invoiceFooter: org.invoiceFooter,
        }}
        org={{
          name: org.name,
          logo: org.logo,
          address: org.address,
          city: org.city,
          country: org.country,
          phone: org.phone,
          email: org.email,
        }}
        client={event.client
          ? {
              name: event.client.name,
              email: event.client.email,
              phone: event.client.phone,
            }
          : null}
        event={{
          name: event.name,
          type: event.type,
          status: event.status,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          guestCount: event.guestCount,
          budget: event.budget ? Number(event.budget) : null,
          contactPerson: event.contactPerson,
          contactPhone: event.contactPhone,
          notes: event.notes,
        }}
        commandes={event.commandes.map((c) => ({
          number: c.number,
          status: c.status,
          totalAmount: Number(c.totalAmount),
        }))}
      />
    ) as unknown as Parameters<typeof renderToBuffer>[0]);

    const filename = `evenement-${event.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || event.id}.pdf`;
    const pdfData = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfData, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.startsWith("Forbidden:")) {
      return NextResponse.json({ error: COMMON.FORBIDDEN_ORIGIN }, { status: 403 });
    }
    console.error("[EVENT PDF ROUTE ERROR]", err instanceof Error ? err.message : EVENT.UNEXPECTED_ERROR);
    if (err instanceof Error && err.stack) {
      console.error("[EVENT PDF ROUTE STACK]", err.stack);
    }
    return NextResponse.json({ error: EVENT.UNEXPECTED_ERROR }, { status: 500 });
  }
}