import { useState } from "react";
import { Send, X } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import LoadingSpinner from "./LoadingSpinner";
import {
  fetchComments,
  postComment,
  deleteComment,
} from "../services/problemsApi";

interface CommentSectionProps {
  complaintId: number;
  currentUserId?: number | string;
  isAdmin?: boolean;
}

const CommentSection = ({ complaintId, currentUserId, isAdmin }: CommentSectionProps) => {
  const [comments, setComments] = useState<any[]>([]);
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
    } catch {
      // silently fail
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // silently fail
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={loadComments}
          className="text-[10px] font-semibold uppercase tracking-wider text-primary hover:underline"
        >
          {comments.length > 0 ? `Коментарі (${comments.length})` : "Завантажити коментарі"}
        </button>
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
              className="bg-stone-800 p-3 border border-stone-700 relative group/comment"
            >
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-[11px] font-bold text-stone-50">{c.author}</span>
                <span className="text-[9px] text-stone-400">
                  {new Date(c.date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">{c.text}</p>
              {(currentUserId === c.author_id || isAdmin) && (
                <button
                  onClick={() => handleDelete(c.id)}
                  className="absolute top-1 right-1 text-red-400 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" strokeWidth={2} />
                </button>
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
          <Send className="w-3 h-3 mr-1" strokeWidth={2} />
          Надіслати
        </Button>
      </div>
    </div>
  );
};

export default CommentSection;
