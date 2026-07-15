import type { Player } from "@/lib/types";

type PlayerListProps = {
  players: Player[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
};

export function PlayerList({ players, onSelect, selectedId }: PlayerListProps) {
  return (
    <ul className="flex flex-col gap-2" role="list">
      {players.map((player, index) => (
        <li key={player.id}>
          <button
            type="button"
            aria-pressed={selectedId === player.id}
            onClick={() => onSelect?.(player.id)}
            disabled={!onSelect}
            className={`flex min-h-12 w-full items-center gap-3 rounded-sm border px-4 py-3 text-left text-base transition-colors ${
              selectedId === player.id
                ? "border-accent bg-accent/10 text-accent"
                : "border-card-border bg-card text-foreground"
            } disabled:opacity-100`}
          >
            <span className="font-mono-num text-xs text-muted">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="font-medium">{player.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
