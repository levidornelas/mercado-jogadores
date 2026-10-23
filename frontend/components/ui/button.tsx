import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
};

export function Button({ className, variant = "primary", ...props }: Props) {
  return (
    <button
      className={cn("ui-button", `ui-button-${variant}`, className)}
      {...props}
    />
  );
}
