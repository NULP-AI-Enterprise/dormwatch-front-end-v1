import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  Delete01Icon,
  CheckmarkCircleIcon,
  CancelCircleIcon,
} from "@hugeicons/core-free-icons";
import type { Complaint } from "@/lib/types";

interface ComplaintAdminActionsProps {
  complaint: Complaint;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
  // When true, hides Delete once the complaint is resolved/rejected. Used by the
  // side panel; the admin list leaves delete available in every state (default).
  hideDeleteWhenClosed?: boolean;
}

const destructiveActionClass =
  "bg-destructive text-destructive-foreground hover:bg-destructive/90";

// One confirmation dialog + trigger button. Shared shape for all four admin
// actions (approve / reject / resolve / delete).
const ConfirmAction = ({
  trigger,
  title,
  description,
  confirmLabel,
  confirmClassName,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  confirmClassName?: string;
  onConfirm: () => void;
}) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Скасувати</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className={confirmClassName}>
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// Forwards ref and any injected props (e.g. AlertDialogTrigger's onClick via
// Radix Slot) down to Button — without this, `asChild` triggers are inert.
const ActionButton = forwardRef<
  HTMLButtonElement,
  {
    variant?: "destructive";
    icon: IconSvgElement;
    children: React.ReactNode;
  } & React.ComponentProps<typeof Button>
>(({ variant, icon, children, ...props }, ref) => (
  <Button ref={ref} variant={variant} {...props}>
    <HugeiconsIcon icon={icon} className="size-3 mr-1" strokeWidth={2} />
    {children}
  </Button>
));
ActionButton.displayName = "ActionButton";

// The approve/reject/resolve/delete AlertDialog cluster used both on admin
// complaint cards (AdminComplaintsPage) and in the ComplaintSidePanel. Extracted
// so a change to any flow updates both places.
const ComplaintAdminActions = ({
  complaint,
  onStatusChange,
  onDelete,
  hideDeleteWhenClosed = false,
}: ComplaintAdminActionsProps) => (
  <>
    {complaint.status === "pending" && (
      <>
        <ConfirmAction
          trigger={<ActionButton icon={CheckmarkCircleIcon}>Схвалити</ActionButton>}
          title="Схвалити скаргу?"
          description={'Ви впевнені, що хочете схвалити цю скаргу? Вона перейде в статус "Активно".'}
          confirmLabel="Схвалити"
          onConfirm={() => onStatusChange("approved")}
        />
        <ConfirmAction
          trigger={
            <ActionButton variant="destructive" icon={CancelCircleIcon}>
              Відхилити
            </ActionButton>
          }
          title="Відхилити скаргу?"
          description={'Ви впевнені, що хочете відхилити цю скаргу? Вона перейде в статус "Відхилено".'}
          confirmLabel="Відхилити"
          confirmClassName={destructiveActionClass}
          onConfirm={() => onStatusChange("rejected")}
        />
      </>
    )}
    {complaint.status === "approved" && (
      <ConfirmAction
        trigger={<ActionButton icon={CheckmarkCircleIcon}>Вирішити</ActionButton>}
        title="Позначити як вирішену?"
        description={'Ви впевнені, що проблема була успішно вирішена? Скарга перейде в статус "Вирішено".'}
        confirmLabel="Вирішити"
        onConfirm={() => onStatusChange("resolved")}
      />
    )}
    {!(hideDeleteWhenClosed && ["resolved", "rejected"].includes(complaint.status)) && (
    <ConfirmAction
      trigger={
        <ActionButton variant="destructive" icon={Delete01Icon}>
          Видалити
        </ActionButton>
      }
      title="Видалити скаргу?"
      description="Ви впевнені, що хочете видалити цю скаргу? Цю дію неможливо скасувати."
      confirmLabel="Видалити"
      confirmClassName={destructiveActionClass}
      onConfirm={onDelete}
    />
    )}
  </>
);

export default ComplaintAdminActions;
