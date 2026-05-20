// src/app/page.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import HeroSection from "@/components/ui/hero-section";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

import MagneticButton from "@/components/ui/magnetic-button";

export default function HomePage() {
  const sectionsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fade‑in + translateY for every section
      gsap.utils.toArray<HTMLElement>(".anim-section").forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 30 },
          {
            duration: 1,
            autoAlpha: 1,
            y: 0,
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
            },
          }
        );
      });

      // Stats counters - updated animation
      const numbers = statsRef.current?.querySelectorAll<HTMLElement>(".counter");
      numbers?.forEach((num) => {
        const target = Number(num.dataset.target);
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: num,
            start: "top 80%",
            once: true,
          },
          onUpdate() {
            num.textContent = Math.floor(obj.val).toLocaleString();
          },
        });
      });
    }, sectionsRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionsRef} className="font-sans text-[#1a1a1a]">
        <HeroSection />
              {/* Hide Clerk UI */}
      <style>{`.cl-rootBox,.cl-userButtonBox,.cl-userButton{display:none!important}`}</style>

      {/* Import fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@300;400;500&display=swap');`}</style>



      {/* Pain Points */}
      <section id="pain" className="anim-section py-32 bg-[#ffffff]">
        <div className="max-w-5xl mx-auto px-8">
          <h3 className="text-3xl font-semibold mb-12 text-center" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Vos problèmes, nos solutions
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[{icon:'🗂️',title:'Gestion manuelle',desc:'Les commandes sont saisies à la main, source d’erreurs.'},
              {icon:'📦',title:'Stocks imprécis',desc:'Vous perdez du temps à réconcilier les inventaires.'},
              {icon:'💬',title:'Communication fragmentée',desc:'Les équipes client et cuisine ne parlent pas toujours.'}]
              .map((item, i) => (
                <div key={i} className="bg-[#ffffff] border border-[#e8e8e8] p-6 rounded shadow-sm text-center">
                  <div className="text-4xl mb-4" style={{ color: "#c9a84c" }}>{item.icon}</div>
                  <h4 className="font-bold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{item.title}</h4>
                  <p style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.desc}</p>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="anim-section py-32 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto px-8">
          <h3 className="text-3xl font-semibold mb-12 text-center" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Fonctionnalités
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {icon:'📅',title:'Réservation en ligne',desc:'Vos clients réservent 24/7, sans appel.'},
              {icon:'📈',title:'Tableau de bord',desc:'Analysez revenu, marge et gaspillage.'},
              {icon:'🔔',title:'Alertes temps réel',desc:'Notifications instantanées pour les ruptures de stock.'},
              {icon:'💳',title:'Paiement intégré',desc:'Facturation simplifiée et sécurisée.'},
              {icon:'👥',title:'Gestion des équipes',desc:'Planifiez les équipes et suivez les heures.'},
              {icon:'🌐',title:'Multilingue',desc:'Interface disponible en plusieurs langues.'}
            ].map((f, i) => (
              <div key={i} className="bg-[#ffffff] border border-[#e8e8e8] p-6 rounded shadow-sm text-center">
                <div className="text-4xl mb-4" style={{ color: "#c9a84c" }}>{f.icon}</div>
                <h4 className="font-bold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{f.title}</h4>
                <p style={{ fontFamily: "'DM Sans', sans-serif" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="anim-section py-32 bg-[#ffffff]">
        <div className="max-w-5xl mx-auto px-8 text-center" ref={statsRef}>
          <h3 className="text-3xl font-semibold mb-12" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Nos chiffres
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[{target:15000,label:'Événements gérés'},{target:98,label:'Satisfaction %'},{target:2,label:'Millions € de CA'}].map((s,i)=>(
              <div key={i}>
                <p className="counter text-5xl font-bold mb-2" data-target={s.target} style={{ color: "#c9a84c", fontFamily: "'Cormorant Garamond', serif" }}>0</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="anim-section py-32 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto px-8">
          <h3 className="text-3xl font-semibold mb-12 text-center" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Tarifs
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="bg-[#ffffff] border border-[#e8e8e8] p-8 rounded shadow-sm text-center">
              <h4 className="font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Starter</h4>
              <p className="text-2xl mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>49 €/mois</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif" }}>Fonctionnalités de base pour les petites structures.</p>
            </div>
            {/* Professional – highlighted */}
            <div className="bg-[#ffffff] border-2 border-[#c9a84c] p-8 rounded shadow-sm text-center">
              <h4 className="font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#c9a84c" }}>Professionnel</h4>
              <p className="text-2xl mb-2" style={{ fontFamily: "'DM Sans', sans-serif", color: "#c9a84c" }}>149 €/mois</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif" }}>Toutes les fonctionnalités + support prioritaire.</p>
            </div>
            {/* Enterprise */}
            <div className="bg-[#ffffff] border border-[#e8e8e8] p-8 rounded shadow-sm text-center">
              <h4 className="font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Entreprise</h4>
              <p className="text-2xl mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Sur devis</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif" }}>Solutions sur‑mesure pour les grands groupes.</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <a href="#contact" className="px-6 py-3 bg-[#c9a84c] text-white rounded-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>Contactez‑nous</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="anim-section py-12 bg-[#111111] text-white">
        <div className="max-w-5xl mx-auto px-8 flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Traytio<span style={{ color: "#c9a84c" }}>•</span>
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif" }}>© 2026 Traytio. Tous droits réservés.</p>
          <nav className="mt-4 space-x-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <a href="#" className="hover:underline">Politique de confidentialité</a>
            <a href="#" className="hover:underline">Conditions d’utilisation</a>
            <a href="#" className="hover:underline">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
