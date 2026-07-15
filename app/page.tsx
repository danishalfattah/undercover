"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/store";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { SetupScreen } from "@/components/screens/SetupScreen";
import { RevealScreen } from "@/components/screens/RevealScreen";
import { SpeakingOrderScreen } from "@/components/screens/SpeakingOrderScreen";
import { VotingScreen } from "@/components/screens/VotingScreen";
import { EliminationScreen } from "@/components/screens/EliminationScreen";
import { MrWhiteGuessScreen } from "@/components/screens/MrWhiteGuessScreen";
import { RoundResultScreen } from "@/components/screens/RoundResultScreen";

export default function Page() {
  const state = useGameStore();
  const [showSetup, setShowSetup] = useState(false);

  switch (state.status) {
    case "SETUP":
      if (!showSetup) {
        return <HomeScreen onStart={() => setShowSetup(true)} />;
      }
      return (
        <SetupScreen
          onStart={(names, config) => {
            const ok = state.initGame({ names, config });
            if (ok) setShowSetup(false);
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
            state.resetToHome();
            setShowSetup(false);
          }}
        />
      );

    default:
      return null;
  }
}
