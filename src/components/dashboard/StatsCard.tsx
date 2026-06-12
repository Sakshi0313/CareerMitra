import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: "default" | "primary" | "secondary" | "success" | "warning";
}

const variants = {
  default: "bg-card",
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground", 
  success: "bg-success/10",
  warning: "bg-accent/10",
};

const iconVariants = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary-foreground/20 text-primary-foreground",
  secondary: "bg-secondary-foreground/20 text-secondary-foreground",
  success: "bg-success/20 text-success",
  warning: "bg-accent/20 text-accent",
};

const StatsCard = ({ title, value, subtitle, icon: Icon, trend, variant = "default" }: StatsCardProps) => {
  return (
    <div className={cn(
      "rounded-2xl p-6 shadow-card border border-border/50 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1",
      variants[variant]
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          iconVariants[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            trend.positive ? "text-success" : "text-destructive"
          )}>
            <span>{trend.positive ? "+" : ""}{trend.value}%</span>
          </div>
        )}
      </div>
      
      <div className={cn(
        "text-3xl font-bold mb-1",
        variant === "default" ? "text-foreground" : ""
      )}>
        {value}
      </div>
      
      <div className={cn(
        "text-sm",
        variant === "default" ? "text-muted-foreground" : "opacity-80"
      )}>
        {title}
      </div>
      
      {subtitle && (
        <div className={cn(
          "text-xs mt-2",
          variant === "default" ? "text-muted-foreground" : "opacity-60"
        )}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default StatsCard;
