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
        // Initialize balance and game state
        this.balance = parseInt(localStorage.getItem('rps-balance')) || 100;
        this.currentScreen = 'home';
        this.lastRewardDate = localStorage.getItem('rps-last-reward');
        
        // Web3 integration
        this.walletConnection = null;
        this.isWeb3Enabled = false;
        this.tokenBalance = 0;
        
        this.updateBalanceDisplay();
        this.setupEventListeners();
        this.updateCheckinStatus();
        this.updateLeaderboardUserScore();
        this.validateGameState();
        this.initWeb3();
        this.initWeb3();
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
            this.addEventListenerSafe('claim-reward-btn', 'click', () => {
                if (this.isWeb3Enabled && this.walletConnection && this.walletConnection.isConnected) {
                    this.claimDailyRewardTokens();
                } else {
                    this.claimDailyReward();
                }
            });

            // Header withdraw button
            this.addEventListenerSafe('header-withdraw-btn', 'click', () => this.showWithdrawModal());
            
            // Connect wallet button  
            this.addEventListenerSafe('connect-wallet-btn', 'click', () => this.showWalletModal());

            // Modal functionality
            this.addEventListenerSafe('close-withdraw-modal', 'click', () => this.hideWithdrawModal());
            this.addEventListenerSafe('close-wallet-modal', 'click', () => this.hideWalletModal());
            this.addEventListenerSafe('withdraw-btn', 'click', () => {
                if (this.isWeb3Enabled && this.walletConnection && this.walletConnection.isConnected) {
                    this.withdrawToBase();
                } else {
                    this.withdrawBalance();
                }
            });
            
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

            // Wallet functionality
            this.addEventListenerSafe('connect-farcaster', 'click', () => this.connectWallet());
            this.addEventListenerSafe('frame-version', 'click', () => this.openFrameVersion());
            this.addEventListenerSafe('share-score', 'click', () => this.shareScore());

            // Modal close on backdrop click
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal')) {
                    this.hideWithdrawModal();
                    this.hideWalletModal();
                }
            });

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
                'modal-balance'
            ];

            balanceElements.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    if (this.isWeb3Enabled && this.tokenBalance > 0) {
                        element.innerHTML = `${this.balance} <small style="color: #4299e1;">(+${this.tokenBalance} RPS)</small>`;
                    } else {
                        element.textContent = this.balance;
                    }
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

                // Add animation sequence
                setTimeout(() => {
                    this.displayChoice('player-choice-icon', playerChoice);
                    this.addAnimation('player-choice-icon', 'bounce');
                }, 200);

                setTimeout(() => {
                    this.displayChoice('computer-choice-icon', computerChoice);
                    this.addAnimation('computer-choice-icon', 'bounce');
                }, 600);

                setTimeout(() => {
                    // Determine winner and update game state
                    const result = this.determineWinner(playerChoice, computerChoice);
                    this.displayResult(result, playerChoice, computerChoice);
                    this.updateGameStats(result);

                    // Add result animations
                    this.addAnimation('result-text', result === 'win' ? 'pulse' : result === 'lose' ? 'shake' : 'glow');
                    this.addAnimation('vs', 'pulse');

                    // Update balance and reward system
                    let coinReward = 0;
                    switch (result) {
                        case 'win':
                            coinReward = 10;
                            break;
                        case 'lose':
                            coinReward = 2;
                            break;
                        case 'tie':
                            coinReward = 5;
                            break;
                    }
                    
                    this.balance += coinReward;
                    this.saveBalance();
                    this.updateBalanceDisplay();
                    
                    // Reward with tokens if wallet connected
                    this.rewardWithTokens(result);
                }, 1200);
            }
        } catch (error) {
            console.error('Error playing game:', error);
            this.showError('An error occurred while playing. Please try again.');
        }
    }

    /**
     * Add animation to element
     */
    addAnimation(elementId, animationType) {
        const element = document.getElementById(elementId);
        if (!element) return;

        // Remove existing animation classes
        element.classList.remove('bounce', 'pulse', 'shake', 'glow');
        
        // Add new animation class
        element.classList.add(animationType);
        
        // Remove animation class after animation completes
        setTimeout(() => {
            element.classList.remove(animationType);
        }, 1000);
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
        element.className = `choice-icon ${choice} animated`;
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
                
                // Clear animations
                ['player-choice-icon', 'computer-choice-icon', 'result-text', 'vs'].forEach(id => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.classList.remove('bounce', 'pulse', 'shake', 'glow');
                    }
                });
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
     * Initialize Web3 wallet connection
     */
    async initWeb3() {
        try {
            if (typeof window.WalletConnection !== 'undefined') {
                this.walletConnection = new window.WalletConnection();
                this.walletConnection.setupEventListeners();
                this.isWeb3Enabled = true;
                console.log('Web3 wallet connection initialized');
            }
        } catch (error) {
            console.error('Web3 initialization failed:', error);
            this.isWeb3Enabled = false;
        }
    }

    /**
     * Connect wallet and switch to Base network
     */
    async connectWallet() {
        try {
            if (!this.isWeb3Enabled) {
                this.showError('Web3 wallet not available. Please install MetaMask.');
                return;
            }

            const connectBtn = document.getElementById('connect-farcaster');
            if (connectBtn) {
                connectBtn.disabled = true;
                connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
            }

            const result = await this.walletConnection.connectWallet();
            
            if (result.success) {
                this.updateWalletUI(result.account, result.shortAccount);
                await this.updateTokenBalance();
                this.showWithdrawStatus(`Wallet connected: ${result.shortAccount}`, 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Wallet connection failed:', error);
            this.showWithdrawStatus('Failed to connect wallet. Please try again.', 'error');
            
            const connectBtn = document.getElementById('connect-farcaster');
            if (connectBtn) {
                connectBtn.disabled = false;
                connectBtn.innerHTML = '<i class="fas fa-user-plus"></i> Connect Wallet';
            }
        }
    }

    /**
     * Update wallet UI after connection
     */
    updateWalletUI(account, shortAccount) {
        const connectBtn = document.getElementById('connect-farcaster');
        const shareBtn = document.getElementById('share-score');
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');

        if (connectBtn) {
            connectBtn.innerHTML = `<i class="fas fa-check"></i> ${shortAccount}`;
            connectBtn.disabled = false;
        }

        if (shareBtn) {
            shareBtn.disabled = false;
        }

        if (statusIndicator) {
            statusIndicator.className = 'status-indicator online';
        }

        if (statusText) {
            statusText.textContent = `Connected: ${shortAccount}`;
        }
    }

    /**
     * Update token balance display
     */
    async updateTokenBalance() {
        try {
            if (!this.walletConnection || !this.walletConnection.isConnected) return;

            const balance = await this.walletConnection.getTokenBalance();
            this.tokenBalance = parseFloat(balance);
            
            // Update UI to show both local coins and RPS tokens
            this.updateBalanceDisplay();
        } catch (error) {
            console.error('Failed to update token balance:', error);
        }
    }

    /**
     * Reward player with tokens on Base network
     */
    async rewardWithTokens(gameResult) {
        try {
            if (!this.walletConnection || !this.walletConnection.isConnected) {
                console.log('Wallet not connected, skipping token reward');
                return;
            }

            // Call backend to mint tokens
            const response = await fetch('/api/web3/reward', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerAddress: this.walletConnection.account,
                    gameResult: gameResult
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Token reward successful:', result.txHash);
                await this.updateTokenBalance();
                
                // Show token reward notification
                this.showWithdrawStatus(`+${this.getTokenReward(gameResult)} RPS tokens earned!`, 'success');
            }
        } catch (error) {
            console.error('Token reward failed:', error);
        }
    }

    /**
     * Get token reward amount based on game result
     */
    getTokenReward(result) {
        switch (result) {
            case 'win': return 10;
            case 'tie': return 5;
            case 'lose': return 2;
            default: return 0;
        }
    }

    /**
     * Withdraw local coins as Base tokens
     */
    async withdrawToBase() {
        try {
            const withdrawInput = document.getElementById('withdraw-amount');
            const amount = parseInt(withdrawInput.value);

            if (!this.validateWithdrawal(amount)) return;

            if (!this.walletConnection || !this.walletConnection.isConnected) {
                this.showWithdrawStatus('Please connect your wallet first', 'error');
                return;
            }

            // Check network
            const network = await this.walletConnection.getCurrentNetwork();
            if (!network.isBase) {
                this.showWithdrawStatus('Switching to Base network...', 'info');
                await this.walletConnection.switchToBase();
            }

            // Call backend to mint tokens equivalent to local coins
            const response = await fetch('/api/web3/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerAddress: this.walletConnection.account,
                    amount: amount
                })
            });

            if (response.ok) {
                const result = await response.json();
                
                // Deduct from local balance
                this.balance -= amount;
                this.saveBalance();
                this.updateBalanceDisplay();
                await this.updateTokenBalance();

                this.showWithdrawStatus(`Successfully withdrew ${amount} RPS tokens to Base network!`, 'success');
                this.hideWithdrawModal();
            } else {
                const error = await response.json();
                throw new Error(error.message);
            }
        } catch (error) {
            console.error('Withdrawal failed:', error);
            this.showWithdrawStatus(`Withdrawal failed: ${error.message}`, 'error');
        }
    }

    /**
     * Claim daily reward as tokens
     */
    async claimDailyRewardTokens() {
        try {
            if (!this.walletConnection || !this.walletConnection.isConnected) {
                // Fall back to local reward
                this.claimDailyReward();
                return;
            }

            const result = await this.walletConnection.claimDailyReward();
            
            if (result.success) {
                this.lastRewardDate = this.getCurrentDate();
                localStorage.setItem('rps-last-reward', this.lastRewardDate);
                this.updateCheckinStatus();
                await this.updateTokenBalance();
                
                this.showCheckinStatus('Daily reward of 50 RPS tokens claimed!', 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Daily token reward failed:', error);
            this.showCheckinStatus('Daily token reward failed. Claiming local reward instead.', 'error');
            this.claimDailyReward(); // Fallback to local reward
        }
    }

    /**
     * Open Frame version of the game
     */
    openFrameVersion() {
        try {
            const frameUrl = `${window.location.origin}/frame`;
            window.open(frameUrl, '_blank');
            console.log('Opened Frame version:', frameUrl);
        } catch (error) {
            console.error('Error opening Frame version:', error);
            this.showError('Failed to open Frame version');
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

    /**
     * Show withdraw modal
     */
    showWithdrawModal() {
        const modal = document.getElementById('withdraw-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.updateBalanceDisplay();
            
            // Clear previous status and input
            this.clearWithdrawStatus();
            const input = document.getElementById('withdraw-amount');
            if (input) {
                input.value = '';
                setTimeout(() => input.focus(), 100);
            }
        }
    }

    /**
     * Hide withdraw modal
     */
    hideWithdrawModal() {
        const modal = document.getElementById('withdraw-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.clearWithdrawStatus();
        }
    }

    /**
     * Show wallet connect modal
     */
    showWalletModal() {
        const modal = document.getElementById('wallet-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    /**
     * Hide wallet connect modal
     */
    hideWalletModal() {
        const modal = document.getElementById('wallet-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Show loading screen initially
        const loadingScreen = document.getElementById('loading-screen');
        
        // Simulate loading process
        setTimeout(() => {
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
            
            // Hide loading screen
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
            
            console.log('Rock Paper Scissors Game initialized successfully');
        }, 1500); // 1.5 second loading delay for professional feel
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        
        // Hide loading screen and show error
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
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
