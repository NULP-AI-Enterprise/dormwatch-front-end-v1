import { HugeiconsIcon } from "@hugeicons/react";
import { Camera01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = "image/png, image/jpeg, image/jpg, image/webp";

interface PhotoUploadFieldProps {
  onFileSelect: (file: File | null) => void;
  /** Text shown inside the dropzone (e.g. "Натисніть, щоб додати фото"). */
  label: string;
  /** Constrain the dropzone to a square (used by the create-report form). */
  aspectSquare?: boolean;
  className?: string;
}

// Shared drag-drop-style photo upload `<label>` (DESIGN.md §7 Create Report /
// §8). Replaces the near-identical dashed dropzones in ComplaintSidePanel and
// CreateReportPage.
const PhotoUploadField = ({
  onFileSelect,
  label,
  aspectSquare = false,
  className,
}: PhotoUploadFieldProps) => (
  <label
    className={cn(
      "w-full border-2 border-dashed border-border flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors",
      aspectSquare && "aspect-square",
      className
    )}
  >
    <HugeiconsIcon
      icon={Camera01Icon}
      className={cn("text-muted-foreground", aspectSquare ? "size-8 mb-3" : "size-6 mb-2")}
      strokeWidth={2}
    />
    <p className="text-xs font-normal text-muted-foreground">{label}</p>
    <input
      type="file"
      accept={ACCEPTED_TYPES}
      className="hidden"
      onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
    />
  </label>
);

export default PhotoUploadField;
