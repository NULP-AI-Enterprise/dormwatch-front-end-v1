import type { ChangeEvent, ReactNode } from "react";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoUploadFieldProps {
  onFileSelect?: (file: File | null) => void;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  label: string;
  aspectSquare?: boolean;
  className?: string;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  children?: ReactNode;
}

// The native input remains keyboard-reachable; focus is visible on its label.
const PhotoUploadField = ({ onFileSelect, onChange, label, aspectSquare = false,
  className, multiple, accept = "image/png,image/jpeg,image/jpg,image/webp", disabled, children }: PhotoUploadFieldProps) => (
  <label className={cn(
    "relative w-full min-w-0 border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors focus-within:ring-2 focus-within:ring-ring",
    aspectSquare && "aspect-square", disabled && "opacity-50 cursor-wait", className,
  )}>
    {children || <><Camera className="size-6 text-muted-foreground" /><span className="text-xs text-muted-foreground">{label}</span></>}
    <input type="file" accept={accept} className="sr-only"
      aria-label={label} multiple={multiple} disabled={disabled}
      onChange={(event) => {
        onFileSelect?.(event.target.files?.[0] || null);
        onChange?.(event);
        event.target.value = "";
      }}
    />
  </label>
);
export default PhotoUploadField;
