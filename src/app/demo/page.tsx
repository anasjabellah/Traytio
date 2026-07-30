"use client";

import { useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { DemoHero } from "@/features/demo-requests/components/DemoHero";
import { DemoBenefits } from "@/features/demo-requests/components/DemoBenefits";
import { DemoTimeline } from "@/features/demo-requests/components/DemoTimeline";
import { DemoFaq } from "@/features/demo-requests/components/DemoFaq";
import { DemoStats } from "@/features/demo-requests/components/DemoStats";
import { DemoSection } from "@/features/demo-requests/components/DemoSection";
import { DemoForm } from "@/features/demo-requests/components/DemoForm";
import { DemoSuccess } from "@/features/demo-requests/components/DemoSuccess";

export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[600px] bg-radiance" />

      <DemoSection
        form={submitted ? <DemoSuccess /> : <DemoForm onSuccess={() => setSubmitted(true)} />}
      >
        <DemoHero />
        <DemoBenefits />
        <DemoTimeline />
        <DemoFaq />
        <DemoStats />
      </DemoSection>

      <Footer />
    </main>
  );
}
