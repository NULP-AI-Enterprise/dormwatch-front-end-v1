import { useState, useEffect, useRef, useCallback } from "react";
import { Send, X, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/RoleBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  fetchComments,
  postComment,
  deleteComment,
} from "@/services/problemsApi";
import { formatDate } from "@/lib/dateUtils";
import type { Comment } from "@/lib/types";
import { ERROR_TEXT } from "@/lib/theme";

interface CommentSectionProps {
  complaintId: number;
  currentUserId?: number | string;
  isAdmin?: boolean;
  complaintAuthorId?: number | null;
  hideHeader?: boolean;
  onCommentsChange?: (count: number, latestForeignId: number | null) => void;
}

const CommentSection = ({
  complaintId,
  currentUserId,
  isAdmin,
  complaintAuthorId,
  hideHeader = false,
  onCommentsChange,
}: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // Tracks the complaint currently displayed, so async handlers can tell
  // whether the user switched complaints mid-flight.
  const currentComplaintIdRef = useRef(complaintId);
  currentComplaintIdRef.current = complaintId;
  const onCommentsChangeRef = useRef(onCommentsChange);
  onCommentsChangeRef.current = onCommentsChange;

  const notifyChange = useCallback((list: Comment[]) => {
    if (!onCommentsChangeRef.current) return;
    const foreign = list.filter((c) => currentUserId == null || c.author_id !== currentUserId);
    const latestForeignId = foreign.length > 0 ? Math.max(...foreign.map((c) => c.id)) : null;
    onCommentsChangeRef.current(list.length, latestForeignId);
  }, [currentUserId]);

  // Guard against a cross-complaint async race: the same component instance is
  // reused as the user switches complaints in the side panel, so a slow fetch
  // for a previous complaintId must not overwrite state for the current one.
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true); setError("");
      try {
        const data = await fetchComments(complaintId);
        if (!ignore) { setComments(data); notifyChange(data); }
      } catch {
        if (!ignore) setError("Не вдалося завантажити коментарі.");
      } finally { if (!ignore) setLoading(false); }
    })();
    return () => {
      ignore = true;
    };
  }, [complaintId, reloadKey, notifyChange]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    setError("");
    const targetComplaintId = complaintId;
    try {
      const posted = await postComment(targetComplaintId, input);
      if (targetComplaintId === currentComplaintIdRef.current) {
        setInput("");
        const next = [...comments, posted];
        setComments(next);
        notifyChange(next);
      }
    } catch {
      setError("Не вдалося надіслати коментар. Спробуйте ще раз.");
    } finally { setSending(false); }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => {
        const next = prev.filter((c) => c.id !== commentId);
        notifyChange(next);
        return next;
      });
    } catch {
      setError("Не вдалося видалити коментар.");
    }
  };

  return (
    <div>
      {!hideHeader && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-normal text-muted-foreground inline-flex items-center gap-1">
            <MessageSquare className="size-3" strokeWidth={2} /> Коментарі ({comments.length})
          </span>
        </div>
      )}

      {error && <div role="alert" className="mb-3 space-y-2"><p className="text-xs text-destructive">{error}</p><Button variant="outline" onClick={() => setReloadKey((value) => value + 1)}>Оновити коментарі</Button></div>}
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
              <div className="flex flex-wrap justify-between items-baseline gap-2 mb-2 pr-5">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    {c.author_id === complaintAuthorId && !isAdmin && currentUserId !== complaintAuthorId
                      ? "Автор звернення"
                      : c.author}
                  </span>
                  <RoleBadge role={c.authorRole} isAdmin={c.authorIsAdmin} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(c.date)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{c.text}</p>
              {(currentUserId != null && String(currentUserId) === String(c.author_id)) && (
                <Button aria-label={"Видалити коментар: " + c.author} variant="ghost" size="icon-xs" onClick={() => handleDelete(c.id)} className={`absolute top-1 right-1 ${ERROR_TEXT} opacity-100 transition-opacity`}>
                  <X className="size-3" strokeWidth={2} />
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
          aria-label="Новий коментар"
          disabled={sending}
          placeholder="Напишіть коментар…"
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button onClick={handleSend} disabled={sending || !input.trim()}>
          <Send className="size-3 mr-1" strokeWidth={2} />
          Надіслати
        </Button>
      </div>
    </div>
  );
};

export default CommentSection;
