import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Player, Role } from "@/lib/types";

const ROLE_LABEL: Record<Role, string> = {
  CIVILIAN: "Civilian",
  UNDERCOVER: "Undercover",
  MR_WHITE: "Mr. White",
};

type EliminationScreenProps = {
  players: Player[];
  lastEliminatedId: string | null;
  onContinue: () => void;
};

export function EliminationScreen({ players, lastEliminatedId, onContinue }: EliminationScreenProps) {
  const eliminated = players.find((p) => p.id === lastEliminatedId);
  if (!eliminated) return null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-slate-500">Pemain tereliminasi</p>
      <h2 className="text-3xl font-bold">{eliminated.name}</h2>
      <Card className="w-full max-w-xs">
        <p className="text-sm text-slate-500">Perannya adalah</p>
        <p className="text-2xl font-bold text-accent-2">{ROLE_LABEL[eliminated.role]}</p>
      </Card>
      <div className="w-full max-w-xs">
        <Button onClick={onContinue}>Lanjut</Button>
      </div>
    </div>
  );
}
