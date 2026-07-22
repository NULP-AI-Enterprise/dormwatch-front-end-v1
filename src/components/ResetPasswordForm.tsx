import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { confirmPasswordReset } from "@/services/problemsApi";
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

const resetSchema = z.object({
  code: z.string().min(1, "Введіть код підтвердження"),
  password: z.string().min(8, "Пароль має містити щонайменше 8 символів"),
  confirmPassword: z.string().min(8, "Підтвердження пароля має містити щонайменше 8 символів"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Паролі не співпадають",
  path: ["confirmPassword"],
});

type ResetData = z.infer<typeof resetSchema>;

export default function ResetPasswordForm({ email }: { email: string }) {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = useForm<ResetData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "", password: "", confirmPassword: "" },
  });

  const handleReset = async (data: ResetData) => {
    setError("");
    setLoading(true);
    try {
      await confirmPasswordReset(email, data.code, data.password, data.confirmPassword);
      navigate("/auth?tab=login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Невірний код. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout heading="Новий пароль" subtitle={`Введіть код з листа на ${email} та новий пароль.`}>
      <Card className="py-0 border-border shadow-2xl">
        <CardContent className="p-6">
          {error && <ErrorBanner message={error} />}

          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-5" noValidate>
              <FormField
                control={resetForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Код підтвердження</FormLabel>
                    <FormControl>
                      <Input placeholder="Введіть 6-значний код" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={resetForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Новий пароль</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={resetForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Підтвердіть пароль</FormLabel>
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
                className="w-full h-11 text-sm font-semibold rounded-lg"
              >
                {loading ? "Збереження..." : "Зберегти новий пароль"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
