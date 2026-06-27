import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProblem, fetchUserProfile } from "../services/problemsApi";
import { ArrowLeft, Camera, Droplets, Zap, Armchair, Wifi, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import LoadingSpinner from "../components/LoadingSpinner";
import { isAdminUser } from "../lib/complaintUtils";

const categories = [
  { id: "plumbing", label: "Сантехніка", Icon: Droplets },
  { id: "electricity", label: "Електрика", Icon: Zap },
  { id: "furniture", label: "Меблі", Icon: Armchair },
  { id: "internet", label: "Інтернет", Icon: Wifi },
];

const CreateReportPage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("plumbing");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "low",
    placeName: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await fetchUserProfile();
        if (user) {
          if (isAdminUser(user)) {
            navigate("/admin");
            return;
          }
          if (user.place && user.place.place_name) {
            setFormData((prev) => ({
              ...prev,
              placeName: user.place.place_name,
            }));
          }
        }
      } catch {
        console.warn("Помилка завантаження профілю");
      } finally {
        setLoadingAuth(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      setError("Вкажи короткий заголовок проблеми.");
      return;
    }
    if (!formData.description.trim()) {
      setError("Опиши проблему.");
      return;
    }

    setSubmitting(true);
    try {
      await createProblem({
        category: selectedCategory,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        place_name: formData.placeName?.trim() || undefined,
        photoFile: photoFile,
      });
      navigate("/");
    } catch (err: any) {
      setError(`Не вдалось створити заявку: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-10">
        <Link
          to="/"
          className="p-2 border border-border hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        </Link>
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
          <label className="micro-label block mb-4">Що трапилось?</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((category) => {
              const isActive = selectedCategory === category.id;
              return (
                <Button
                  key={category.id}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="p-4 h-auto border-2 flex flex-col items-center gap-2 transition-all"
                >
                  <category.Icon
                    className={`w-6 h-6 ${
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                    strokeWidth={2}
                  />
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-widest ${
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {category.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <label className="micro-label block mb-2">Пріоритет</label>
              <div className="flex gap-2">
                {[
                  { id: "low", label: "Низький" },
                  { id: "medium", label: "Середній" },
                  { id: "high", label: "Високий" },
                ].map((p) => (
                  <Button
                    key={p.id}
                    type="button"
                    variant={formData.priority === p.id ? "default" : "outline"}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, priority: p.id }))
                    }
                    className="flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors"
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="micro-label block mb-2">Заголовок</label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Коротко: тече кран..."
                maxLength={80}
                required
              />
            </div>
            <div>
              <label className="micro-label block mb-2">
                Місце проблеми
              </label>
              <Input
                type="text"
                name="placeName"
                value={formData.placeName}
                onChange={handleInputChange}
                placeholder="Напр. кімната 404, коридор 3 поверху..."
                maxLength={100}
              />
            </div>
            <div>
              <label className="micro-label block mb-2">Опис проблеми</label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                placeholder="Деталі..."
                className="min-h-36 resize-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="micro-label block mb-3">Фотодоказ</label>
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
                  <X className="w-4 h-4" strokeWidth={2} />
                </Button>
              </div>
            ) : (
              <label className="w-full aspect-square border-2 border-dashed border-border flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                <Camera
                  className="w-8 h-8 text-muted-foreground mb-3"
                  strokeWidth={2}
                />
                <p className="micro-label">
                  Натисніть, щоб додати фото
                </p>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full font-bold text-sm uppercase tracking-wider"
        >
          {submitting ? "Публікую..." : "Опублікувати звернення"}
        </Button>
      </form>
    </div>
  );
};

export default CreateReportPage;
