import { Button } from "@/components/ui/Button";

type HomeScreenProps = {
  onStart: () => void;
  onShowHistory: () => void;
  savedSessionInfo: { playerCount: number; roundNumber: number } | null;
  onResume: () => void;
};

export function HomeScreen({ onStart, onShowHistory, savedSessionInfo, onResume }: HomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 text-center">
      <div className="animate-fade-up flex flex-col items-center gap-4">
        <span className="font-mono-num text-xs tracking-[0.4em] text-accent-soft">
          FILE NO. UC-01
        </span>

        <div className="relative">
          <h1 className="font-display text-6xl font-bold tracking-tight text-foreground italic">
            Undercover
          </h1>
          <div className="mt-2 h-px w-full bg-card-border" />
        </div>

        <p
          className="mt-1 -rotate-2 border-2 border-danger/70 px-3 py-1 text-xs font-bold tracking-[0.3em] text-danger uppercase"
          aria-hidden="true"
        >
          Rahasia
        </p>

        <p className="max-w-xs text-sm text-muted">
          Game deduksi kata. Satu perangkat, digilir antar tersangka.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {savedSessionInfo && (
          <div className="animate-fade-up">
            <Button onClick={onResume}>Lanjutkan Permainan</Button>
            <p className="mt-2 text-center text-xs text-muted">
              {savedSessionInfo.playerCount} pemain &middot; Ronde {savedSessionInfo.roundNumber}
            </p>
          </div>
        )}

        <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <Button variant={savedSessionInfo ? "secondary" : "primary"} onClick={onStart}>
            Buka Berkas
          </Button>
        </div>

        <button
          type="button"
          onClick={onShowHistory}
          className="animate-fade-up text-xs tracking-[0.2em] text-muted underline uppercase"
          style={{ animationDelay: "180ms" }}
        >
          Riwayat Permainan
        </button>
      </div>
    </div>
  );
}
