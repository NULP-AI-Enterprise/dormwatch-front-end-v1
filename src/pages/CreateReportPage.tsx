import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProblem, fetchUserProfile, fetchMyComplaintPlaces } from "@/services/problemsApi";
import { compressImage } from "@/services/imageUtils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Camera01Icon,
  DropletsIcon,
  BoltIcon,
  ArmchairIcon,
  WifiIcon,
  Cancel01Icon,
  Forward01Icon,
  Settings01Icon,
  DoorIcon,
  FireIcon,
  PaintBrushIcon,
  BulbIcon,
  Key01Icon,
  WindIcon,
  HelpCircleIcon,
  Add01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
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
import type { Place } from "@/lib/types";

// 12 categories divided into 2 pages of 6 categories each
const ALL_CATEGORIES = [
  // Page 1 (6 categories)
  { id: "Сантехніка", label: "Сантехніка", Icon: DropletsIcon },
  { id: "Електрика", label: "Електрика", Icon: BoltIcon },
  { id: "Опалення", label: "Опалення", Icon: FireIcon },
  { id: "Меблі", label: "Меблі", Icon: ArmchairIcon },
  { id: "Вікна та двері", label: "Вікна та двері", Icon: DoorIcon },
  { id: "Побутова техніка", label: "Побутова техніка", Icon: Settings01Icon },
  // Page 2 (6 categories)
  { id: "Інтернет", label: "Інтернет", Icon: WifiIcon },
  { id: "Стіни та ремонт", label: "Стіни та ремонт", Icon: PaintBrushIcon },
  { id: "Освітлення", label: "Освітлення", Icon: BulbIcon },
  { id: "Замки та ключі", label: "Замки та ключі", Icon: Key01Icon },
  { id: "Вентиляція", label: "Вентиляція", Icon: WindIcon },
  { id: "Інше", label: "Інше", Icon: HelpCircleIcon },
];

