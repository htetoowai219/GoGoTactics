import { Link } from "react-router-dom";
import { SearchX, Ghost, FileQuestion } from "lucide-react";
import { Button } from "./ui/button";

interface EmptyStateProps {
  icon?: "search" | "ghost" | "file";
  title: string;
  description?: string;
  action?: { label: string; to: string };
}

export function EmptyState({ icon = "ghost", title, description, action }: EmptyStateProps) {
  const Icon = icon === "search" ? SearchX : icon === "file" ? FileQuestion : Ghost;
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-elevated text-muted">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && (
        <Button asChild className="mt-5">
          <Link to={action.to}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
