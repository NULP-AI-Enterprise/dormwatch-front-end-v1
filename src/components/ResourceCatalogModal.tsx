import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ResourceCatalogEditor } from "@/components/ResourceCatalogEditor";
export type { ResourceItem } from "@/components/ResourceCatalogEditor";

export default function ResourceCatalogModal({ open, onOpenChange, onCatalogUpdated }: {
  open: boolean; onOpenChange: (open: boolean) => void; onCatalogUpdated?: () => void;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Каталог матеріалів та ресурсів</DialogTitle>
        <DialogDescription>Матеріали, одиниці виміру та базові ціни для списання.</DialogDescription>
      </DialogHeader>
      {open && <ResourceCatalogEditor onUpdated={onCatalogUpdated} />}
    </DialogContent>
  </Dialog>;
}
