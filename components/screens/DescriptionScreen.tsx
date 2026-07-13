import { Button } from "@/components/ui/Button";
import type { Player } from "@/lib/types";

type DescriptionScreenProps = {
  players: Player[];
  currentTurnIndex: number;
  onNextTurn: () => void;
};

export function DescriptionScreen({ players, currentTurnIndex, onNextTurn }: DescriptionScreenProps) {
  const alivePlayers = players.filter((p) => p.isAlive).sort((a, b) => a.turnOrder - b.turnOrder);
  const currentPlayer = alivePlayers[currentTurnIndex];
  const isLastTurn = currentTurnIndex === alivePlayers.length - 1;

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8">
      <h2 className="text-2xl font-bold">Fase Deskripsi</h2>
      <ol className="flex flex-col gap-2">
        {alivePlayers.map((p, index) => (
          <li
            key={p.id}
            className={`flex min-h-11 items-center rounded-xl border px-4 text-base ${
              index === currentTurnIndex
                ? "border-accent-2 bg-indigo-50 font-semibold text-accent-2"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {index + 1}. {p.name}
          </li>
        ))}
      </ol>
      {currentPlayer && (
        <p className="text-center text-lg">
          Giliran: <span className="font-bold">{currentPlayer.name}</span>
        </p>
      )}
      <div className="mt-auto">
        <Button onClick={onNextTurn}>{isLastTurn ? "Lanjut ke Voting" : "Berikutnya"}</Button>
      </div>
    </div>
  );
}
