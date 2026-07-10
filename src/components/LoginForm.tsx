import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginUser } from "@/services/problemsApi";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { AuthLayout, ErrorBanner } from "@/components/AuthLayout";

const loginSchema = z.object({
  email: z.string().min(1, "Email обов'язковий").email("Невірний формат email").refine(
    (v) => v.endsWith("@lpnu.ua"),
    "Дозволені тільки домени @lpnu.ua"
  ),
  password: z.string().min(1, "Пароль обов'язковий"),
});

type LoginData = z.infer<typeof loginSchema>;

function LoginForm() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleLogin = async (data: LoginData) => {
    setError("");
    setLoading(true);
    try {
      await loginUser(data.email, data.password);
      window.dispatchEvent(new Event("profileUpdated"));
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Невірний email або пароль. Перевірте ще раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout heading="З поверненням!" subtitle="Увійдіть, щоб подати або відстежити звернення про ремонт.">
      <Card className="py-0 border-border shadow-2xl">
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
                {loading ? "Входимо…" : "Увійти"}
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
}

export default LoginForm;
