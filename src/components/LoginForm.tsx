import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginUser } from "@/services/problemsApi";
import { roleHomeRoute } from "@/lib/complaintUtils";
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
  email: z.string().min(1, "Email обов'язковий").email("Невірний формат email"),
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
      const res = await loginUser(data.email, data.password);
      window.dispatchEvent(new Event("profileUpdated"));
      navigate(roleHomeRoute(res.role), { replace: true });
    } catch (err: any) {
      if (err.requiresVerification) {
        navigate(`/auth?tab=verify&email=${encodeURIComponent(err.email)}`);
      } else {
        setError(err instanceof Error ? err.message : "Невірний email або пароль. Перевірте ще раз.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout heading="З поверненням!" subtitle="Увійдіть, щоб подати або відстежити звернення про ремонт.">
      <Card className="py-0 border-border">
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
                      <Input type="email" placeholder="student@lpnu.ua або email" {...field} />
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
                      <Link to="/auth?tab=forgot" tabIndex={-1} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                        Забули пароль?
                      </Link>
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
                className="w-full"
              >
                {loading ? "Входимо…" : "Увійти"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Secondary nudge: account creation. Plain card (no shadow/accent
          bar) so the primary login card stays the visual focus. */}
      <Card className="mt-6 border-border p-0">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Новий студент у гуртожитку?</p>
          <Link
            to="/auth?tab=register"
            className="inline-flex items-center gap-1 mt-1 text-sm font-semibold text-primary hover:text-primary/80 hover:underline transition-colors"
          >
            Створити обліковий запис
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

export default LoginForm;
