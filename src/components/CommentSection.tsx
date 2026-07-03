import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Forward01Icon, Cancel01Icon, Message01Icon } from "@hugeicons/core-free-icons";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
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
  complaintAuthorId?: number | null;
}

const CommentSection = ({ complaintId, currentUserId, isAdmin, complaintAuthorId }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const loadComments = async () => {
    setLoading(true);
    const data = await fetchComments(complaintId);
    setComments(data);
    setLoading(false);
  };

  useEffect(() => {
    loadComments();
  }, [complaintId]);

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
        <span className="text-xs font-semibold text-muted-foreground inline-flex items-center gap-1">
          <HugeiconsIcon icon={Message01Icon} className="size-3" strokeWidth={2} /> Коментарі ({comments.length})
        </span>
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
              <div className="flex justify-between items-baseline mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">{c.author}</span>
                  {c.author_id === currentUserId && isAdmin ? (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-blue-500 text-white hover:bg-blue-600">Адміністратор</Badge>
                  ) : c.author_id === complaintAuthorId ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-green-600 border-green-600">Автор скарги</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-stone-500 border-stone-300">Студент</Badge>
                  )}
                </div>
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
        <Button onClick={handleSend}>
          <HugeiconsIcon icon={Forward01Icon} className="size-3 mr-1" strokeWidth={2} />
          Надіслати
        </Button>
      </div>
    </div>
  );
};

export default CommentSection;
