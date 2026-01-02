export default class PokerGame {
  constructor(roomId, io) {
    this.roomId = roomId;
    this.io = io;
    this.players = [];
    this.deck = [];
    this.communityCards = [];
    this.pot = 0;
    this.currentTurn = 0;
    this.state = 'WAITING'; 
    this.smallBlind = 10;
    this.bigBlind = 20;
    this.dealerIndex = 0;
    this.minBet = 20;
  }

  addPlayer(id, name) {
    const player = {
      id,
      name,
      chips: 10000,
      hand: [],
      currentBet: 0,
      folded: false,
      status: 'active'
    };
    this.players.push(player);
    return player;
  }

  removePlayer(id) {
    this.players = this.players.filter(p => p.id !== id);
  }

  shuffleDeck() {
    const suits = ['h', 'd', 'c', 's'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    this.deck = [];
    for (let s of suits) {
      for (let r of ranks) {
        this.deck.push({ rank: r, suit: s });
      }
    }
    this.deck.sort(() => Math.random() - 0.5);
  }

  startGame() {
    if (this.players.length < 2) return;
    this.state = 'PREFLOP';
    this.shuffleDeck();
    this.communityCards = [];
    this.pot = 0;
    this.players.forEach(p => {
      p.hand = [this.deck.pop(), this.deck.pop()];
      p.folded = false;
      p.currentBet = 0;
    });
    this.currentTurn = (this.dealerIndex + 1) % this.players.length;
  }

  handleAction(playerId, action, amount = 0) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || this.players[this.currentTurn].id !== playerId) return;

    if (action === 'fold') {
      player.folded = true;
    } else if (action === 'call') {
      const callAmount = this.minBet - player.currentBet;
      player.chips -= callAmount;
      player.currentBet += callAmount;
      this.pot += callAmount;
    } else if (action === 'raise') {
      const raiseAmount = amount;
      player.chips -= raiseAmount;
      player.currentBet += raiseAmount;
      this.pot += raiseAmount;
      this.minBet = player.currentBet;
    } else if (action === 'check') {
      
    }

    this.nextTurn();
  }

  nextTurn() {
    let activePlayers = this.players.filter(p => !p.folded);
    if (activePlayers.length === 1) {
      this.endRound(activePlayers[0]);
      return;
    }

    do {
      this.currentTurn = (this.currentTurn + 1) % this.players.length;
    } while (this.players[this.currentTurn].folded);

    const isRoundComplete = this.players.every(p => p.folded || p.currentBet === this.minBet || p.chips === 0);
    
    if (isRoundComplete && this.currentTurn === this.dealerIndex) {
      this.nextStreet();
    }
  }

  nextStreet() {
    this.players.forEach(p => p.currentBet = 0);
    this.minBet = 0;
    
    if (this.state === 'PREFLOP') {
      this.state = 'FLOP';
      this.communityCards.push(this.deck.pop(), this.deck.pop(), this.deck.pop());
    } else if (this.state === 'FLOP') {
      this.state = 'TURN';
      this.communityCards.push(this.deck.pop());
    } else if (this.state === 'TURN') {
      this.state = 'RIVER';
      this.communityCards.push(this.deck.pop());
    } else if (this.state === 'RIVER') {
      this.state = 'SHOWDOWN';
      this.resolveShowdown(); 
    }
  }

  resolveShowdown() {
    this.startGame();
  }

  endRound(winner) {
    winner.chips += this.pot;
    this.startGame(); 
  }

  getPublicState() {
    return {
      roomId: this.roomId,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        chips: p.chips,
        currentBet: p.currentBet,
        folded: p.folded,
        isTurn: this.players[this.currentTurn].id === p.id,
        hand: this.state === 'SHOWDOWN' ? p.hand : null 
      })),
      communityCards: this.communityCards,
      pot: this.pot,
      state: this.state
    };
  }
}
