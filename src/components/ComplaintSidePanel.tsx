import { useState, useEffect, useRef } from "react";
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent } from "@/components/ui/sheet";
import CommentSection from "@/components/CommentSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { resolveImageUrl } from "@/services/imageUtils";
import { updateComplaintStatus, deleteProblem, updateComplaintPriority, fetchCategories, fetchJson } from "@/services/problemsApi";
import { priorityBadgeClass, priorityLabel, PRIORITY_OPTIONS, lifecycleStage } from "@/lib/complaintUtils";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import ComplaintAdminActions from "@/components/ComplaintAdminActions";
import PhotoUploadField from "@/components/PhotoUploadField";
import TicketInfo from "@/components/TicketInfo";
import { formatDate } from "@/lib/dateUtils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Ticket01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import type { Complaint, CategoryOption, Ticket } from "@/lib/types";

interface ComplaintSidePanelProps {
  complaint: Complaint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: () => void;
  currentUserId?: number | string;
  isAdmin: boolean;
  onCreateTicket?: (complaint: Complaint) => void;
  // Read-only work-order info surfaced to the complaint owner (assignee /
  // deadline). Assigning stays admin-only in the admin ticket flow.
  ticket?: Ticket | null;
}

const ComplaintSidePanel = ({
  complaint,
  open,
  onOpenChange,
  onStatusChange,
  currentUserId,
  isAdmin,
  onCreateTicket,
  ticket,
}: ComplaintSidePanelProps) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const isPrioritySelectOpen = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([{ category_id: 0, name: "Помилка завантаження" }]));
  }, []);

  useEffect(() => {
    if (!editPhotoFile) {
      setEditPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(editPhotoFile);
    setEditPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [editPhotoFile]);

  useEffect(() => {
    if (!complaint) return;
    setEditTitle(complaint.title);
    setEditDescription(complaint.description);
    setEditCategory(complaint.category ?? "");
    setEditPriority(complaint.priority ?? "");
    setEditPhotoFile(null);
    setIsEditing(false);
  }, [complaint]);

  if (!complaint) return null;

  const isOwner = String(currentUserId) === String(complaint.user_id);
  // Only the complaint owner may edit content, and only while pending. Admins
  // run the moderation workflow (status/priority/delete/tickets) but must not
  // rewrite a resident's report — enforced here and on the backend.
  const canEdit = isOwner && complaint.status === "pending";

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateComplaintStatus(complaint.id, newStatus);
      window.dispatchEvent(new CustomEvent("complaintUpdated"));
      onStatusChange();
    } catch (err) {
      setError("Не вдалося змінити статус. Спробуйте ще раз.");
      console.warn('Failed to change complaint status', err);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    setEditPriority(newPriority);
    try {
      await updateComplaintPriority(complaint.id, newPriority);
      window.dispatchEvent(new CustomEvent("complaintUpdated"));
      onStatusChange();
    } catch (err) {
      setError("Не вдалося змінити пріоритет. Спробуйте ще раз.");
      console.warn('Failed to change complaint priority', err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProblem(complaint.id);
      window.dispatchEvent(new CustomEvent("complaintUpdated"));
      onStatusChange();
      onOpenChange(false);
    } catch (err) {
      setError("Не вдалося видалити звернення. Спробуйте ще раз.");
      console.warn('Failed to delete complaint', err);
    }
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("title", editTitle);
    formData.append("description", editDescription);
    // Only send category/priority when actually set, so an empty (unknown)
    // value is never persisted as a fabricated category/priority.
    if (editCategory) formData.append("category_name", editCategory);
    if (editPriority) formData.append("priority", editPriority);
    if (editPhotoFile) formData.append("photo_url", editPhotoFile);

    try {
      // Content edits are owner-only (canEdit gates this), so always use the
      // owner endpoint. Admins have no content-edit path.
      await fetchJson(`/me/complaints/${complaint.id}/`, {
        method: "PATCH",
        body: formData,
      });
      window.dispatchEvent(new CustomEvent("complaintUpdated"));
      onStatusChange();
      onOpenChange(false);
    } catch (err) {
      setError("Не вдалося зберегти зміни. Спробуйте ще раз.");
      console.warn('Failed to save complaint', err);
    }
  };

  const handleCancel = () => {
    setEditTitle(complaint.title);
    setEditDescription(complaint.description);
    setEditCategory(complaint.category ?? "");
    setEditPriority(complaint.priority ?? "");
    setEditPhotoFile(null);
    setIsEditing(false);
  };

  const categoryLabel = complaint.category;

  return (
    <>
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className={`${isAdmin ? "max-w-[90vw] sm:max-w-[90vw]" : "max-w-4xl sm:max-w-4xl"} bg-transparent border-none shadow-none p-0 flex justify-center items-center`} showCloseButton={false}>
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          {previewImage && (
            <img
              src={previewImage}
              className="w-full h-auto max-h-[90vh] object-contain"
              alt="Full size"
            />
          )}
          <DialogClose className="absolute top-4 right-4 text-foreground hover:text-stone-300">
            <HugeiconsIcon icon={Cancel01Icon} className="size-6" strokeWidth={2} />
          </DialogClose>
        </DialogContent>
      </Dialog>

    <Sheet 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen && isPrioritySelectOpen.current) return;
        onOpenChange(newOpen);
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Деталі звернення</SheetTitle>
          <SheetDescription>Інформація про звернення та керування статусом</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 py-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <StatusBadge status={complaint.status} />
              <span className="text-xs font-semibold text-muted-foreground">
                {String(complaint.id) !== "new" && `#${complaint.id}`}
              </span>
            </div>
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Назва звернення"
              />
            ) : (
              <h3 className="text-base font-bold text-foreground mb-1">{complaint.title || "Без назви"}</h3>
            )}
            <p className="text-xs font-normal text-muted-foreground">{complaint.building ? `Корпус ${complaint.building}` : "Корпус ?"}<span className="w-1 h-1 bg-border inline-block mx-1.5" />{complaint.placeName || "?"}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isEditing ? (
              <div className="w-full space-y-2">
                <Combobox<string, false>
                  items={categories.map((c) => c.name)}
                  value={editCategory}
                  onValueChange={(v) => setEditCategory(v ?? "")}
                >
                  <ComboboxInput placeholder="Категорія" className="w-full h-8 text-xs" />
                  <ComboboxContent>
                    <ComboboxEmpty>Категорій не знайдено</ComboboxEmpty>
                    <ComboboxList>
                      {(name: string) => (
                        <ComboboxItem key={name} value={name}>
                          {name}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <Select value={editPriority} onValueChange={setEditPriority}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Пріоритет" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {priorityLabel(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <span className="text-xs text-muted-foreground font-semibold">
                  {categoryLabel}
                </span>
                <span className="w-1 h-1 bg-border" />
                {isAdmin && !["resolved", "rejected"].includes(complaint.status) ? (
                  <Select
                    value={complaint.priority ?? undefined}
                    onValueChange={handlePriorityChange}
                    onOpenChange={(isOpen) => {
                      if (!isOpen) {
                        setTimeout(() => { isPrioritySelectOpen.current = false; }, 150);
                      } else {
                        isPrioritySelectOpen.current = true;
                      }
                    }}
                  >
                    <SelectTrigger className={`h-6 text-xs px-2 py-0 font-semibold border ${priorityBadgeClass(complaint.priority ?? "")}`}>
                      <SelectValue placeholder="Пріоритет" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {priorityLabel(p)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <PriorityBadge priority={complaint.priority} prefix />
                )}
                {complaint.createdAt && (
                  <span className="text-xs text-muted-foreground font-semibold">
                    {formatDate(complaint.createdAt)}
                  </span>
                )}
              </>
            )}
          </div>

          {isEditing ? (
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Опис звернення"
              className="min-h-24 resize-none"
            />
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed break-all whitespace-pre-wrap">{complaint.description || "—"}</p>
          )}

          {isEditing ? (
            <div className="space-y-2">
              {(editPhotoPreview || complaint.photoUrl) && (
                <div className="w-full h-32 overflow-hidden border border-border">
                  <img
                    src={editPhotoPreview || resolveImageUrl(complaint.thumbnail || complaint.photoUrl)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <PhotoUploadField
                onFileSelect={setEditPhotoFile}
                label={editPhotoFile ? editPhotoFile.name : "Натисніть, щоб замінити фото"}
              />
            </div>
          ) : (
            complaint.photoUrl && (
              <div 
                className="w-full h-44 overflow-hidden border border-border cursor-zoom-in"
                onClick={() => setPreviewImage(resolveImageUrl(complaint.photoUrl as string))}
              >
                <img
                  src={resolveImageUrl(complaint.thumbnail || complaint.photoUrl)}
                  alt=""
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            )
          )}

          {error && (
            <p className="text-xs leading-relaxed text-destructive font-semibold">{error}</p>
          )}

          {isEditing && (
            <div className="flex gap-2">
              <Button onClick={handleSave}>Зберегти</Button>
              <Button variant="outline" onClick={handleCancel}>Скасувати</Button>
            </div>
          )}

          {canEdit && !isEditing && (
            <Button variant="ghost" onClick={() => { setError(null); setIsEditing(true); }}>
              Редагувати
            </Button>
          )}

          {/* Owner-facing read-only work-order tracking. Shown while in progress
              and after resolution (informational: who handled it, deadline), but
              not for a rejected request — there is no work order to track. Each
              block owns its leading Separator so rules never double up. */}
          {!isAdmin && isOwner && ticket && lifecycleStage(complaint.status) !== "rejected" && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Відстеження виконання</p>
                <TicketInfo variant="detail" ticket={ticket} />
              </div>
            </>
          )}

          {isAdmin && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <ComplaintAdminActions
                    complaint={complaint}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    hideDeleteWhenClosed
                  />
                  {onCreateTicket && complaint.status === "approved" && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        onOpenChange(false);
                        onCreateTicket(complaint);
                      }}
                    >
                      <HugeiconsIcon icon={Ticket01Icon} className="size-3 mr-1" strokeWidth={2} />
                      Створити тікет
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator dashed />

          <CommentSection complaintId={complaint.id} currentUserId={currentUserId} isAdmin={isAdmin} complaintAuthorId={complaint.user_id} />
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
};

export default ComplaintSidePanel;
