import { HugeiconsIcon } from "@hugeicons/react";
import { BellOffIcon } from "@hugeicons/core-free-icons";

const CommunityBoard = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">Дошка оголошень</h2>
      </div>
      <div className="bg-card/50 border border-border border-dashed p-8 flex flex-col items-center justify-center text-center h-[280px]">
        <div className="w-12 h-12 mb-4 border border-border bg-card flex items-center justify-center text-muted-foreground">
          <HugeiconsIcon icon={BellOffIcon} className="size-5" strokeWidth={1.5} />
        </div>
        <h3 className="text-foreground font-semibold mb-1">Немає оголошень</h3>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
          Ваша дошка порожня. Ми опублікуємо інформацію про планові ремонти або оновлення корпусу.
        </p>
      </div>
    </div>
  );
};

export default CommunityBoard;
