import { Label } from "@/components/ui/label";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerUser, fetchInviteInfo } from "@/services/problemsApi";
import { roleHomeRoute } from "@/lib/complaintUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { ChevronRight } from "lucide-react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
  useFormField,
} from "@/components/ui/form";
import { useBuildings } from "@/hooks/useBuildings";
import PlaceCombobox from "@/components/PlaceCombobox";
import type { Place } from "@/lib/types";
import { AuthLayout, ErrorBanner } from "@/components/AuthLayout";

const ALLOWED_INVITE_DOMAINS = [
  "lpnu.ua",
  "gmail.com",
  "ukr.net",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "meta.ua",
  "i.ua",
  "email.ua",
  "proton.me",
  "protonmail.com",
  "live.com",
  "msn.com",
  "me.com",
  "mac.com",
];

// Building is required once buildings exist; on an empty DB (first-user/admin
// bootstrap there is nothing to pick) it stays optional — mirrors the server-side
// guard in RegisterSerializer.validate().
const makeRegisterSchema = (buildingRequired: boolean, hasInvite: boolean) => z.object({
  first_name: z.string().min(1, "Ім'я обов'язкове"),
  last_name: z.string().min(1, "Прізвище обов'язкове"),
  email: z.string().min(1, "Email обов'язковий").email("Невірний формат email").superRefine((val, ctx) => {
    const domain = val.includes("@") ? val.split("@").pop()?.toLowerCase() || "" : "";
    if (!hasInvite) {
      if (domain !== "lpnu.ua" && !domain.endsWith(".lpnu.ua")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Дозволені тільки домени @lpnu.ua",
        });
      }
    } else {
      const isValid = ALLOWED_INVITE_DOMAINS.includes(domain) || domain.endsWith(".lpnu.ua");
      if (!isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Поштовий домен @${domain} не підтримується. Перевірте правильність написання (наприклад, @gmail.com, @ukr.net, @lpnu.ua).`,
        });
      }
    }
  }),
  password: z.string().min(8, "Пароль має бути щонайменше 8 символів"),
  confirm_password: z.string().min(1, "Підтвердження пароля обов'язкове"),
  building_id: z.string().optional(),
  place_id: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirm_password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Паролі не співпадають",
      path: ["confirm_password"],
    });
  }
  if (buildingRequired && (!data.building_id || data.building_id.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Оберіть гуртожиток",
      path: ["building_id"],
    });
  }
});

type RegisterData = z.infer<ReturnType<typeof makeRegisterSchema>>;

function ComboboxField(props: React.ComponentProps<typeof ComboboxInput>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  return (
    <ComboboxInput
      id={formItemId}
      aria-invalid={!!error}
      aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
      {...props}
    />
  );
}

function RegisterForm() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const buildings = useBuildings();
  const [regPlace, setRegPlace] = useState<Place | null>(null);

  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const roleParam = searchParams.get("role");

  const [inviteRole, setInviteRole] = useState<string | null>(
    roleParam ? roleParam.toLowerCase() : null
  );

  useEffect(() => {
    if (!inviteToken) return;
    fetchInviteInfo(inviteToken)
      .then((res: { role?: string }) => {
        if (res?.role) {
          setInviteRole(String(res.role).toLowerCase());
        }
      })
      .catch((err: unknown) => {
        try {
          const parsed = JSON.parse(err instanceof Error ? err.message : "");
          setError(parsed.detail || "Посилання-запрошення недійсне або вже використане");
        } catch {
          setError((err instanceof Error ? err.message : "") || "Посилання-запрошення недійсне або вже використане");
        }
      });
  }, [inviteToken]);

  const isWorker = inviteRole === "worker" || inviteRole === "працівник";

  const registerSchema = useMemo(
    () => makeRegisterSchema(buildings.length > 0 && !inviteToken, !!inviteToken),
    [buildings.length, inviteToken],
  );

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "", last_name: "", email: "",
      password: "", confirm_password: "",
      building_id: "", place_id: "",
    },
  });

  const regBuildingId = registerForm.watch("building_id");

  // Reset the picked room whenever the building changes (the room list is
  // scoped to a building). PlaceCombobox self-fetches, so no manual load here.
  useEffect(() => {
    setRegPlace(null);
    registerForm.setValue("place_id", "");
  }, [regBuildingId, registerForm]);

  const handleRegister = async (data: RegisterData) => {
    setError("");
    setLoading(true);
    try {
      const result = await registerUser({
        email: data.email,
        password: data.password,
        confirm_password: data.confirm_password,
        first_name: data.first_name,
        last_name: data.last_name,
        ...(data.building_id ? { building_id: data.building_id } : {}),
        ...(data.place_id ? { place_id: data.place_id } : {}),
        ...(inviteToken ? { invite_token: inviteToken } : {}),
      });
      window.dispatchEvent(new Event("profileUpdated"));
      navigate(roleHomeRoute(result.role), { replace: true });
    } catch (err: unknown) {
      let msg = "Не вдалося зареєструватися. Перевірте дані й спробуйте ще раз.";
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err instanceof Error ? err.message : "");
          if (typeof parsed === "object" && parsed !== null) {
            const firstKey = Object.keys(parsed)[0];
            const val = (parsed as Record<string, unknown>)[firstKey];
            msg = Array.isArray(val) ? String(val[0]) : String(val);
            
            // Map common backend errors to form fields
            if (firstKey in registerForm.getValues()) {
              registerForm.setError(firstKey as keyof RegisterData, { type: "server", message: msg });
              setLoading(false);
              return;
            }
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

  return (
    <AuthLayout
      heading={
        inviteToken
          ? `Реєстрація за запрошенням: ${isWorker ? "Працівник" : "Адміністратор"}`
          : "Реєстрація"
      }
      subtitle={
        inviteToken
          ? "Створіть свій обліковий запис для доступу до системи за запрошенням."
          : "Кілька секунд — і можна подавати звернення про ремонт."
      }
    >
      <Card className="py-0 border-border">
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
                      <Input type="email" placeholder={inviteToken ? "ваш.email@example.com" : "student@lpnu.ua"} {...field} />
                    </FormControl>
                    {!inviteToken && (
                      <FormDescription>
                        Дозволені домени: @lpnu.ua
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!inviteToken && (
                <>
                  <FormField
                    control={registerForm.control}
                    name="building_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Гуртожиток</FormLabel>
                        <Combobox<string, false>
                          items={buildings.map((b) => String(b.building_id))}
                          value={field.value}
                          onValueChange={(v) => field.onChange(v ?? "")}
                          itemToStringLabel={(id) =>
                            buildings.find((b) => String(b.building_id) === id)?.name ?? id
                          }
                        >
                          <ComboboxField placeholder="Оберіть свій гуртожиток..." className="w-full" />
                          <ComboboxContent>
                            <ComboboxEmpty>Гуртожитків не знайдено</ComboboxEmpty>
                            <ComboboxList>
                              {(id: string) => (
                                <ComboboxItem key={id} value={id}>
                                  {buildings.find((b) => String(b.building_id) === id)?.name ?? id}
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
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
                          <Label htmlFor="registration-room">Кімната</Label>
                          <PlaceCombobox
                            id="registration-room"
                            buildingId={Number(regBuildingId)}
                            value={regPlace}
                            onChange={(p) => {
                              setRegPlace(p);
                              field.onChange(String(p.place_id));
                            }}
                            placeholder="Оберіть кімнату..."
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
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
            className="inline-flex items-center gap-1 mt-2 text-link hover:text-link/80 font-bold transition-colors group"
          >
            Увійти до системи
            <ChevronRight strokeWidth={2} className="size-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

export default RegisterForm;
