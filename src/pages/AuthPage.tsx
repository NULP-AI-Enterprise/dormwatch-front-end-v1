import { useState, useEffect, type ReactNode } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginUser, registerUser, fetchBuildings, fetchPlaces } from "../services/problemsApi";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building03Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
  useFormField,
} from "../components/ui/form";

const loginSchema = z.object({
  email: z.string().min(1, "Email обов'язковий").email("Невірний формат email").refine(
    (v) => v.endsWith("@lpnu.ua"),
    "Дозволені тільки домени @lpnu.ua"
  ),
  password: z.string().min(1, "Пароль обов'язковий"),
});

const registerSchema = z.object({
  first_name: z.string().min(1, "Ім'я обов'язкове"),
  last_name: z.string().min(1, "Прізвище обов'язкове"),
  email: z.string().min(1, "Email обов'язковий").email("Невірний формат email").refine(
    (v) => v.endsWith("@lpnu.ua"),
    "Дозволені тільки домени @lpnu.ua"
  ),
  password: z.string().min(8, "Пароль має бути щонайменше 8 символів"),
  confirm_password: z.string().min(1, "Підтвердження пароля обов'язкове"),
  building_id: z.string().optional(),
  place_id: z.string().optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Паролі не співпадають",
  path: ["confirm_password"],
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

function AuthLayout({ children, heading, subtitle }: { children: ReactNode; heading: string; subtitle: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 text-primary font-bold text-2xl mb-2">
            <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="size-8" />
            <span>DormWatch</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{heading}</h1>
          <p className="text-muted-foreground text-sm mt-2 text-center">{subtitle}</p>
        </div>

        {children}

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 group-hover:-translate-x-1 transition-transform" />
            Повернутися на головну
          </Link>
        </div>
      </div>
    </div>
  );
}

function SelectField({ children, ...props }: React.ComponentProps<typeof SelectTrigger>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  return (
    <SelectTrigger
      id={formItemId}
      aria-invalid={!!error}
      aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
      {...props}
    >
      {children}
    </SelectTrigger>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-5 border border-destructive/40 bg-destructive/10 px-3 py-2.5">
      <p className="text-xs leading-relaxed text-destructive font-semibold">{message}</p>
    </div>
  );
}

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("tab") === "register" ? "register" : "login";

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [buildings, setBuildings] = useState<Array<{building_id: number, name: string}>>([]);
  const [places, setPlaces] = useState<Array<{place_id: number, place_name: string}>>([]);
  const [placesLoading, setPlacesLoading] = useState(false);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "", last_name: "", email: "",
      password: "", confirm_password: "",
      building_id: "", place_id: "",
    },
  });

  const regBuildingId = registerForm.watch("building_id");

  useEffect(() => {
    fetchBuildings().then(setBuildings).catch(() => {});
  }, []);

  useEffect(() => {
    if (!regBuildingId) {
      setPlaces([]);
      return;
    }
    setPlacesLoading(true);
    registerForm.setValue("place_id", "");
    fetchPlaces(regBuildingId)
      .then(setPlaces)
      .catch(() => setPlaces([]))
      .finally(() => setPlacesLoading(false));
  }, [regBuildingId, registerForm]);

  const handleLogin = async (data: LoginData) => {
    setError("");
    setLoading(true);
    try {
      await loginUser(data.email, data.password);
      window.dispatchEvent(new Event("profileUpdated"));
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Невірний email або пароль");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    setError("");
    setLoading(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        confirm_password: data.confirm_password,
        first_name: data.first_name,
        last_name: data.last_name,
        // TODO: include place_id once buildings/places are populated
        ...(data.place_id ? { place_id: data.place_id } : {}),
      });
      window.dispatchEvent(new Event("profileUpdated"));
      navigate("/");
    } catch (err) {
      let msg = "Помилка реєстрації";
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (typeof parsed === "object" && parsed !== null) {
            const firstKey = Object.keys(parsed)[0];
            const val = (parsed as Record<string, unknown>)[firstKey];
            msg = Array.isArray(val) ? String(val[0]) : String(val);
          }
        } catch {
          msg = err.message || msg;
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (mode === "register") {
    return (
      <AuthLayout heading="Реєстрація" subtitle="Створіть обліковий запис для подачі заявок на ремонт.">
        <Card className="border-border shadow-2xl">
          <CardContent className="p-6">
            {error && <ErrorBanner message={error} />}

            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    control={registerForm.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ім'я</FormLabel>
                        <FormControl>
                          <Input placeholder="Іван" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Прізвище</FormLabel>
                        <FormControl>
                          <Input placeholder="Франко" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Електронна пошта</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="student@lpnu.ua" {...field} />
                      </FormControl>
                      <FormDescription>
                        Дозволені домени: @lpnu.ua
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="building_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Гуртожиток</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectField className="w-full">
                          <SelectValue placeholder="Оберіть свій гуртожиток..." />
                        </SelectField>
                        <SelectContent>
                          {buildings.map((b) => (
                            <SelectItem key={b.building_id} value={String(b.building_id)}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {regBuildingId && (
                  <FormField
                    control={registerForm.control}
                    name="place_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Кімната</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={placesLoading}>
                          <SelectField className="w-full">
                            <SelectValue placeholder={placesLoading ? "Завантаження..." : "Оберіть кімнату"} />
                          </SelectField>
                          <SelectContent>
                            {places.map((p) => (
                              <SelectItem key={p.place_id} value={String(p.place_id)}>
                                {p.place_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Пароль</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="confirm_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Підтвердження паролю</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full relative overflow-hidden group"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {loading ? "Завантаження..." : "Створити обліковий запис"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="mt-6 border-border shadow-lg bg-muted/50 p-0 relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted-foreground" />
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">Вже маєте обліковий запис?</p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1 mt-2 text-primary hover:text-primary/80 font-bold transition-colors group"
            >
              Увійти до системи
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout heading="Вхід до системи" subtitle="Увійдіть, щоб створити або відстежити заявку на ремонт.">
      <Card className="border-border shadow-2xl">
        <CardContent className="p-6">
          {error && <ErrorBanner message={error} />}

          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5" noValidate>
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Електронна пошта</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="student@lpnu.ua" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Пароль</FormLabel>
                      <a href="#" tabIndex={-1} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                        Забули пароль?
                      </a>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full relative overflow-hidden group"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                {loading ? "Завантаження..." : "Увійти"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="mt-6 border-border shadow-lg bg-muted/50 p-0 relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted-foreground" />
        <CardContent className="p-5 text-center">
          <p className="text-sm text-muted-foreground">Новий студент у гуртожитку?</p>
          <Link
            to="/auth?tab=register"
            className="inline-flex items-center gap-1 mt-2 text-primary hover:text-primary/80 font-bold transition-colors group"
          >
            Створити обліковий запис
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default AuthPage;
