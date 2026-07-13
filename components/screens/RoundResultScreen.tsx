import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Player, WinnerSide } from "@/lib/types";

const WINNER_LABEL: Record<NonNullable<WinnerSide>, string> = {
  CIVILIAN: "Civilian Menang!",
  IMPOSTOR: "Penyusup Menang!",
  MR_WHITE_GUESS: "Mr. White Menang!",
};

type RoundResultScreenProps = {
  players: Player[];
  winner: WinnerSide;
  onNewRound: () => void;
  onFinish: () => void;
};

export function RoundResultScreen({ players, winner, onNewRound, onFinish }: RoundResultScreenProps) {
  const ranking = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8">
      <h2 className="text-center text-2xl font-bold">{winner ? WINNER_LABEL[winner] : "Ronde Selesai"}</h2>
      <Card className="flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-500">Papan Peringkat</p>
        <ol className="flex flex-col gap-2">
          {ranking.map((p, index) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>
                {index + 1}. {p.name}
              </span>
              <span className="font-semibold">{p.score} pts</span>
            </li>
          ))}
        </ol>
      </Card>
      <div className="mt-auto flex flex-col gap-2">
        <Button onClick={onNewRound}>Ronde Baru</Button>
        <Button variant="secondary" onClick={onFinish}>
          Selesai
        </Button>
      </div>
    </div>
  );
}
