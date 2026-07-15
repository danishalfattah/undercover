import { Button } from "@/components/ui/Button";

type HomeScreenProps = {
  onStart: () => void;
};

export function HomeScreen({ onStart }: HomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 text-center">
      <div className="animate-fade-up flex flex-col items-center gap-4">
        <span className="font-mono-num text-xs tracking-[0.4em] text-accent-soft">
          FILE NO. UC-01
        </span>

        <div className="relative">
          <h1 className="font-display text-6xl font-bold tracking-tight text-foreground italic">
            Undercover
          </h1>
          <div className="mt-2 h-px w-full bg-card-border" />
        </div>

        <p
          className="mt-1 -rotate-2 border-2 border-danger/70 px-3 py-1 text-xs font-bold tracking-[0.3em] text-danger uppercase"
          aria-hidden="true"
        >
          Rahasia
        </p>

        <p className="max-w-xs text-sm text-muted">
          Game deduksi kata. Satu perangkat, digilir antar tersangka.
        </p>
      </div>

      <div className="w-full max-w-xs animate-fade-up" style={{ animationDelay: "120ms" }}>
        <Button onClick={onStart}>Buka Berkas</Button>
      </div>
    </div>
  );
}
