import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "success" | "coral" | "accent";

interface Props {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  fullWidth?: boolean;
}

const styles: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground shadow-btn",
  secondary: "bg-secondary text-secondary-foreground shadow-btn-secondary",
  success: "bg-success text-success-foreground shadow-btn-success",
  coral: "bg-coral text-coral-foreground shadow-btn-coral",
  accent: "bg-accent text-accent-foreground shadow-btn-accent",
};

export const CandyButton = ({
  children, onClick, variant = "primary", disabled, className = "", type = "button", fullWidth,
}: Props) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "press-down rounded-2xl px-6 py-4 font-display font-semibold text-lg select-none",
      "uppercase tracking-wide",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0",
      styles[variant],
      fullWidth && "w-full",
      className,
    )}
  >
    {children}
  </button>
);
