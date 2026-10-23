import { PhotoAttachment } from "@/components/PhotoAttachment";
import { useState, useEffect } from "react";
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
import ImagePreviewDialog from "@/components/ImagePreviewDialog";
import { resolveImageUrl } from "@/services/imageUtils";
import {
  updateComplaintAdmin,
  deleteAdminComplaint,
  fetchCategories,
  fetchJson,
} from "@/services/problemsApi";
import {
  priorityLabel,
  PRIORITY_OPTIONS,
  isBlockComplaint,
  cleanComplaintDescription,
} from "@/lib/complaintUtils";
import { StatusBadge, PriorityBadge, OverdueBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/context/UserContext";
import ProgressStepper from "@/components/ProgressStepper";
import ComplaintAdminActions from "@/components/ComplaintAdminActions";
import ComplaintResidentActions from "@/components/ComplaintResidentActions";
import ComplaintResourcesSection from "@/components/ComplaintResourcesSection";
import PhotoUploadField from "@/components/PhotoUploadField";
import { formatDate } from "@/lib/dateUtils";
import { Home, Users, ZoomIn, Pencil, Phone } from "lucide-react";
import type { Complaint, CategoryOption } from "@/lib/types";

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
    setEditDescription(cleanComplaintDescription(complaint.description));
    setEditCategory(complaint.category ?? "");
    setEditPriority(complaint.priority ?? "");
    setEditPhotoFile(null);
    setIsEditing(false);
  }, [complaint]);

  const { user: currentUser } = useUser();
  if (!complaint) return null;
  const isOwner = String(currentUserId) === String(complaint.user_id) || (currentUser?.user != null && complaint.user_id === currentUser.user);
  const isWorker = ["worker", "працівник"].includes(String(currentUser?.role?.role_name ?? currentUser?.role ?? "").toLowerCase());
  const canViewReasons = isOwner || isAdmin || isWorker;
  const canEdit = isOwner && complaint.status === "pending";

  const handleAdminPatch = async (body: Record<string, unknown>) => {
    setError(null);
    try {
      await updateComplaintAdmin(complaint.id, body);
      window.dispatchEvent(new CustomEvent("complaintUpdated"));
      onStatusChange();
    } catch (err) {
      console.warn("Failed to update complaint", err);
      throw err;
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAdminComplaint(complaint.id);
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
    const isBlock = isBlockComplaint(complaint.description);
    const finalDesc = isBlock ? `${editDescription.trim()}\n\n[Блок]` : editDescription.trim();
    formData.append("description", finalDesc);
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
    setEditDescription(cleanComplaintDescription(complaint.description));
    setEditCategory(complaint.category ?? "");
    setEditPriority(complaint.priority ?? "");
    setEditPhotoFile(null);
    setIsEditing(false);
  };

  const categoryLabel = complaint.category;

  return (
    <>
      <ImagePreviewDialog
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />

    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-x-hidden w-full max-w-full sm:max-w-md md:max-w-xl">
        <SheetHeader>
          <SheetTitle>Деталі звернення</SheetTitle>
          <SheetDescription>Інформація про звернення та керування статусом</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 py-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={complaint.status} />
                <OverdueBadge complaint={complaint} />
                {complaint.isRework && (
                  <Badge variant="outline" className="bg-status-danger-bg text-status-danger border-status-danger/40 inline-flex items-center gap-1 font-semibold text-xs px-2 py-0.5">
                    Повторне опрацювання
                  </Badge>
                )}
                {complaint.studentPhone && !isAdmin && (
                  <Badge variant="outline" className="border-status-info/40 bg-status-info-bg text-status-info inline-flex items-center gap-1 font-semibold text-xs px-2 py-0.5">
                    <Phone className="size-3" strokeWidth={2} />
                    {complaint.studentPhone}
                  </Badge>
                )}
              </div>
            </div>
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Назва звернення"
              />
            ) : (
              <h3 className="text-base font-bold text-foreground mb-1 break-words [overflow-wrap:anywhere]">{complaint.title || "Без назви"}</h3>
            )}
            <p className="text-xs font-normal text-muted-foreground flex flex-wrap items-center">
              <span>{complaint.building || "?"}{complaint.placeName && <><span className="w-1 h-1 bg-border inline-block mx-1.5" />{complaint.placeName}</>}</span>
              <span className="w-1 h-1 bg-border inline-block mx-1.5" />
              <span>{isOwner ? "Ви (автор)" : isAdmin ? (complaint.userName || "Автор звернення") : "Автор звернення"}</span>
            </p>
          </div>

          <div className="py-2.5 border-y border-border/50">
            <ProgressStepper status={complaint.status} />
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
                <PriorityBadge priority={complaint.priority} />
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
            <div className="space-y-3">
              {cleanComplaintDescription(complaint.description) && (
                <p className="text-sm text-foreground leading-relaxed break-all [overflow-wrap:anywhere] whitespace-pre-wrap">
                  {cleanComplaintDescription(complaint.description)}
                </p>
              )}
              {(isBlockComplaint(complaint.description) || complaint.isShared) && (
                <div className="flex flex-wrap gap-2 items-center">
                  {isBlockComplaint(complaint.description) && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-status-info-bg text-status-info border border-status-info/40">
                      <Home className="size-4 shrink-0 text-status-info" strokeWidth={2} />
                      <span>Звернення стосується блоку</span>
                    </div>
                  )}
                  {complaint.isShared && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-status-warning-bg text-status-warning border border-status-warning/40">
                      <Users className="size-4 shrink-0 text-status-warning" strokeWidth={2} />
                      <span>Звернення стосується спільного простору</span>
                    </div>
                  )}
                </div>
              )}
              {!cleanComplaintDescription(complaint.description) && !isBlockComplaint(complaint.description) && !complaint.isShared && (
                <p className="text-sm text-muted-foreground leading-relaxed">—</p>
              )}
            </div>
          )}


          {isEditing ? (
            <div className="space-y-2">
              {(editPhotoPreview || complaint.photoUrl) && (
                <div className="w-full max-h-56 overflow-hidden border border-border bg-muted/20 flex items-center justify-center">
                  <img
                    src={editPhotoPreview || resolveImageUrl(complaint.thumbnail || complaint.photoUrl) || undefined}
                    alt=""
                    className="max-h-56 w-auto max-w-full object-contain mx-auto"
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
              <PhotoAttachment
                className="relative w-full max-h-80 overflow-hidden border border-border bg-muted/20 dark:bg-black/30 flex items-center justify-center group/panelphoto cursor-zoom-in"
                onClick={() => setPreviewImage(resolveImageUrl(complaint.photoUrl as string))}
              >
                <img
                  src={resolveImageUrl(complaint.photoUrl || complaint.thumbnail) || undefined}
                  alt={complaint.title || "Фото звернення"}
                  className="max-h-80 w-auto max-w-full object-contain mx-auto group-hover/panelphoto:scale-[1.02] transition-transform duration-300"
                />
                <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 bg-background/90 backdrop-blur-sm border border-border text-xs font-medium text-foreground flex items-center gap-1.5 opacity-80 group-hover/panelphoto:opacity-100 transition-opacity pointer-events-none shadow-sm">
                  <ZoomIn className="size-3.5 text-muted-foreground" strokeWidth={2} />
                  <span>Збільшити фото</span>
                </div>
              </PhotoAttachment>
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

          {/* Reason read surfaces: only visible to owner, admin, or worker */}
          {canViewReasons && complaint.status === "rejected" && complaint.rejectionReason && (
            <div className="border border-status-danger/30 bg-status-danger-bg p-3">
              <p className="text-xs font-semibold text-status-danger mb-1">Причина відхилення</p>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-all">
                {complaint.rejectionReason}
              </p>
            </div>
          )}
          {canViewReasons && (complaint.status === "not_accepted" || complaint.isRework) && complaint.reworkReason && (
            <div className="border border-status-danger/30 bg-status-danger-bg p-3 space-y-2">
              <p className="text-xs font-semibold text-status-danger">Причина неприйняття (повторне опрацювання)</p>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-all">
                {complaint.reworkReason}
              </p>
              {complaint.reworkPhoto && (
                <PhotoAttachment
                  className="mt-2 relative inline-block cursor-zoom-in border border-border overflow-hidden bg-background"
                  onClick={() => setPreviewImage(resolveImageUrl(complaint.reworkPhoto as string))}
                >
                  <img
                    src={resolveImageUrl(complaint.reworkPhoto as string) || undefined}
                    alt="Фото від мешканця"
                    className="max-h-36 w-auto object-contain"
                  />
                  <div className="text-xs text-muted-foreground p-1 text-center bg-muted/40">
                    Фото від мешканця (натисніть для збільшення)
                  </div>
                </PhotoAttachment>
              )}
            </div>
          )}
          {complaint.completionPhoto && (
            <div className="border border-status-success/30 bg-status-success-bg p-3 space-y-2">
              <p className="text-xs font-semibold text-status-success">Фото виконаної роботи (від працівника)</p>
              <PhotoAttachment
                className="relative inline-block cursor-zoom-in border border-border overflow-hidden bg-background"
                onClick={() => setPreviewImage(resolveImageUrl(complaint.completionPhoto as string))}
              >
                <img
                  src={resolveImageUrl(complaint.completionPhoto as string) || undefined}
                  alt="Фото виконаної роботи"
                  className="max-h-36 w-auto object-contain"
                />
                <div className="text-xs text-muted-foreground p-1 text-center bg-muted/40">
                  Фото виконання (натисніть для збільшення)
                </div>
              </PhotoAttachment>
            </div>
          )}

          {/* Owner lifecycle & actions: edit, cancel, accept, etc. */}
          {!isEditing && (canEdit || isOwner) && (
            <div className="flex flex-wrap gap-2 items-center">
              {canEdit && (
                <Button
                  variant="outline"
                  onClick={() => { setError(null); setIsEditing(true); }}
                  className="cursor-pointer"
                >
                  <Pencil className="size-3 mr-1" strokeWidth={2} />
                  Редагувати
                </Button>
              )}
              {isOwner && (
                <ComplaintResidentActions complaint={complaint} onChanged={onStatusChange} />
              )}
            </div>
          )}

          {isAdmin && (
            <>
              <Separator dashed />
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <ComplaintAdminActions
                    complaint={complaint}
                    onPatch={handleAdminPatch}
                    onDelete={handleDelete}
                    hideDeleteWhenClosed
                  />
                </div>

                {(complaint.worker || complaint.deadline) && (
                  <div className="grid grid-cols-2 gap-2 text-xs border border-border/60 bg-muted/20 p-2.5">
                    {complaint.worker && (
                      <div>
                        <span className="text-muted-foreground block text-xs">Виконавець:</span>
                        <span className="font-semibold text-foreground">{complaint.worker.full_name}</span>
                      </div>
                    )}
                    {complaint.deadline && (
                      <div>
                        <span className="text-muted-foreground block text-xs">Дедлайн:</span>
                        <span className="font-semibold text-foreground">{formatDate(complaint.deadline)}</span>
                      </div>
                    )}
                  </div>
                )}
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

              <ComplaintResourcesSection complaintId={complaint.id} />

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
