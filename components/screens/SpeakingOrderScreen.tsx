import { Button } from "@/components/ui/Button";
import type { Player } from "@/lib/types";

type SpeakingOrderScreenProps = {
  players: Player[];
  onGoToVoting: () => void;
  onSkipRound: () => void;
};

export function SpeakingOrderScreen({ players, onGoToVoting, onSkipRound }: SpeakingOrderScreenProps) {
  const alivePlayers = players.filter((p) => p.isAlive).sort((a, b) => a.turnOrder - b.turnOrder);

  function handleSkip() {
    if (confirm("Lewati ronde ini? Tidak ada poin yang berubah.")) {
      onSkipRound();
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8">
      <div className="animate-fade-up text-center">
        <span className="font-mono-num text-xs tracking-[0.3em] text-accent-soft">CATATAN KASUS</span>
        <h2 className="font-display text-3xl font-bold text-foreground italic">Urutan Bicara</h2>
        <p className="mt-1 text-sm text-muted">Deskripsikan katamu bergiliran sesuai urutan ini</p>
      </div>

      <ol className="flex flex-col divide-y divide-card-border/60 rounded-sm border border-card-border bg-card shadow-[0_6px_16px_-10px_rgba(42,33,24,0.4)]">
        {alivePlayers.map((p, index) => (
          <li key={p.id} className="flex items-center gap-4 px-5 py-4">
            <span className="font-mono-num text-lg font-bold text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-base text-foreground">{p.name}</span>
          </li>
        ))}
      </ol>

      <div className="mt-auto flex flex-col gap-2">
        <Button onClick={onGoToVoting}>Lanjut ke Voting</Button>
        <Button variant="secondary" onClick={handleSkip}>
          Skip Ronde
        </Button>
      </div>
    </div>
  );
}
