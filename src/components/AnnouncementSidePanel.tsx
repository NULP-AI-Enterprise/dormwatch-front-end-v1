import { useState, useEffect, useRef } from "react";
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { PinIcon } from "@hugeicons/core-free-icons";
import { createAnnouncement, updateAnnouncement } from "@/services/problemsApi";
import { formatDate } from "@/lib/dateUtils";
import { format } from "date-fns";
import type { Announcement, Building } from "@/lib/types";

// Sentinel Select value for the global (all-buildings) option — Select needs a
// non-empty string value, so "global" stands in for a null building.
const GLOBAL = "global";

interface AnnouncementSidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // null = a blank "create" form (admin only). An object = view/edit.
  announcement: Announcement | null;
  // Residents get a static read-only view; admins get the editable form.
  readOnly?: boolean;
  buildings?: Building[];
  // Called after a successful create/update so the parent can refresh its list.
  onSaved?: () => void;
}

const AnnouncementSidePanel = ({
  open,
  onOpenChange,
  announcement,
  readOnly = false,
  buildings = [],
  onSaved,
}: AnnouncementSidePanelProps) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [buildingValue, setBuildingValue] = useState<string>(GLOBAL);
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A portalled Select closing shouldn't also close the Sheet (mirrors the
  // guard in ComplaintSidePanel).
  const isSelectOpen = useRef(false);

  // Seed the form from the announcement (edit) or reset to blank (create)
  // whenever the target changes.
  useEffect(() => {
    setError(null);
    setSaving(false);
    if (announcement) {
      setTitle(announcement.title);
      setBody(announcement.body);
      setBuildingValue(announcement.building == null ? GLOBAL : String(announcement.building));
      setIsPinned(announcement.is_pinned);
      setExpiresAt(announcement.expires_at ? new Date(announcement.expires_at) : undefined);
    } else {
      setTitle("");
      setBody("");
      setBuildingValue(GLOBAL);
      setIsPinned(false);
      setExpiresAt(undefined);
    }
  }, [announcement, open]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) {
      setError("Заголовок і текст обовʼязкові.");
      return;
    }
    setSaving(true);
    setError(null);
    const buildingId = buildingValue === GLOBAL ? null : Number(buildingValue);
    const expires = expiresAt ? format(expiresAt, "yyyy-MM-dd") : null;
    try {
      if (announcement) {
        await updateAnnouncement(announcement.announcement_id, {
          title: trimmedTitle,
          body: trimmedBody,
          building: buildingId,
          is_pinned: isPinned,
          expires_at: expires,
        });
      } else {
        await createAnnouncement({
          title: trimmedTitle,
          body: trimmedBody,
          buildingId,
          isPinned,
          expiresAt: expires,
        });
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError("Не вдалося зберегти оголошення. Спробуйте ще раз.");
      console.warn("Failed to save announcement", err);
    } finally {
      setSaving(false);
    }
  };

  const areaLabel = announcement
    ? announcement.building_name || "Всі гуртожитки"
    : null;

  return (
    <Sheet
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen && isSelectOpen.current) return;
        onOpenChange(newOpen);
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {readOnly ? "Оголошення" : announcement ? "Редагувати оголошення" : "Нове оголошення"}
          </SheetTitle>
          <SheetDescription>
            {readOnly
              ? "Інформація про оголошення"
              : "Заповніть поля та опублікуйте оголошення для мешканців"}
          </SheetDescription>
        </SheetHeader>

        {readOnly ? (
          <div className="flex flex-col gap-3 px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{areaLabel}</Badge>
              {announcement?.is_pinned && (
                <Badge>
                  <HugeiconsIcon icon={PinIcon} data-icon="inline-start" strokeWidth={2} />
                  Закріплено
                </Badge>
              )}
              {announcement?.is_expired && (
                <Badge variant="outline" className="text-muted-foreground">Архів</Badge>
              )}
            </div>
            <h3 className="text-base font-bold text-foreground">
              {announcement?.title || "Без назви"}
            </h3>
            <p className="text-xs font-normal text-muted-foreground">
              {formatDate(announcement?.created_at)}
              {announcement?.created_by_name ? ` · ${announcement.created_by_name}` : ""}
            </p>
            <p className="text-sm text-foreground leading-relaxed break-words whitespace-pre-wrap">
              {announcement?.body || "—"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ann-title" className="text-xs font-semibold text-foreground">
                Заголовок
              </Label>
              <Input
                id="ann-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Коротко про що оголошення"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="ann-body" className="text-xs font-semibold text-foreground">
                Текст
              </Label>
              <Textarea
                id="ann-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Повний текст оголошення"
                className="min-h-36 resize-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-foreground">Область</Label>
              <Select
                value={buildingValue}
                onValueChange={setBuildingValue}
                onOpenChange={(o) => {
                  if (o) {
                    isSelectOpen.current = true;
                  } else {
                    setTimeout(() => { isSelectOpen.current = false; }, 150);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GLOBAL}>Всі гуртожитки</SelectItem>
                  {buildings.map((b) => (
                    <SelectItem key={b.building_id} value={String(b.building_id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="ann-pinned"
                checked={isPinned}
                onCheckedChange={(v) => setIsPinned(v === true)}
              />
              <Label htmlFor="ann-pinned" className="text-xs font-semibold text-foreground">
                Закріпити вгорі
              </Label>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-foreground">
                Термін дії (необовʼязково)
              </Label>
              <div className="flex items-center gap-2">
                <DatePicker
                  date={expiresAt}
                  setDate={setExpiresAt}
                  placeholder="Без терміну"
                />
                {expiresAt && (
                  <Button variant="ghost" onClick={() => setExpiresAt(undefined)}>
                    Очистити
                  </Button>
                )}
              </div>
            </div>

            {error && (
              <p className="text-xs leading-relaxed text-destructive font-semibold">{error}</p>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving || !title.trim() || !body.trim()}>
                {announcement ? "Зберегти" : "Опублікувати"}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Скасувати
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default AnnouncementSidePanel;
