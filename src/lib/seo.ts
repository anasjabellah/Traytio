import type { Metadata } from "next";

export function canonicalMetadata(path: string): Metadata {
  return {
    alternates: {
      canonical: path,
    },
  };
}
