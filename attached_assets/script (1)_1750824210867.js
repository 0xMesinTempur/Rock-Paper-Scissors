class RockPaperScissorsGame {
    constructor() {
        this.balance = parseInt(localStorage.getItem('rps_balance')) || 0;
        this.lastCheckinDate = localStorage.getItem('rps_last_checkin');
        this.currentScreen = 'home';
        
        this.init();
    }

    init() {
        this.updateBalanceDisplay();
        this.setupEventListeners();
        this.updateCheckinStatus();
        this.updateLeaderboardUserScore();
    }

    setupEventListeners() {
        // Home screen navigation
        document.getElementById('play-btn').addEventListener('click', () => this.showScreen('game'));
        document.getElementById('leaderboard-btn').addEventListener('click', () => this.showScreen('leaderboard'));
        document.getElementById('daily-checkin-btn').addEventListener('click', () => this.showScreen('checkin'));

        // Back buttons
        document.getElementById('back-to-home').addEventListener('click', () => this.showScreen('home'));
        document.getElementById('back-to-home-leaderboard').addEventListener('click', () => this.showScreen('home'));
        document.getElementById('back-to-home-checkin').addEventListener('click', () => this.showScreen('home'));

        // Game choices
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const choice = e.currentTarget.dataset.choice;
                this.playGame(choice);
            });
        });

        // Play again button
        document.getElementById('play-again').addEventListener('click', () => this.resetGame());

        // Daily check-in
        document.getElementById('claim-reward-btn').addEventListener('click', () => this.claimDailyReward());

        // Withdraw functionality
        document.getElementById('withdraw-btn').addEventListener('click', () => this.withdrawBalance());

        // Farcaster functionality (placeholder for future integration)
        document.getElementById('connect-farcaster').addEventListener('click', () => this.connectFarcaster());
        document.getElementById('share-score').addEventListener('click', () => this.shareScore());
    }

    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        document.getElementById(`${screenName}-screen`).classList.add('active');
        this.currentScreen = screenName;

        // Update checkin status when showing checkin screen
        if (screenName === 'checkin') {
            this.updateCheckinStatus();
        }
    }

    updateBalanceDisplay() {
        document.getElementById('balance').textContent = this.balance;
        document.getElementById('user-leaderboard-score').textContent = this.balance;
        
        // Update footer balance display
        const footerBalance = document.getElementById('footer-balance');
        if (footerBalance) {
            footerBalance.textContent = this.balance;
        }
        
        // Update withdraw input max value
        const withdrawInput = document.getElementById('withdraw-amount');
        if (withdrawInput) {
            withdrawInput.max = this.balance;
        }
    }

    updateLeaderboardUserScore() {
        document.getElementById('user-leaderboard-score').textContent = this.balance;
    }

    playGame(playerChoice) {
        const choices = ['rock', 'paper', 'scissors'];
        const computerChoice = choices[Math.floor(Math.random() * choices.length)];
        
        // Hide choices and show result
        document.querySelector('.choices').style.display = 'none';
        document.getElementById('game-result').classList.remove('hidden');

        // Display choices
        this.displayChoice('player-choice-icon', playerChoice);
        this.displayChoice('computer-choice-icon', computerChoice);

        // Determine winner
        const result = this.determineWinner(playerChoice, computerChoice);
        this.displayResult(result, playerChoice, computerChoice);

        // Update balance if player wins
        if (result === 'win') {
            this.balance++;
            this.saveBalance();
            this.updateBalanceDisplay();
        }
    }

    displayChoice(elementId, choice) {
        const element = document.getElementById(elementId);
        const icons = {
            rock: 'fas fa-hand-rock',
            paper: 'fas fa-hand-paper',
            scissors: 'fas fa-hand-scissors'
        };

        element.innerHTML = `<i class="${icons[choice]}"></i>`;
        element.className = `choice-icon ${choice}`;
    }

    determineWinner(playerChoice, computerChoice) {
        if (playerChoice === computerChoice) {
            return 'draw';
        }

        const winConditions = {
            rock: 'scissors',
            paper: 'rock',
            scissors: 'paper'
        };

        return winConditions[playerChoice] === computerChoice ? 'win' : 'lose';
    }

    displayResult(result, playerChoice, computerChoice) {
        const resultElement = document.getElementById('result-text');
        const messages = {
            win: `🎉 You Win! ${this.capitalizeFirst(playerChoice)} beats ${computerChoice}. +1 coin!`,
            lose: `😔 You Lose! ${this.capitalizeFirst(computerChoice)} beats ${playerChoice}. Try again!`,
            draw: `🤝 It's a Draw! Both chose ${playerChoice}. No coins awarded.`
        };

        resultElement.textContent = messages[result];
        resultElement.className = `result-text ${result}`;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    resetGame() {
        document.querySelector('.choices').style.display = 'flex';
        document.getElementById('game-result').classList.add('hidden');
    }

    claimDailyReward() {
        const today = new Date().toDateString();
        
        if (this.lastCheckinDate === today) {
            this.showCheckinStatus('You have already claimed your daily reward!', 'already-claimed');
            return;
        }

        // Award the daily reward
        this.balance++;
        this.lastCheckinDate = today;
        
        // Save to localStorage
        this.saveBalance();
        localStorage.setItem('rps_last_checkin', this.lastCheckinDate);
        
        // Update displays
        this.updateBalanceDisplay();
        this.showCheckinStatus('🎉 Daily reward claimed! +1 coin added to your balance.', 'success');
        this.updateCheckinButton();
    }

    updateCheckinStatus() {
        const today = new Date().toDateString();
        const button = document.getElementById('claim-reward-btn');
        
        if (this.lastCheckinDate === today) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-check"></i> Already Claimed Today';
            this.showCheckinStatus('You have already claimed your daily reward today!', 'already-claimed');
        } else {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-hand-holding-usd"></i> Claim Reward';
            document.getElementById('checkin-status').innerHTML = '';
        }
    }

    updateCheckinButton() {
        const button = document.getElementById('claim-reward-btn');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-check"></i> Already Claimed Today';
    }

    showCheckinStatus(message, type) {
        const statusElement = document.getElementById('checkin-status');
        statusElement.textContent = message;
        statusElement.className = `checkin-status ${type}`;
    }

    saveBalance() {
        localStorage.setItem('rps_balance', this.balance.toString());
    }

    // Utility method to get current date in a consistent format
    getCurrentDate() {
        return new Date().toDateString();
    }

    // Withdraw balance functionality
    withdrawBalance() {
        const amountInput = document.getElementById('withdraw-amount');
        const amount = parseInt(amountInput.value);
        const statusElement = document.getElementById('withdraw-status');

        // Clear previous status
        statusElement.textContent = '';
        statusElement.className = 'withdraw-status';

        // Validation
        if (!amount || amount <= 0) {
            this.showWithdrawStatus('Please enter a valid amount', 'error');
            return;
        }

        if (amount > this.balance) {
            this.showWithdrawStatus('Insufficient balance', 'error');
            return;
        }

        if (amount > 1000) {
            this.showWithdrawStatus('Maximum withdrawal is 1000 coins', 'error');
            return;
        }

        // Process withdrawal
        this.balance -= amount;
        this.saveBalance();
        this.updateBalanceDisplay();

        // Clear input and show success
        amountInput.value = '';
        this.showWithdrawStatus(`Successfully withdrew ${amount} coins!`, 'success');

        // Update withdraw input max value
        amountInput.max = this.balance;
    }

    showWithdrawStatus(message, type) {
        const statusElement = document.getElementById('withdraw-status');
        statusElement.textContent = message;
        statusElement.className = `withdraw-status ${type}`;

        // Clear status after 5 seconds
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'withdraw-status';
        }, 5000);
    }

    // Method to reset game data (for testing purposes)
    resetGameData() {
        localStorage.removeItem('rps_balance');
        localStorage.removeItem('rps_last_checkin');
        this.balance = 0;
        this.lastCheckinDate = null;
        this.updateBalanceDisplay();
        this.updateCheckinStatus();
        
        // Clear withdraw form
        document.getElementById('withdraw-amount').value = '';
        document.getElementById('withdraw-status').textContent = '';
        
        // Reset Farcaster connection status
        this.updateFarcasterStatus(false);
    }

    // Farcaster integration methods (ready for implementation)
    connectFarcaster() {
        // Placeholder for Farcaster connection logic
        const connectBtn = document.getElementById('connect-farcaster');
        const shareBtn = document.getElementById('share-score');
        
        // Simulate connection process
        connectBtn.disabled = true;
        connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
        
        setTimeout(() => {
            // For demo purposes, we'll simulate a successful connection
            this.updateFarcasterStatus(true);
            connectBtn.innerHTML = '<i class="fas fa-check"></i> Connected';
            shareBtn.disabled = false;
            
            // Show success message
            this.showWithdrawStatus('Farcaster connected successfully!', 'success');
        }, 2000);
    }

    shareScore() {
        // Placeholder for sharing score to Farcaster
        if (this.balance > 0) {
            const shareBtn = document.getElementById('share-score');
            shareBtn.disabled = true;
            shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sharing...';
            
            setTimeout(() => {
                shareBtn.disabled = false;
                shareBtn.innerHTML = '<i class="fas fa-share"></i> Share Score';
                this.showWithdrawStatus(`Score of ${this.balance} coins shared to Farcaster!`, 'success');
            }, 1500);
        } else {
            this.showWithdrawStatus('No score to share! Play some games first.', 'error');
        }
    }

    updateFarcasterStatus(connected) {
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');
        const shareBtn = document.getElementById('share-score');
        
        if (connected) {
            statusIndicator.className = 'status-indicator online';
            statusText.textContent = 'Connected';
            shareBtn.disabled = false;
        } else {
            statusIndicator.className = 'status-indicator offline';
            statusText.textContent = 'Not connected';
            shareBtn.disabled = true;
            
            // Reset connect button
            const connectBtn = document.getElementById('connect-farcaster');
            connectBtn.disabled = false;
            connectBtn.innerHTML = '<i class="fas fa-user-plus"></i> Connect Account';
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.rpsGame = new RockPaperScissorsGame();
    
    // Add some helpful console commands for testing
    console.log('Rock Paper Scissors Game Loaded!');
    console.log('Available commands:');
    console.log('- rpsGame.resetGameData() - Reset all game data');
    console.log('- rpsGame.balance - View current balance');
});

// Add some visual feedback for button interactions
document.addEventListener('click', (e) => {
    if (e.target.matches('button') || e.target.closest('button')) {
        const button = e.target.matches('button') ? e.target : e.target.closest('button');
        
        // Add click animation
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }
});

// Add keyboard support for navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.rpsGame && window.rpsGame.currentScreen !== 'home') {
        window.rpsGame.showScreen('home');
    }
});

// Add periodic balance sync in case multiple tabs are open
setInterval(() => {
    if (window.rpsGame) {
        const storedBalance = parseInt(localStorage.getItem('rps_balance')) || 0;
        if (storedBalance !== window.rpsGame.balance) {
            window.rpsGame.balance = storedBalance;
            window.rpsGame.updateBalanceDisplay();
        }
    }
}, 1000);
