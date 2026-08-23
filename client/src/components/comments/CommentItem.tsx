import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Heart, MessageCircle, Trash2, CornerDownRight, Loader2 } from "lucide-react";
import { commentsApi, getApiErrorMessage } from "../../api/endpoints";
import { useAuthStore } from "../../stores/authStore";
import type { CommentNode } from "../../types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ReportDialog } from "../ReportDialog";
import { cn, timeAgo } from "../../lib/utils";

interface CommentItemProps {
  comment: CommentNode;
  lineupId: string;
  onReply: (parentId: string, content: string) => Promise<void>;
  replyOpenFor: string | null;
  setReplyOpenFor: (id: string | null) => void;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  lineupId,
  onReply,
  replyOpenFor,
  setReplyOpenFor,
  isReply = false,
}: CommentItemProps) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const likeMutation = useMutation({
    mutationFn: () => commentsApi.like(comment._id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["comments", lineupId] }),
    onError: (err) => {
      if (!user) toast.error("Log in to like comments");
      else toast.error(getApiErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => commentsApi.remove(comment._id),
    onSuccess: () => {
      toast.success("Comment deleted");
      queryClient.invalidateQueries({ queryKey: ["comments", lineupId] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const submitReply = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await onReply(comment._id, replyContent.trim());
      setReplyContent("");
      setReplyOpenFor(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn(isReply && "ml-6 border-l border-border pl-4 sm:ml-10")}>
      <div className="flex gap-3 py-3">
        <Link to={`/users/${comment.author.username}`} className="shrink-0">
          <Avatar className="h-8 w-8">
            {comment.author.avatar?.url ? (
              <AvatarImage src={comment.author.avatar.url} alt={comment.author.username} />
            ) : null}
            <AvatarFallback>
              {comment.author.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 text-sm">
            <Link
              to={`/users/${comment.author.username}`}
              className="font-medium hover:text-accent"
            >
              @{comment.author.username}
            </Link>
            <span className="text-xs text-muted">{timeAgo(comment.createdAt)}</span>
          </div>

          <p
            className={cn(
              "mt-1 whitespace-pre-wrap break-words text-sm",
              comment.isDeleted && "italic text-muted/60",
            )}
          >
            {comment.content}
          </p>

          {!comment.isDeleted && (
            <div className="mt-1.5 flex items-center gap-3 text-xs text-muted">
              <button
                onClick={() => likeMutation.mutate()}
                disabled={likeMutation.isPending}
                className={cn(
                  "flex items-center gap-1 cursor-pointer transition-colors hover:text-foreground",
                  comment.likedByViewer && "text-rose-400 hover:text-rose-300",
                )}
              >
                <Heart className={cn("h-3.5 w-3.5", comment.likedByViewer && "fill-current")} />
                {comment.likesCount > 0 ? comment.likesCount : "Like"}
              </button>

              {!isReply && user && (
                <button
                  onClick={() =>
                    setReplyOpenFor(replyOpenFor === comment._id ? null : comment._id)
                  }
                  className="flex items-center gap-1 cursor-pointer transition-colors hover:text-foreground"
                >
                  <CornerDownRight className="h-3.5 w-3.5" /> Reply
                </button>
              )}

              {user?._id === comment.author._id && (
                <button
                  onClick={() => deleteMutation.mutate()}
                  className="flex items-center gap-1 cursor-pointer transition-colors hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              )}

              {user && user._id !== comment.author._id && (
                <ReportDialog
                  targetType="comment"
                  targetId={comment._id}
                  trigger={
                    <span className="transition-colors hover:text-foreground">Report</span>
                  }
                />
              )}
            </div>
          )}

          {replyOpenFor === comment._id && !isReply && (
            <div className="mt-2 flex gap-2 animate-fade-in">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Reply to @${comment.author.username}…`}
                className="min-h-[60px]"
                maxLength={2000}
              />
              <Button
                size="sm"
                onClick={submitReply}
                disabled={!replyContent.trim() || submitting}
              >
                {submitting ? <Loader2 className="animate-spin" /> : <MessageCircle />}
              </Button>
            </div>
          )}
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply._id}
          comment={reply}
          lineupId={lineupId}
          onReply={onReply}
          replyOpenFor={replyOpenFor}
          setReplyOpenFor={setReplyOpenFor}
          isReply
        />
      ))}
    </div>
  );
}
