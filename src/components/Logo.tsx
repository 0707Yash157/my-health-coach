import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  const icon = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2 group", className)}>
      <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary text-primary-foreground shadow-soft transition-smooth group-hover:shadow-glow">
        <Leaf className={icon} />
      </span>
      <span className={cn("font-display font-semibold tracking-tight", text)}>
        Verdure
      </span>
    </Link>
  );
}
