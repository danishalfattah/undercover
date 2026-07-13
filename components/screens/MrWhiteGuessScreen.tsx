"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Player } from "@/lib/types";

type MrWhiteGuessScreenProps = {
  mrWhite: Player | undefined;
  onSubmitGuess: (guess: string) => void;
};

export function MrWhiteGuessScreen({ mrWhite, onSubmitGuess }: MrWhiteGuessScreenProps) {
  const [guess, setGuess] = useState("");

  if (!mrWhite) return null;

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