const priorities = [
  { id: "low", label: "Низький", activeClass: "bg-green-500/10 text-green-500 border-green-500 hover:bg-green-500/15" },
  { id: "medium", label: "Середній", activeClass: "bg-yellow-500/10 text-yellow-500 border-yellow-500 hover:bg-yellow-500/15" },
  { id: "high", label: "Високий", activeClass: "bg-orange-500/10 text-orange-500 border-orange-500 hover:bg-orange-500/15" },
  { id: "critical", label: "Критичний", activeClass: "bg-red-500/20 text-red-500 border-red-500/80 font-bold hover:bg-red-500/30" },
];

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
  const [allowedPlaces, setAllowedPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
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

  const totalPhotosSize = photos.reduce((acc, p) => acc + p.size, 0);

  useEffect(() => {
    fetchMyComplaintPlaces().then((places) => {
      setAllowedPlaces(places);
    }).catch(() => {});

    fetchUserProfile().then((user) => {
      if (user?.place?.place_id && user?.place?.place_name) {
        setSelectedPlace({
          place_id: user.place.place_id,
          place_name: user.place.place_name,
          capacity: 0,
          isShared: false,
        });
      }
    }).catch(() => {});
  }, []);

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

      await createProblem({
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
      navigate("/user");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Не вдалося надіслати звернення: ${msg}. Спробуйте ще раз.`);
    } finally {
      setSubmitting(false);
    }
  };

  const visibleCategories = ALL_CATEGORIES.slice(categoryPage * 6, (categoryPage + 1) * 6);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 relative">
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="outline" size="icon">
          <Link to="/user">
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
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

      {error && (
        <div className="mb-6 p-4 border border-destructive/30 bg-destructive/10 text-destructive text-xs font-bold rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-8 bg-card border border-border p-6 md:p-8 rounded-xl shadow-sm">
        {/* Категорії з пагінацією 6 категорій на сторінці */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Що саме трапилось?
            </label>

            {/* Навігація між списками категорій */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">
                {categoryPage + 1} / 2
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() => setCategoryPage(0)}
                disabled={categoryPage === 0}
                className="size-7 rounded-lg"
                title="Попередні категорії"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" strokeWidth={2.5} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() => setCategoryPage(1)}
                disabled={categoryPage === 1}
                className="size-7 rounded-lg"
                title="Наступні категорії"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" strokeWidth={2.5} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {visibleCategories.map((category) => {
              const isActive = selectedCategory === category.id;
              return (
                <Button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 h-auto flex flex-col items-center gap-2.5 transition-all duration-200 shadow-sm rounded-xl ${
                    isActive
                      ? "bg-blue-500/10 border-2 border-blue-500 text-blue-500 hover:bg-blue-500/15"
                      : "bg-card border border-border text-muted-foreground hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-blue-400"
                  }`}
                >
                  <HugeiconsIcon
                    icon={category.Icon}
                    className={`size-6 ${
                      isActive ? "text-blue-500" : "text-muted-foreground"
                    }`}
                    strokeWidth={2}
                  />
                  <span className="text-xs font-semibold text-center">
                    {category.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-5">
            {/* Рівень пріоритету */}
            <div>
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-3">
                Рівень пріоритету
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {priorities.map((p) => {
                  const isActive = formData.priority === p.id;
                  return (
                    <Button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, priority: p.id }))
                      }
                      className={`py-2 px-3 text-xs font-semibold transition-all duration-150 rounded-lg border-2 ${
                        isActive
                          ? p.activeClass
                          : "bg-card border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      {p.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Короткий заголовок */}
            <div>
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-2">
                Короткий заголовок
              </label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Наприклад: Зламався змішувач, протікає батарея..."
                maxLength={80}
                required
                className="h-10 rounded-lg text-xs"
              />
            </div>

            {/* Де саме проблема */}
            <div>
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-2">
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
                  <ComboboxInput placeholder="Оберіть кімнату..." className="w-full h-10 rounded-lg text-xs" />
                  <ComboboxContent>
                    <ComboboxEmpty>Кімнат не знайдено</ComboboxEmpty>
                    <ComboboxList>
                      {(p: Place) => (
                        <ComboboxItem key={p.place_id} value={p}>
                          {p.place_name}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              ) : (
                <Input
                  type="text"
                  value=""
                  disabled
                  placeholder="Немає доступних кімнат — вкажіть гуртожиток у профілі"
                  className="h-10 rounded-lg text-xs"
                />
              )}

              {selectedPlace && !selectedPlace.isShared && /^\d+[a-zA-Zа-яА-ЯіїёІЇЄє]?$/.test(selectedPlace.place_name.trim()) && (
                <div className="flex items-center gap-2 mt-3 p-2.5 bg-muted/40 border border-border rounded-lg">
                  <input
                    type="checkbox"
                    id="isBlockShared"
                    checked={isBlockShared}
                    onChange={(e) => setIsBlockShared(e.target.checked)}
                    className="rounded border-border bg-card text-primary focus:ring-primary size-4"
                  />
                  <label htmlFor="isBlockShared" className="text-xs font-medium text-foreground cursor-pointer select-none">
                    Це проблема спільного блоку
                  </label>
                </div>
              )}
            </div>

            {/* Детальний опис проблеми */}
            <div>
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-2">
                Детальний опис проблеми
              </label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Будь ласка, вкажіть деталі: що сталось, коли помітили, чи потрібна присутність у кімнаті..."
                className="min-h-28 resize-none rounded-lg text-xs"
                required
              />
            </div>
          </div>

          {/* Фотодоказ: до 6 фото, стиснення, макс 10МБ */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Фотодоказ (до {MAX_PHOTOS} фото)
              </label>
              <span className="text-[11px] font-medium text-muted-foreground">
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
                      className="relative aspect-square border border-border rounded-lg overflow-hidden group shadow-sm bg-muted/20"
                    >
                      <img
                        src={p.previewUrl}
                        alt="Photo"
                        onClick={() => setPreviewZoomUrl(p.previewUrl)}
                        className="w-full h-full object-cover cursor-zoom-in group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded backdrop-blur-xs">
                        {formatBytes(p.size)}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemovePhoto(p.id)}
                        className="absolute top-1 right-1 size-5 bg-card/90 border border-border text-destructive hover:bg-card hover:scale-110 transition-all shadow-sm rounded-full"
                        title="Видалити фото"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} className="size-3" strokeWidth={2.5} />
                      </Button>
                    </div>
                  ))}

                  {photos.length < MAX_PHOTOS && (
                    <label className="aspect-square border-2 border-dashed border-border flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all rounded-lg group">
                      <HugeiconsIcon
                        icon={Add01Icon}
                        className="size-6 text-muted-foreground group-hover:text-blue-500 transition-colors"
                        strokeWidth={2}
                      />
                      <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-blue-500 mt-1">
                        Додати ще
                      </span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        multiple
                        className="hidden"
                        onChange={handleFilesSelect}
                        disabled={compressing}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Зона первинного завантаження коли немає фото */}
              {photos.length === 0 && (
                <label className="w-full aspect-[3/2] md:aspect-square border-2 border-dashed border-border flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-200 rounded-xl shadow-sm flex-1 min-h-[200px] group">
                  <HugeiconsIcon
                    icon={Camera01Icon}
                    className="size-10 mb-3 text-muted-foreground group-hover:scale-110 group-hover:text-blue-500 transition-all duration-200"
                    strokeWidth={2}
                  />
                  <p className="text-xs font-bold text-foreground mb-1">
                    {compressing ? "Стискаємо фотографії..." : "Натисніть для завантаження фото"}
                  </p>
                  <p className="text-[10px] text-muted-foreground max-w-xs leading-normal">
                    Можна обрати до 6 фото (PNG, JPEG, WEBP). Фото оптимізуються автоматично, сумарний об'єм до 10 МБ.
                  </p>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    multiple
                    className="hidden"
                    onChange={handleFilesSelect}
                    disabled={compressing}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={submitting || compressing}
          className="w-full h-12 text-sm font-bold shadow-md rounded-xl bg-blue-500 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
        >
          <HugeiconsIcon icon={Forward01Icon} className="size-5" strokeWidth={2.5} />
          {submitting ? "Надсилаємо заявку..." : "Опублікувати звернення"}
        </Button>
      </form>

      {/* Модальне вікно перегляду фото */}
      <Dialog open={!!previewZoomUrl} onOpenChange={(open) => !open && setPreviewZoomUrl(null)}>
        <DialogContent className="max-w-[90vw] bg-transparent border-none shadow-none p-0 flex justify-center items-center" showCloseButton={false}>
          <DialogTitle className="sr-only">Перегляд фото</DialogTitle>
          {previewZoomUrl && (
            <img
              src={previewZoomUrl}
              className="w-full h-auto max-h-[90vh] object-contain rounded-xl"
              alt="Full size preview"
            />
          )}
          <DialogClose className="absolute top-4 right-4 text-foreground hover:text-stone-300">
            <HugeiconsIcon icon={Cancel01Icon} className="size-6" strokeWidth={2} />
          </DialogClose>
        </DialogContent>
      </Dialog>

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
