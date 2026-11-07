"use client";

import { FC } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

/**
 * Simple switch row used across Settings / Security pages.
 * Follows the ToggleLeft/ToggleRight icon pattern from the Coupons page.
 */
export const ToggleRow: FC<ToggleRowProps> = ({
  label,
  description,
  value,
  onChange,
  disabled,
}) => (
  <div className="flex items-center justify-between gap-4 py-3">
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className="shrink-0 disabled:opacity-50"
    >
      {value ? (
        <ToggleRight className="h-7 w-7 text-green-600 cursor-pointer" />
      ) : (
        <ToggleLeft className="h-7 w-7 text-gray-400 cursor-pointer" />
      )}
    </button>
  </div>
);
