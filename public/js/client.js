const socket = io();
let currentUser = null;
let currentRoom = 'rialo-genesis';

const screens = {
    lobby: document.getElementById('lobby-screen'),
    game: document.getElementById('game-screen')
};

document.getElementById('join-btn').addEventListener('click', () => {
    const username = document.getElementById('username-input').value;
    if (!username) return;
    
    currentUser = username;
    document.getElementById('username-display').innerText = currentUser;
    
    socket.emit('join_room', { roomId: currentRoom, username });
    
    screens.lobby.classList.add('hidden');
    screens.game.classList.remove('hidden');
});

socket.on('game_state', (state) => {
    renderTable(state);
    renderControls(state);
});

function renderTable(state) {
    const container = document.getElementById('players-container');
    container.innerHTML = '';
    
    const pot = document.getElementById('pot-amount');
    pot.innerText = state.pot.toLocaleString();

    const commCards = document.getElementById('community-cards');
    commCards.innerHTML = '';
    state.communityCards.forEach(card => {
        const el = document.createElement('div');
        el.className = 'card';
        el.innerText = `${card.rank}${card.suit}`;
        commCards.appendChild(el);
    });

    const totalPlayers = state.players.length;
    const radius = 280; 
    
    state.players.forEach((player, index) => {
        const angle = (index / totalPlayers) * 2 * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        const seat = document.createElement('div');
        seat.className = `player-seat ${player.isTurn ? 'active-turn' : ''}`;
        seat.style.transform = `translate(${x}px, ${y}px)`;
        
        seat.innerHTML = `
            <div class="p-name" style="color: var(--rialo-mint)">${player.name}</div>
            <div class="p-chips">${player.chips}</div>
            <div class="p-bet" style="font-size: 0.8em; opacity: 0.7">${player.currentBet > 0 ? player.currentBet : ''}</div>
        `;
        
        container.appendChild(seat);

        if (player.name === currentUser && player.hand) {
            const handDiv = document.getElementById('my-hand');
            handDiv.innerHTML = '';
            player.hand.forEach(card => {
                const c = document.createElement('div');
                c.className = 'card';
                c.innerText = `${card.rank}${card.suit}`;
                handDiv.appendChild(c);
            });
        }
    });
}

function sendAction(action, amount = 0) {
    socket.emit('action', {
        roomId: currentRoom,
        action,
        amount
    });
}
