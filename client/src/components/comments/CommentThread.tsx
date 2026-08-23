import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MessageSquare } from "lucide-react";
import { commentsApi, getApiErrorMessage } from "../../api/endpoints";
import { useAuthStore } from "../../stores/authStore";
import type { CommentNode } from "../../types";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { CommentItem } from "./CommentItem";
import { EmptyState } from "../EmptyState";

interface CommentThreadProps {
  lineupId: string;
  comments: CommentNode[];
  pagination?: { page: number; totalPages: number; total: number };
  onPageChange: (page: number) => void;
}

export function CommentThread({ lineupId, comments, pagination, onPageChange }: CommentThreadProps) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [replyOpenFor, setReplyOpenFor] = useState<string | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["comments", lineupId] });

  const createMutation = useMutation({
    mutationFn: (opts: { content: string; parentComment?: string | null }) =>
      commentsApi.create(lineupId, opts.content, opts.parentComment),
    onSuccess: () => {
      setContent("");
      void invalidate();
      void queryClient.invalidateQueries({ queryKey: ["lineup"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Could not post comment")),
  });

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
        <MessageSquare className="h-5 w-5 text-accent" />
        Comments
        {pagination ? ` (${pagination.total})` : ""}
      </h2>

      {user ? (
        <form
          className="mb-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!content.trim()) return;
            createMutation.mutate({ content: content.trim() });
          }}
        >
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Share your thoughts, @${user.username}…`}
            maxLength={2000}
          />
          <div className="mt-2 flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="animate-spin" />}
              Post comment
            </Button>
          </div>
        </form>
      ) : (
        <p className="mb-6 rounded-lg border border-border bg-surface p-3 text-sm text-muted">
          <a href="/login" className="text-accent hover:underline">Log in</a> to join the
          discussion.
        </p>
      )}

      {comments.length === 0 ? (
        <EmptyState
          icon="file"
          title="No comments yet"
          description="Be the first to share feedback on this lineup."
        />
      ) : (
        <div className="divide-y divide-border">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              lineupId={lineupId}
              replyOpenFor={replyOpenFor}
              setReplyOpenFor={setReplyOpenFor}
              onReply={async (parentId, replyContent) => {
                await createMutation.mutateAsync({
                  content: replyContent,
                  parentComment: parentId,
                });
              }}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted">
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </section>
  );
}
