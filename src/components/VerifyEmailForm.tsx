import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { verifyEmail } from "@/services/problemsApi";
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

const verifySchema = z.object({
  code: z.string().min(1, "Введіть код підтвердження"),
});

type VerifyData = z.infer<typeof verifySchema>;

export default function VerifyEmailForm({ email }: { email: string }) {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyForm = useForm<VerifyData>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: "" },
  });

  const handleVerify = async (data: VerifyData) => {
    setError("");
    setLoading(true);
    try {
      await verifyEmail(email, data.code);
      window.dispatchEvent(new Event("profileUpdated"));
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Невірний код. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout heading="Підтвердження Email" subtitle={`Ми надіслали код на ${email}`}>
      <Card className="py-0 border-border shadow-2xl">
        <CardContent className="p-6">
          {error && <ErrorBanner message={error} />}

          <Form {...verifyForm}>
            <form onSubmit={verifyForm.handleSubmit(handleVerify)} className="space-y-5" noValidate>
              <FormField
                control={verifyForm.control}
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-sm font-semibold rounded-lg"
              >
                {loading ? "Підтвердження..." : "Підтвердити"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
