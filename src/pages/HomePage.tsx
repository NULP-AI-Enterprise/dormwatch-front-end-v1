import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchApprovedComplaints } from "../services/problemsApi";
import { ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const categoryMeta: Record<string, string> = {
  plumbing: "🚿",
  electricity: "⚡",
  furniture: "🪑",
  internet: "🌐",
};

const getLocationText = (p: any) => {
  const b = p.building ? `Корпус ${p.building}` : "";
  const place = p.placeName ? `, ${p.placeName}` : "";
  return `${b}${place}`;
};

const HomePage = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const data = await fetchApprovedComplaints("new");
        if (mounted && Array.isArray(data)) {
          setActivities(data.slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to load activity", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = [
    { value: "№12", label: "Корпусів підключено" },
    { value: "452", label: "Виправлено несправностей" },
    { value: "92%", label: "Задоволеність" },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="grid lg:grid-cols-2 gap-16 items-start">
        <div>
          <span className="micro-label inline-block mb-6">
            Для студентів та адміністрації
          </span>
          <h1 className="text-6xl font-bold leading-[1.05] mb-6 tracking-tight text-foreground">
            Твій гуртожиток —<br />
            <span className="text-primary">твої правила.</span>
          </h1>
          <p className="text-base text-muted-foreground mb-10 max-w-md leading-relaxed">
            Помітили зламаний кран, несправну плитку чи проблеми з опаленням?
            Повідомте про це та слідкуйте за ремонтом онлайн.
          </p>

          <div className="grid grid-cols-3 gap-8 mb-10 border-t border-dashed border-border pt-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="micro-label mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button asChild size="lg" className="font-bold text-sm">
              <Link to="/user" className="inline-flex items-center gap-2">
                Переглянути проблеми
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <Card className="border-border shadow-none">
            <CardHeader className="border-b border-dashed border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Остання активність
                </CardTitle>
                <span className="w-2 h-2 bg-green-500"></span>
              </div>
            </CardHeader>
            <CardContent className="space-y-0 pt-0">
              {loading && (
                <div className="py-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin"></div>
                </div>
              )}
              {!loading && activities.length === 0 && (
                <p className="py-8 text-xs text-muted-foreground text-center">
                  Поки що тихо...
                </p>
              )}
              {!loading &&
                activities.map((item) => (
                  <div
                    key={item.id}
                    className="py-4 border-b border-dashed border-border last:border-b-0 flex items-start gap-4 link-hover cursor-default"
                  >
                    <div className="w-10 h-10 bg-muted border border-border flex items-center justify-center flex-shrink-0 text-lg">
                      {categoryMeta[item.category] || "🔧"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground truncate max-w-[260px]">
                        {item.title}
                      </p>
                      <p className="micro-label mt-0.5">
                        {getLocationText(item)} &middot;{" "}
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              {!loading && activities.length > 0 && (
                <div className="py-4 text-center border-t border-dashed border-border">
                  <Link
                    to="/dashboard"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Дивитись всі &rarr;
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default HomePage;
