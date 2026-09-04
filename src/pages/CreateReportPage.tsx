import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProblem, fetchUserProfile, fetchCategories, fetchMyComplaintPlaces, fetchSimilarComplaints, upvoteComplaint } from "@/services/problemsApi";
import PlaceCombobox from "@/components/PlaceCombobox";
import ComplaintCard from "@/components/ComplaintCard";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Cancel01Icon, Forward01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PhotoUploadField from "@/components/PhotoUploadField";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import type { CategoryOption, Place, Complaint } from "@/lib/types";

const CreateReportPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  // Category starts empty (no silent first-API pick) — the filer decides.
  const [selectedCategory, setSelectedCategory] = useState("");
  // Own room + shared areas in the building — the constrained selector shown
  // when the resident has a room. Empty when they fall back to the building
  // picker (no own room) or when no location is possible at all.
  const [allowedPlaces, setAllowedPlaces] = useState<Place[]>([]);
  const [place, setPlace] = useState<Place | null>(null);
  // Drives the building picker for residents with no own room.
  const [profileBuildingId, setProfileBuildingId] = useState<number | null>(null);
  // 'constrained' = own room + shared; 'picker' = building picker; 'none' = none.
  const [selectorMode, setSelectorMode] = useState<"constrained" | "picker" | "none">("none");
  const [placeResolved, setPlaceResolved] = useState(false);
  // No priority on the create form — triage owns urgency (step19, resolved call #16).
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [similarComplaints, setSimilarComplaints] = useState<Complaint[]>([]);
  const [isSearchingSimilar, setIsSearchingSimilar] = useState(false);
  const [upvotingId, setUpvotingId] = useState<number | null>(null);

  // Debounced search for similar complaints
  useEffect(() => {
    const text = (formData.title + " " + formData.description).trim();
    if (text.length < 10) {
      setSimilarComplaints([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearchingSimilar(true);
      fetchSimilarComplaints(
        text,
        categories.find(c => c.name === selectedCategory)?.category_id || null,
        profileBuildingId
      )
        .then((data) => setSimilarComplaints(data))
        .catch(() => setSimilarComplaints([]))
        .finally(() => setIsSearchingSimilar(false));
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.title, formData.description, selectedCategory, profileBuildingId, categories]);

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

  useEffect(() => {
    Promise.all([fetchMyComplaintPlaces(), fetchUserProfile()])
      .then(([places, user]) => {
        const ownRoomId = user?.place?.place_id ?? null;
        const buildingId =
          user?.building?.building_id ?? user?.place?.building?.building_id ?? null;
        setProfileBuildingId(buildingId);
        if (ownRoomId) {
          // Has a room: the constrained selector (own + shared areas), own room
          // preselected. A hallway flood is filed by picking the shared area —
          // the default is never silently submitted.
          setAllowedPlaces(places);
          setPlace(places.find((p) => p.place_id === ownRoomId) ?? null);
          setSelectorMode("constrained");
        } else if (buildingId != null) {
          // No own room: fall back to the building picker, which owns its own
          // list (all places in the building, shared areas included).
          setAllowedPlaces([]);
          setPlace(null);
          setSelectorMode("picker");
        } else {
          // No room and no building: no location possible.
          setSelectorMode("none");
        }
        setPlaceResolved(true);
      })
      .catch(() => {
        setPlaceResolved(true);
      });
  }, []);

  useEffect(() => {
    fetchCategories().then((data) => {
      setCategories(data);
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
    if (!place) {
      setError("Оберіть місце проблеми — кімнату або спільну зону.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createProblem({
        category: selectedCategory,
        title: formData.title.trim(),
        description: formData.description.trim(),
        place_id: place.place_id,
        photoFile: photoFile,
      });
      toast.success(`Звернення №${created.id} створено`);
      navigate(`/user`, { state: { openComplaintId: created.id } });
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
        {/* Lead with what the user is reporting — title + description — then the
            classification (category) and where it happened. No silent pre-fills,
            no priority on the filer's plate: triage owns urgency (resolved call #16). */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-5">
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
            <div>
              <label className="text-xs font-semibold text-foreground block mb-4">Категорія</label>
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
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">
                Місце проблеми
              </label>
              {!placeResolved ? (
                <Input type="text" value="" disabled placeholder="Завантаження місць…" />
              ) : selectorMode === "constrained" ? (
                <Combobox<Place, false>
                  items={allowedPlaces}
                  value={place}
                  onValueChange={(p) => setPlace(p)}
                  itemToStringLabel={(p) => p.place_name}
                  isItemEqualToValue={(a, b) => a.place_id === b.place_id}
                >
                  <ComboboxInput placeholder="Оберіть кімнату або спільну зону" className="w-full" />
                  <ComboboxContent>
                    <ComboboxEmpty>Місць не знайдено</ComboboxEmpty>
                    <ComboboxList>
                      {(p: Place) => (
                        <ComboboxItem key={p.place_id} value={p}>
                          {p.place_name}
                          {p.isShared && (
                            <span className="ml-1 text-muted-foreground">(спільна)</span>
                          )}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              ) : selectorMode === "picker" ? (
                <PlaceCombobox
                  buildingId={profileBuildingId ?? undefined}
                  value={place}
                  onChange={(p) => setPlace(p)}
                  placeholder="Оберіть кімнату або спільну зону"
                />
              ) : (
                <p className="text-xs text-muted-foreground pt-1">
                  Щоб подати звернення, додайте гуртожиток у профілі.
                </p>
              )}
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
                  className="absolute top-2 right-2 bg-card border border-border text-destructive hover:bg-card transition-all"
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

        {similarComplaints.length > 0 && (
          <div className="bg-muted/30 border border-border p-5 rounded-lg space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                Знайдено схожі відкриті проблеми
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Можливо, хтось уже повідомив про це? Приєднайтесь до звернення, щоб підвищити його пріоритет та отримувати сповіщення, замість створення нового.
              </p>
            </div>
            
            <div className="grid gap-3">
              {similarComplaints.map(sc => (
                <div key={sc.id} className="relative">
                  <ComplaintCard complaint={sc} variant="compact" showPriority />
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpvote(sc.id)}
                      disabled={upvotingId === sc.id || submitting}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {upvotingId === sc.id ? "Приєднуємось..." : "👍 У мене така ж проблема"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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