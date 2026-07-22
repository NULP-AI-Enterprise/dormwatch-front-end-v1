import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { changePassword } from "@/services/problemsApi";
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


const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Введіть старий пароль"),
  newPassword: z.string().min(8, "Пароль має містити щонайменше 8 символів"),
  confirmNewPassword: z.string().min(8, "Підтвердження має містити щонайменше 8 символів"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Нові паролі не співпадають",
  path: ["confirmNewPassword"],
});

type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  const onSubmit = async (data: ChangePasswordData) => {
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      await changePassword(data.oldPassword, data.newPassword, data.confirmNewPassword);
      setSuccess(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося змінити пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="mb-5 border border-destructive/40 bg-destructive/10 px-3 py-2.5">
            <p className="text-xs leading-relaxed text-destructive font-semibold">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-5 border border-green-500/40 bg-green-500/10 px-3 py-2.5">
            <p className="text-xs leading-relaxed text-green-500 font-semibold">Пароль успішно змінено</p>
          </div>
        )}

        <FormField
          control={form.control}
          name="oldPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Старий пароль</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Новий пароль</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmNewPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Підтвердіть новий пароль</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} size="sm" className="w-full">
          {loading ? "Збереження..." : "Змінити пароль"}
        </Button>
      </form>
    </Form>
  );
}
