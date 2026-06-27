import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchUserProfile } from "../services/problemsApi";
import { ArrowRight, Search, Building2, Camera, Activity, ShieldAlert } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import Footer from "../components/Footer";
import { isAdminUser } from "../lib/complaintUtils";

const HomePage = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const user = await fetchUserProfile();
        if (!mounted) return;
        if (user) {
          navigate(isAdminUser(user) ? "/admin" : "/user", { replace: true });
          return;
        }
      } catch {
        // not logged in — show landing
      } finally {
        if (mounted) setCheckingAuth(false);
      }
    };
    checkAuth();
    return () => { mounted = false; };
  }, [navigate]);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] dark bg-stone-900">
        <LoadingSpinner size="lg" className="border-blue-500" />
      </div>
    );
  }

  return (
    <div className="dark bg-stone-900 min-h-screen flex flex-col antialiased">
      {/* Navigation */}
      <nav className="border-b border-stone-800 bg-stone-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xl tracking-tight">
            <Building2 className="w-6 h-6" strokeWidth={1.5} />
            <span>DormWatch</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-stone-300">
            <a href="#how-it-works" className="hover:text-stone-50 transition-colors">Як це працює</a>
            <a href="#faq" className="hover:text-stone-50 transition-colors">Поширені запитання</a>
            <a href="#emergency" className="hover:text-stone-50 transition-colors">Екстрені контакти</a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/account"
              className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 text-sm font-bold transition-colors border border-blue-700"
            >
              Вхід для студентів
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10">
            <h1 className="text-5xl lg:text-6xl font-bold text-stone-50 leading-tight mb-6 tracking-tight">
              Зламаний кран? Холодна кімната? <span className="text-blue-400">Ми допоможемо.</span>
            </h1>
            <p className="text-lg text-stone-400 mb-8 max-w-xl leading-relaxed">
              Створюйте заявки на ремонт у вашому гуртожитку менш ніж за 15 секунд. Відстежуйте оновлення статусу в режимі реального часу. Без завантаження додатків та очікування на лінії.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/create-report"
                className="bg-blue-800 hover:bg-blue-900 text-white px-6 py-3 text-base font-bold transition-colors flex items-center justify-center gap-2 border border-blue-700"
              >
                Повідомити про проблему
                <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
              </Link>
              <Link
                to="/dashboard"
                className="bg-stone-800 hover:bg-stone-700 text-stone-50 border border-stone-600 px-6 py-3 text-base font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" strokeWidth={2} />
                Відстежити заявку
              </Link>
            </div>
          </div>

          <div className="relative w-full aspect-square max-w-lg mx-auto lg:ml-auto">
            <div className="absolute inset-0 bg-stone-800 border border-stone-700 transform rotate-3 scale-95 opacity-50" />
            <div className="absolute inset-0 bg-stone-800 border border-stone-700 transform -rotate-2 scale-100 opacity-80" />

            <div className="absolute inset-0 bg-stone-900 border border-stone-700 shadow-2xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-stone-800 pb-4">
                <div className="w-32 h-4 bg-stone-800" />
                <div className="w-8 h-8 bg-blue-900 border border-blue-800" />
              </div>

              <div className="bg-stone-800 border border-stone-700 p-4 group hover:border-stone-500 transition-colors relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">Сантехніка</span>
                  <span className="px-2 py-0.5 bg-yellow-900/30 text-yellow-500 border border-yellow-700/50 text-[10px] uppercase font-bold tracking-wider">Очікує</span>
                </div>
                <div className="w-3/4 h-3 bg-stone-700 mb-2" />
                <div className="w-full h-2 bg-stone-700 mb-1" />
                <div className="w-2/3 h-2 bg-stone-700" />
              </div>

              <div className="bg-stone-800 border border-stone-700 p-4 group hover:border-stone-500 transition-colors relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">Опалення</span>
                  <span className="px-2 py-0.5 bg-blue-900/30 text-blue-500 border border-blue-700/50 text-[10px] uppercase font-bold tracking-wider">В роботі</span>
                </div>
                <div className="w-1/2 h-3 bg-stone-700 mb-2" />
                <div className="w-full h-2 bg-stone-700 mb-1" />
                <div className="w-4/5 h-2 bg-stone-700" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <div className="border-y border-stone-800 bg-stone-900">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-stone-800">
          <div className="text-center px-4">
            <p className="text-3xl font-bold text-stone-50 mb-1">15с</p>
            <p className="text-xs uppercase tracking-widest text-stone-400 font-semibold">На подачу заявки</p>
          </div>
          <div className="text-center px-4">
            <p className="text-3xl font-bold text-stone-50 mb-1">24/7</p>
            <p className="text-xs uppercase tracking-widest text-stone-400 font-semibold">Екстрена підтримка</p>
          </div>
          <div className="text-center px-4">
            <p className="text-3xl font-bold text-stone-50 mb-1">100%</p>
            <p className="text-xs uppercase tracking-widest text-stone-400 font-semibold">Охоплення кампусу</p>
          </div>
          <div className="text-center px-4">
            <p className="text-3xl font-bold text-stone-50 mb-1">Прямий</p>
            <p className="text-xs uppercase tracking-widest text-stone-400 font-semibold">Зв'язок із майстрами</p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <section className="py-24 max-w-7xl mx-auto px-6" id="how-it-works">
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-stone-50 mb-4">Більше жодних загублених заявок.</h2>
          <p className="text-stone-400 max-w-2xl text-lg">Ми замінили незручні паперові форми та проігноровані електронні листи на чітку, прозору систему заявок, яка дійсно працює.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-stone-800 border border-stone-700 p-8 relative group hover:border-stone-500 transition-colors">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-stone-900 border border-stone-600 mb-6 flex items-center justify-center">
              <Camera className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-stone-50 mb-3">Сфотографуйте та надішліть</h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              Не намагайтеся пояснити, де протікає. Просто зробіть фото, вкажіть номер кімнати, і наша система автоматично направить заявку до потрібного відділу.
            </p>
          </div>

          <div className="bg-stone-800 border border-stone-700 p-8 relative group hover:border-stone-500 transition-colors">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-stone-900 border border-stone-600 mb-6 flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-stone-50 mb-3">Прозоре відстеження</h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              Припиніть гадати, чи бачив хтось вашу заявку. Отримуйте оновлення статусу в реальному часі, коли ваша заявка переглядається, призначається майстру та вирішується.
            </p>
          </div>

          <div className="bg-stone-800 border border-stone-700 p-8 relative group hover:border-stone-500 transition-colors">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-stone-900 border border-stone-600 mb-6 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-stone-50 mb-3">Екстрене реагування</h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              Критичні проблеми, такі як відключення електроенергії або затоплення, миттєво позначаються та надсилаються черговій бригаді аварійної служби.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-y border-stone-800 bg-stone-900 py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl font-bold text-stone-50 mb-6">Потрібно щось полагодити?</h2>
          <p className="text-stone-400 mb-8 text-lg">Увійдіть за допомогою студентського квитка, щоб надіслати заявку безпосередньо до служби експлуатації кампусу.</p>
          <div className="flex justify-center gap-4">
            <Link
              to="/account"
              className="bg-blue-800 hover:bg-blue-900 text-white px-8 py-4 text-base font-bold transition-colors border border-blue-700 inline-flex items-center gap-2"
            >
              Розпочати
              <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
