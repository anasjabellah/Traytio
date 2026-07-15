"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getOrganizationId } from "@/lib/get-organization-id"
import { assertCan } from "@/lib/assert-role"
import { withActionGuard } from "@/lib/action-guard"
import { INVOICE } from "@/lib/notify/messages"

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

const updatePdfSettingsSchema = z.object({
  logo: z.string().nullable().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  pdfFontFamily: z.string().optional(),
  companyName: z.string().nullable().optional(),
  companyAddress: z.string().nullable().optional(),
  companyPhone: z.string().nullable().optional(),
  companyEmail: z.string().nullable().optional(),
  companyWebsite: z.string().nullable().optional(),
  companyICE: z.string().nullable().optional(),
  companyIF: z.string().nullable().optional(),
  companyRC: z.string().nullable().optional(),
  invoicePrefix: z.string().optional(),
  quotePrefix: z.string().optional(),
  paymentDelayDays: z.number().int().positive().optional(),
  invoiceFooter: z.string().nullable().optional(),
  invoiceTerms: z.string().nullable().optional(),
  invoiceNotes: z.string().nullable().optional(),
})

async function getPdfSettingsHandler(): Promise<{ success: boolean; data?: PdfSettings; error?: string }> {
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
      return { success: false, error: INVOICE.NOT_FOUND_ORGANIZATION }
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
    return { success: false, error: INVOICE.SETTINGS.FETCH_ERROR }
  }
}

async function updatePdfSettingsHandler(data: Partial<PdfSettings>): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = updatePdfSettingsSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? INVOICE.SETTINGS.SAVE_ERROR }
    }

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
    return { success: false, error: INVOICE.SETTINGS.SAVE_ERROR }
  }
}

export const getPdfSettings = withActionGuard(getPdfSettingsHandler, { name: 'invoices:settings' })
export const updatePdfSettings = withActionGuard(updatePdfSettingsHandler, { name: 'invoices:settings' })
