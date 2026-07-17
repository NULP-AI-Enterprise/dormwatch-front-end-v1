import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { requestPasswordReset } from "@/services/problemsApi";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { AuthLayout, ErrorBanner } from "@/components/AuthLayout";

const forgotSchema = z.object({
  email: z.string().min(1, "Email обов'язковий").email("Невірний формат email").refine(
    (v) => v.endsWith("@lpnu.ua"),
    "Дозволені тільки домени @lpnu.ua"
  ),
});

type ForgotData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordForm() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const forgotForm = useForm<ForgotData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const handleRequest = async (data: ForgotData) => {
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(data.email);
      navigate(`/auth?tab=reset&email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка при відновленні пароля.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout heading="Відновлення пароля" subtitle="Введіть свій email, щоб отримати код для відновлення.">
      <Card className="py-0 border-border shadow-2xl">
        <CardContent className="p-6">
          {error && <ErrorBanner message={error} />}

          <Form {...forgotForm}>
            <form onSubmit={forgotForm.handleSubmit(handleRequest)} className="space-y-5" noValidate>
              <FormField
                control={forgotForm.control}
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-sm font-semibold rounded-lg"
              >
                {loading ? "Відправка..." : "Відправити код"}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm font-medium text-muted-foreground">
            Згадали пароль?{" "}
            <Link to="/auth?tab=login" className="text-primary hover:text-primary/80 transition-colors">
              Увійдіть
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
