"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useGameStore } from "@/lib/store";
import { loadActiveSession, loadHistory, saveActiveSession } from "@/lib/persistence";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { SetupScreen } from "@/components/screens/SetupScreen";
import { RevealScreen } from "@/components/screens/RevealScreen";
import { SpeakingOrderScreen } from "@/components/screens/SpeakingOrderScreen";
import { VotingScreen } from "@/components/screens/VotingScreen";
import { EliminationScreen } from "@/components/screens/EliminationScreen";
import { MrWhiteGuessScreen } from "@/components/screens/MrWhiteGuessScreen";
import { RoundResultScreen } from "@/components/screens/RoundResultScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";

function subscribeNever() {
  return () => {};
}

/**
 * Static export prerenders HomeScreen server-side with no localStorage access.
 * useSyncExternalStore reports `false` for that prerendered snapshot and for
 * React's client hydration pass (keeping them identical, so no mismatch), then
 * `true` on the following client-only render — the correct way to gate
 * browser-only reads without triggering a hydration warning or an effect-based
 * setState.
 */
function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}

export default function Page() {
  const state = useGameStore();
  const [showSetup, setShowSetup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const mounted = useHasMounted();
  // Bumping this forces a re-render so the next loadActiveSession() read
  // reflects a save we just cleared (initGame/finishSession), without storing
  // the session itself in React state.
  const [, setSessionVersion] = useState(0);
  const savedSession = mounted ? loadActiveSession() : null;

  useEffect(() => {
    if (!mounted) return;
    if (state.status === "SETUP" && state.players.length === 0) return; // no active session to save
    saveActiveSession(state);
  }, [state, mounted]);

  switch (state.status) {
    case "SETUP":
      if (showHistory) {
        return <HistoryScreen entries={loadHistory()} onBack={() => setShowHistory(false)} />;
      }
      if (!showSetup) {
        return (
          <HomeScreen
            onStart={() => setShowSetup(true)}
            onShowHistory={() => setShowHistory(true)}
            savedSessionInfo={
              savedSession
                ? { playerCount: savedSession.seatOrder.length, roundNumber: savedSession.roundNumber }
                : null
            }
            onResume={() => {
              if (!savedSession) return;
              state.resumeSession(savedSession);
            }}
          />
        );
      }
      return (
        <SetupScreen
          onStart={(names, config) => {
            const ok = state.initGame({ names, config });
            if (ok) {
              setShowSetup(false);
              setSessionVersion((v) => v + 1);
            }
            return ok;
          }}
        />
      );

    case "REVEAL":
      return (
        <RevealScreen
          players={state.players}
          revealCards={state.revealCards}
          revealPickIndex={state.revealPickIndex}
          onPickCard={state.pickRevealCard}
        />
      );

    case "SPEAKING_ORDER":
      return (
        <SpeakingOrderScreen
          players={state.players}
          onGoToVoting={state.goToVoting}
          onSkipRound={state.skipRound}
        />
      );

    case "VOTING":
      return (
        <VotingScreen
          players={state.players}
          eliminationCandidates={state.eliminationCandidates}
          onEliminate={state.eliminatePlayer}
          onRandomTieBreak={state.randomTieBreak}
          onSkipRound={state.skipRound}
        />
      );

    case "ELIMINATION":
      return (
        <EliminationScreen
          players={state.players}
          lastEliminatedId={state.lastEliminatedId}
          onContinue={state.acknowledgeElimination}
        />
      );

    case "MR_WHITE_GUESS":
      return (
        <MrWhiteGuessScreen
          mrWhite={state.players.find((p) => p.id === state.lastEliminatedId)}
          guessResult={state.mrWhiteGuessResult}
          onSubmitGuess={state.submitMrWhiteGuess}
          onAcknowledgeGuess={state.acknowledgeMrWhiteGuess}
        />
      );

    case "ROUND_RESULT":
    case "FINISHED":
      return (
        <RoundResultScreen
          players={state.players}
          winner={state.winner}
          wordPair={state.wordPair}
          mrWhiteGuessResult={state.mrWhiteGuessResult}
          onNewRound={state.startNewRound}
          onFinish={() => {
            state.finishSession();
            setShowSetup(false);
            setSessionVersion((v) => v + 1);
          }}
        />
      );

    default:
      return null;
  }
}
