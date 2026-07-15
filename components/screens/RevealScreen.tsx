"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Player, RevealCard } from "@/lib/types";

type RevealScreenProps = {
  players: Player[];
  revealCards: RevealCard[];
  revealPickIndex: number;
  onPickCard: (cardIndex: number) => void;
};

export function RevealScreen({ players, revealCards, revealPickIndex, onPickCard }: RevealScreenProps) {
  // The card the current player has tapped but not yet confirmed (local, not in store).
  const [openCardIndex, setOpenCardIndex] = useState<number | null>(null);
  const currentPlayer = players[revealPickIndex];

  if (!currentPlayer) return null;

  const openCard = openCardIndex !== null ? revealCards[openCardIndex] : null;

  function handleConfirm() {
    if (openCardIndex === null) return;
    const index = openCardIndex;
    setOpenCardIndex(null);
    onPickCard(index);
  }

  // Showing the tapped card's word to the current player.
  if (openCard) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="font-mono-num text-xs tracking-[0.3em] text-accent-soft">
          UNTUK {currentPlayer.name.toUpperCase()} SEORANG
        </span>
        <div className="animate-flip perspective-midrange">
          <div className="dossier-edge flex h-56 w-72 flex-col items-center justify-center gap-3 border border-card-border bg-card px-6 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)]">
            <span className="text-[10px] tracking-[0.4em] text-danger uppercase">Rahasia</span>
            <p className="font-display text-3xl font-bold text-foreground italic">
              {openCard.secretWord ?? "Mr. White"}
            </p>
            <div className="h-px w-16 bg-card-border" />
            <span className="font-mono-num text-[10px] text-muted">
              KARTU {String(openCard.index + 1).padStart(2, "0")}
            </span>
          </div>
        </div>
        <div className="w-full max-w-xs">
          <Button onClick={handleConfirm}>Tutup &amp; Lanjut</Button>
        </div>
      </div>
    );
  }

  // Grid of face-down cards for the current player to choose from.
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8">
      <div className="animate-fade-up text-center">
        <span className="font-mono-num text-xs tracking-[0.3em] text-accent-soft">
          GILIRAN MENGAMBIL KARTU
        </span>
        <h2 className="font-display text-3xl font-bold text-foreground italic">{currentPlayer.name}</h2>
        <p className="mt-1 text-sm text-muted">Pilih satu kartu tersegel</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {revealCards.map((card) => {
          const taken = card.takenByPlayerId !== null;
          return (
            <button
              key={card.index}
              type="button"
              disabled={taken}
              onClick={() => setOpenCardIndex(card.index)}
              className={`dossier-edge flex aspect-3/4 flex-col items-center justify-center gap-2 border transition-all ${
                taken
                  ? "border-card-border/50 bg-card/40 text-card-border"
                  : "border-accent/60 bg-card text-accent active:scale-[0.97] active:border-accent"
              }`}
              aria-label={taken ? "Kartu sudah diambil" : `Kartu ${card.index + 1}`}
            >
              {taken ? (
                <span className="text-2xl">✓</span>
              ) : (
                <>
                  <span className="font-mono-num text-[10px] tracking-[0.3em] opacity-70">
                    KARTU {String(card.index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-4xl font-bold italic">?</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
