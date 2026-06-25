import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProblem, fetchUserProfile } from "../services/problemsApi";

const CreateReportPage = () => {
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState("plumbing");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "low",
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // Стейт для прев'ю
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Перевірка авторизації
useEffect(() => {
    async function checkAuth() {
      try {
        await fetchUserProfile();
      } catch (e) {
         console.warn("Помилка завантаження профілю", e);
      } finally {
        setLoadingAuth(false);
      }
    }
    checkAuth();
  }, []);

  const categories = useMemo(
    () => [
      { id: "plumbing", emoji: "🚿", name: "Сантехніка" },
      { id: "electricity", emoji: "💡", name: "Електрика" },
      { id: "furniture", emoji: "🪑", name: "Меблі" },
      { id: "internet", emoji: "🌐", name: "Інтернет" },
    ],
    []
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const handleFileChange = (e) => {
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

  const handleSubmit = async (e) => {
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
        photoFile: photoFile, 
      });

      navigate("/"); // Або /dashboard
    } catch (err) {
      console.error(err);
      setError(`Не вдалось створити заявку: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAuth) return <div className="p-10 text-center font-bold text-indigo-600">Перевірка доступу...</div>;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 lg:mb-10">
          <Link
            to="/"
            className="p-2 sm:p-3 bg-slate-100 rounded-xl sm:rounded-2xl hover:bg-slate-200 transition-colors"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Нове звернення
          </h2>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 lg:space-y-10">
          {/* Category Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-3 sm:mb-4 uppercase tracking-wider">
              Що трапилось?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-3 sm:p-4 border-2 rounded-xl sm:rounded-2xl text-center transition-all ${
                    selectedCategory === category.id
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-100 hover:border-indigo-100"
                  }`}
                >
                  <span className="text-xl sm:text-2xl block mb-1 sm:mb-2">{category.emoji}</span>
                  <span className="text-[10px] sm:text-xs font-bold">{category.name}</span>
                </button>
              ))}
            </div>
          </div>



          {/* Title & Description */}
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">
                  Пріоритет
                </label>
                <div className="flex gap-2">
                  {[
                    { id: "low", label: "Низький", color: "bg-green-100 text-green-700 hover:bg-green-200 border-green-200", activeColor: "bg-green-500 text-white border-green-500 shadow-md shadow-green-200" },
                    { id: "medium", label: "Середній", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200", activeColor: "bg-yellow-500 text-white border-yellow-500 shadow-md shadow-yellow-200" },
                    { id: "high", label: "Високий", color: "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200", activeColor: "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200" },
                    { id: "critical", label: "Критичний", color: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200", activeColor: "bg-red-500 text-white border-red-500 shadow-md shadow-red-200" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, priority: p.id }))}
                      className={`flex-1 py-2 sm:py-3 rounded-xl border text-[10px] sm:text-xs font-bold transition-all ${
                        formData.priority === p.id ? p.activeColor : p.color
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">
                  Заголовок
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Коротко: тече кран..."
                  maxLength={80}
                  className="w-full p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-2 sm:mb-3 uppercase tracking-wider">
                  Опис проблеми
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={8}
                  placeholder="Деталі..."
                  className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl sm:rounded-[2rem] text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  required
                />
              </div>
            </div>

            {/* Photo Upload with Preview */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-2 sm:mb-3 uppercase tracking-wider">
                Фотодоказ
              </label>
              
              {photoFile && previewUrl ? (
                // Показуємо прев'ю, якщо файл обрано
                <div className="relative w-full aspect-square rounded-2xl sm:rounded-[2rem] border-2 border-slate-200 overflow-hidden group">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  {/* Кнопка видалення */}
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 bg-white/80 p-2 rounded-full text-red-500 hover:bg-white transition-all shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                // Показуємо інпут, якщо файлу немає
                <label className="w-full aspect-square rounded-2xl sm:rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 sm:p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                  <span className="text-3xl mb-2">📷</span>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 leading-tight">
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

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] text-sm sm:text-base font-black shadow-xl transition-all ${
              submitting
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {submitting ? "Публікую..." : "Опублікувати звернення"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateReportPage;