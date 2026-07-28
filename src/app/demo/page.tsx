"use client"

import { useState } from "react"
import { Navbar } from "@/components/site/Navbar"
import { Footer } from "@/components/site/Footer"
import { DemoBenefits } from "@/features/demo-requests/components/DemoBenefits"
import { DemoForm } from "@/features/demo-requests/components/DemoForm"
import { DemoSuccess } from "@/features/demo-requests/components/DemoSuccess"

export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[600px] bg-radiance" />

      <section className="relative mx-auto max-w-7xl px-6 pt-36 pb-24 lg:pt-44 lg:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <DemoBenefits />

          <div>
            {submitted ? <DemoSuccess /> : <DemoForm onSuccess={() => setSubmitted(true)} />}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
