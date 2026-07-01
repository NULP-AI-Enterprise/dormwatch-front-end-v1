import { useState } from "react";
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent } from "./ui/sheet";
import CommentSection from "./CommentSection";
import TicketCreateForm from "./TicketCreateForm";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { resolveImageUrl } from "../services/imageUtils";
import { CATEGORY_LABELS, updateComplaintStatus, deleteProblem } from "../services/problemsApi";
import { statusBadgeClass, statusLabel, priorityBadgeClass, priorityLabel } from "../lib/complaintUtils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon, Ticket01Icon, CheckmarkCircleIcon, CancelCircleIcon } from "@hugeicons/core-free-icons";
import type { Complaint } from "../lib/types";

interface ComplaintSidePanelProps {
  complaint: Complaint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: () => void;
  currentUserId?: number | string;
  isAdmin: boolean;
}

const ComplaintSidePanel = ({
  complaint,
  open,
  onOpenChange,
  onStatusChange,
  currentUserId,
  isAdmin,
}: ComplaintSidePanelProps) => {
  const [showTicketForm, setShowTicketForm] = useState(false);

  if (!complaint) return null;

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateComplaintStatus(complaint.id, newStatus);
      onStatusChange();
    } catch (err) {
      console.warn('Failed to change complaint status', err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProblem(complaint.id);
      onStatusChange();
      onOpenChange(false);
    } catch (err) {
      console.warn('Failed to delete complaint', err);
    }
  };

  const categoryLabel =
    CATEGORY_LABELS[complaint.category as keyof typeof CATEGORY_LABELS] || complaint.category;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Деталі заявки</SheetTitle>
          <SheetDescription>Інформація про заявку та керування статусом</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 py-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className={statusBadgeClass(complaint.status)}>
                {statusLabel(complaint.status)}
              </Badge>
              <span className="text-xs font-semibold text-muted-foreground">
                {complaint.id !== "new" && `#${complaint.id}`}
              </span>
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">{complaint.title || "Без назви"}</h3>
            <p className="text-xs font-normal text-muted-foreground">{complaint.building ? `Корпус ${complaint.building}` : "Корпус ?"}<span className="w-1 h-1 bg-border inline-block mx-1.5" />{complaint.placeName || "?"}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">
              {categoryLabel}
            </span>
            <span className="w-1 h-1 bg-border" />
            <Badge
              variant="outline"
              className={priorityBadgeClass(complaint.priority)}
            >
                Пріоритет: {priorityLabel(complaint.priority)}
            </Badge>
            {complaint.createdAt && (
              <span className="text-xs text-muted-foreground font-semibold">
                {new Date(complaint.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">{complaint.description || "—"}</p>

          {complaint.photoUrl && (
            <div className="w-full h-44 overflow-hidden border border-border">
              <img
                src={resolveImageUrl(complaint.thumbnail || complaint.photoUrl)}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <Separator />

          {isAdmin && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {complaint.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange("approved")}
                    >
                      <HugeiconsIcon icon={CheckmarkCircleIcon} className="size-3 mr-1" strokeWidth={2} />
                      Схвалити
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusChange("rejected")}
                    >
                      <HugeiconsIcon icon={CancelCircleIcon} className="size-3 mr-1" strokeWidth={2} />
                      Відхилити
                    </Button>
                  </>
                )}
                {complaint.status === "approved" && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange("resolved")}
                  >
                    <HugeiconsIcon icon={CheckmarkCircleIcon} className="size-3 mr-1" strokeWidth={2} />
                    Позначити вирішеним
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                >
                  <HugeiconsIcon icon={Delete01Icon} className="size-3 mr-1" strokeWidth={2} />
                  Видалити
                </Button>
                {!showTicketForm && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowTicketForm(true)}
                  >
                    <HugeiconsIcon icon={Ticket01Icon} className="size-3 mr-1" strokeWidth={2} />
                    Створити тікет
                  </Button>
                )}
              </div>

              {showTicketForm && (
                <TicketCreateForm
                  onClose={() => setShowTicketForm(false)}
                  onSaved={() => {
                    setShowTicketForm(false);
                    onOpenChange(false);
                  }}
                />
              )}
            </div>
          )}

          <Separator dashed />

          <CommentSection complaintId={complaint.id} currentUserId={currentUserId} isAdmin={isAdmin} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ComplaintSidePanel;
