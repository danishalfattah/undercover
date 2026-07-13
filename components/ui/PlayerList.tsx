import type { Player } from "@/lib/types";

type PlayerListProps = {
  players: Player[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
};

export function PlayerList({ players, onSelect, selectedId }: PlayerListProps) {
  return (
    <ul className="flex flex-col gap-2" role="list">
      {players.map((player) => (
        <li key={player.id}>
          <button
            type="button"
            aria-pressed={selectedId === player.id}
            onClick={() => onSelect?.(player.id)}
            disabled={!onSelect}
            className={`min-h-11 w-full rounded-xl border px-4 py-3 text-left text-base font-medium transition-colors ${
              selectedId === player.id
                ? "border-accent-2 bg-indigo-50 text-accent-2"
                : "border-slate-200 bg-white text-foreground"
            } disabled:opacity-100`}
          >
            {player.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
