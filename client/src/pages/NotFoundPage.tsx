import { Link } from "react-router-dom";
import { Ghost } from "lucide-react";
import { Button } from "../components/ui/button";
import { Seo } from "../components/Seo";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Seo title="Page not found" />
      <span className="mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-elevated text-muted">
        <Ghost className="h-10 w-10" />
      </span>
      <h1 className="text-4xl font-black tracking-tight">404</h1>
      <p className="mt-2 max-w-sm text-muted">
        This page got swept off the board. It might have been moved or never existed.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  );
}
