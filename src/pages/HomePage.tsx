import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchUserProfile } from "@/services/problemsApi";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Camera01Icon, Activity01Icon, ShieldIcon } from "@hugeicons/core-free-icons";
import PageSpinner from "@/components/PageSpinner";
import Logo from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { Separator } from "@/components/ui/separator";
import { isAdminUser, statusBadgeClass } from "@/lib/complaintUtils";
import { FeatureCard } from "@/components/FeatureCard";

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
    return <PageSpinner minHeight="min-h-[60vh]" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">Як це працює</a>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button asChild>
              <Link to="/auth">
                Вхід для студентів
              </Link>
            </Button>
          </div>
        </div>
        <Separator />
      </nav>

      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10">
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 tracking-tight">
              Зламаний кран? Холодна кімната? <span className="text-blue-600 dark:text-blue-400">Ми допоможемо.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
              Створюйте звернення про ремонт у вашому гуртожитку менш ніж за 15 секунд. Відстежуйте оновлення статусу в режимі реального часу. Без завантаження додатків та очікування на лінії.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="gap-2">
                <Link to="/auth">
                  Повідомити про проблему
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" strokeWidth={2} />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative w-full aspect-square max-w-lg mx-auto lg:ml-auto">
            <div className="absolute inset-0 bg-card border border-border transform rotate-3 scale-95 opacity-50" />
            <div className="absolute inset-0 bg-card border border-border transform -rotate-2 scale-100 opacity-80" />
            <div className="absolute inset-0 bg-background border border-border p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center pb-4">
                <div className="w-32 h-4 bg-card" />
                <div className="w-8 h-8 bg-primary/90 border border-blue-800" />
              </div>
              <Separator />
              <div className="bg-card border border-border p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-muted-foreground font-normal">Сантехніка</span>
                  <span className={`px-2 py-0.5 ${statusBadgeClass("pending")} text-xs font-semibold`}>Очікує</span>
                </div>
                <div className="w-3/4 h-3 bg-muted mb-2" />
                <div className="w-full h-2 bg-muted mb-1" />
                <div className="w-2/3 h-2 bg-muted" />
              </div>
              <div className="bg-card border border-border p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-muted-foreground font-normal">Опалення</span>
                  <span className={`px-2 py-0.5 ${statusBadgeClass("approved")} text-xs font-semibold`}>В роботі</span>
                </div>
                <div className="w-1/2 h-3 bg-muted mb-2" />
                <div className="w-full h-2 bg-muted mb-1" />
                <div className="w-4/5 h-2 bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*
        TODO: replace with real, verifiable stats from an API before showing this band.
        The previous values ("15с", "24/7", "100% Охоплення кампусу", "Прямий") were
        hardcoded marketing figures with nothing to substantiate them, so the band is
        hidden until real numbers are wired up.
      */}

      <section className="py-24 max-w-7xl mx-auto px-6" id="how-it-works">
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Більше жодних загублених звернень.</h2>
          <p className="text-muted-foreground max-w-2xl text-lg">Ми замінили незручні паперові форми та проігноровані електронні листи на чітку, прозору систему звернень, яка дійсно працює.</p>
        </div>
        <div className="grid md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          <FeatureCard
            icon={Camera01Icon}
            title="Сфотографуйте та надішліть"
            description="Не намагайтеся пояснити, де протікає. Просто зробіть фото, вкажіть номер кімнати, і наша система автоматично направить звернення до потрібного відділу."
          />
          <FeatureCard
            icon={Activity01Icon}
            title="Прозоре відстеження"
            description="Припиніть гадати, чи бачив хтось ваше звернення. Отримуйте оновлення статусу в реальному часі, коли ваше звернення переглядається, призначається майстру та вирішується."
          />
          <FeatureCard
            icon={ShieldIcon}
            title="Екстрене реагування"
            description="Критичні проблеми, такі як відключення електроенергії або затоплення, миттєво позначаються та надсилаються черговій бригаді аварійної служби."
          />
        </div>
      </section>

      <Separator />
      <section className="bg-background py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl font-bold text-foreground mb-6">Потрібно щось полагодити?</h2>
          <p className="text-muted-foreground mb-8 text-lg">Увійдіть за допомогою студентського квитка, щоб надіслати звернення безпосередньо до служби експлуатації кампусу.</p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link to="/auth">
                Розпочати
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" strokeWidth={2} />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <Separator />

      <Footer />
    </div>
  );
};

export default HomePage;
