'use client';
import { useEffect, useState } from "react";
import gsap from "gsap";

// Helper to check for desktop (no touch)
const isDesktop = () => {
  if (typeof window === "undefined") return false;
  return !("ontouchstart" in window || navigator.maxTouchPoints > 0);
};

export default function CustomCursor() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isDesktop()) return;

    // hide native cursor
    const originalCursor = document.body.style.cursor;
    document.body.style.cursor = "none";

    // create elements
    const dot = document.createElement("div");
    const circle = document.createElement("div");
    dot.style.position = "fixed";
    dot.style.width = "8px";
    dot.style.height = "8px";
    dot.style.borderRadius = "50%";
    dot.style.background = "#ffffff";
    dot.style.pointerEvents = "none";
    dot.style.zIndex = "9999";
    dot.style.transform = "translate(-50%, -50%)";

    circle.style.position = "fixed";
    circle.style.width = "40px";
    circle.style.height = "40px";
    circle.style.border = "2px solid #ffffff";
    circle.style.borderRadius = "50%";
    circle.style.pointerEvents = "none";
    circle.style.zIndex = "9998";
    circle.style.transform = "translate(-50%, -50%)";

    document.body.appendChild(dot);
    document.body.appendChild(circle);

    // GSAP quickTo for smooth following
    const moveDot = gsap.quickTo(dot, "css", {
      x: 0,
      y: 0,
      overwrite: true,
    });
    const moveCircle = gsap.quickTo(circle, "css", {
      x: 0,
      y: 0,
      overwrite: true,
      // lerp factor via duration/ease; we'll use a small duration for slight lag
      duration: 0.08,
    });

    const onMouseMove = (e: MouseEvent) => {
      moveDot(e.clientX, e.clientY);
      moveCircle(e.clientX, e.clientY);
    };
    window.addEventListener("mousemove", onMouseMove);

    // Hover handling
    const pointerSelector = "a, button, [data-cursor='pointer']";
    const textSelector = "h1, h2, p, [data-cursor='text']";

    const onPointerEnter = () => {
      gsap.to(circle, {
        scale: 1.5,
        borderColor: "#ffcc00",
        opacity: 0.8,
        duration: 0.2,
      });
      gsap.to(dot, { opacity: 0, duration: 0.1 });
    };
    const onPointerLeave = () => {
      gsap.to(circle, { scale: 1, borderColor: "#ffffff", opacity: 1, duration: 0.2 });
      gsap.to(dot, { opacity: 1, duration: 0.2 });
    };
    const onTextEnter = () => {
      gsap.to(circle, { scaleX: 3, scaleY: 0.2, duration: 0.2 });
    };
    const onTextLeave = () => {
      gsap.to(circle, { scaleX: 1, scaleY: 1, duration: 0.2 });
    };

    // delegate events
    const delegate = (selector: string, enter: EventListener, leave: EventListener) => {
      const elements = document.querySelectorAll<HTMLElement>(selector);
      elements.forEach((el) => {
        el.addEventListener("mouseenter", enter);
        el.addEventListener("mouseleave", leave);
      });
    };
    delegate(pointerSelector, onPointerEnter, onPointerLeave);
    delegate(textSelector, onTextEnter, onTextLeave);

    // cleanup
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.body.removeChild(dot);
      document.body.removeChild(circle);
      document.body.style.cursor = originalCursor;
      // remove hover listeners
      const clean = (selector: string, enter: EventListener, leave: EventListener) => {
        document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
          el.removeEventListener("mouseenter", enter);
          el.removeEventListener("mouseleave", leave);
        });
      };
      clean(pointerSelector, onPointerEnter, onPointerLeave);
      clean(textSelector, onTextEnter, onTextLeave);
    };
  }, []);

  // We render nothing – the elements are attached to body directly.
  // The component only mounts on desktop.
  useEffect(() => setMounted(true), []);
  return mounted ? null : null;
}
