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
import { DatePicker } from "@/components/ui/date-picker";
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
import {
  updateComplaintStatus,
  deleteProblem,
  updateComplaintPriority,
  updateComplaintAssignment,
  fetchCategories,
  fetchWorkers,
  fetchJson,
} from "@/services/problemsApi";
import {
  priorityBadgeClass,
  priorityLabel,
  PRIORITY_OPTIONS,
  TERMINAL_STATUSES,
} from "@/lib/complaintUtils";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import ComplaintAdminActions from "@/components/ComplaintAdminActions";
import ComplaintResidentActions from "@/components/ComplaintResidentActions";
import PhotoUploadField from "@/components/PhotoUploadField";
import { formatDate } from "@/lib/dateUtils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import type { Complaint, CategoryOption, Worker } from "@/lib/types";

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
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([{ category_id: 0, name: "Помилка завантаження" }]));
  }, []);

  // Assignment targets for the admin panel (worker + deadline controls).
  useEffect(() => {
    if (isAdmin && open) {
      fetchWorkers().then(setWorkers).catch(() => setWorkers([]));
    }
  }, [isAdmin, open]);

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

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    try {
      await updateComplaintStatus(complaint.id, newStatus, reason);
      window.dispatchEvent(new CustomEvent("complaintUpdated"));
      onStatusChange();
    } catch (err) {
      setError("Не вдалося змінити статус. Спробуйте ще раз.");
      console.warn('Failed to change complaint status', err);
    }
  };

  // The owner accepts or rejects finished work from the review state; those
  // controls land with the resident stepper work (step 04).
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

  const handleWorkerChange = async (raw: string) => {
    try {
      await updateComplaintAssignment(complaint.id, {
        workerId: raw === "none" ? null : Number(raw),
      });
      window.dispatchEvent(new CustomEvent("complaintUpdated"));
      onStatusChange();
    } catch (err) {
      setError("Не вдалося призначити виконавця. Спробуйте ще раз.");
      console.warn('Failed to assign worker', err);
    }
  };

  const handleDeadlineChange = async (date?: Date) => {
    try {
      await updateComplaintAssignment(complaint.id, {
        deadline: date ? date.toISOString() : null,
      });
      window.dispatchEvent(new CustomEvent("complaintUpdated"));
      onStatusChange();
    } catch (err) {
      setError("Не вдалося зберегти дедлайн. Спробуйте ще раз.");
      console.warn('Failed to save deadline', err);
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
              <span className="text-xs font-normal text-muted-foreground">
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
            <p className="text-xs font-normal text-muted-foreground">{complaint.building || "?"}<span className="w-1 h-1 bg-border inline-block mx-1.5" />{complaint.placeName || "?"}</p>
            {complaint.followUpOf != null && (
              <p className="text-xs font-normal text-muted-foreground mt-1">
                Повторне звернення до №{complaint.followUpOf}
              </p>
            )}
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
                <span className="text-xs text-muted-foreground font-normal">
                  {categoryLabel}
                </span>
                <span className="w-1 h-1 bg-border" />
                {isAdmin && !TERMINAL_STATUSES.includes(complaint.status) ? (
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
                  <span className="text-xs text-muted-foreground font-normal">
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

          {complaint.rejectionReason && (complaint.status === "rejected" || complaint.status === "denied") && (
            <div className="p-3 bg-destructive/10 border border-destructive/25 rounded-lg text-xs">
              <span className="font-bold text-destructive block mb-1">Причина відхилення:</span>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{complaint.rejectionReason}</p>
            </div>
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

          {/* Reason read surfaces: the marks a rejection leaves behind must be
              readable where the state is visible (full-loop rule). */}
          {complaint.status === "rejected" && complaint.rejectionReason && (
            <div className="border border-border bg-muted/30 p-3">
              <p className="text-xs font-semibold text-foreground mb-1">Причина відхилення</p>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-all">
                {complaint.rejectionReason}
              </p>
            </div>
          )}
          {complaint.status === "not_accepted" && complaint.reworkReason && (
            <div className="border border-border bg-muted/30 p-3">
              <p className="text-xs font-semibold text-destructive mb-1">Причина неприйняття</p>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-all">
                {complaint.reworkReason}
              </p>
            </div>
          )}

          {/* Owner lifecycle: accept/reject finished work, withdraw while
              Очікує, re-file from any closed state. */}
          {isOwner && !isEditing && (
            <div className="flex flex-wrap gap-2 items-center">
              <ComplaintResidentActions complaint={complaint} onChanged={onStatusChange} />
            </div>
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
                </div>

                {/* Assignment lives on the complaint itself now — the same
                    PATCH endpoint backs the print/export surfaces. */}
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Виконавець</label>
                    <Select
                      value={complaint.worker ? String(complaint.worker.worker_id) : "none"}
                      onValueChange={handleWorkerChange}
                    >
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue placeholder="Не призначено" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Не призначено</SelectItem>
                        {workers.map((w) => (
                          <SelectItem key={w.worker_id} value={String(w.worker_id)}>
                            {w.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Дедлайн</label>
                    <DatePicker
                      date={complaint.deadline ? new Date(complaint.deadline) : undefined}
                      setDate={(d) => handleDeadlineChange(d ?? undefined)}
                      placeholder="Не визначено"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Comments are owner/admin-only on the backend (GET & POST 403 for
              others). Only render the section for those roles so residents
              viewing someone else's published complaint don't see an
              unusable list + input. */}
          {(isOwner || isAdmin) && (
            <>
              <Separator dashed />

              <CommentSection complaintId={complaint.id} currentUserId={currentUserId} isAdmin={isAdmin} complaintAuthorId={complaint.user_id} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
};

export default ComplaintSidePanel;
