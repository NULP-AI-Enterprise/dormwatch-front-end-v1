import { useEffect, useState } from "react";
import {
  fetchUserProfile,
  loginUser,
  registerUser,
  logoutUser,
  updateUserProfile,
  changeUserRoom,
  fetchBuildings,
  fetchPlaces,
} from "../services/problemsApi";
import UserPage from "./UserPage";
import Preloader from "../components/Preloader";

const SERVER_URL = "http://127.0.0.1:8000";

const EMAIL_DOMAIN_HINT = "@lpnu.ua";

const AccountPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    building: "4",
    floor: "",
    room: "",
  });

  const [activeTab, setActiveTab] = useState("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [regForm, setRegForm] = useState({
    email: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    building_id: "",
    place_id: "",
  });
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [buildings, setBuildings] = useState([]);
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!user) {
      fetchBuildings()
        .then(setBuildings)
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (regForm.building_id) {
      fetchPlaces(regForm.building_id)
        .then(setPlaces)
        .catch(() => setPlaces([]));
    } else {
      setPlaces([]);
    }
  }, [regForm.building_id]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await fetchUserProfile();
      setUser(data);

      if (data) {
        const placeObj = data.place;
        const buildingObj = placeObj?.building;

        setEditForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          building: buildingObj?.name || buildingObj?.building_id
            ? String(buildingObj?.name || buildingObj?.building_id)
            : "",
          floor: "",
          room: placeObj?.place_name || "",
        });
      }
    } catch (e) {
      console.log("Not logged in");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      await loginUser(loginEmail, loginPassword);
      await loadProfile();
      setLoginEmail("");
      setLoginPassword("");
    } catch (err) {
      setLoginError(err.message || "Невірний email або пароль");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (regForm.password !== regForm.confirm_password) {
      setRegError("Паролі не співпадають");
      return;
    }

    const payload = {
      email: regForm.email,
      password: regForm.password,
      confirm_password: regForm.confirm_password,
      first_name: regForm.first_name,
      last_name: regForm.last_name,
    };
    if (regForm.place_id) {
      payload.place_id = parseInt(regForm.place_id);
    }

    try {
      await registerUser(payload);
      setRegSuccess("Реєстрація успішна!");
      setTimeout(async () => {
        await loadProfile();
      }, 500);
    } catch (err) {
      try {
        const parsed = JSON.parse(err.message);
        const msgs = Object.values(parsed).flat().join("; ");
        setRegError(msgs || "Помилка реєстрації");
      } catch {
        setRegError(err.message || "Помилка реєстрації");
      }
    }
  };

  const handleRegChange = (e) => {
    const { name, value } = e.target;
    setRegForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateUserProfile({
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        photoFile: photoFile,
      });

      if (editForm.building && editForm.floor && editForm.room) {
        await changeUserRoom(
          parseInt(editForm.building),
          parseInt(editForm.floor),
          editForm.room
        );
      }

      await loadProfile();
      setIsEditing(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      alert("Профіль оновлено!");
    } catch (error) {
      console.error(error);
      alert("Помилка при збереженні. Перевірте дані.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Preloader />;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => {
                setActiveTab("login");
                setLoginError("");
              }}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${
                activeTab === "login"
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Увійти
            </button>
            <button
              onClick={() => {
                setActiveTab("register");
                setRegError("");
                setRegSuccess("");
              }}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${
                activeTab === "register"
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Зареєструватися
            </button>
          </div>

          <div className="p-8">
            {activeTab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-slate-900">Вхід</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Увійдіть, щоб керувати профілем
                  </p>
                </div>
                {loginError && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center font-medium">
                    {loginError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={`yourname${EMAIL_DOMAIN_HINT}`}
                    className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Пароль
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-[0.98]"
                >
                  Увійти
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-black text-slate-900">
                    Реєстрація
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Створіть обліковий запис студента
                  </p>
                </div>

                {regError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs text-center font-medium">
                    {regError}
                  </div>
                )}
                {regSuccess && (
                  <div className="p-3 bg-green-50 text-green-700 rounded-xl text-xs text-center font-medium">
                    {regSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={regForm.email}
                    onChange={handleRegChange}
                    placeholder={`yourname${EMAIL_DOMAIN_HINT}`}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Дозволені домени: {EMAIL_DOMAIN_HINT}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                      Пароль
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={regForm.password}
                      onChange={handleRegChange}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                      Підтвердження
                    </label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={regForm.confirm_password}
                      onChange={handleRegChange}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                      Ім&apos;я
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={regForm.first_name}
                      onChange={handleRegChange}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                      Прізвище
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={regForm.last_name}
                      onChange={handleRegChange}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Гуртожиток
                  </label>
                  <select
                    name="building_id"
                    value={regForm.building_id}
                    onChange={handleRegChange}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                  >
                    <option value="">Оберіть гуртожиток</option>
                    {buildings.map((b) => (
                      <option key={b.building_id} value={b.building_id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {regForm.building_id && places.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                      Кімната
                    </label>
                    <select
                      name="place_id"
                      value={regForm.place_id}
                      onChange={handleRegChange}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                    >
                      <option value="">Оберіть кімнату</option>
                      {places.map((p) => (
                        <option key={p.place_id} value={p.place_id}>
                          {p.place_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-[0.98] mt-2"
                >
                  Зареєструватися
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  const placeObj = user.place;
  const buildingObj = placeObj?.building;

  const buildingInfo = buildingObj
    ? buildingObj.name || `№${buildingObj.number || buildingObj.building_id || '?'}`
    : "Не вказано";
  const roomInfo = placeObj
    ? placeObj.place_name
    : "Кімната не вказана";

  const isAdmin =
    user.role &&
    ["admin", "адміністратор"].includes(
      (user.role.role_name || "").toLowerCase()
    );

  let avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.first_name || "Guest"}`;
  if (user.photo_url) {
    const path = user.photo_url;
    const isAbsolute = path.startsWith("http") || path.startsWith("blob:");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    avatarUrl = isAbsolute
      ? path
      : `${SERVER_URL}${cleanPath.startsWith("/api") ? "" : "/api"}${cleanPath}`;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            {!isEditing ? (
              <>
                <div className="h-24 sm:h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
                  <div className="absolute -bottom-10 left-8">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white p-1.5 shadow-lg">
                      <img
                        src={avatarUrl}
                        className="w-full h-full rounded-2xl bg-slate-100 object-cover"
                        alt="User Avatar"
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-14 pb-8 px-6 sm:px-8 mt-2">
                  <h2 className="text-2xl font-black text-slate-900">
                    {user.first_name} {user.last_name}
                  </h2>
                  <p className="text-sm font-medium text-slate-500 mb-6 flex flex-col gap-1">
                    <span className="italic">{user.email}</span>
                    {isAdmin && (
                      <span className="text-indigo-600 font-bold text-xs uppercase bg-indigo-50 px-2 py-1 rounded w-fit">
                        Адміністратор
                      </span>
                    )}
                  </p>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl">
                        🏢
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Гуртожиток
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                          {buildingInfo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl">
                        🚪
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Розміщення
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                          {roomInfo}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100"
                    >
                      Редагувати
                    </button>
                    <button
                      onClick={logoutUser}
                      className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 border border-red-100"
                    >
                      Вийти
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 sm:p-8">
                <h3 className="text-xl font-black text-slate-900 mb-6">
                  Редагування
                </h3>

                <div className="mb-6 flex flex-col items-center">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-100 shadow-inner overflow-hidden mb-3">
                    <img
                      src={photoPreview || avatarUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label className="cursor-pointer px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all border border-indigo-100">
                    Обрати нове фото
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Ім&apos;я
                    </label>
                    <input
                      name="first_name"
                      value={editForm.first_name}
                      onChange={handleEditChange}
                      className="w-full p-2 border rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Прізвище
                    </label>
                    <input
                      name="last_name"
                      value={editForm.last_name}
                      onChange={handleEditChange}
                      className="w-full p-2 border rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Email
                    </label>
                    <input
                      name="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      className="w-full p-2 border rounded-lg font-bold"
                    />
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-black text-indigo-600 uppercase mb-3">
                      Зміна кімнати
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Корпус
                        </label>
                        <select
                          name="building"
                          value={editForm.building}
                          onChange={handleEditChange}
                          className="w-full p-2 border rounded-lg font-bold"
                        >
                          <option value="1">№1</option>
                          <option value="2">№2</option>
                          <option value="3">№3</option>
                          <option value="4">№4</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Поверх
                        </label>
                        <input
                          name="floor"
                          type="number"
                          value={editForm.floor}
                          onChange={handleEditChange}
                          className="w-full p-2 border rounded-lg font-bold"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Кімната
                        </label>
                        <input
                          name="room"
                          value={editForm.room}
                          onChange={handleEditChange}
                          placeholder="405"
                          className="w-full p-2 border rounded-lg font-bold"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                    >
                      {saving ? "Зберігаю..." : "Зберегти"}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
                    >
                      Скасувати
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl sm:rounded-[2rem] p-6 border border-slate-100 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Контакти допомоги
            </h4>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Комендант
              </p>
              <p className="text-sm font-bold text-slate-900">093 123 45 67</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <UserPage />
        </div>
      </div>
    </main>
  );
};

export default AccountPage;
