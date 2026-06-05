"use client"

import { Package, Sparkles, Truck } from "lucide-react";
import { PremiumField } from "./premium-field";

export function ExtrasStep(props: any) {
  const { transport, setTransport, delivery, setDelivery, equipment, setEquipment, extraService, setExtraService } = props;
  const items = [
    { label: "Transport", icon: <Truck className="h-4 w-4" />, value: transport, set: setTransport },
    { label: "Livraison", icon: <Package className="h-4 w-4" />, value: delivery, set: setDelivery },
    { label: "Location équipement", icon: <Package className="h-4 w-4" />, value: equipment, set: setEquipment },
    { label: "Services extra", icon: <Sparkles className="h-4 w-4" />, value: extraService, set: setExtraService },
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {items.map((it) => (
        <PremiumField key={it.label} label={it.label} value={it.value} onChange={(v) => it.set(parseInt(v) || 0)} type="number" prefix="MAD" icon={it.icon} />
      ))}
    </div>
  );
}
