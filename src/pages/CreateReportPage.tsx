import PhotoUploadField from "@/components/PhotoUploadField";
import { PhotoAttachment } from "@/components/PhotoAttachment";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Checkbox } from "@/components/ui/checkbox";
import { PRIORITY_OPTIONS, priorityLabel } from "@/lib/complaintUtils";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createProblem,
  fetchUserProfile,
  fetchMyComplaintPlaces,
  fetchSimilarComplaints,
  upvoteComplaint,
} from "@/services/problemsApi";
import { compressImage } from "@/services/imageUtils";
import PlaceCombobox from "@/components/PlaceCombobox";
import ComplaintCard from "@/components/ComplaintCard";
import { toast } from "sonner";
import {
  Droplets,
  Zap,
  Flame,
  Armchair,
  DoorClosed,
  Wrench,
  Wifi,
  Paintbrush,
  Lightbulb,
  Key,
  Wind,
  HelpCircle,
  ChevronLeft,
  ArrowLeft,
  ArrowRight,
  Camera,
  X,
  Plus,
  Send,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ImagePreviewDialog from "@/components/ImagePreviewDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import type { Place, Complaint } from "@/lib/types";

// 12 категорій, розбиті на 2 сторінки по 6 категорій
const ALL_CATEGORIES = [
  // Сторінка 1 (6 категорій)
  { id: "Сантехніка", label: "Сантехніка", Icon: Droplets },
  { id: "Електрика", label: "Електрика", Icon: Zap },
  { id: "Опалення", label: "Опалення", Icon: Flame },
  { id: "Меблі", label: "Меблі", Icon: Armchair },
  { id: "Вікна та двері", label: "Вікна та двері", Icon: DoorClosed },
  { id: "Побутова техніка", label: "Побутова техніка", Icon: Wrench },
  // Сторінка 2 (6 категорій)
  { id: "Інтернет", label: "Інтернет", Icon: Wifi },
  { id: "Стіни та ремонт", label: "Стіни та ремонт", Icon: Paintbrush },
  { id: "Освітлення", label: "Освітлення", Icon: Lightbulb },
  { id: "Замки та ключі", label: "Замки та ключі", Icon: Key },
  { id: "Вентиляція", label: "Вентиляція", Icon: Wind },
  { id: "Інше", label: "Інше", Icon: HelpCircle },
];

const priorities = PRIORITY_OPTIONS.map((id) => ({ id, label: priorityLabel(id) }));

const MAX_PHOTOS = 6;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10 MB

interface PhotoItem {
  id: string;
  file: File;
  previewUrl: string;
  size: number;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 КБ";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

const CreateReportPage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("Сантехніка");
  const [categoryPage, setCategoryPage] = useState(0); // 0 or 1
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState("");
  const [locationReload, setLocationReload] = useState(0);
  const [allowedPlaces, setAllowedPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [profileBuildingId, setProfileBuildingId] = useState<number | null>(null);
  const [isBlockShared, setIsBlockShared] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "low",
  });

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [previewZoomUrl, setPreviewZoomUrl] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Схожі відкриті звернення (ШІ)
  const [similarComplaints, setSimilarComplaints] = useState<Complaint[]>([]);
  const [upvotingId, setUpvotingId] = useState<number | null>(null);

  const totalPhotosSize = photos.reduce((acc, p) => acc + p.size, 0);

  useEffect(() => {
    let active = true;
    setLocationLoading(true); setLocationError("");
    Promise.all([fetchMyComplaintPlaces(), fetchUserProfile()]).then(([places, user]) => {
      if (!active) return;
      if (!user) throw new Error("Профіль недоступний");
      setAllowedPlaces(places);
      setProfileBuildingId(user.building?.building_id ?? user.place?.building?.building_id ?? null);
      setSelectedPlace((previous) => previous || places.find((place: Place) => place.place_id === user.place?.place_id) || null);
    }).catch(() => {
      if (active) setLocationError("Не вдалося завантажити доступні місця звернення.");
    }).finally(() => { if (active) setLocationLoading(false); });
    return () => { active = false; };
  }, [locationReload]);

  // Пошук схожих звернень у реальному часі
  useEffect(() => {
    const text = (formData.title + " " + formData.description).trim();
    // Оптимальний критерій: щонайменше одне змістовне слово (>= 3 символів) та довжина тексту >= 4
    const words = text.split(/\s+/).filter((w) => w.length >= 3);
    if (words.length === 0 || text.length < 4) {
      setSimilarComplaints([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchSimilarComplaints(
        text,
        null,
        profileBuildingId,
        selectedPlace?.place_id || null
      )
        .then((data) => setSimilarComplaints(data))
        .catch(() => setSimilarComplaints([]));
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.title, formData.description, selectedCategory, profileBuildingId, selectedPlace?.place_id]);

  const handleUpvote = async (complaintId: number) => {
    setUpvotingId(complaintId);
    try {
      await upvoteComplaint(complaintId);
      toast.success("Ви приєдналися до існуючого звернення");
      navigate(`/user`, { state: { openComplaintId: complaintId } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Помилка: ${msg}`);
    } finally {
      setUpvotingId(null);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const rawFiles = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (rawFiles.length === 0) return;

    if (photos.length + rawFiles.length > MAX_PHOTOS) {
      setError(`Максимально можна завантажити ${MAX_PHOTOS} фото (ви обрали ${rawFiles.length}, вже завантажено ${photos.length}).`);
      e.target.value = "";
      return;
    }

    setCompressing(true);
    setError("");

    try {
      const newItems: PhotoItem[] = [];
      let runningSize = totalPhotosSize;

      for (const file of rawFiles) {
        const compressed = await compressImage(file, 1920, 0.82);
        if (runningSize + compressed.size > MAX_TOTAL_BYTES) {
          setError("Сумарний об'єм доданих фото перевищує 10 МБ. Будь ласка, оберіть менше зображень.");
          break;
        }
        runningSize += compressed.size;
        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          file: compressed,
          previewUrl: URL.createObjectURL(compressed),
          size: compressed.size,
        });
      }

      setPhotos((prev) => [...prev, ...newItems]);
    } catch {
      setError("Помилка обробки фото.");
    } finally {
      setCompressing(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Вкажіть короткий заголовок проблеми.");
      return;
    }
    if (!formData.description.trim()) {
      setError("Опишіть проблему.");
      return;
    }
    if (!selectedCategory) {
      setError("Оберіть категорію.");
      return;
    }
    if (totalPhotosSize > MAX_TOTAL_BYTES) {
      setError("Сумарний розмір фотографій не повинен перевищувати 10 МБ.");
      return;
    }

    setIsConfirmOpen(true);
  };

  const executeSubmit = async () => {
    setIsConfirmOpen(false);
    setSubmitting(true);
    try {
      const descriptionToSubmit = isBlockShared
        ? `${formData.description.trim()}\n\n[Блок]`
        : formData.description.trim();

      const created = await createProblem({
        category: selectedCategory,
        title: formData.title.trim(),
        description: descriptionToSubmit,
        priority: formData.priority,
        place_id: selectedPlace?.place_id,
        photoFiles: photos.map((p) => p.file),
      });

      sessionStorage.setItem(
        "studentReportSuccess",
        "Ваше звернення успішно створено. Адміністрація вже отримала його для обробки."
      );
      toast.success("Ваше звернення успішно створено!");
      navigate("/user", { state: { openComplaintId: created?.id } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Не вдалося надіслати звернення: ${msg}. Спробуйте ще раз.`);
    } finally {
      setSubmitting(false);
    }
  };

  const visibleCategories = ALL_CATEGORIES.slice(categoryPage * 6, (categoryPage + 1) * 6);

  return (
    <div className="w-full min-w-0 max-w-3xl mx-auto px-4 py-8 relative">
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="outline" size="icon">
          <Link to="/user" aria-label="Повернутися на головну">
            <ChevronLeft className="size-4" strokeWidth={2} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Нове звернення
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Повідомте про проблему, і ми вирішимо її найближчим часом
          </p>
        </div>
      </div>

      {locationLoading && <p role="status" className="mb-4 text-sm text-muted-foreground">Завантаження доступних місць…</p>}
      {locationError && <div role="alert" className="mb-4 space-y-2">
        <p className="text-sm text-destructive">{locationError}</p>
        <Button type="button" variant="outline" onClick={() => setLocationReload((value) => value + 1)}>Спробувати ще раз</Button>
      </div>}
      {error && (
        <div className="mb-6 p-4 border border-destructive/30 bg-destructive/10 text-destructive text-xs font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="min-w-0 space-y-8 bg-card border border-border p-4 sm:p-6 md:p-8 shadow-sm">
        {/* Категорії з пагінацією 6 категорій на сторінці */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-xs font-bold text-foreground ">
              Що саме трапилось?
            </label>

            {/* Навігація між списками категорій */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {categoryPage + 1} / 2
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() => setCategoryPage(0)}
                disabled={categoryPage === 0}
                className="size-7"
                title="Попередні категорії"
              >
                <ArrowLeft className="size-3.5" strokeWidth={2.5} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() => setCategoryPage(1)}
                disabled={categoryPage === 1}
                className="size-7"
                title="Наступні категорії"
              >
                <ArrowRight className="size-3.5" strokeWidth={2.5} />
              </Button>
            </div>
          </div>

          <ToggleGroup type="single" value={selectedCategory} onValueChange={(value) => { if (value) setSelectedCategory(value); }}
            aria-label="Категорія звернення" variant="outline" className="grid w-full grid-cols-2 md:grid-cols-3 gap-3">
            {visibleCategories.map((category) => {
              const IconComponent = category.Icon;
              return (
                <ToggleGroupItem key={category.id} value={category.id}
                  className="min-w-0 h-auto p-3 flex-col gap-2 whitespace-normal">
                  <IconComponent className="size-6" strokeWidth={2} />
                  <span>{category.label}</span>
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 gap-6 [&>*]:min-w-0">
          <div className="space-y-5">
            {/* Рівень пріоритету */}
            <div>
              <label className="text-xs font-bold text-foreground  block mb-3">
                Рівень пріоритету
              </label>
              <ToggleGroup type="single" value={formData.priority}
                onValueChange={(value) => { if (value) setFormData((prev) => ({ ...prev, priority: value })); }}
                aria-label="Рівень пріоритету" variant="outline" className="grid w-full grid-cols-2 gap-2">
                {priorities.map((priority) => <ToggleGroupItem key={priority.id} value={priority.id} className="min-w-0">{priority.label}</ToggleGroupItem>)}
              </ToggleGroup>
            </div>

            {/* Короткий заголовок */}
            <div>
              <label htmlFor="report-title" className="text-xs font-semibold block mb-2">
                Короткий заголовок
              </label>
              <Input
                type="text"
                id="report-title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Наприклад: Зламався змішувач, протікає батарея..."
                maxLength={80}
                required
                className="h-10 text-xs"
              />
            </div>

            {/* Де саме проблема */}
            <div>
              <label htmlFor="report-place" className="text-xs font-semibold block mb-2">
                Де саме проблема?
              </label>
              {allowedPlaces.length > 0 ? (
                <Combobox<Place, false>
                  items={allowedPlaces}
                  value={selectedPlace}
                  onValueChange={(p) => {
                    setSelectedPlace(p);
                    if (!p || p.isShared || !/^\d+[a-zA-Zа-яА-ЯіїёІЇЄє]?$/.test(p.place_name.trim())) {
                      setIsBlockShared(false);
                    }
                  }}
                  itemToStringLabel={(p) => p.place_name}
                  isItemEqualToValue={(a, b) => a.place_id === b.place_id}
                >
                  <ComboboxInput id="report-place" placeholder="Оберіть кімнату або зону..." className="w-full h-10 text-xs" />
                  <ComboboxContent>
                    <ComboboxEmpty>Місць не знайдено</ComboboxEmpty>
                    <ComboboxList>
                      {(p: Place) => (
                        <ComboboxItem key={p.place_id} value={p}>
                          {p.place_name}
                          {p.isShared && (
                            <span className="ml-1 text-muted-foreground text-xs">(спільна)</span>
                          )}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              ) : profileBuildingId ? (
                <PlaceCombobox
                  id="report-place"
                  buildingId={profileBuildingId}
                  value={selectedPlace}
                  onChange={(p) => {
                    setSelectedPlace(p);
                    if (!p || p.isShared || !/^\d+[a-zA-Zа-яА-ЯіїёІЇЄє]?$/.test(p.place_name.trim())) {
                      setIsBlockShared(false);
                    }
                  }}
                  placeholder="Оберіть кімнату або спільну зону"
                />
              ) : (
                <Input
                  type="text"
                  value=""
                  disabled
                  placeholder="Немає доступних кімнат — вкажіть гуртожиток у профілі"
                  className="h-10 text-xs"
                />
              )}

              {selectedPlace && !selectedPlace.isShared && /^\d+[a-zA-Zа-яА-ЯіїёІЇЄє]?$/.test(selectedPlace.place_name.trim()) && (
                <div className="flex items-center gap-2 mt-3 p-2.5 bg-muted/40 border border-border">
                  <Checkbox
                    id="isBlockShared"
                    checked={isBlockShared}
                    onCheckedChange={(checked) => setIsBlockShared(checked === true)}
                    className="rounded-none border-border bg-card text-link focus:ring-primary size-4"
                  />
                  <label htmlFor="isBlockShared" className="text-xs font-medium text-foreground cursor-pointer select-none">
                    Це проблема спільного блоку
                  </label>
                </div>
              )}
            </div>

            {/* Детальний опис проблеми */}
            <div>
              <label htmlFor="report-description" className="text-xs font-semibold block mb-2">
                Детальний опис проблеми
              </label>
              <Textarea
                id="report-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Будь ласка, вкажіть деталі: що сталось, коли помітили, чи потрібна присутність у кімнаті..."
                className="min-h-28 resize-none text-xs"
                required
              />
            </div>
          </div>

          {/* Фотодоказ: до 6 фото, стиснення, макс 10МБ */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <label className="text-xs font-bold text-foreground ">
                Фотодоказ (до {MAX_PHOTOS} фото)
              </label>
              <span className="text-xs font-medium text-muted-foreground">
                {photos.length}/{MAX_PHOTOS} • {formatBytes(totalPhotosSize)}/10 МБ
              </span>
            </div>

            <div className="space-y-3 flex-1 flex flex-col">
              {/* Сітка завантажених фото */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2.5">
                  {photos.map((p) => (
                    <div
                      key={p.id}
                      className="relative aspect-square border border-border overflow-hidden group shadow-sm bg-muted/20"
                    >
                      <PhotoAttachment className="size-full" onClick={() => setPreviewZoomUrl(p.previewUrl)} aria-label={"Збільшити фото: " + p.file.name}>
                      <img
                        src={p.previewUrl}
                        alt="Фото звернення"
                        className="w-full h-full object-cover"
                      />
                      </PhotoAttachment>
                      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 py-0.5 backdrop-blur-xs">
                        {formatBytes(p.size)}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemovePhoto(p.id)}
                        className="absolute top-1 right-1 size-6 bg-card/90 border border-border text-destructive hover:bg-card hover:scale-110 transition-all shadow-sm"
                        title="Видалити фото"
                      >
                        <X className="size-3" strokeWidth={2.5} />
                      </Button>
                    </div>
                  ))}

                  {photos.length < MAX_PHOTOS && (
                    <PhotoUploadField label="Додати ще фото" multiple disabled={compressing} onChange={handleFilesSelect} className="aspect-square p-2">
                      <Plus className="size-6" /><span className="text-xs">Додати ще</span>
                    </PhotoUploadField>
                  )}
                </div>
              )}

              {/* Зона первинного завантаження коли немає фото */}
              {photos.length === 0 && (
                <PhotoUploadField label="Завантажити фото звернення" multiple disabled={compressing} onChange={handleFilesSelect} className="min-h-52 flex-1">
                  <Camera className="size-10 text-muted-foreground" />
                  <span className="text-xs font-semibold">{compressing ? "Стискаємо фотографії…" : "Обрати фото"}</span>
                  <span className="text-xs text-muted-foreground">До 6 фото PNG, JPEG або WEBP. Фото оптимізуються автоматично, загальний розмір — до 10 МБ.</span>
                </PhotoUploadField>
              )}
            </div>
          </div>
        </div>

        {/* Секція ШІ-пошуку дублікатів */}
        {similarComplaints.length > 0 && (
          <div className="bg-muted/30 border border-border p-5 space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Знайдено схожі відкриті проблеми
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Можливо, хтось уже повідомив про це? Приєднайтесь до звернення, щоб підвищити його пріоритет та отримувати сповіщення, замість створення нового.
              </p>
            </div>
            
            <div className="grid gap-3">
              {similarComplaints.map((sc) => (
                <div key={sc.id} className="relative">
                  <ComplaintCard complaint={sc} variant="compact" showPriority />
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleUpvote(sc.id)}
                      disabled={upvotingId === sc.id || submitting}
                      className="gap-1.5"
                    >
                      {upvotingId === sc.id ? (
                        "Приєднуємось..."
                      ) : (
                        <>
                          <ThumbsUp className="size-3.5" strokeWidth={2} />
                          У мене така ж проблема
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          type="submit"
          size="touch"
          disabled={submitting || compressing || locationLoading || !!locationError}
          className="w-full"
        >
          <Send className="size-4" strokeWidth={2.5} />
          {submitting ? "Надсилаємо заявку..." : "Опублікувати звернення"}
        </Button>
      </form>

      {/* Модальне вікно перегляду фото */}
      <ImagePreviewDialog
        imageUrl={previewZoomUrl}
        onClose={() => setPreviewZoomUrl(null)}
      />

      {/* Діалог підтвердження */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Створити звернення?</AlertDialogTitle>
            <AlertDialogDescription>
              Ваше звернення буде надіслано адміністрації для обробки. Перевірте, чи всі дані вказано правильно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={executeSubmit}>
              Створити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreateReportPage;