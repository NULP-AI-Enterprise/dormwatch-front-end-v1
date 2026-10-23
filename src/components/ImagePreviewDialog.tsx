import { useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { resolveImageUrl } from "@/services/imageUtils";

interface ImagePreviewDialogProps {
  imageUrl: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  alt?: string;
}

export const ImagePreviewDialog = ({
  imageUrl,
  open,
  onOpenChange,
  onClose,
  alt = "Фото проблеми",
}: ImagePreviewDialogProps) => {
  const returnFocus = useRef<HTMLElement | null>(null);
  const isOpen = open !== undefined ? open : !!imageUrl;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (onClose) onClose();
      if (onOpenChange) onOpenChange(false);
    }
  };

  const resolved = imageUrl ? resolveImageUrl(imageUrl) : null;

  if (!resolved && !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        overlayClassName="bg-black/80 backdrop-blur-xs"
        className="w-fit sm:max-w-fit max-w-[95vw] max-h-[92vh] p-0 bg-transparent border-none shadow-none ring-0 gap-0 focus-visible:outline-none overflow-visible pointer-events-none flex items-center justify-center rounded-none"
        showCloseButton={false}
        aria-describedby={undefined}
        onOpenAutoFocus={() => { if (document.activeElement instanceof HTMLElement) returnFocus.current = document.activeElement; }}
        onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus.current?.focus(); }}
      >
        <DialogTitle className="sr-only">Перегляд фото</DialogTitle>
        {resolved && (
          <div className="relative inline-block max-w-[95vw] max-h-[90vh] overflow-hidden border border-border bg-card shadow-2xl pointer-events-auto rounded-none">
            <img
              src={resolved}
              className="block max-h-[90vh] max-w-[95vw] w-auto h-auto object-contain rounded-none select-none"
              alt={alt}
            />
            <DialogClose
              type="button"
              className="absolute top-2 right-2 text-white hover:text-stone-300 p-1.5 focus-visible:outline-2 focus-visible:outline-white bg-black/60 hover:bg-black/80 rounded-none cursor-pointer transition-colors z-20"
              title="Закрити (Esc або клік поза фото)"
              aria-label="Закрити перегляд фото"
            >
              <X className="size-5" strokeWidth={2} />
            </DialogClose>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewDialog;
