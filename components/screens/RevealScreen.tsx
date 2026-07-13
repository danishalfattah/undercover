"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Player } from "@/lib/types";

type RevealScreenProps = {
  players: Player[];
  revealIndex: number;
  onConfirmRevealed: () => void;
};

export function RevealScreen({ players, revealIndex, onConfirmRevealed }: RevealScreenProps) {
  const [handedOff, setHandedOff] = useState(false);
  const [holding, setHolding] = useState(false);
  const player = players[revealIndex];

  if (!player) return null;

  function handleNext() {
    setHandedOff(false);
    setHolding(false);
    onConfirmRevealed();
  }

  if (!handedOff) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-slate-500">Serahkan perangkat ke</p>
        <h2 className="text-3xl font-bold">{player.name}</h2>
        <div className="w-full max-w-xs">
          <Button onClick={() => setHandedOff(true)}>Saya {player.name}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-slate-500">Tekan dan tahan kartu untuk melihat kata</p>
      <Card
        className="flex h-56 w-full max-w-xs select-none items-center justify-center text-2xl font-bold"
        onPointerDown={() => setHolding(true)}
        onPointerUp={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
      >
        {holding ? (player.secretWord ?? "^^") : "•••••"}
      </Card>
      <div className="w-full max-w-xs">
        <Button onClick={handleNext}>Sudah, sembunyikan &amp; lanjut</Button>
      </div>
    </div>
  );
}
