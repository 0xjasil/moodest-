import React, { forwardRef, useEffect, useRef } from "react";

export interface CheckboxProps {
  id?: string;
  label?: React.ReactNode;
  name?: string;
  checked?: boolean; // controlled
  defaultChecked?: boolean; // uncontrolled
  disabled?: boolean;
  indeterminate?: boolean; // visual indeterminate state
  className?: string;
  onCheckedChange?: (checked: boolean) => void;
}

// ShadCN-style checkbox. 
// - Accessible: uses native input[type=checkbox]
// - Supports controlled/uncontrolled usage
// - Supports indeterminate visual state
// - Minimal Tailwind classes so you can drop into a shadcn UI codebase

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      id,
      label,
      name,
      checked,
      defaultChecked,
      disabled = false,
      indeterminate = false,
      className = "",
      onCheckedChange,
    },
    ref
  ) => {
    const innerRef = useRef<HTMLInputElement | null>(null);

    // sync forwarded ref
    useEffect(() => {
      if (!ref) return;
      if (typeof ref === "function") ref(innerRef.current as HTMLInputElement);
      else if (typeof ref === "object") (ref as React.MutableRefObject<HTMLInputElement | null>).current = innerRef.current;
    }, [ref]);

    // apply indeterminate when input mounts or indeterminate prop changes
    useEffect(() => {
      if (!innerRef.current) return;
      innerRef.current.indeterminate = indeterminate;
    }, [indeterminate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const value = e.target.checked;
      onCheckedChange?.(value);
    };

    const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
      id,
      name,
      disabled,
      onChange: handleChange,
    };

    // If "checked" prop is provided, treat as controlled
    if (typeof checked !== "undefined") inputProps.checked = checked;
    // otherwise, if defaultChecked provided, pass as defaultChecked for uncontrolled
    if (typeof checked === "undefined" && typeof defaultChecked !== "undefined") inputProps.defaultChecked = defaultChecked;

    return (
      <label
        htmlFor={id}
        className={`inline-flex items-center gap-2 cursor-pointer select-none ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
      >
        <span className="relative">
          {/* Native input visually hidden but available to screen readers */}
          <input
            ref={innerRef}
            type="checkbox"
            className="peer sr-only"
            {...inputProps}
          />

          {/* Visual box styled like shadcn */}
          <span
            aria-hidden
            className={`inline-flex h-5 w-5 items-center justify-center rounded-md border transition-colors focus:outline-none peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2 
              peer-checked:bg-primary peer-checked:border-primary peer-checked:text-primary-foreground
              bg-background border-border
            `}
          >
            {/* Check icon (SVG). We respect indeterminate by showing a dash. */}
            <svg
              className={`h-3 w-3 transition-opacity ${indeterminate ? "opacity-100" : "peer-checked:opacity-100 opacity-0"}`}
              viewBox={indeterminate ? "0 0 20 20" : "0 0 24 24"}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              {indeterminate ? (
                <rect x="4" y="9" width="12" height="2" rx="1" fill="currentColor" />
              ) : (
                <path
                  d="M5 12.5l3 3L19 5"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </span>
        </span>

        {label && <span className="text-sm leading-none">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
export default Checkbox;
