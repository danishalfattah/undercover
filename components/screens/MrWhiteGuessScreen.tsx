"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
        <p className="text-slate-500">{mrWhite.name} menebak</p>
        <h2 className="text-2xl font-bold">&ldquo;{guessResult.guess}&rdquo;</h2>
        <Card className="w-full max-w-xs">
          <p className="text-2xl font-bold text-danger">Salah!</p>
        </Card>
        <div className="w-full max-w-xs">
          <Button onClick={onAcknowledgeGuess}>Lanjut</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-slate-500">{mrWhite.name} tereliminasi sebagai Mr. White</p>
      <h2 className="text-2xl font-bold">Tebak kata Civilian!</h2>
      <input
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        placeholder="Tulis tebakan..."
        className="min-h-11 w-full max-w-xs rounded-xl border border-slate-300 px-4 text-center text-lg"
      />
      <div className="w-full max-w-xs">
        <Button onClick={() => onSubmitGuess(guess)} disabled={!guess.trim()}>
          Kirim Tebakan
        </Button>
      </div>
    </div>
  );
}
