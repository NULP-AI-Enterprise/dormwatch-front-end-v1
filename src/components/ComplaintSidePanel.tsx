import { useState, useEffect, useRef } from "react";
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent } from "./ui/sheet";
import CommentSection from "./CommentSection";
import TicketCreateForm from "./TicketCreateForm";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "./ui/dialog";
import { resolveImageUrl } from "../services/imageUtils";
import { updateComplaintStatus, deleteProblem, updateComplaintPriority, fetchCategories, fetchJson } from "../services/problemsApi";
import { statusBadgeClass, statusLabel, priorityBadgeClass, priorityLabel } from "../lib/complaintUtils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon, Ticket01Icon, CheckmarkCircleIcon, CancelCircleIcon, Cancel01Icon, Camera01Icon } from "@hugeicons/core-free-icons";
import type { Complaint } from "../lib/types";

interface ComplaintSidePanelProps {
  complaint: Complaint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: () => void;
  currentUserId?: number | string;
  isAdmin: boolean;
}

const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];

const ComplaintSidePanel = ({
  complaint,
  open,
  onOpenChange,
  onStatusChange,
  currentUserId,
  isAdmin,
}: ComplaintSidePanelProps) => {
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const isPrioritySelectOpen = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{category_id: number, name: string}>>([]);
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
    setEditCategory(complaint.category);
    setEditPriority(complaint.priority);
    setEditPhotoFile(null);
    setIsEditing(false);
  }, [complaint]);

  if (!complaint) return null;

  const isOwner = String(currentUserId) === String(complaint.user_id);
  const canEdit = isAdmin || (isOwner && complaint.status === "pending");

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateComplaintStatus(complaint.id, newStatus);
      window.dispatchEvent(new CustomEvent("complaintUpdated"));
      onStatusChange();
    } catch (err) {
      setError("Не вдалось змінити статус");
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
      setError("Не вдалось змінити пріоритет");
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
      setError("Не вдалось видалити заявку");
      console.warn('Failed to delete complaint', err);
    }
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("title", editTitle);
    formData.append("description", editDescription);
    formData.append("category_name", editCategory);
    formData.append("priority", editPriority);
    if (editPhotoFile) formData.append("photo_url", editPhotoFile);

    try {
      if (isAdmin) {
        await fetchJson(`/admin/complaints/${complaint.id}/status/`, {
          method: "PATCH",
          body: formData,
        });
      } else {
        await fetchJson(`/me/complaints/${complaint.id}/`, {
          method: "PATCH",
          body: formData,
        });
      }
      window.dispatchEvent(new CustomEvent("complaintUpdated"));
      onStatusChange();
      onOpenChange(false);
    } catch (err) {
      setError("Не вдалось зберегти зміни");
      console.warn('Failed to save complaint', err);
    }
  };

  const handleCancel = () => {
    setEditTitle(complaint.title);
    setEditDescription(complaint.description);
    setEditCategory(complaint.category);
    setEditPriority(complaint.priority);
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
          <SheetTitle>Деталі скарги</SheetTitle>
          <SheetDescription>Інформація про скаргу та керування статусом</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 py-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className={statusBadgeClass(complaint.status)}>
                {statusLabel(complaint.status)}
              </Badge>
              <span className="text-xs font-semibold text-muted-foreground">
                {String(complaint.id) !== "new" && `#${complaint.id}`}
              </span>
            </div>
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Назва заявки"
              />
            ) : (
              <h3 className="text-base font-bold text-foreground mb-1">{complaint.title || "Без назви"}</h3>
            )}
            <p className="text-xs font-normal text-muted-foreground">{complaint.building ? `Корпус ${complaint.building}` : "Корпус ?"}<span className="w-1 h-1 bg-border inline-block mx-1.5" />{complaint.placeName || "?"}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isEditing ? (
              <div className="w-full space-y-2">
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Категорія" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.category_id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                {isAdmin ? (
                  <Select 
                    value={complaint.priority} 
                    onValueChange={handlePriorityChange}
                    onOpenChange={(isOpen) => {
                      if (!isOpen) {
                        setTimeout(() => { isPrioritySelectOpen.current = false; }, 150);
                      } else {
                        isPrioritySelectOpen.current = true;
                      }
                    }}
                  >
                    <SelectTrigger className={`h-6 text-xs px-2 py-0 font-semibold border ${priorityBadgeClass(complaint.priority)}`}>
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
                  <Badge
                    variant="outline"
                    className={priorityBadgeClass(complaint.priority)}
                  >
                      Пріоритет: {priorityLabel(complaint.priority)}
                  </Badge>
                )}
                {complaint.createdAt && (
                  <span className="text-xs text-muted-foreground font-semibold">
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </span>
                )}
              </>
            )}
          </div>

          {isEditing ? (
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Опис заявки"
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
              <label className="w-full border-2 border-dashed border-border flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                <HugeiconsIcon
                  icon={Camera01Icon}
                  className="size-6 text-muted-foreground mb-2"
                  strokeWidth={2}
                />
                <p className="text-xs font-normal text-muted-foreground">
                  {editPhotoFile ? editPhotoFile.name : "Натисніть, щоб замінити фото"}
                </p>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setEditPhotoFile(file);
                  }}
                />
              </label>
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

          <Separator />

          {isAdmin && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {complaint.status === "pending" && (
                  <>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button>
                          <HugeiconsIcon icon={CheckmarkCircleIcon} className="size-3 mr-1" strokeWidth={2} />
                          Схвалити
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Схвалити скаргу?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ви впевнені, що хочете схвалити цю скаргу? Вона перейде в статус "Активно".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Скасувати</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleStatusChange("approved")}>Схвалити</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                        >
                          <HugeiconsIcon icon={CancelCircleIcon} className="size-3 mr-1" strokeWidth={2} />
                          Відхилити
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Відхилити скаргу?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ви впевнені, що хочете відхилити цю скаргу? Вона перейде в статус "Відхилено".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Скасувати</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleStatusChange("rejected")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Відхилити</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
                {complaint.status === "approved" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button>
                        <HugeiconsIcon icon={CheckmarkCircleIcon} className="size-3 mr-1" strokeWidth={2} />
                        Позначити вирішеним
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Позначити як вирішену?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ви впевнені, що проблема була успішно вирішена? Скарга перейде в статус "Вирішено".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Скасувати</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleStatusChange("resolved")}>Вирішити</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                    >
                      <HugeiconsIcon icon={Delete01Icon} className="size-3 mr-1" strokeWidth={2} />
                      Видалити
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Видалити скаргу?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ви впевнені, що хочете видалити цю скаргу? Цю дію неможливо скасувати.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Скасувати</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Видалити</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {!showTicketForm && (
                  <Button
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
                  fixedComplaintId={complaint.id as number}
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

          <CommentSection complaintId={complaint.id} currentUserId={currentUserId} isAdmin={isAdmin} complaintAuthorId={complaint.user_id} />
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
};

export default ComplaintSidePanel;
