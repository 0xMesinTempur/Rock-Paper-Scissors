/**
 * Rock Paper Scissors Game - Enhanced Gaming Experience
 * Features: Persistent scoring, daily rewards, wallet system, social integration
 */
class RockPaperScissorsGame {
    constructor() {
        // Initialize game state from localStorage
        this.balance = parseInt(localStorage.getItem('rps_balance')) || 0;
        this.lastCheckinDate = localStorage.getItem('rps_last_checkin');
        this.currentScreen = 'home';
        this.gameStats = this.loadGameStats();
        
        // Initialize the game
        this.init();
    }

    /**
     * Initialize game components and event listeners
     */
    init() {
        this.updateBalanceDisplay();
        this.setupEventListeners();
        this.updateCheckinStatus();
        this.updateLeaderboardUserScore();
        this.validateGameState();
    }

    /**
     * Load game statistics from localStorage
     */
    loadGameStats() {
        const defaultStats = {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            winStreak: 0,
            bestStreak: 0
        };
        
        try {
            const saved = localStorage.getItem('rps_game_stats');
            return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
        } catch (error) {
            console.warn('Error loading game stats:', error);
            return defaultStats;
        }
    }

    /**
     * Save game statistics to localStorage
     */
    saveGameStats() {
        try {
            localStorage.setItem('rps_game_stats', JSON.stringify(this.gameStats));
        } catch (error) {
            console.error('Error saving game stats:', error);
        }
    }

    /**
     * Validate and repair game state if necessary
     */
    validateGameState() {
        // Ensure balance is non-negative
        if (this.balance < 0) {
            this.balance = 0;
            this.saveBalance();
        }

        // Validate date format for checkin
        if (this.lastCheckinDate && !this.isValidDate(this.lastCheckinDate)) {
            this.lastCheckinDate = null;
            localStorage.removeItem('rps_last_checkin');
        }
    }

