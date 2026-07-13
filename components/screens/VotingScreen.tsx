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
};

export function VotingScreen({
  players,
  eliminationCandidates,
  onEliminate,
  onRandomTieBreak,
}: VotingScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isTieBreak = eliminationCandidates.length > 0;
  const votablePlayers = isTieBreak
    ? players.filter((p) => eliminationCandidates.includes(p.id))
    : players.filter((p) => p.isAlive);

  return (
    <div className="flex flex-1 flex-col gap-4 px-6 py-8">
      <h2 className="text-2xl font-bold">{isTieBreak ? "Voting Ulang (Seri)" : "Voting"}</h2>
      <p className="text-slate-500">Pilih pemain yang dieliminasi berdasarkan hasil voting kelompok.</p>
      <PlayerList players={votablePlayers} onSelect={setSelectedId} selectedId={selectedId} />
      <div className="mt-auto flex flex-col gap-2">
        <Button onClick={() => selectedId && onEliminate(selectedId)} disabled={!selectedId}>
          Eliminasi
        </Button>
        {isTieBreak && (
          <Button variant="secondary" onClick={onRandomTieBreak}>
            Pilih Acak
          </Button>
        )}
      </div>
    </div>
  );
}
