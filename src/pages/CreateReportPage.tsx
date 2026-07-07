import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProblem, fetchUserProfile, fetchCategories } from "@/services/problemsApi";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Cancel01Icon, Forward01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PhotoUploadField from "@/components/PhotoUploadField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryOption } from "@/lib/types";

const CreateReportPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
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

  useEffect(() => {
    fetchUserProfile().then((user) => {
      if (user?.place?.place_name) {
        setFormData((prev) => ({ ...prev, placeName: user.place.place_name }));
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
      setError("Вкажи короткий заголовок проблеми.");
      return;
    }
    if (!formData.description.trim()) {
      setError("Опиши проблему.");
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-10">
        <Link
          to="/"
          className="p-2 border border-border hover:border-primary hover:bg-primary/5 transition-colors"
        >
                  <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
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
          <label className="text-xs font-semibold text-foreground block mb-4">Що трапилось?</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Оберіть категорію" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.category_id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">Пріоритет</label>
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
                    className="flex-1 py-2 text-xs transition-colors"
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">Заголовок</label>
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
              <label className="text-xs font-semibold text-foreground block mb-2">
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
              <label className="text-xs font-semibold text-foreground block mb-2">Опис проблеми</label>
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
            <label className="text-xs font-semibold text-foreground block mb-3">Фотодоказ</label>
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
          {submitting ? "Публікую..." : "Опублікувати звернення"}
        </Button>
      </form>
    </div>
  );
};

export default CreateReportPage;
