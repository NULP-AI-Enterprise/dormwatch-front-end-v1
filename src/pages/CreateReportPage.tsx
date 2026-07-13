import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProblem, fetchUserProfile, fetchCategories, fetchMyComplaintPlaces } from "@/services/problemsApi";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Cancel01Icon, Forward01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import PhotoUploadField from "@/components/PhotoUploadField";
import { PRIORITY_OPTIONS, priorityLabel } from "@/lib/complaintUtils";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import type { CategoryOption, Place } from "@/lib/types";

const CreateReportPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  // The bounded set a resident may file against: their own room + shared rooms
  // in their building. Fetched from /me/complaint-places/; NO inline creation.
  const [allowedPlaces, setAllowedPlaces] = useState<Place[]>([]);
  const [place, setPlace] = useState<Place | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "low",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyComplaintPlaces().then((places) => {
      setAllowedPlaces(places);
    }).catch(() => {});
    fetchUserProfile().then((user) => {
      // Default the selection to the resident's own assigned room, if any.
      if (user?.place?.place_id && user?.place?.place_name) {
        setPlace({
          place_id: user.place.place_id,
          place_name: user.place.place_name,
          capacity: 0,
          isShared: false,
        });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchCategories().then((data) => {
      setCategories(data);
      if (data.length > 0) setSelectedCategory((prev) => prev || data[0].name);
    }).catch(() => {});
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (file: File | null) => {
    if (file) {
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Додайте короткий заголовок — так звернення легше впізнати.");
      return;
    }
    if (!formData.description.trim()) {
      setError("Опишіть, будь ласка, що сталося.");
      return;
    }
    if (!selectedCategory) {
      setError("Оберіть категорію.");
      return;
    }

    setSubmitting(true);
    try {
      await createProblem({
        category: selectedCategory,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        place_id: place?.place_id,
        photoFile: photoFile,
      });
      navigate("/user");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Не вдалося надіслати звернення: ${msg}. Спробуйте ще раз.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-10">
        <Button asChild variant="outline" size="icon">
          <Link to="/user">
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Нове звернення
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-destructive/30 bg-destructive/10 text-destructive text-sm font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="text-xs font-semibold text-foreground block mb-4">Що трапилося?</label>
          <Combobox<string, false>
            items={categories.map((c) => c.name)}
            value={selectedCategory}
            onValueChange={(v) => setSelectedCategory(v ?? "")}
          >
            <ComboboxInput placeholder="Оберіть категорію" className="w-full" />
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
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">Пріоритет</label>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={0}
                value={formData.priority}
                // Radix emits "" when the active item is clicked again; ignore
                // it so a priority stays selected at all times.
                onValueChange={(value) => {
                  if (value) setFormData((prev) => ({ ...prev, priority: value }));
                }}
                className="w-full"
              >
                {PRIORITY_OPTIONS.map((id) => (
                  <ToggleGroupItem
                    key={id}
                    value={id}
                    // DESIGN.md §305/§184: selected tier carries the primary
                    // fill (the "default button" look), not the muted on-state
                    // shadcn ships by default.
                    className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:hover:bg-primary/80"
                  >
                    {priorityLabel(id)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">Заголовок</label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Напр.: тече кран у ванній"
                maxLength={80}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">
                Місце проблеми
              </label>
              {allowedPlaces.length > 0 ? (
                <Combobox<Place, false>
                  items={allowedPlaces}
                  value={place}
                  onValueChange={(p) => setPlace(p)}
                  itemToStringLabel={(p) => p.place_name}
                  isItemEqualToValue={(a, b) => a.place_id === b.place_id}
                >
                  <ComboboxInput placeholder="Оберіть кімнату" className="w-full" />
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
                />
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">Опис проблеми</label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                placeholder="Що саме зламалося, коли почалося, де саме…"
                className="min-h-36 resize-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-3">Фото (необовʼязково, але дуже допомагає)</label>
            {photoFile && previewUrl ? (
              <div className="relative w-full aspect-square border-2 border-border overflow-hidden group">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 bg-card/80 border border-border text-destructive hover:bg-card transition-all"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
                </Button>
              </div>
            ) : (
              <PhotoUploadField
                onFileSelect={handleFileSelect}
                label="Натисніть, щоб додати фото"
                aspectSquare
              />
            )}
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full"
        >
          <HugeiconsIcon icon={Forward01Icon} className="size-4 mr-2" strokeWidth={2} />
          {submitting ? "Надсилаємо…" : "Надіслати звернення"}
        </Button>
      </form>
    </div>
  );
};

export default CreateReportPage;
