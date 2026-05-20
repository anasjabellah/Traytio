import { useEffect, useRef } from "react";
import gsap from "gsap";

interface UseMagneticOptions {
  strength?: number | undefined; // 0-1, default 0.3
}

export function useMagnetic(options: UseMagneticOptions = {}) {
  const { strength = 0.3 } = options;
  const ref = useRef<HTMLElement>(null);
  const bounds = useRef<DOMRect>(null);

  // Update bounds when element changes
  useEffect(() => {
    if (ref.current) {
      bounds.current = ref.current.getBoundingClientRect();
    }
  }, [ref.current]);

  const handleMouseEnter = (e: MouseEvent) => {
    if (!ref.current || !bounds.current) return;

    const centerX = bounds.current.left + bounds.current.width / 2;
    const centerY = bounds.current.top + bounds.current.height / 2;

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    // Calculate offset (clamped)
    const offsetX = deltaX * strength;
    const offsetY = deltaY * strength;

    gsap.to(ref.current, {
      x: offsetX,
      y: offsetY,
      duration: 0.3,
      ease: "power3.out",
    });
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;

    gsap.to(ref.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.3)",
    });
  };

  return {
    ref,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };
}
