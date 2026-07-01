import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Forward01Icon, Cancel01Icon, Refresh01Icon, Message01Icon } from "@hugeicons/core-free-icons";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import LoadingSpinner from "./LoadingSpinner";
import {
  fetchComments,
  postComment,
  deleteComment,
} from "../services/problemsApi";
import type { Comment } from "../lib/types";

interface CommentSectionProps {
  complaintId: number;
  currentUserId?: number | string;
  isAdmin?: boolean;
}

const CommentSection = ({ complaintId, currentUserId, isAdmin }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const loadComments = async () => {
    setLoading(true);
    const data = await fetchComments(complaintId);
    setComments(data);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      await postComment(complaintId, input);
      setInput("");
      loadComments();
    } catch (err) {
      console.warn('Failed to send comment', err);
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.warn('Failed to delete comment', err);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Button variant="link" size="xs" onClick={loadComments} className="p-0 h-auto text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
          {comments.length > 0 ? <><HugeiconsIcon icon={Message01Icon} className="size-3" strokeWidth={2} /> Коментарі ({comments.length})</> : <><HugeiconsIcon icon={Refresh01Icon} className="size-3" strokeWidth={2} /> Завантажити коментарі</>}
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      )}

      {comments.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className="bg-card p-3 border border-border relative group/comment"
            >
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold text-foreground">{c.author}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{c.text}</p>
              {(currentUserId === c.author_id || isAdmin) && (
                <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(c.id)} className="absolute top-1 right-1 text-red-400 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                  <HugeiconsIcon icon={Cancel01Icon} className="size-3" strokeWidth={2} />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Написати коментар..."
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button size="sm" onClick={handleSend}>
          <HugeiconsIcon icon={Forward01Icon} className="size-3 mr-1" strokeWidth={2} />
          Надіслати
        </Button>
      </div>
    </div>
  );
};

export default CommentSection;
