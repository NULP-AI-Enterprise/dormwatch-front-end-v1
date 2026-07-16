import { useState, useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MailSend01Icon, Cancel01Icon, Message01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  fetchComments,
  postComment,
  deleteComment,
} from "@/services/problemsApi";
import { formatDate } from "@/lib/dateUtils";
import type { Comment } from "@/lib/types";

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
  // Tracks the complaint currently displayed, so async handlers can tell
  // whether the user switched complaints mid-flight.
  const currentComplaintIdRef = useRef(complaintId);
  currentComplaintIdRef.current = complaintId;

  // Guard against a cross-complaint async race: the same component instance is
  // reused as the user switches complaints in the side panel, so a slow fetch
  // for a previous complaintId must not overwrite state for the current one.
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      const data = await fetchComments(complaintId);
      if (!ignore) {
        setComments(data);
        setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [complaintId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const targetComplaintId = complaintId;
    try {
      await postComment(targetComplaintId, input);
      setInput("");
      // Refetch for the complaint we posted to, and only apply if the user
      // hasn't switched complaints in the meantime.
      const data = await fetchComments(targetComplaintId);
      if (targetComplaintId === currentComplaintIdRef.current) {
        setComments(data);
      }
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
                  {c.authorIsAdmin ? (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-blue-500 text-white hover:bg-blue-600">Адміністратор</Badge>
                  ) : c.author_id === complaintAuthorId ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-green-600 border-green-600">Автор звернення</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-stone-500 border-stone-300">Студент</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(c.date)}
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
          placeholder="Напишіть коментар…"
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button onClick={handleSend}>
          <HugeiconsIcon icon={MailSend01Icon} className="size-3 mr-1" strokeWidth={2} />
          Надіслати
        </Button>
      </div>
    </div>
  );
};

export default CommentSection;
