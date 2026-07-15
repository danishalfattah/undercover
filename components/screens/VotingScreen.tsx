"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PlayerList } from "@/components/ui/PlayerList";
import type { Player } from "@/lib/types";

type VotingScreenProps = {
  players: Player[];
  eliminationCandidates: string[];
  onEliminate: (id: string) => void;
  onRandomTieBreak: () => void;
  onSkipRound: () => void;
};

export function VotingScreen({
  players,
  eliminationCandidates,
  onEliminate,
  onRandomTieBreak,
  onSkipRound,
}: VotingScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isTieBreak = eliminationCandidates.length > 0;
  const votablePlayers = isTieBreak
    ? players.filter((p) => eliminationCandidates.includes(p.id))
    : players.filter((p) => p.isAlive);

  function handleSkip() {
    if (confirm("Lewati ronde ini? Tidak ada poin yang berubah.")) {
      onSkipRound();
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-6 py-8">
      <div className="animate-fade-up text-center">
        <span className="font-mono-num text-xs tracking-[0.3em] text-accent-soft">
          {isTieBreak ? "SERI TERDETEKSI" : "PEMUNGUTAN SUARA"}
        </span>
        <h2 className="font-display text-3xl font-bold text-foreground italic">
          {isTieBreak ? "Voting Ulang" : "Voting"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Pilih tersangka yang dieliminasi berdasarkan hasil voting kelompok.
        </p>
      </div>
      <PlayerList players={votablePlayers} onSelect={setSelectedId} selectedId={selectedId} />
      <div className="mt-auto flex flex-col gap-2">
        <Button
          variant="danger"
          onClick={() => selectedId && onEliminate(selectedId)}
          disabled={!selectedId}
        >
          Eliminasi
        </Button>
        {isTieBreak && (
          <Button variant="secondary" onClick={onRandomTieBreak}>
            Pilih Acak
          </Button>
        )}
        {!isTieBreak && (
          <Button variant="secondary" onClick={handleSkip}>
            Skip Ronde
          </Button>
        )}
      </div>
    </div>
  );
}
