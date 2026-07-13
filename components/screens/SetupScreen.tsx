"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { recommendComposition, validateComposition } from "@/lib/gameLogic";
import type { GameConfig, RoleConfig, WordCategory } from "@/lib/types";

const CATEGORIES: (WordCategory | "Acak")[] = [
  "Acak",
  "Umum",
  "Makanan",
  "Minuman",
  "Hewan",
  "Tempat",
  "Profesi",
  "Objek",
  "Olahraga",
];

type SetupScreenProps = {
  onStart: (names: string[], config: GameConfig) => boolean;
};

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [playerCount, setPlayerCount] = useState(5);
  const [names, setNames] = useState<string[]>(Array(5).fill(""));
  const [composition, setComposition] = useState<RoleConfig>(recommendComposition(5));
  const [category, setCategory] = useState<WordCategory | "Acak">("Acak");
  const [error, setError] = useState<string | null>(null);

  function updatePlayerCount(next: number) {
    const clamped = Math.max(3, Math.min(20, next));
    setPlayerCount(clamped);
    setNames((prev) => {
      const copy = [...prev];
      copy.length = clamped;
      return copy.map((n) => n ?? "");
    });
    setComposition(recommendComposition(clamped));
  }

  const validation = useMemo(
    () => validateComposition(composition, playerCount),
    [composition, playerCount]
  );

  function handleStart() {
    const resolvedNames = names.map((n, i) => (n.trim() ? n.trim().slice(0, 12) : `Pemain ${i + 1}`));
    const config: GameConfig = { ...composition, category };
    const ok = onStart(resolvedNames, config);
    if (!ok) {
      setError("Konfigurasi tidak valid. Periksa kembali komposisi peran.");
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
      <h2 className="text-2xl font-bold">Setup Permainan</h2>

      <Card className="flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-600">Jumlah Pemain</label>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            className="w-12"
            onClick={() => updatePlayerCount(playerCount - 1)}
            aria-label="Kurangi jumlah pemain"
          >
            −
          </Button>
          <span className="min-w-[3ch] text-center text-xl font-semibold">{playerCount}</span>
          <Button
            variant="secondary"
            className="w-12"
            onClick={() => updatePlayerCount(playerCount + 1)}
            aria-label="Tambah jumlah pemain"
          >
            +
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-600">Nama Pemain</label>
        {names.map((name, index) => (
          <input
            key={index}
            value={name}
            maxLength={12}
            placeholder={`Pemain ${index + 1}`}
            onChange={(e) => {
              const copy = [...names];
              copy[index] = e.target.value;
              setNames(copy);
            }}
            className="min-h-11 rounded-xl border border-slate-300 px-4 text-base"
          />
        ))}
      </Card>

      <Card className="flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-600">Komposisi Peran</label>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="font-semibold">{composition.civilianCount}</div>
            <div className="text-slate-500">Civilian</div>
          </div>
          <div>
            <div className="font-semibold">{composition.undercoverCount}</div>
            <div className="text-slate-500">Undercover</div>
          </div>
          <div>
            <div className="font-semibold">{composition.mrWhiteCount}</div>
            <div className="text-slate-500">Mr. White</div>
          </div>
        </div>
        {!validation.valid && (
          <p className="text-sm text-danger" role="alert">
            {validation.reason}
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-600" htmlFor="category">
          Kategori
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as WordCategory | "Acak")}
          className="min-h-11 rounded-xl border border-slate-300 px-4 text-base"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Card>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="mt-auto pt-2">
        <Button onClick={handleStart} disabled={!validation.valid}>
          Mulai
        </Button>
      </div>
    </div>
  );
}
