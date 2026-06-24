import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchApprovedComplaints } from "../services/problemsApi";
import Preloader from "../components/Preloader";


const HomePage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const data = await fetchApprovedComplaints("new");
        if (mounted) {
          
          setActivities(data.slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to load activity", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  const getCategoryEmoji = (cat) => {
    switch (String(cat).toLowerCase()) {
      case 'plumbing': return '🚿';
      case 'electricity': return '⚡';
      case 'furniture': return '🪑';
      case 'internet': return '🌐';
      default: return '🔧';
    }
  };


  const getLocationText = (p) => {
    const b = p.building ? `Корпус ${p.building}` : "";
    const place = p.placeName ? `, ${p.placeName}` : "";
    return `${b}${place}`;
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
        <div>
          <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 bg-indigo-100 text-indigo-700 text-[10px] sm:text-xs font-bold rounded-full mb-4 sm:mb-6 uppercase tracking-wider">
            Для студентів та адміністрації
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.1] mb-4 sm:mb-6 tracking-tight text-slate-900">
            Твій гуртожиток — <br />
            <span className="text-indigo-600">твої правила.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 mb-6 sm:mb-8 max-w-lg leading-relaxed">
            Помітили зламаний кран, несправну плитку чи проблеми з опаленням?
            Повідомте про це та слідкуйте за ремонтом онлайн.
          </p>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-10">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">№12</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase mt-1">
                Корпусів підключено
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-indigo-600">452</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase mt-1">
                Виправлено несправностей
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">92%</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase mt-1">
                Задоволеність
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              to="/user"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-indigo-600 text-white rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >
              Переглянути проблеми
            </Link>
          </div>
        </div>

        {/* Блок активності */}
        <div className="relative mt-8 lg:mt-0">
          <div className="hidden lg:block absolute -top-10 -right-10 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-60"></div>
          <div className="relative bg-white p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
              <h3 className="font-bold text-sm sm:text-base lg:text-lg italic tracking-tight">
                Остання активність
              </h3>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {loading && <Preloader />}

              {!loading && activities.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Поки що тихо... 😴</p>
              )}

              {!loading && activities.map((item) => (
                <div key={item.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 transition-colors hover:bg-white hover:shadow-md">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                    {getCategoryEmoji(item.category)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-500">
                      {getLocationText(item)} • {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {!loading && activities.length > 0 && (
              <div className="mt-6 text-center">
                <Link to="/dashboard" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                  Дивитись всі →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomePage;