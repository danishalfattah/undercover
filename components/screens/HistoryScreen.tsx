import { Button } from "@/components/ui/Button";
import type { SessionHistoryEntry } from "@/lib/types";

type HistoryScreenProps = {
  entries: SessionHistoryEntry[];
  onBack: () => void;
};

export function HistoryScreen({ entries, onBack }: HistoryScreenProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8">
      <div className="animate-fade-up text-center">
        <span className="font-mono-num text-xs tracking-[0.3em] text-accent-soft">ARSIP KASUS</span>
        <h2 className="font-display text-3xl font-bold text-foreground italic">Riwayat Permainan</h2>
      </div>

      {entries.length === 0 ? (
        <p className="text-center text-sm text-muted">Belum ada riwayat permainan.</p>
      ) : (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-sm border border-card-border bg-card shadow-[0_6px_16px_-10px_rgba(42,33,24,0.4)]"
            >
              <div className="flex items-center justify-between border-b border-card-border/60 px-5 py-3">
                <span className="font-mono-num text-xs text-muted">
                  {new Date(entry.timestamp).toLocaleString("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                <span className="font-mono-num text-xs text-accent-soft">
                  {entry.playerNames.length} pemain &middot; Ronde {entry.roundsPlayed}
                </span>
              </div>
              <ol className="flex flex-col divide-y divide-card-border/60">
                {entry.finalLeaderboard.map((p, index) => (
                  <li key={p.name} className="flex items-center justify-between px-5 py-3">
                    <span className="flex items-center gap-3">
                      <span className="font-mono-num text-xs text-muted">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-base text-foreground">{p.name}</span>
                    </span>
                    <span className="font-mono-num text-base font-bold text-foreground">
                      {p.score} pts
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto">
        <Button variant="secondary" onClick={onBack}>
          Kembali
        </Button>
      </div>
    </div>
  );
}
