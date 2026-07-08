import { useState, useCallback } from "react";

// Manages the "which card's comments are open" toggle used by the complaint
// feeds. Only one card's comments are open at a time; toggling the open card
// closes it.
export function useCommentToggle() {
  const [openId, setOpenId] = useState<number | null>(null);

  const isOpen = useCallback((id: number) => openId === id, [openId]);
  const toggle = useCallback(
    (id: number) => setOpenId((prev) => (prev === id ? null : id)),
    []
  );

  return { openId, isOpen, toggle };
}
