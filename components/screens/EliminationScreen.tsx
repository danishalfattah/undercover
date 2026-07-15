import { Button } from "@/components/ui/Button";
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
      <span className="font-mono-num text-xs tracking-[0.3em] text-accent-soft">TERSINGKAP</span>
      <h2 className="font-display text-3xl font-bold text-foreground italic">{eliminated.name}</h2>

      <div className="animate-stamp dossier-edge relative flex w-full max-w-xs flex-col items-center gap-2 border-2 border-danger/70 bg-card px-6 py-8 -rotate-2">
        <span className="text-xs tracking-[0.4em] text-muted uppercase">Perannya adalah</span>
        <p className="font-display text-3xl font-bold text-danger">{ROLE_LABEL[eliminated.role]}</p>
      </div>

      <div className="w-full max-w-xs pt-4">
        <Button onClick={onContinue}>Lanjut</Button>
      </div>
    </div>
  );
}
