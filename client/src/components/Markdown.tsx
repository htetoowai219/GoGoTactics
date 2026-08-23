import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../lib/utils";

export function Markdown({ content, className }: { content: string; className?: string }) {
  if (!content?.trim()) return null;
  return (
    <div className={cn("prose-gogo text-sm text-muted", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
