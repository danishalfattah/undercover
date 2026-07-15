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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-bold tracking-[0.2em] text-accent-soft uppercase">
      {children}
    </label>
  );
}

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

  /** Adjust undercoverCount or mrWhiteCount; civilianCount absorbs the remainder. */
  function updateRoleCount(role: "undercoverCount" | "mrWhiteCount", delta: number) {
    setComposition((prev) => {
      const nextValue = Math.max(0, prev[role] + delta);
      const updated = { ...prev, [role]: nextValue };
      updated.civilianCount = playerCount - updated.undercoverCount - updated.mrWhiteCount;
      return updated;
    });
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
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-8">
      <div className="mb-2">
        <span className="font-mono-num text-xs tracking-[0.3em] text-accent-soft">DAFTAR KASUS</span>
        <h2 className="font-display text-3xl font-bold text-foreground">Setup Berkas</h2>
      </div>

      <Card className="flex flex-col gap-3">
        <FieldLabel>Jumlah Tersangka</FieldLabel>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => updatePlayerCount(playerCount - 1)}
            aria-label="Kurangi jumlah pemain"
            className="flex h-11 w-11 items-center justify-center rounded-sm border-2 border-card-border text-lg text-foreground active:bg-black/5"
          >
            −
          </button>
          <span className="font-mono-num min-w-[3ch] flex-1 text-center text-3xl font-bold text-foreground">
            {playerCount}
          </span>
          <button
            type="button"
            onClick={() => updatePlayerCount(playerCount + 1)}
            aria-label="Tambah jumlah pemain"
            className="flex h-11 w-11 items-center justify-center rounded-sm border-2 border-card-border text-lg text-foreground active:bg-black/5"
          >
            +
          </button>
        </div>
      </Card>

      <Card className="flex flex-col gap-2">
        <FieldLabel>Nama Tersangka</FieldLabel>
        {names.map((name, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="font-mono-num w-6 shrink-0 text-right text-xs text-muted">
              {String(index + 1).padStart(2, "0")}
            </span>
            <input
              value={name}
              maxLength={12}
              placeholder={`Pemain ${index + 1}`}
              onChange={(e) => {
                const copy = [...names];
                copy[index] = e.target.value;
                setNames(copy);
              }}
              className="min-h-11 flex-1 rounded-sm border border-card-border bg-transparent px-3 text-base text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
            />
          </div>
        ))}
      </Card>

      <Card className="flex flex-col gap-3">
        <FieldLabel>Komposisi Peran</FieldLabel>

        <div className="flex items-center justify-between border-b border-card-border/60 pb-3">
          <span className="text-sm text-foreground">Civilian</span>
          <span className="font-mono-num min-w-[2ch] text-center text-lg font-bold text-foreground">
            {composition.civilianCount}
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-card-border/60 pb-3">
          <span className="text-sm text-foreground">Undercover</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateRoleCount("undercoverCount", -1)}
              aria-label="Kurangi jumlah Undercover"
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-card-border text-sm active:bg-black/5"
            >
              −
            </button>
            <span className="font-mono-num min-w-[2ch] text-center text-lg font-bold text-foreground">
              {composition.undercoverCount}
            </span>
            <button
              type="button"
              onClick={() => updateRoleCount("undercoverCount", 1)}
              aria-label="Tambah jumlah Undercover"
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-card-border text-sm active:bg-black/5"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">Mr. White</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateRoleCount("mrWhiteCount", -1)}
              aria-label="Kurangi jumlah Mr. White"
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-card-border text-sm active:bg-black/5"
            >
              −
            </button>
            <span className="font-mono-num min-w-[2ch] text-center text-lg font-bold text-foreground">
              {composition.mrWhiteCount}
            </span>
            <button
              type="button"
              onClick={() => updateRoleCount("mrWhiteCount", 1)}
              aria-label="Tambah jumlah Mr. White"
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-card-border text-sm active:bg-black/5"
            >
              +
            </button>
          </div>
        </div>

        {!validation.valid && (
          <p className="text-sm text-danger" role="alert">
            {validation.reason}
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-2">
        <label htmlFor="category" className="text-xs font-bold tracking-[0.2em] text-accent-soft uppercase">
          Kategori Kata
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as WordCategory | "Acak")}
          className="min-h-11 rounded-sm border border-card-border bg-transparent px-3 text-base text-foreground focus:border-accent focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-card text-foreground">
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
          Mulai Investigasi
        </Button>
      </div>
    </div>
  );
}
