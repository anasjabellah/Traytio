import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationId } from "@/lib/get-organization-id";
import { INVOICE } from "@/lib/notify/messages";
import { InvoicePDF } from "@/features/invoices/components/invoice-pdf";
import { renderToBuffer } from "@react-pdf/renderer";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const organizationId = await getOrganizationId();

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId },
      include: {
        commande: {
          include: {
            client: { select: { id: true, name: true, email: true, phone: true, address: true, city: true, postalCode: true, company: true, siret: true } },
            event: { select: { name: true, startDate: true, location: true } },
            items: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: INVOICE.NOT_FOUND }, { status: 404 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true, logo: true, address: true, city: true, country: true, phone: true, email: true,
        primaryColor: true, secondaryColor: true, pdfFontFamily: true,
        companyName: true, companyAddress: true, companyPhone: true, companyEmail: true, companyWebsite: true,
        companyICE: true, companyIF: true, companyRC: true,
        invoicePrefix: true, quotePrefix: true, paymentDelayDays: true,
        invoiceFooter: true, invoiceTerms: true,
      },
    });

    if (!org) {
      return NextResponse.json({ error: INVOICE.NOT_FOUND_ORGANIZATION }, { status: 404 });
    }

    const cmd = invoice.commande;
    if (!cmd) {
      return NextResponse.json({ error: INVOICE.NOT_FOUND_COMMANDE_LINKED }, { status: 404 });
    }

    const pdfBuffer = await renderToBuffer((
      <InvoicePDF
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
          invoicePrefix: org.invoicePrefix ?? "FAC",
          quotePrefix: org.quotePrefix ?? "DEV",
          paymentDelayDays: org.paymentDelayDays ?? 30,
          invoiceFooter: org.invoiceFooter,
          invoiceTerms: org.invoiceTerms,
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
        client={cmd.client
          ? {
              name: cmd.client.name,
              email: cmd.client.email,
              phone: cmd.client.phone,
              address: cmd.client.address,
              city: cmd.client.city,
              postalCode: cmd.client.postalCode,
              company: cmd.client.company,
              siret: cmd.client.siret,
            }
          : null}
        invoice={{
          number: invoice.number,
          type: invoice.type as "DEVIS" | "FACTURE",
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          totalAmount: Number(invoice.totalAmount),
          paidAmount: Number(invoice.paidAmount),
          notes: invoice.notes,
        }}
        commande={{
          totalAmount: Number(cmd.totalAmount),
          acompteAmount: Number(cmd.acompteAmount),
          paidAmount: Number(cmd.paidAmount),
          remainingAmount: Number(cmd.remainingAmount),
          transportFees: cmd.transportFees ? Number(cmd.transportFees) : null,
          deliveryFees: cmd.deliveryFees ? Number(cmd.deliveryFees) : null,
          equipmentFees: cmd.equipmentFees ? Number(cmd.equipmentFees) : null,
          discountType: cmd.discountType,
          discountValue: cmd.discountValue ? Number(cmd.discountValue) : null,
          discountAmount: cmd.discountAmount ? Number(cmd.discountAmount) : null,
          taxRate: cmd.taxRate ? Number(cmd.taxRate) : null,
          taxLabel: cmd.taxLabel,
          taxAmount: cmd.taxAmount ? Number(cmd.taxAmount) : null,
          notes: cmd.notes,
          clientNotes: cmd.clientNotes,
          eventDate: cmd.event?.startDate ?? null,
          eventLocation: cmd.event?.location ?? null,
          guestCount: cmd.guestCount,
          menuName: cmd.menuName,
          items: cmd.items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
            totalPrice: Number(i.totalPrice),
          })),
        }}
      />
    ) as unknown as Parameters<typeof renderToBuffer>[0]);

    const filename = `${invoice.number}.pdf`;
    const pdfData = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfData, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : INVOICE.UNEXPECTED_ERROR;
    console.error("[PDF ROUTE ERROR]", message);
    if (err instanceof Error && err.stack) {
      console.error("[PDF ROUTE STACK]", err.stack);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
