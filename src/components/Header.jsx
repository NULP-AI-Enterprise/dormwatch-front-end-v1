import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchUserProfile } from "../services/problemsApi";

const SERVER_URL = "http://127.0.0.1:8000";

const Header = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [user, setUser] = useState(null);
  const [imgHash, setImgHash] = useState(Date.now()); // Стейт для оновлення картинки

  const loadUser = async () => {
    try {
      const data = await fetchUserProfile();
      setUser(data);
      setImgHash(Date.now()); // Оновлюємо хеш тільки коли прийшли нові дані
    } catch (e) {
      console.log("Not logged in");
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();

    // Слухаємо сигнал збереження з AccountPage
    window.addEventListener('profileUpdated', loadUser);
    return () => window.removeEventListener('profileUpdated', loadUser);
  }, [location.pathname]);

  // ТОЧНО ЯК В ACCOUNT PAGE
  let avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.first_name || 'Guest'}`;
  if (user?.photo_url) {
      const path = user.photo_url;
      const isAbsolute = path.startsWith("http") || path.startsWith("blob:");
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      
      avatarUrl = isAbsolute 
        ? path 
        : `${SERVER_URL}${cleanPath.startsWith('/api') ? '' : '/api'}${cleanPath}?t=${imgHash}`;
  }

  const isAdminUser =
    user?.role &&
    ["admin", "адміністратор"].includes(
      (user.role.role_name || "").toLowerCase()
    );

  const placeObj = user?.place; 
  const buildingName = placeObj?.building?.name || placeObj?.building?.number || placeObj?.building?.building_id;
  const roomText = placeObj 
    ? `Гуртожиток №${buildingName || '?'}, ${placeObj.place_name}`
    : "Кімната не вказана";

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          
          {/* Left: Logo */}
          <div className="flex items-center gap-4 sm:gap-8">
            <Link to="/" className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-indigo-900">
                DormWatch
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex gap-1">
              <Link to="/" className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${currentPath === "/" ? "bg-indigo-50 text-indigo-600" : "hover:bg-slate-100"}`}>
                Головна
              </Link>
              <Link to="/dashboard" className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${currentPath === "/dashboard" ? "bg-indigo-50 text-indigo-600" : "hover:bg-slate-100"}`}>
                Дашборд
              </Link>
              
              {isAdminUser && (
                  <Link to="/admin" className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${currentPath === "/admin" ? "bg-indigo-50 text-indigo-600" : "text-indigo-600 hover:bg-indigo-50"}`}>
                    Комендант-центр
                  </Link>
              )}
            </nav>
          </div>

          {/* Right: Actions + User */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {user ? (
                <>
                    <Link to="/create-report" className="hidden sm:flex bg-indigo-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md active:scale-95">
                    + Створити заявку
                    </Link>

                    {/* User Info */}
                    <div className="flex items-center gap-2 sm:gap-3 sm:pl-4 sm:border-l sm:border-slate-100">
                        <div className="text-right hidden lg:block">
                            <p className="text-xs font-bold text-slate-900">
                            {user.first_name} {user.last_name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium tracking-tight">
                            {roomText}
                            </p>
                        </div>

                        <Link to="/account">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-200 transition-all">
                              <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.first_name}` }} />
                            </div>
                        </Link>
                    </div>
                </>
            ) : (
                <Link to="/account" className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all">
                    Увійти
                </Link>
            )}

            {/* Mobile Burger */}
            <button onClick={() => setMobileMenuOpen((v) => !v)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <nav className="px-4 py-4 space-y-2">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-sm font-medium rounded-lg hover:bg-slate-100">
              Головна
            </Link>
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-sm font-medium rounded-lg hover:bg-slate-100">
              Дашборд
            </Link>
            {isAdminUser && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-sm font-medium rounded-lg text-indigo-600 bg-indigo-50">
                Комендант-центр
                </Link>
            )}
            
            {user ? (
                <>
                    <div className="px-4 py-2 border-t border-slate-100 mt-2">
                        <p className="text-xs font-bold text-slate-900">{user.first_name} {user.last_name}</p>
                        <p className="text-[10px] text-slate-500">{roomText}</p>
                    </div>
                    <Link to="/create-report" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold text-center mt-2">
                        + Створити заявку
                    </Link>
                    <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 mt-1 text-center">
                        Мій профіль
                    </Link>
                </>
            ) : (
                <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold text-center mt-4">
                    Увійти в акаунт
                </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;