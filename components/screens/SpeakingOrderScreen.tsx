"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Player } from "@/lib/types";

type SpeakingOrderScreenProps = {
  players: Player[];
  onGoToVoting: () => void;
  onSkipRound: () => void;
};

export function SpeakingOrderScreen({ players, onGoToVoting, onSkipRound }: SpeakingOrderScreenProps) {
  const alivePlayers = players.filter((p) => p.isAlive).sort((a, b) => a.turnOrder - b.turnOrder);

  // Player currently confirming their identity before their word is shown again (local, not in store).
  const [confirmingPlayerId, setConfirmingPlayerId] = useState<string | null>(null);
  // Player whose word is currently being shown (only after identity confirmation).
  const [revealingPlayerId, setRevealingPlayerId] = useState<string | null>(null);

  function handleSkip() {
    if (confirm("Lewati ronde ini? Tidak ada poin yang berubah.")) {
      onSkipRound();
    }
  }

  const confirmingPlayer = confirmingPlayerId ? players.find((p) => p.id === confirmingPlayerId) : null;
  const revealingPlayer = revealingPlayerId ? players.find((p) => p.id === revealingPlayerId) : null;

  // Step 2: word shown, only after identity confirmation.
  if (revealingPlayer) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="font-mono-num text-xs tracking-[0.3em] text-accent-soft">
          UNTUK {revealingPlayer.name.toUpperCase()} SEORANG
        </span>
        <div className="dossier-edge flex h-56 w-72 flex-col items-center justify-center gap-3 border border-card-border bg-card px-6 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)]">
          <span className="text-[10px] tracking-[0.4em] text-danger uppercase">Rahasia</span>
          <p className="font-display text-3xl font-bold text-foreground italic">
            {revealingPlayer.secretWord ?? "Mr. White"}
          </p>
          <div className="h-px w-16 bg-card-border" />
          <span className="font-mono-num text-[10px] text-muted">KATA DIINGAT KEMBALI</span>
        </div>
        <div className="w-full max-w-xs">
          <Button onClick={() => setRevealingPlayerId(null)}>Tutup &amp; Kembali</Button>
        </div>
      </div>
    );
  }

  // Step 1: confirm identity before showing the word.
  if (confirmingPlayer) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-sm text-muted">Serahkan perangkat ke</p>
        <h2 className="font-display text-3xl font-bold text-foreground italic">{confirmingPlayer.name}</h2>
        <div className="flex w-full max-w-xs flex-col gap-2">
          <Button
            onClick={() => {
              setRevealingPlayerId(confirmingPlayer.id);
              setConfirmingPlayerId(null);
            }}
          >
            Saya {confirmingPlayer.name}
          </Button>
          <Button variant="secondary" onClick={() => setConfirmingPlayerId(null)}>
            Batal
          </Button>
        </div>
      </div>
    );
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
          <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-4">
              <span className="font-mono-num text-lg font-bold text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-base text-foreground">{p.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setConfirmingPlayerId(p.id)}
              className="font-mono-num text-xs tracking-[0.15em] text-accent-soft underline uppercase"
            >
              Lupa Kata
            </button>
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
