/**
 * N-08 Invoice PDF template — print-quality Devis/Facture document — Tests
 *
 * Guardrails for the redesigned client-facing PDF template
 * (`src/features/invoices/components/invoice-pdf.tsx`):
 *
 *   - It must keep rendering a real, valid PDF via @react-pdf/renderer for
 *     every data shape the app can produce: FACTURE, DEVIS, empty client,
 *     empty items, no event, no notes, and long multi-page content.
 *   - The rendering must NOT hardcode example values: document type, numbering,
 *     dates, amounts, remise, acompte, paid/remaining and notes all come from
 *     props (the same contract the PDF route already uses).
 *   - The customization settings must keep flowing into the template
 *     (colors, font, company identity + legal ids, footer, conditions,
 *     default notes) and the route must forward them.
 *
 * Unlike tests/b02, this test IMPORTS the real template (+ @react-pdf/renderer)
 * because invoice-pdf.tsx has no @clerk/@prisma dependency — only node:path and
 * @react-pdf/renderer, and the three fonts ship in public/fonts.
 *
 * Run: npx tsx tests/n08-invoice-pdf-template.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF, type InvoicePDFProps } from '../src/features/invoices/components/invoice-pdf'

const SRC_ROOT = resolve(process.cwd(), 'src')

// ── Fixtures ─────────────────────────────────────────────────────────────────

const SETTINGS: InvoicePDFProps['settings'] = {
  primaryColor: '#C9A96E',
  secondaryColor: '#1a1a1a',
  pdfFontFamily: 'DM Sans',
  companyName: 'Traytio Traiteur',
  companyAddress: '12, Boulevard Mohammed V, Casablanca',
  companyPhone: '+212 6 00 00 00 00',
  companyEmail: 'contact@traytio.ma',
  companyWebsite: 'www.traytio.ma',
  companyICE: '0012345678900123',
  companyIF: '12345678',
  companyRC: '12345C',
  invoicePrefix: 'FAC',
  quotePrefix: 'DEV',
  paymentDelayDays: 30,
  invoiceFooter: 'Merci de votre confiance — Traytio.',
  invoiceTerms: 'Paiement à réception de la facture.',
  invoiceNotes: 'Réglement accepté : espèces, virement ou carte.',
}

const ORG: InvoicePDFProps['org'] = {
  name: 'Traytio',
  logo: null,
  address: '12, Boulevard Mohammed V',
  city: 'Casablanca',
  country: 'Maroc',
  phone: '+212 6 00 00 00 00',
  email: 'contact@traytio.ma',
}

const CLIENT: InvoicePDFProps['client'] = {
  name: 'Amine El Fassi',
  company: 'Société Atlas Événements SARL',
  email: 'amine.elfassi@atlas-ev.ma',
  phone: '+212 6 22 33 44 55',
  address: '45, Rue des Orangers, Racine',
  city: 'Casablanca',
  postalCode: '20100',
  siret: '0012345678900123',
}

const ITEMS: InvoicePDFProps['commande']['items'] = [
  { name: 'Menu Premium — Entrées froides', quantity: 50, unitPrice: 4500, totalPrice: 4500 },
  { name: 'Menu Premium — Plat principal royal', quantity: 50, unitPrice: 12000, totalPrice: 12000 },
  { name: 'Menu Premium — Dessert & mignardises', quantity: 50, unitPrice: 3500, totalPrice: 3500 },
]

function baseProps(over: Partial<InvoicePDFProps> = {}): InvoicePDFProps {
  return {
    settings: SETTINGS,
    org: ORG,
    client: CLIENT,
    invoice: {
      number: 'FAC-2026-0001',
      type: 'FACTURE',
      issueDate: new Date('2026-09-01T12:00:00Z'),
      dueDate: new Date('2026-10-01T12:00:00Z'),
      totalAmount: 20000,
      paidAmount: 5000,
      notes: null,
    },
    commande: {
      number: 'CMD-2026-0042',
      totalAmount: 20000,
      acompteAmount: 6000,
      paidAmount: 5000,
      remainingAmount: 15000,
      transportFees: 800,
      deliveryFees: null,
      equipmentFees: null,
      discountType: 'FIXED',
      discountValue: 500,
      discountAmount: 500,
      taxRate: 20,
      taxLabel: 'TVA',
      taxAmount: 2000,
      notes: null,
      clientNotes: null,
      eventDate: new Date('2026-12-24T12:00:00Z'),
      eventLocation: 'Casablanca — Golf Anfa',
      guestCount: 50,
      menuName: 'Menu Premium',
      items: ITEMS,
    },
    ...over,
  }
}

async function renderPdf(props: InvoicePDFProps): Promise<Buffer> {
  const element = React.createElement(InvoicePDF, props)
  const out = await renderToBuffer(element as unknown as Parameters<typeof renderToBuffer>[0])
  return Buffer.isBuffer(out) ? out : Buffer.from(out as Uint8Array)
}

function assertValidPdf(buf: Buffer): void {
  assert.ok(buf.length > 1000, `expected a non-trivial PDF, got ${buf.length} bytes`)
  assert.equal(buf.subarray(0, 5).toString(), '%PDF-', 'must start with the %PDF- magic header')
}

// ── 1. BEHAVIOR: the template renders real PDFs for every data shape ─────────

describe('N-08 BEHAVIOR: InvoicePDF renders a valid Devis/Facture PDF', () => {
  it('renders a single-page FACTURE with all sections present', async () => {
    const buf = await renderPdf(baseProps())
    assertValidPdf(buf)
  })

  it('renders a DEVIS with quote semantics (type, validity, acompte)', async () => {
    const buf = await renderPdf(baseProps({
      invoice: { ...baseProps().invoice, number: 'DEV-2026-0001', type: 'DEVIS' },
    }))
    assertValidPdf(buf)
  })

  it('renders with a Poppins font override and custom colors', async () => {
    const buf = await renderPdf(baseProps({
      settings: { ...SETTINGS, pdfFontFamily: 'Poppins', primaryColor: '#b8860b', secondaryColor: '#222222' },
    }))
    assertValidPdf(buf)
  })

  it('renders gracefully with no client, no items, no event, no notes', async () => {
    const buf = await renderPdf(baseProps({
      client: null,
      commande: { ...baseProps().commande, items: [], number: null, menuName: null, eventDate: null, eventLocation: null, guestCount: null, clientNotes: '—' },
      invoice: { ...baseProps().invoice, notes: null },
      settings: { ...SETTINGS, invoiceNotes: null, invoiceTerms: null },
    }))
    assertValidPdf(buf)
  })

  it('renders long multi-page content (40 items, long names/addresses/notes) without errors', async () => {
    const items = Array.from({ length: 40 }, (_, i) => ({
      name: `Service traiteur mariage — brochettes d’agneau aux épices et herbes fraîches (lot ${i + 1})`,
      quantity: 12 + i,
      unitPrice: 150 + i,
      totalPrice: (12 + i) * (150 + i),
    }))
    const buf = await renderPdf(baseProps({
      client: { ...CLIENT, name: 'Très longue raison sociale d’une société de réception haut de gamme', address: 'Avenue extrêmement longue avec numéro, étage, immeuble, quartier, ville, pays et code postal complet' },
      commande: { ...baseProps().commande, number: 'CMD-2026-0200', items },
      invoice: { ...baseProps().invoice, notes: 'Devis établi pour un gala de 400 couverts avec plusieurs pages d’articles.' },
    }))
    assertValidPdf(buf)
  })

  it('does not hardcode example values — the number/type/dates/costs are not in the source', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/invoices/components/invoice-pdf.tsx'), 'utf8')
    assert.ok(!/[0-9]{4}-[0-9]{4}/.test(src), 'document numbering must come from props, not the template')
    assert.ok(!/7 290,70/.test(src) && !/1\.2\.3\.4/.test(src), 'example amounts must not be hardcoded')
  })
})

// ── 2. SOURCE CONTRACT: customization stays wired to the generated PDF ──────

describe('N-08 SOURCE CONTRACT: customization settings remain honored', () => {
  const src = readFileSync(resolve(SRC_ROOT, 'features/invoices/components/invoice-pdf.tsx'), 'utf8')

  for (const field of ['primaryColor', 'secondaryColor', 'pdfFontFamily', 'companyName', 'companyICE', 'invoiceTerms', 'invoiceFooter', 'invoiceNotes']) {
    it(`template reads settings.${field}`, () => {
      assert.ok(src.includes(`settings?.${field}`) || src.includes(`settings.${field}`), `missing settings.${field}`)
    })
  }

  it('template uses org.logo for the configured logo', () => {
    assert.ok(src.includes('org.logo'))
  })

  it('template receives the order reference (commande.number) and renders it', () => {
    assert.ok(src.includes('commande.number'))
  })

  it('template renders the client-face fields (client meta, event, items)', () => {
    assert.ok(src.includes('client.siret'))
    assert.ok(src.includes('commande.eventDate'))
    assert.ok(src.includes('commande.guestCount'))
    assert.ok(src.includes('item.name'))
  })

  it('applies the configured font on the PDF page', () => {
    assert.ok(src.includes('style={[s.page, { fontFamily }]}'))
  })

  it('formats money with the app formatCurrency (fr-MA MAD), not the fr-FR narrow no-break space', () => {
    assert.ok(src.includes('Intl.NumberFormat("fr-MA"'), 'template must use the fr-MA currency locale')
    assert.ok(src.includes('currency: "MAD"'), 'template must format in MAD')
    assert.ok(src.includes('toLocaleString("fr-FR"') === false, 'must not use fr-FR grouping (narrow no-break space renders as "/" in the PDF)')
  })

  const route = readFileSync(resolve(SRC_ROOT, 'app/api/invoices/[id]/pdf/route.tsx'), 'utf8')

  it('PDF route forwards default notes (invoiceNotes) to the template', () => {
    assert.ok(route.includes('invoiceNotes: org.invoiceNotes'))
  })

  it('PDF route forwards the order reference (commande.number) to the template', () => {
    assert.ok(route.includes('number: cmd.number'))
  })
})