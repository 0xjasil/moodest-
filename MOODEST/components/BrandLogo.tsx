import React, { useState } from "react";

const SRC = {
  primary: "/brand/logo-primary.svg",
  secondary: "/brand/logo-secondary.svg",
  horizontal: "/brand/logo-horizontal.svg",
  emblem: "/brand/logo-emblem.svg",
  gold: "/brand/logo-gold.svg",
  white: "/brand/logo-white.svg",
  wordmark: "/brand/logo-horizontal.svg",
  vector: "/brand/logo-primary.svg",
} as const;

type LogoVariant = keyof typeof SRC;

export default function BrandLogo({
  variant = "primary",
  className = "",
  alt,
}: {
  variant?: LogoVariant;
  className?: string;
  alt?: string;
}) {
  const [hasError, setHasError] = useState(false);

  const label =
    alt ??
    (variant === "emblem"
      ? "Modest Studio Luxury Abayas Emblem"
      : "Modest Studio — Luxury Designer Abayas & Modest Wear");

  const fallbackPng =
    variant === "emblem"
      ? "/brand/logo-emblem.png"
      : variant === "gold"
      ? "/brand/logo-gold.png"
      : variant === "secondary" || variant === "horizontal"
      ? "/brand/logo-secondary.png"
      : variant === "white"
      ? "/brand/logo-white.png"
      : "/brand/logo-primary.png";

  const currentSrc = hasError ? fallbackPng : SRC[variant] ?? SRC.primary;

  return (
    <img
      src={currentSrc}
      alt={label}
      onError={() => {
        if (!hasError) {
          setHasError(true);
        }
      }}
      className={`object-contain object-center select-none ${className}`}
      draggable={false}
    />
  );
}
