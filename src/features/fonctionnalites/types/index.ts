import type { LucideIcon } from "lucide-react";

export interface Module {
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
}

export interface WorkflowStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface Reason {
  icon: LucideIcon;
  title: string;
  description: string;
}