    /**
     * Check if a date string is valid
     */
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    /**
     * Set up all event listeners for the game
     */
    setupEventListeners() {
        try {
            // Home screen navigation
            this.addEventListenerSafe('play-btn', 'click', () => this.showScreen('game'));
            this.addEventListenerSafe('leaderboard-btn', 'click', () => this.showScreen('leaderboard'));
            this.addEventListenerSafe('daily-checkin-btn', 'click', () => this.showScreen('checkin'));

            // Back buttons
            this.addEventListenerSafe('back-to-home', 'click', () => this.showScreen('home'));
            this.addEventListenerSafe('back-to-home-leaderboard', 'click', () => this.showScreen('home'));
            this.addEventListenerSafe('back-to-home-checkin', 'click', () => this.showScreen('home'));

            // Game choices
            document.querySelectorAll('.choice-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const choice = e.currentTarget.dataset.choice;
                    if (choice) {
                        this.playGame(choice);
                    }
                });
            });

            // Game controls
            this.addEventListenerSafe('play-again', 'click', () => this.resetGame());
            this.addEventListenerSafe('claim-reward-btn', 'click', () => this.claimDailyReward());

            // Wallet functionality
            this.addEventListenerSafe('withdraw-btn', 'click', () => this.withdrawBalance());
            
            // Withdraw input validation
            const withdrawInput = document.getElementById('withdraw-amount');
            if (withdrawInput) {
                withdrawInput.addEventListener('input', (e) => this.validateWithdrawInput(e));
                withdrawInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.withdrawBalance();
                    }
                });
            }

            // Farcaster functionality
            this.addEventListenerSafe('connect-farcaster', 'click', () => this.connectFarcaster());
            this.addEventListenerSafe('share-score', 'click', () => this.shareScore());

        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    /**
     * Safely add event listener with error handling
     */
    addEventListenerSafe(elementId, event, callback) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, callback);
        } else {
            console.warn(`Element with ID '${elementId}' not found`);
        }
    }

    /**
     * Validate withdraw input in real-time
     */
    validateWithdrawInput(event) {
        const input = event.target;
        const value = parseInt(input.value);
        
        // Remove any non-numeric characters
        input.value = input.value.replace(/[^0-9]/g, '');
        
        // Update max value based on current balance
        input.max = this.balance;
    }

    /**
     * Show specified screen and hide others
     */
    showScreen(screenName) {
        try {
            // Hide all screens
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });

            // Show target screen
            const targetScreen = document.getElementById(`${screenName}-screen`);
            if (targetScreen) {
                targetScreen.classList.add('active');
                this.currentScreen = screenName;

                // Screen-specific actions
                if (screenName === 'checkin') {
                    this.updateCheckinStatus();
                } else if (screenName === 'leaderboard') {
                    this.updateLeaderboardUserScore();
                }
            } else {
                console.error(`Screen '${screenName}' not found`);
            }
        } catch (error) {
            console.error('Error showing screen:', error);
        }
    }

    /**
     * Update balance display across all components
     */
    updateBalanceDisplay() {
        try {
            const balanceElements = [
                'balance',
                'user-leaderboard-score',
                'footer-balance'
            ];

            balanceElements.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = this.balance;
                }
            });

            // Update withdraw input constraints
            const withdrawInput = document.getElementById('withdraw-amount');
            if (withdrawInput) {
                withdrawInput.max = this.balance;
                if (parseInt(withdrawInput.value) > this.balance) {
                    withdrawInput.value = this.balance;
                }
            }
        } catch (error) {
            console.error('Error updating balance display:', error);
        }
    }

    /**
     * Update leaderboard user score
     */
    updateLeaderboardUserScore() {
        const element = document.getElementById('user-leaderboard-score');
        if (element) {
            element.textContent = this.balance;
        }
    }

    /**
     * Main game logic - play a round
     */
    playGame(playerChoice) {
        if (!['rock', 'paper', 'scissors'].includes(playerChoice)) {
            console.error('Invalid player choice:', playerChoice);
            return;
        }

        try {
            const choices = ['rock', 'paper', 'scissors'];
            const computerChoice = choices[Math.floor(Math.random() * choices.length)];
            
            // Hide choices and show result with animation
            const choicesElement = document.querySelector('.choices');
            const resultElement = document.getElementById('game-result');
            
            if (choicesElement && resultElement) {
                choicesElement.style.display = 'none';
                resultElement.classList.remove('hidden');

                // Display choices with icons
                this.displayChoice('player-choice-icon', playerChoice);
                this.displayChoice('computer-choice-icon', computerChoice);

                // Determine winner and update game state
                const result = this.determineWinner(playerChoice, computerChoice);
                this.displayResult(result, playerChoice, computerChoice);
                this.updateGameStats(result);

                // Update balance for wins
                if (result === 'win') {
                    this.balance++;
                    this.saveBalance();
                    this.updateBalanceDisplay();
                }
            }
        } catch (error) {
            console.error('Error playing game:', error);
            this.showError('An error occurred while playing. Please try again.');
        }
    }

    /**
     * Display choice icon with proper styling
     */
    displayChoice(elementId, choice) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const icons = {
            rock: 'fas fa-hand-rock',
            paper: 'fas fa-hand-paper', 
            scissors: 'fas fa-hand-scissors'
        };

        const iconClass = icons[choice] || 'fas fa-question';
        element.innerHTML = `<i class="${iconClass}"></i>`;
        element.className = `choice-icon ${choice}`;
    }

    /**
     * Determine the winner based on game rules
     */
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

    /**
     * Display game result with appropriate messaging
     */
    displayResult(result, playerChoice, computerChoice) {
        const resultElement = document.getElementById('result-text');
        if (!resultElement) return;

        const messages = {
            win: `🎉 You Win! ${this.capitalizeFirst(playerChoice)} beats ${computerChoice}. +1 coin!`,
            lose: `😔 You Lose! ${this.capitalizeFirst(computerChoice)} beats ${playerChoice}. Try again!`,
            draw: `🤝 It's a Draw! Both chose ${playerChoice}. No coins awarded.`
        };

        resultElement.textContent = messages[result] || 'Unknown result';
        resultElement.className = `result-text ${result}`;
    }

    /**
     * Update game statistics
     */
    updateGameStats(result) {
        this.gameStats.gamesPlayed++;
        
        switch (result) {
            case 'win':
                this.gameStats.wins++;
                this.gameStats.winStreak++;
                if (this.gameStats.winStreak > this.gameStats.bestStreak) {
                    this.gameStats.bestStreak = this.gameStats.winStreak;
                }
                break;
            case 'lose':
                this.gameStats.losses++;
                this.gameStats.winStreak = 0;
                break;
            case 'draw':
                this.gameStats.draws++;
                break;
        }
        
        this.saveGameStats();
    }

    /**
     * Capitalize first letter of string
     */
    capitalizeFirst(str) {
        return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    }

    /**
     * Reset game to play again
     */
    resetGame() {
        try {
            const choicesElement = document.querySelector('.choices');
            const resultElement = document.getElementById('game-result');
            
            if (choicesElement && resultElement) {
                choicesElement.style.display = 'flex';
                resultElement.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error resetting game:', error);
        }
    }

    /**
     * Handle daily reward claiming
     */
    claimDailyReward() {
        try {
            const today = new Date().toDateString();
            
            if (this.lastCheckinDate === today) {
                this.showCheckinStatus('You have already claimed your daily reward today!', 'already-claimed');
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
        } catch (error) {
            console.error('Error claiming daily reward:', error);
            this.showCheckinStatus('Error claiming reward. Please try again.', 'error');
        }
    }

    /**
     * Update check-in status and button state
     */
    updateCheckinStatus() {
        try {
            const today = new Date().toDateString();
            const button = document.getElementById('claim-reward-btn');
            
            if (!button) return;

            if (this.lastCheckinDate === today) {
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-check"></i> Already Claimed Today';
                this.showCheckinStatus('You have already claimed your daily reward today!', 'already-claimed');
            } else {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-hand-holding-usd"></i> Claim Reward';
                const statusElement = document.getElementById('checkin-status');
                if (statusElement) {
                    statusElement.innerHTML = '';
                }
            }
        } catch (error) {
            console.error('Error updating checkin status:', error);
        }
    }

    /**
     * Update check-in button after successful claim
     */
    updateCheckinButton() {
        const button = document.getElementById('claim-reward-btn');
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-check"></i> Already Claimed Today';
        }
    }

    /**
     * Show check-in status message
     */
    showCheckinStatus(message, type) {
        const statusElement = document.getElementById('checkin-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `checkin-status ${type}`;
        }
    }

    /**
     * Save balance to localStorage
     */
    saveBalance() {
        try {
            localStorage.setItem('rps_balance', this.balance.toString());
        } catch (error) {
            console.error('Error saving balance:', error);
        }
    }

    /**
     * Get current date in consistent format
     */
    getCurrentDate() {
        return new Date().toDateString();
    }

    /**
     * Handle balance withdrawal
     */
    withdrawBalance() {
        try {
            const amountInput = document.getElementById('withdraw-amount');
            const amount = parseInt(amountInput?.value || '0');
            
            // Clear previous status
            this.clearWithdrawStatus();

            // Comprehensive validation
            const validationResult = this.validateWithdrawal(amount);
            if (!validationResult.isValid) {
                this.showWithdrawStatus(validationResult.message, 'error');
                return;
            }

            // Process withdrawal
            this.balance -= amount;
            this.saveBalance();
            this.updateBalanceDisplay();

            // Clear input and show success
            if (amountInput) {
                amountInput.value = '';
                amountInput.max = this.balance;
            }
            
            this.showWithdrawStatus(`Successfully withdrew ${amount} coins! 💰`, 'success');

        } catch (error) {
            console.error('Error processing withdrawal:', error);
            this.showWithdrawStatus('An error occurred during withdrawal. Please try again.', 'error');
        }
    }

    /**
     * Validate withdrawal amount
     */
    validateWithdrawal(amount) {
        if (!amount || amount <= 0) {
            return { isValid: false, message: 'Please enter a valid amount greater than 0' };
        }

        if (amount > this.balance) {
            return { isValid: false, message: `Insufficient balance. Available: ${this.balance} coins` };
        }

        if (amount > 1000) {
            return { isValid: false, message: 'Maximum withdrawal is 1000 coins per transaction' };
        }

        return { isValid: true };
    }

    /**
     * Clear withdrawal status
     */
    clearWithdrawStatus() {
        const statusElement = document.getElementById('withdraw-status');
        if (statusElement) {
            statusElement.textContent = '';
            statusElement.className = 'withdraw-status';
        }
    }

    /**
     * Show withdrawal status message
     */
    showWithdrawStatus(message, type) {
        const statusElement = document.getElementById('withdraw-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `withdraw-status ${type}`;

            // Auto-clear success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    statusElement.textContent = '';
                    statusElement.className = 'withdraw-status';
                }, 5000);
            }
        }
    }

    /**
     * Show general error message
     */
    showError(message) {
        // Create or update error display
        let errorElement = document.getElementById('error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'error-message';
            errorElement.className = 'error-message';
            document.body.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }

    /**
     * Reset all game data (for testing/debugging)
     */
    resetGameData() {
        try {
            localStorage.removeItem('rps_balance');
            localStorage.removeItem('rps_last_checkin');
            localStorage.removeItem('rps_game_stats');
            
            this.balance = 0;
            this.lastCheckinDate = null;
            this.gameStats = this.loadGameStats();
            
            this.updateBalanceDisplay();
            this.updateCheckinStatus();
            
            // Clear forms
            const withdrawInput = document.getElementById('withdraw-amount');
            if (withdrawInput) {
                withdrawInput.value = '';
            }
            this.clearWithdrawStatus();
            
            // Reset Farcaster connection
            this.updateFarcasterStatus(false);
            
            console.log('Game data reset successfully');
        } catch (error) {
            console.error('Error resetting game data:', error);
        }
    }

    /**
     * Connect to Farcaster (placeholder implementation)
     */
    connectFarcaster() {
        try {
            const connectBtn = document.getElementById('connect-farcaster');
            const shareBtn = document.getElementById('share-score');
            
            if (!connectBtn) return;

            // Simulate connection process
            connectBtn.disabled = true;
            connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
            
            // Simulate API call delay
            setTimeout(() => {
                // For demo purposes, simulate successful connection
                this.updateFarcasterStatus(true);
                connectBtn.innerHTML = '<i class="fas fa-check"></i> Connected';
                
                if (shareBtn) {
                    shareBtn.disabled = false;
                }
                
                this.showWithdrawStatus('Farcaster connected successfully! 🎉', 'success');
            }, 2000);
        } catch (error) {
            console.error('Error connecting to Farcaster:', error);
            this.showWithdrawStatus('Failed to connect to Farcaster. Please try again.', 'error');
        }
    }

    /**
     * Share score to Farcaster (placeholder implementation)
     */
    shareScore() {
        try {
            if (this.balance <= 0) {
                this.showWithdrawStatus('No score to share! Play some games first. 🎮', 'error');
                return;
            }

            const shareBtn = document.getElementById('share-score');
            if (!shareBtn) return;

            shareBtn.disabled = true;
            shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sharing...';
            
            // Simulate sharing process
            setTimeout(() => {
                shareBtn.disabled = false;
                shareBtn.innerHTML = '<i class="fas fa-share"></i> Share Score';
                
                const winRate = this.gameStats.gamesPlayed > 0 
                    ? Math.round((this.gameStats.wins / this.gameStats.gamesPlayed) * 100)
                    : 0;
                
                this.showWithdrawStatus(
                    `Score shared! 🎉 ${this.balance} coins, ${winRate}% win rate`, 
                    'success'
                );
            }, 1500);
        } catch (error) {
            console.error('Error sharing score:', error);
            this.showWithdrawStatus('Failed to share score. Please try again.', 'error');
        }
    }

    /**
     * Update Farcaster connection status
     */
    updateFarcasterStatus(connected) {
        try {
            const statusIndicator = document.querySelector('.status-indicator');
            const statusText = document.querySelector('.status-text');
            const shareBtn = document.getElementById('share-score');
            const connectBtn = document.getElementById('connect-farcaster');
            
            if (statusIndicator) {
                statusIndicator.className = connected ? 'status-indicator online' : 'status-indicator offline';
            }
            
            if (statusText) {
                statusText.textContent = connected ? 'Connected' : 'Not connected';
            }
            
            if (shareBtn) {
                shareBtn.disabled = !connected;
            }
            
            if (connectBtn && !connected) {
                connectBtn.disabled = false;
                connectBtn.innerHTML = '<i class="fas fa-user-plus"></i> Connect Account';
            }
        } catch (error) {
            console.error('Error updating Farcaster status:', error);
        }
    }

    /**
     * Get game statistics for display
     */
    getGameStats() {
        return { ...this.gameStats };
    }

    /**
     * Export game data for backup
     */
    exportGameData() {
        return {
            balance: this.balance,
            lastCheckinDate: this.lastCheckinDate,
            gameStats: this.gameStats,
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import game data from backup
     */
    importGameData(data) {
        try {
            if (data.balance !== undefined) this.balance = data.balance;
            if (data.lastCheckinDate) this.lastCheckinDate = data.lastCheckinDate;
            if (data.gameStats) this.gameStats = { ...this.gameStats, ...data.gameStats };
            
            this.saveBalance();
            this.saveGameStats();
            if (this.lastCheckinDate) {
                localStorage.setItem('rps_last_checkin', this.lastCheckinDate);
            }
            
            this.updateBalanceDisplay();
            this.updateCheckinStatus();
            
            return true;
        } catch (error) {
            console.error('Error importing game data:', error);
            return false;
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Create global game instance
        window.rpsGame = new RockPaperScissorsGame();
        
        // Add global debug functions in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.debugRPS = {
                resetGame: () => window.rpsGame.resetGameData(),
                getStats: () => window.rpsGame.getGameStats(),
                exportData: () => window.rpsGame.exportGameData(),
                importData: (data) => window.rpsGame.importGameData(data),
                addCoins: (amount) => {
                    window.rpsGame.balance += amount;
                    window.rpsGame.saveBalance();
                    window.rpsGame.updateBalanceDisplay();
                }
            };
            console.log('Debug functions available: window.debugRPS');
        }
        
        console.log('Rock Paper Scissors Game initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        
        // Show user-friendly error message
        document.body.innerHTML = `
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                font-family: Arial, sans-serif;
                text-align: center;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                color: white;
                padding: 20px;
            ">
                <div>
                    <h1>⚠️ Game Loading Error</h1>
                    <p>Sorry, there was an error loading the game.</p>
                    <p>Please refresh the page to try again.</p>
                    <button onclick="location.reload()" style="
                        background: #4299e1;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        color: white;
                        cursor: pointer;
                        margin-top: 20px;
                    ">Refresh Page</button>
                </div>
            </div>
        `;
    }
});

// Handle page visibility changes to pause/resume game
document.addEventListener('visibilitychange', () => {
    if (window.rpsGame) {
        if (document.hidden) {
            // Game is hidden, could pause animations or save state
            console.log('Game paused');
        } else {
            // Game is visible again, resume normal operation
            console.log('Game resumed');
            window.rpsGame.updateBalanceDisplay();
            window.rpsGame.updateCheckinStatus();
        }
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('Connection restored');
});

window.addEventListener('offline', () => {
    console.log('Connection lost - game will continue offline');
});
