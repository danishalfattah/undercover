"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { MrWhiteGuessResult, Player } from "@/lib/types";

type MrWhiteGuessScreenProps = {
  mrWhite: Player | undefined;
  guessResult: MrWhiteGuessResult | null;
  onSubmitGuess: (guess: string) => void;
  onAcknowledgeGuess: () => void;
};

export function MrWhiteGuessScreen({
  mrWhite,
  guessResult,
  onSubmitGuess,
  onAcknowledgeGuess,
}: MrWhiteGuessScreenProps) {
  const [guess, setGuess] = useState("");

  if (!mrWhite) return null;

  if (guessResult && !guessResult.correct) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="font-mono-num text-xs tracking-[0.3em] text-accent-soft">
          TEBAKAN {mrWhite.name.toUpperCase()}
        </span>
        <h2 className="font-display text-2xl font-bold text-foreground italic">
          &ldquo;{guessResult.guess}&rdquo;
        </h2>
        <div className="animate-stamp dossier-edge flex w-full max-w-xs items-center justify-center border-2 border-danger/70 bg-card px-6 py-8 rotate-2">
          <p className="font-display text-3xl font-bold tracking-wide text-danger uppercase">Salah!</p>
        </div>
        <div className="w-full max-w-xs pt-2">
          <Button onClick={onAcknowledgeGuess}>Lanjut</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="font-mono-num text-xs tracking-[0.3em] text-accent-soft">
        {mrWhite.name.toUpperCase()} TERSINGKAP SEBAGAI MR. WHITE
      </span>
      <h2 className="font-display text-3xl font-bold text-foreground italic">Tebak Kata Civilian</h2>
      <input
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        placeholder="Tulis tebakan..."
        className="min-h-12 w-full max-w-xs rounded-sm border border-card-border bg-card px-4 text-center text-lg text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
      />
      <div className="w-full max-w-xs">
        <Button onClick={() => onSubmitGuess(guess)} disabled={!guess.trim()}>
          Kirim Tebakan
        </Button>
      </div>
    </div>
  );
}
