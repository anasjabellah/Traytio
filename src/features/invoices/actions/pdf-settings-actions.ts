"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { assertCan } from "@/lib/assert-role"

export type PdfSettings = {
  logo: string | null
  primaryColor: string
  secondaryColor: string
  pdfFontFamily: string
  companyName: string | null
  companyAddress: string | null
  companyPhone: string | null
  companyEmail: string | null
  companyWebsite: string | null
  companyICE: string | null
  companyIF: string | null
  companyRC: string | null
  invoicePrefix: string
  quotePrefix: string
  paymentDelayDays: number
  invoiceFooter: string | null
  invoiceTerms: string | null
  invoiceNotes: string | null
}

export async function getPdfSettings(): Promise<{ success: boolean; data?: PdfSettings; error?: string }> {
  try {
    const organizationId = await getOrganizationId()
    await assertCan('invoices', 'settings')
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        logo: true,
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
        invoicePrefix: true,
        quotePrefix: true,
        paymentDelayDays: true,
        invoiceFooter: true,
        invoiceTerms: true,
        invoiceNotes: true,
      },
    })

    if (!org) {
      return { success: false, error: "Organisation introuvable" }
    }

    return {
      success: true,
      data: {
        logo: org.logo,
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
        invoiceNotes: org.invoiceNotes,
      },
    }
  } catch (error) {
    console.error("getPdfSettings error:", error)
    return { success: false, error: "Erreur lors de la récupération des paramètres" }
  }
}

export async function updatePdfSettings(data: Partial<PdfSettings>): Promise<{ success: boolean; error?: string }> {
  try {
    const organizationId = await getOrganizationId()
    await assertCan('invoices', 'settings')
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(data.logo !== undefined && { logo: data.logo }),
        ...(data.primaryColor !== undefined && { primaryColor: data.primaryColor }),
        ...(data.secondaryColor !== undefined && { secondaryColor: data.secondaryColor }),
        ...(data.pdfFontFamily !== undefined && { pdfFontFamily: data.pdfFontFamily }),
        ...(data.companyName !== undefined && { companyName: data.companyName }),
        ...(data.companyAddress !== undefined && { companyAddress: data.companyAddress }),
        ...(data.companyPhone !== undefined && { companyPhone: data.companyPhone }),
        ...(data.companyEmail !== undefined && { companyEmail: data.companyEmail }),
        ...(data.companyWebsite !== undefined && { companyWebsite: data.companyWebsite }),
        ...(data.companyICE !== undefined && { companyICE: data.companyICE }),
        ...(data.companyIF !== undefined && { companyIF: data.companyIF }),
        ...(data.companyRC !== undefined && { companyRC: data.companyRC }),
        ...(data.invoicePrefix !== undefined && { invoicePrefix: data.invoicePrefix }),
        ...(data.quotePrefix !== undefined && { quotePrefix: data.quotePrefix }),
        ...(data.paymentDelayDays !== undefined && { paymentDelayDays: data.paymentDelayDays }),
        ...(data.invoiceFooter !== undefined && { invoiceFooter: data.invoiceFooter }),
        ...(data.invoiceTerms !== undefined && { invoiceTerms: data.invoiceTerms }),
        ...(data.invoiceNotes !== undefined && { invoiceNotes: data.invoiceNotes }),
      },
    })

    revalidatePath("/dashboard/invoices")
    return { success: true }
  } catch (error) {
    console.error("updatePdfSettings error:", error)
    return { success: false, error: "Erreur lors de la sauvegarde des paramètres" }
  }
}
