import { Button } from "@/components/ui/Button";
import type { GameState, MrWhiteGuessResult, Player, WinnerSide } from "@/lib/types";

const WINNER_LABEL: Record<NonNullable<WinnerSide>, string> = {
  CIVILIAN: "Civilian Menang!",
  IMPOSTOR: "Penyusup Menang!",
  MR_WHITE_GUESS: "Mr. White Menang!",
};

type RoundResultScreenProps = {
  players: Player[];
  winner: WinnerSide;
  wordPair: GameState["wordPair"];
  mrWhiteGuessResult: MrWhiteGuessResult | null;
  onNewRound: () => void;
  onFinish: () => void;
};

export function RoundResultScreen({
  players,
  winner,
  wordPair,
  mrWhiteGuessResult,
  onNewRound,
  onFinish,
}: RoundResultScreenProps) {
  const ranking = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8">
      <div className="animate-fade-up text-center">
        <span className="font-mono-num text-xs tracking-[0.3em] text-accent-soft">KASUS DITUTUP</span>
        <h2 className="font-display text-3xl font-bold text-foreground italic">
          {winner ? WINNER_LABEL[winner] : "Ronde Selesai"}
        </h2>
        {winner === "MR_WHITE_GUESS" && mrWhiteGuessResult && (
          <p className="mt-1 text-sm text-muted">
            Tebakan benar: &ldquo;{mrWhiteGuessResult.guess}&rdquo;
          </p>
        )}
      </div>

      {wordPair && (
        <div className="flex divide-x divide-card-border rounded-sm border border-card-border bg-card shadow-[0_6px_16px_-10px_rgba(42,33,24,0.4)]">
          <div className="flex flex-1 flex-col items-center gap-1 px-4 py-4">
            <span className="text-xs font-bold tracking-[0.2em] text-accent-soft uppercase">
              Civilian
            </span>
            <span className="font-display text-xl font-bold text-foreground italic">
              {wordPair.civilian}
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center gap-1 px-4 py-4">
            <span className="text-xs font-bold tracking-[0.2em] text-danger uppercase">
              Undercover
            </span>
            <span className="font-display text-xl font-bold text-foreground italic">
              {wordPair.undercover}
            </span>
          </div>
        </div>
      )}

      <div className="rounded-sm border border-card-border bg-card shadow-[0_6px_16px_-10px_rgba(42,33,24,0.4)]">
        <p className="border-b border-card-border/60 px-5 py-3 text-xs font-bold tracking-[0.2em] text-accent-soft uppercase">
          Papan Peringkat
        </p>
        <ol className="flex flex-col divide-y divide-card-border/60">
          {ranking.map((p, index) => (
            <li key={p.id} className="flex items-center justify-between px-5 py-3">
              <span className="flex items-center gap-3">
                <span className="font-mono-num text-xs text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-base text-foreground">{p.name}</span>
              </span>
              <span className="flex items-center gap-2">
                {p.lastRoundPoints > 0 && (
                  <span className="font-mono-num text-sm font-bold text-accent">
                    +{p.lastRoundPoints}
                  </span>
                )}
                <span className="font-mono-num text-base font-bold text-foreground">
                  {p.score} pts
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <Button onClick={onNewRound}>Ronde Baru</Button>
        <Button variant="secondary" onClick={onFinish}>
          Selesai
        </Button>
      </div>
    </div>
  );
}
