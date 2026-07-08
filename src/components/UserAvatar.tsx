import { getUserInitials } from "@/lib/complaintUtils";
import { resolveImageUrl } from "@/services/imageUtils";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-sm",
};

interface UserAvatarProps {
  user: { first_name?: string; last_name?: string; photo_url?: string | null } | null | undefined;
  size?: AvatarSize;
  /** Initials shown when the user has no name/photo. */
  fallback?: string;
  className?: string;
}

// Single square avatar (DESIGN.md §5 — sharp corners, no radius). Renders the
// user's `photo_url` when present, otherwise falls back to initials. Replaces
// the copy-pasted initials circles that had drifted across the layouts.
const UserAvatar = ({ user, size = "sm", fallback = "U", className }: UserAvatarProps) => {
  const photoUrl = user?.photo_url ? resolveImageUrl(user.photo_url) : null;

  return (
    <div
      className={cn(
        "bg-card border border-border shrink-0 overflow-hidden flex items-center justify-center text-muted-foreground font-bold",
        SIZE_CLASSES[size],
        className
      )}
    >
      {photoUrl ? (
        <img src={photoUrl} className="w-full h-full object-cover" alt="" />
      ) : (
        getUserInitials(user, fallback)
      )}
    </div>
  );
};

export default UserAvatar;
