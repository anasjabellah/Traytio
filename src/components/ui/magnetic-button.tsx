import React, { forwardRef, ElementType, ReactNode, MutableRefObject, Ref } from "react";
import { useMagnetic } from "@/hooks/use-magnetic";

interface MagneticButtonProps {
  as?: ElementType;
  strength?: number;
  children: ReactNode;
  className?: string;
  href?: string;
  // Allow any additional props (e.g., type, onClick, etc.)
  [key: string]: any;
}

export const MagneticButton = forwardRef<HTMLElement, MagneticButtonProps>((props, ref) => {
  const {
    as: Component = "button",
    children,
    strength = 0.3,
    className,
    href,
    ...restProps
  } = props;

  const { ref: magneticRef, onMouseEnter, onMouseLeave } = useMagnetic({ strength });

  const mergedRef = (instance: HTMLElement | null) => {
    (magneticRef as MutableRefObject<HTMLElement | null>).current = instance;
    if (typeof ref === "function") {
      ref(instance);
    } else if (ref) {
      (ref as MutableRefObject<HTMLElement | null>).current = instance;
    }
  };

  const FinalComponent = Component as ElementType;

  return (
    <FinalComponent
      ref={mergedRef as Ref<HTMLElement>}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={className}
      href={href}
      {...restProps}
    >
      {children}
    </FinalComponent>
  );
});

MagneticButton.displayName = "MagneticButton";

export default MagneticButton;
