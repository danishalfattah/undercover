import { Button } from "@/components/ui/Button";

type HomeScreenProps = {
  onStart: () => void;
};

export function HomeScreen({ onStart }: HomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Undercover</h1>
        <p className="mt-2 text-slate-500">Game deduksi kata, satu perangkat digilir.</p>
      </div>
      <div className="w-full max-w-xs">
        <Button onClick={onStart}>Main</Button>
      </div>
    </div>
  );
}
