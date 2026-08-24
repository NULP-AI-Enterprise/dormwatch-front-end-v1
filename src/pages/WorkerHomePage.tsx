import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon, Wrench01Icon } from "@hugeicons/core-free-icons";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Logo from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import UserAvatar from "@/components/UserAvatar";
import { logoutUser } from "@/services/problemsApi";

// Interim landing for provisioned workers (step06). Step07 replaces this with
// the mobile-first work panel; the route and guard stay.
const WorkerHomePage = () => {
  const { user } = useUser();

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo to="/worker" />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto gap-2 py-1.5 cursor-pointer">
                  <UserAvatar user={user} size="sm" fallback="П" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleLogout} variant="destructive" className="cursor-pointer">
                  <HugeiconsIcon icon={Logout01Icon} className="size-4" />
                  <span>Вийти</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="border-border shadow-none bg-card w-full max-w-md">
          <CardContent className="p-8">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={Wrench01Icon} className="size-5" />
                </EmptyMedia>
                <EmptyTitle>Панель працівника</EmptyTitle>
                <EmptyDescription>
                  Ви увійшли як працівник. Тут з’являться ваші призначені роботи.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default WorkerHomePage;
