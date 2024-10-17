// BEGINNING OF SECTION ALPHA

import React, { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const OhHellMonteCarlo = () => {
  // You see, self, we're using React hooks here to manage the component's state.
  // These state variables will help us track the progress and results of our simulation.
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [simulationData, setSimulationData] = useState([]);

  // Now, self, this is the main simulation function. It's wrapped in useCallback to optimize performance.
  const runSimulation = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setResults(null);
    setError(null);
    setSimulationData([]);

    const simulationLogs = [];

    try {
      // You see, we're setting up some parameters for our simulation here.
      const minPlayers = 4, maxPlayers = 7, minRounds = 1, maxRounds = 13, numSimulations = 1000;
      const strategies = { basic: new BasicStrategy(), advanced: new AdvancedStrategy() };
      const results = { basic: [], advanced: [] };

      for (let simNum = 0; simNum < numSimulations; simNum++) {
        for (let numPlayers = minPlayers; numPlayers <= maxPlayers; numPlayers++) {
          const maxCards = Math.min(Math.floor(52 / numPlayers), 13);
          for (let numRounds = minRounds; numRounds <= Math.min(maxRounds, maxCards); numRounds++) {
            for (const [strategyName, strategy] of Object.entries(strategies)) {
              const game = new Game(numPlayers, numRounds);
              
              for (let decrement = 0; decrement < numRounds; decrement++) {

                for (let roundNum = 0; roundNum < numRounds; roundNum++) {
                  if (roundNum - decrement < 0) {
                    continue;
                  }

                  let decrement_for_play = decrement;
                  if (strategyName === 'basic') {
                    decrement_for_play = 0;
                  }

                  game.dealCards(roundNum+1);
                  game.setTrump();

                  const roundData = {
                    simulation: simNum,
                    strategy: strategyName,
                    num_players: numPlayers,
                    num_rounds: numRounds,
                    current_round: roundNum + 1,
                    player_hands: game.players.map(player => player.hand),
                    player_bids: [],
                    trump_suit: game.getTrump(),
                    advanced_strategy_decrement: decrement_for_play
                  };

                  // Bidding phase
                  for (let player = 0; player < numPlayers; player++) {
                    const bid = strategy.bid(
                      game.getPlayerHand(player),
                      game.getTrump(),
                      game.getNumCards(),
                      player,
                      game.getTotalBids(),
                      numPlayers,
                      decrement_for_play
                    );
                    game.placeBid(player, bid);
                    roundData.player_bids.push(bid);
                  }

                  // Playing phase
                  for (let trickNum = 0; trickNum < game.getNumCards(); trickNum++) {
                    const trickData = { ...roundData, trick_number: trickNum + 1, trick_action: [] };

                    for (let player = 0; player < numPlayers; player++) {
                      const card = strategy.play(
                        game.getPlayerHand(player),
                        game.getTrickCards(),
                        game.getTrump(),
                        game.getPlayerBid(player),
                        game.getPlayerTricks(player),
                        game.getNumCards()
                      );
                      game.playCard(player, card);
                      trickData.trick_action.push([player, card]);
                    }

                    const winner = game.evaluateTrick();
                    game.awardTrick(winner);
                    trickData.trick_winner = winner;

                    simulationData.push(trickData);
                  }

                  game.scoreRound();
                }

                results[strategyName].push(game.getFinalScores());
              }
            }
          }
        }

        // Update progress after each simulation
        setProgress((simNum + 1) / numSimulations * 100);
        // Allow UI to update between simulations
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      const analysisResult = analyzeResults(results);
      if (!analysisResult) throw new Error("Analysis failed to produce valid results");
      setResults(analysisResult);
      setSimulationData(simulationData);
    } catch (err) {
      console.error("Simulation error:", err);
      setError(err.message || "An unexpected error occurred during simulation");
    } finally {
      setIsRunning(false);
    }
  }, []);

  const downloadCSV = () => {
    const headers = Object.keys(simulationData[0]);
    let csvContent = headers.join(',') + '\n';

    simulationData.forEach(data => {
      let row = headers.map(header => {
        let cell = data[header];
        if (Array.isArray(cell)) {
          return '"' + JSON.stringify(cell).replace(/"/g, '""') + '"';
        }
        return cell;
      }).join(',');
      csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'oh_hell_simulation_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // You see, self, this function plays a single game with a given strategy
  const playGame = (game, strategy, logs, strategyName) => {
    logs.push(`\nGame start for ${strategyName} strategy:`);
    for (let round = 0; round < game.numRounds; round++) {
      logs.push(`\nRound ${round + 1}:`);
      playRound(game, strategy, logs);
    }
    const finalScores = game.getFinalScores();
    logs.push(`Game end. Final scores: ${finalScores.join(', ')}`);
    return finalScores;
  };

// END OF SECTION ALPHA

 // BEGINNING OF SECTION BRAVO

  // This function, self, simulates a single round of the game
  const playRound = (game, strategy, logs) => {
    game.dealCards();
    game.setTrump();
    logs.push(`Trump suit: ${game.getTrump()}`);

    logs.push("Bidding phase:");
    for (let player = 0; player < game.numPlayers; player++) {
      const hand = game.getPlayerHand(player);
      const bid = strategy.bid(hand, game.getTrump(), game.getNumCards(), player, game.getTotalBids(), game.numPlayers);
      game.placeBid(player, bid);
      logs.push(`Player ${player} hand: ${hand.join(', ')} - Bid: ${bid}`);
    }

    logs.push("Playing phase:");
    for (let trick = 0; trick < game.getNumCards(); trick++) {
      logs.push(`Trick ${trick + 1}:`);
      for (let player = 0; player < game.numPlayers; player++) {
        const card = strategy.play(
          game.getPlayerHand(player),
          game.getTrickCards(),
          game.getTrump(),
          game.getPlayerBid(player),
          game.getPlayerTricks(player),
          game.getNumCards()
        );
        game.playCard(player, card);
        logs.push(`Player ${player} played: ${card}`);
      }
      const winner = game.evaluateTrick();
      game.awardTrick(winner);
      logs.push(`Trick won by Player ${winner}`);
    }

    game.scoreRound();
    logs.push(`Round scores: ${game.players.map(p => p.score).join(', ')}`);
  };

  // Now, self, this function analyzes the results of our simulations
  const analyzeResults = (results) => {
    const analysis = {};
    for (const [strategyName, scores] of Object.entries(results)) {
      if (!Array.isArray(scores) || scores.length === 0) {
        console.error(`Invalid data for ${strategyName} strategy`);
        return null;
      }
      const wins = scores.filter(sc => Array.isArray(sc) && sc.length > 0 && sc[0] === Math.max(...sc.flat())).length;
      const flatScores = scores.flat();
      analysis[strategyName] = {
        meanScore: flatScores.reduce((a, b) => a + b, 0) / flatScores.length,
        medianScore: calculateMedian(flatScores),
        standardDeviation: calculateStandardDeviation(flatScores),
        winRate: (wins / scores.length) * 100
      };
    }
    return analysis;
  };

  // You see, self, these are helper functions for our statistical calculations
  const calculateMedian = (arr) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const calculateStandardDeviation = (arr) => {
    const mean = arr.reduce((a, b) => a + b) / arr.length;
    return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / arr.length);
  };

  // This little function helps us format numbers nicely
  const formatNumber = (num) => {
    return typeof num === 'number' && !isNaN(num) ? num.toFixed(2) : 'N/A';
  };

  // const downloadLogs = () => {
  //   // You see, self, we're splitting our logs into smaller chunks here
  //   const maxChunkSize = Math.ceil(logs.join('\n').length / 20);  // One-20th of the current size
  //   const chunks = [];
  //   let currentChunk = "";
  
  //   for (const log of logs) {
  //     if ((currentChunk + log + '\n').length > maxChunkSize) {
  //       chunks.push(currentChunk);
  //       currentChunk = "";
  //     }
  //     currentChunk += log + '\n';
  //   }
  //   if (currentChunk) chunks.push(currentChunk);
  
  //   // Now, self, we're using our alpha, bravo, charlie ordering as suffixes
  //   const suffixes = [
  //     'alpha',   'bravo',    'charlie', 'delta',  'echo',     'foxtrot',
  //     'golf',    'hotel',    'india',   'juliet', 'kilo',     'lima',
  //     'mike',    'november', 'oscar',   'papa',   'quebec',   'romeo',
  //     'sierra',  'tango',    'uniform', 'victor', 'whiskey',  'xray',
  //     'yankee',  'zulu'
  //   ];

  //   chunks.forEach((chunk, index) => {
  //     const blob = new Blob([chunk], { type: 'text/plain' });
  //     const url = URL.createObjectURL(blob);
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.download = `oh-hell-simulation-logs-${suffixes[index]}.txt`;
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //     URL.revokeObjectURL(url);
  //   });
  // };

  // Now, self, this is the JSX for our component's UI
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Oh Hell Monte Carlo Simulation</h2>
      <button 
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2" 
        onClick={runSimulation} 
        disabled={isRunning}
      >
        {isRunning ? 'Running...' : 'Run Simulation'}
      </button>
      {simulationData.length > 0 && (
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={downloadCSV}
        >
          Download CSV
        </button>
      )}
      {isRunning && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="mt-2">Progress: {formatNumber(progress)}%</p>
        </div>
      )}
      {error && (
        <div className="mt-4 text-red-500">
          Error: {error}
        </div>
      )}
      {results && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Results:</h3>
          {Object.entries(results).map(([strategy, stats]) => (
            <div key={strategy} className="mb-4">
              <h4 className="text-lg font-medium">{strategy} Strategy:</h4>
              <p>Win Rate: {formatNumber(stats.winRate)}%</p>
              <p>Mean Score: {formatNumber(stats.meanScore)}</p>
              <p>Median Score: {formatNumber(stats.medianScore)}</p>
              <p>Standard Deviation: {formatNumber(stats.standardDeviation)}</p>
            </div>
          ))}
          <div className="mt-4">
            <h4 className="text-lg font-medium mb-2">Score Distribution:</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={Object.entries(results).flatMap(([s, st]) => 
                [{name: s, score: st.meanScore, type: 'Mean'},
                 {name: s, score: st.medianScore, type: 'Median'}]
              )}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#8884d8" name="Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

// END OF SECTION BRAVO

// BEGINNING OF SECTION CHARLIE

// You see, self, this Game class represents the state and rules of our Oh Hell game
class Game {
  constructor(numPlayers, numRounds) {
    this.numPlayers = numPlayers;
    this.numRounds = numRounds;
    this.players = Array(numPlayers).fill().map(() => new Player());
    this.deck = new Deck();
    this.trump = null;
    this.currentTrick = [];
    this.round = 0;
  }

  // This method, self, deals cards to all players
  dealCards(numCards) {
    this.deck.shuffle();
    this.players.forEach(player => { player.hand = this.deck.deal(numCards); });
  }

  // You see, this sets the trump suit for the round
  setTrump() { 
    this.trump = Math.floor(Math.random() * 4); 
  }

  // This method allows a player to place a bid
  placeBid(playerIndex, bid) { 
    this.players[playerIndex].bid = bid; 
  }

  // And this one, self, is for playing a card
  playCard(playerIndex, card) { 
    this.players[playerIndex].playCard(card); 
    this.currentTrick.push([playerIndex, card]); 
  }

  // Now, this method evaluates who won the trick
  evaluateTrick() {
    let winningCard = this.currentTrick[0];
    for (let i = 1; i < this.currentTrick.length; i++) {
      if (this.isCardBetter(this.currentTrick[i][1], winningCard[1])) {
        winningCard = this.currentTrick[i];
      }
    }
    return winningCard[0];
  }

  // You see, self, this helper method compares two cards
  isCardBetter(card1, card2) {
    if (Math.floor(card1 / 13) === this.trump && Math.floor(card2 / 13) !== this.trump) return true;
    if (Math.floor(card1 / 13) === Math.floor(card2 / 13)) return card1 % 13 > card2 % 13;
    return false;
  }

  // This method awards the trick to the winning player
  awardTrick(winnerIndex) { 
    this.players[winnerIndex].tricks += 1; 
    this.currentTrick = []; 
  }

  // And this one, self, scores the round for all players
  scoreRound() {
    this.players.forEach(player => {
      if (player.bid === player.tricks) {
        player.score += 10 + player.tricks;
      } else {
        player.score += player.tricks;
      }
      player.bid = 0;
      player.tricks = 0;
    });
  }

  // These are getter methods, self. They help us access game state
  getFinalScores() { return this.players.map(player => player.score); }
  getPlayerHand(playerIndex) { return this.players[playerIndex].hand; }
  getTrump() { return this.trump; }
  getNumCards() { return this.players[0].hand.length; }
  getTotalBids() { return this.players.reduce((sum, player) => sum + player.bid, 0); }
  getPlayerBid(playerIndex) { return this.players[playerIndex].bid; }
  getPlayerTricks(playerIndex) { return this.players[playerIndex].tricks; }
  getTrickCards() { return this.currentTrick.map(([_, card]) => card); }

  // This method creates a deep copy of the game state
  copy() {
    const gameCopy = new Game(this.numPlayers, this.numRounds);
    gameCopy.players = this.players.map(player => player.copy());
    gameCopy.trump = this.trump;
    gameCopy.currentTrick = [...this.currentTrick];
    gameCopy.round = this.round;
    return gameCopy;
  }
}

// You see, self, this Player class represents each player in our game
class Player {
  constructor() { 
    this.hand = []; 
    this.bid = 0; 
    this.tricks = 0; 
    this.score = 0; 
  }

  playCard(card) { 
    const index = this.hand.indexOf(card); 
    if (index > -1) this.hand.splice(index, 1); 
  }

  copy() {
    const playerCopy = new Player();
    playerCopy.hand = [...this.hand];
    playerCopy.bid = this.bid;
    playerCopy.tricks = this.tricks;
    playerCopy.score = this.score;
    return playerCopy;
  }
}

// Now, self, this Deck class represents our deck of cards
class Deck {
  constructor() { 
    this.cards = Array.from({length: 52}, (_, i) => i); 
  }

  shuffle() {
    for (let shuffle_count = 0; shuffle_count < 7; shuffle_count++) {
      for (let i = this.cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
      }
    }
  }

  deal(numCards) { 
    return this.cards.splice(0, numCards); 
  }
}

// END OF SECTION CHARLIE

// BEGINNING OF SECTION DELTA

// You see, self, this BasicStrategy class implements a simple strategy for bidding and playing
class BasicStrategy {
  bid(hand, trump, numCards, playerPosition, totalBids, numPlayers, decrement) {
    const trumpCount = hand.filter(card => Math.floor(card / 13) === trump).length;
    const highCardCount = hand.filter(card => card % 13 >= 10).length;
    let bid = Math.round(trumpCount + highCardCount * 0.5);
    if (playerPosition === numPlayers - 1) {
      const targetBids = numCards;
      if (totalBids + bid === targetBids) bid += Math.random() < 0.5 ? -1 : 1;
    }
    return Math.max(0, Math.min(bid, numCards));
  }

  play(hand, trickCards, trump, playerBid, playerTricks, numCards) {
    if (trickCards.length === 0) return playerTricks < playerBid ? Math.max(...hand) : Math.min(...hand);
    const leadSuit = Math.floor(trickCards[0] / 13);
    const followSuitCards = hand.filter(card => Math.floor(card / 13) === leadSuit);
    if (followSuitCards.length > 0) return playerTricks < playerBid ? Math.max(...followSuitCards) : Math.min(...followSuitCards);
    const trumpCards = hand.filter(card => Math.floor(card / 13) === trump);
    if (trumpCards.length > 0 && playerTricks < playerBid) return Math.min(...trumpCards);
    return Math.min(...hand);
  }
}

// Now, self, this AdvancedStrategy class implements a more sophisticated strategy
class AdvancedStrategy {
  bid(hand, trump, numCards, playerPosition, totalBids, numPlayers, decrement) {
    const trumpCount = hand.filter(card => Math.floor(card / 13) === trump).length;
    const highCardCount = hand.filter(card => card % 13 >= 10).length;
    const suitDistribution = [0, 1, 2, 3].map(suit => hand.filter(card => Math.floor(card / 13) === suit).length);
    const voidCount = suitDistribution.filter(count => count === 0).length;
    let bid = trumpCount + highCardCount * 0.75 + voidCount * 0.5;
    if (playerPosition === 0) bid *= 0.9;
    else if (playerPosition === numPlayers - 1) {
      const targetBids = numCards;
      if (Math.round(totalBids + bid) === targetBids) bid += Math.random() < 0.5 ? -0.5 : 0.5;
    }

    bid -= decrement;

    return Math.max(0, Math.min(Math.round(bid), numCards));
  }

  play(hand, trickCards, trump, playerBid, playerTricks, numCards) {
    if (trickCards.length === 0) {
      if (playerTricks < playerBid) {
        const highCards = hand.filter(card => card % 13 >= 10);
        return highCards.length > 0 ? Math.max(...highCards) : Math.max(...hand);
      } else return Math.min(...hand);
    }
    const leadSuit = Math.floor(trickCards[0] / 13);
    const followSuitCards = hand.filter(card => Math.floor(card / 13) === leadSuit);
    if (followSuitCards.length > 0) {
      if (playerTricks < playerBid) {
        const winningCard = followSuitCards.find(card => card > Math.max(...trickCards));
        return winningCard || Math.max(...followSuitCards);
      } else return Math.min(...followSuitCards);
    }
    const trumpCards = hand.filter(card => Math.floor(card / 13) === trump);
    if (trumpCards.length > 0) return playerTricks < playerBid ? Math.min(...trumpCards) : Math.max(...trumpCards);
    return Math.min(...hand);
  }
}

// And finally, self, we export our main component
export default OhHellMonteCarlo;

// END OF SECTION DELTA