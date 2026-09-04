import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { changePassword } from "@/services/problemsApi";
import { SUCCESS, SUCCESS_TEXT } from "@/lib/theme";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<ChangePasswordData | null>(null);

  const form = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  const onSubmit = (data: ChangePasswordData) => {
    setError("");
    setSuccess(false);
    setPendingData(data);
    setIsConfirmOpen(true);
  };

  const executeChangePassword = async () => {
    if (!pendingData) return;
    setIsConfirmOpen(false);
    setLoading(true);
    try {
      await changePassword(pendingData.oldPassword, pendingData.newPassword, pendingData.confirmNewPassword);
      setSuccess(true);
      form.reset();
      setPendingData(null);
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
          <div className={`mb-5 border px-3 py-2.5 ${SUCCESS}`}>
            <p className={`text-xs leading-relaxed font-semibold ${SUCCESS_TEXT}`}>Пароль успішно змінено</p>
          </div>
        )}

        <FormField
          control={form.control}
          name="oldPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Старий пароль</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
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
                <Input type="password" autoComplete="new-password" {...field} />
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
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Збереження..." : "Змінити пароль"}
        </Button>
      </form>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Змінити пароль?</AlertDialogTitle>
            <AlertDialogDescription>
              Ви впевнені, що хочете встановити новий пароль для свого облікового запису?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={executeChangePassword}>
              Підтвердити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
