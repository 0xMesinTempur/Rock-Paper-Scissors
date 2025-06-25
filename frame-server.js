const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const Web3Integration = require('./blockchain/web3-integration');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Frame state storage
const frameStates = new Map();

// Initialize Web3 integration
const web3 = new Web3Integration();
web3.initialize().then(success => {
    if (success) {
        console.log('✅ Web3 integration ready');
    } else {
        console.log('⚠️  Web3 integration disabled');
    }
});

// Game choices
const CHOICES = {
    rock: { emoji: '🗿', name: 'Rock' },
    paper: { emoji: '📄', name: 'Paper' },  
    scissors: { emoji: '✂️', name: 'Scissors' }
};

// Helper functions
function determineWinner(playerChoice, computerChoice) {
    if (playerChoice === computerChoice) return 'tie';
    
    const winConditions = {
        rock: 'scissors',
        paper: 'rock', 
        scissors: 'paper'
    };
    
    return winConditions[playerChoice] === computerChoice ? 'win' : 'lose';
}

// Generate SVG image instead of Canvas
function generateGameSVG(gameState) {
    const width = 800;
    const height = 418;
    
    let content = '';
    
    if (gameState.phase === 'start') {
        content = `
            <text x="400" y="80" font-family="Arial" font-size="48" font-weight="bold" text-anchor="middle" fill="white">Rock Paper Scissors</text>
            <text x="400" y="180" font-family="Arial" font-size="32" text-anchor="middle" fill="#4299e1">Choose your move!</text>
            
            <rect x="150" y="220" width="120" height="80" rx="10" fill="#2d3748"/>
            <text x="210" y="275" font-family="Arial" font-size="40" text-anchor="middle" fill="white">🗿</text>
            
            <rect x="340" y="220" width="120" height="80" rx="10" fill="#2d3748"/>
            <text x="400" y="275" font-family="Arial" font-size="40" text-anchor="middle" fill="white">📄</text>
            
            <rect x="530" y="220" width="120" height="80" rx="10" fill="#2d3748"/>
            <text x="590" y="275" font-family="Arial" font-size="40" text-anchor="middle" fill="white">✂️</text>
        `;
    } else if (gameState.phase === 'result') {
        const { playerChoice, computerChoice, result } = gameState;
        
        let resultText = '';
        let resultColor = '';
        
        switch (result) {
            case 'win':
                resultText = '🎉 You Win! +10 coins';
                resultColor = '#48bb78';
                break;
            case 'lose':
                resultText = '😢 You Lose! +2 coins';
                resultColor = '#f56565';
                break;
            case 'tie':
                resultText = '🤝 It\'s a Tie! +5 coins';
                resultColor = '#ed8936';
                break;
        }
        
        content = `
            <text x="400" y="80" font-family="Arial" font-size="48" font-weight="bold" text-anchor="middle" fill="white">Rock Paper Scissors</text>
            
            <text x="150" y="180" font-family="Arial" font-size="24" text-anchor="start" fill="white">You:</text>
            <text x="200" y="240" font-family="Arial" font-size="60" text-anchor="middle" fill="white">${CHOICES[playerChoice].emoji}</text>
            
            <text x="400" y="220" font-family="Arial" font-size="36" font-weight="bold" text-anchor="middle" fill="#4299e1">VS</text>
            
            <text x="650" y="180" font-family="Arial" font-size="24" text-anchor="end" fill="white">Computer:</text>
            <text x="600" y="240" font-family="Arial" font-size="60" text-anchor="middle" fill="white">${CHOICES[computerChoice].emoji}</text>
            
            <text x="400" y="320" font-family="Arial" font-size="32" font-weight="bold" text-anchor="middle" fill="${resultColor}">${resultText}</text>
            <text x="400" y="360" font-family="Arial" font-size="20" text-anchor="middle" fill="white">Balance: ${gameState.balance || 0} coins</text>
        `;
    } else if (gameState.phase === 'balance') {
        content = `
            <text x="400" y="80" font-family="Arial" font-size="48" font-weight="bold" text-anchor="middle" fill="white">Your Balance</text>
            <text x="400" y="180" font-family="Arial" font-size="64" font-weight="bold" text-anchor="middle" fill="#4299e1">${gameState.balance || 0}</text>
            <text x="400" y="220" font-family="Arial" font-size="32" text-anchor="middle" fill="white">coins</text>
            ${gameState.rewardMessage ? `<text x="400" y="280" font-family="Arial" font-size="24" text-anchor="middle" fill="#48bb78">${gameState.rewardMessage}</text>` : ''}
            <text x="400" y="350" font-family="Arial" font-size="20" text-anchor="middle" fill="#666">Games: ${(gameState.wins || 0) + (gameState.losses || 0) + (gameState.ties || 0)}</text>
        `;
    }
    
    return `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1a1a2e"/>
                    <stop offset="50%" stop-color="#16213e"/>
                    <stop offset="100%" stop-color="#0f3460"/>
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#bg)"/>
            ${content}
        </svg>
    `;
}

// Generate Frame HTML
function generateFrameHTML(gameState, sessionId) {
    const baseUrl = process.env.REPL_URL || `http://localhost:${PORT}`;
    
    let buttons = '';
    
    if (gameState.phase === 'start') {
        buttons = `
            <meta name="fc:frame:button:1" content="🗿 Rock" />
            <meta name="fc:frame:button:1:action" content="post" />
            <meta name="fc:frame:button:1:target" content="${baseUrl}/api/frame/play?choice=rock&session=${sessionId}" />
            
            <meta name="fc:frame:button:2" content="📄 Paper" />
            <meta name="fc:frame:button:2:action" content="post" />
            <meta name="fc:frame:button:2:target" content="${baseUrl}/api/frame/play?choice=paper&session=${sessionId}" />
            
            <meta name="fc:frame:button:3" content="✂️ Scissors" />
            <meta name="fc:frame:button:3:action" content="post" />
            <meta name="fc:frame:button:3:target" content="${baseUrl}/api/frame/play?choice=scissors&session=${sessionId}" />
            
            <meta name="fc:frame:button:4" content="💰 Balance" />
            <meta name="fc:frame:button:4:action" content="post" />
            <meta name="fc:frame:button:4:target" content="${baseUrl}/api/frame/balance?session=${sessionId}" />
        `;
    } else if (gameState.phase === 'result') {
        buttons = `
            <meta name="fc:frame:button:1" content="🔄 Play Again" />
            <meta name="fc:frame:button:1:action" content="post" />
            <meta name="fc:frame:button:1:target" content="${baseUrl}/api/frame/restart?session=${sessionId}" />
            
            <meta name="fc:frame:button:2" content="💰 Balance" />
            <meta name="fc:frame:button:2:action" content="post" />
            <meta name="fc:frame:button:2:target" content="${baseUrl}/api/frame/balance?session=${sessionId}" />
            
            <meta name="fc:frame:button:3" content="🏆 Stats" />
            <meta name="fc:frame:button:3:action" content="post" />
            <meta name="fc:frame:button:3:target" content="${baseUrl}/api/frame/stats?session=${sessionId}" />
        `;
    } else if (gameState.phase === 'balance') {
        buttons = `
            <meta name="fc:frame:button:1" content="🎮 Play Game" />
            <meta name="fc:frame:button:1:action" content="post" />
            <meta name="fc:frame:button:1:target" content="${baseUrl}/api/frame/restart?session=${sessionId}" />
            
            <meta name="fc:frame:button:2" content="🎁 Daily Reward" />
            <meta name="fc:frame:button:2:action" content="post" />
            <meta name="fc:frame:button:2:target" content="${baseUrl}/api/frame/reward?session=${sessionId}" />
        `;
    }

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Rock Paper Scissors Game</title>
    
    <meta name="fc:frame" content="vNext" />
    <meta name="fc:frame:image" content="${baseUrl}/api/frame/image?session=${sessionId}" />
    <meta name="fc:frame:image:aspect_ratio" content="1.91:1" />
    ${buttons}
    
    <meta property="og:title" content="Rock Paper Scissors Game" />
    <meta property="og:description" content="Play Rock Paper Scissors and earn coins!" />
    <meta property="og:image" content="${baseUrl}/api/frame/image?session=${sessionId}" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Rock Paper Scissors Game" />
    <meta name="twitter:description" content="Play Rock Paper Scissors and earn coins!" />
</head>
<body>
    <h1>Rock Paper Scissors Game</h1>
    <p>This is a Farcaster Frame game. View in a Frame-enabled client to play!</p>
    <a href="/">Play the full game</a>
</body>
</html>`;
}

// Routes
app.get('/frame', (req, res) => {
    const sessionId = Date.now().toString();
    const gameState = {
        phase: 'start',
        balance: 100,
        wins: 0,
        losses: 0,
        ties: 0,
        lastReward: null
    };
    
    frameStates.set(sessionId, gameState);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(generateFrameHTML(gameState, sessionId));
});

app.get('/api/frame/image', (req, res) => {
    try {
        const sessionId = req.query.session;
        const gameState = frameStates.get(sessionId) || { phase: 'start', balance: 100 };
        
        const svgContent = generateGameSVG(gameState);
        
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'no-cache');
        res.send(svgContent);
    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).send('Error generating image');
    }
});

app.post('/api/frame/play', (req, res) => {
    try {
        const { choice, session } = req.query;
        const gameState = frameStates.get(session) || { phase: 'start', balance: 100, wins: 0, losses: 0, ties: 0 };
        
        if (!CHOICES[choice]) {
            return res.status(400).json({ error: 'Invalid choice' });
        }
        
        const computerChoice = Object.keys(CHOICES)[Math.floor(Math.random() * 3)];
        const result = determineWinner(choice, computerChoice);
        
        let coinReward = 0;
        switch (result) {
            case 'win':
                coinReward = 10;
                gameState.wins = (gameState.wins || 0) + 1;
                break;
            case 'lose':
                coinReward = 2;
                gameState.losses = (gameState.losses || 0) + 1;
                break;
            case 'tie':
                coinReward = 5;
                gameState.ties = (gameState.ties || 0) + 1;
                break;
        }
        
        gameState.balance = (gameState.balance || 100) + coinReward;
        gameState.phase = 'result';
        gameState.playerChoice = choice;
        gameState.computerChoice = computerChoice;
        gameState.result = result;
        gameState.coinReward = coinReward;
        
        frameStates.set(session, gameState);
        
        res.setHeader('Content-Type', 'text/html');
        res.send(generateFrameHTML(gameState, session));
    } catch (error) {
        console.error('Error in play endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/frame/restart', (req, res) => {
    try {
        const { session } = req.query;
        const gameState = frameStates.get(session) || { balance: 100, wins: 0, losses: 0, ties: 0 };
        
        gameState.phase = 'start';
        delete gameState.playerChoice;
        delete gameState.computerChoice;
        delete gameState.result;
        delete gameState.coinReward;
        delete gameState.rewardMessage;
        
        frameStates.set(session, gameState);
        
        res.setHeader('Content-Type', 'text/html');
        res.send(generateFrameHTML(gameState, session));
    } catch (error) {
        console.error('Error in restart endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/frame/balance', (req, res) => {
    try {
        const { session } = req.query;
        const gameState = frameStates.get(session) || { balance: 100, wins: 0, losses: 0, ties: 0 };
        
        gameState.phase = 'balance';
        frameStates.set(session, gameState);
        
        res.setHeader('Content-Type', 'text/html');
        res.send(generateFrameHTML(gameState, session));
    } catch (error) {
        console.error('Error in balance endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/frame/reward', (req, res) => {
    try {
        const { session } = req.query;
        const gameState = frameStates.get(session) || { balance: 100, wins: 0, losses: 0, ties: 0 };
        
        const today = new Date().toDateString();
        
        if (gameState.lastReward === today) {
            gameState.rewardMessage = 'Already claimed today!';
        } else {
            const reward = 50;
            gameState.balance = (gameState.balance || 100) + reward;
            gameState.lastReward = today;
            gameState.rewardMessage = `+${reward} coins claimed!`;
        }
        
        gameState.phase = 'balance';
        frameStates.set(session, gameState);
        
        res.setHeader('Content-Type', 'text/html');
        res.send(generateFrameHTML(gameState, session));
    } catch (error) {
        console.error('Error in reward endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/frame/stats', (req, res) => {
    try {
        const { session } = req.query;
        const gameState = frameStates.get(session) || { balance: 100, wins: 0, losses: 0, ties: 0 };
        
        const baseUrl = process.env.REPL_URL || `http://localhost:${PORT}`;
        
        const statsSVG = `
            <svg width="800" height="418" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#1a1a2e"/>
                        <stop offset="50%" stop-color="#16213e"/>
                        <stop offset="100%" stop-color="#0f3460"/>
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#bg)"/>
                <text x="400" y="80" font-family="Arial" font-size="36" font-weight="bold" text-anchor="middle" fill="white">Your Game Stats</text>
                <text x="400" y="150" font-family="Arial" font-size="28" text-anchor="middle" fill="white">Balance: ${gameState.balance || 0} coins</text>
                <text x="400" y="190" font-family="Arial" font-size="28" text-anchor="middle" fill="white">Wins: ${gameState.wins || 0}</text>
                <text x="400" y="230" font-family="Arial" font-size="28" text-anchor="middle" fill="white">Losses: ${gameState.losses || 0}</text>
                <text x="400" y="270" font-family="Arial" font-size="28" text-anchor="middle" fill="white">Ties: ${gameState.ties || 0}</text>
                <text x="400" y="310" font-family="Arial" font-size="28" text-anchor="middle" fill="white">Total Games: ${(gameState.wins || 0) + (gameState.losses || 0) + (gameState.ties || 0)}</text>
            </svg>
        `;
        
        const statsHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Game Stats</title>
    
    <meta name="fc:frame" content="vNext" />
    <meta name="fc:frame:image" content="data:image/svg+xml;base64,${Buffer.from(statsSVG).toString('base64')}" />
    <meta name="fc:frame:image:aspect_ratio" content="1.91:1" />
    
    <meta name="fc:frame:button:1" content="🎮 Play Game" />
    <meta name="fc:frame:button:1:action" content="post" />
    <meta name="fc:frame:button:1:target" content="${baseUrl}/api/frame/restart?session=${session}" />
    
    <meta name="fc:frame:button:2" content="💰 Balance" />
    <meta name="fc:frame:button:2:action" content="post" />
    <meta name="fc:frame:button:2:target" content="${baseUrl}/api/frame/balance?session=${session}" />
</head>
<body>
    <h1>Game Stats</h1>
    <p>View your game statistics</p>
</body>
</html>`;
        
        res.setHeader('Content-Type', 'text/html');
        res.send(statsHTML);
    } catch (error) {
        console.error('Error in stats endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Web3 API endpoints
app.post('/api/web3/reward', async (req, res) => {
    try {
        const { playerAddress, gameResult } = req.body;
        
        if (!web3.isValidAddress(playerAddress)) {
            return res.status(400).json({ error: 'Invalid player address' });
        }
        
        if (!['win', 'lose', 'tie'].includes(gameResult)) {
            return res.status(400).json({ error: 'Invalid game result' });
        }
        
        // Simulate token reward (in production, this would mint actual tokens)
        const tokenReward = gameResult === 'win' ? 10 : gameResult === 'tie' ? 5 : 2;
        const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
        
        res.json({
            success: true,
            txHash: mockTxHash,
            reward: tokenReward,
            message: `Player rewarded ${tokenReward} RPS tokens for ${gameResult}`
        });
    } catch (error) {
        console.error('Reward API error:', error);
        res.status(500).json({ 
            error: 'Failed to process reward',
            message: error.message 
        });
    }
});

app.post('/api/web3/withdraw', async (req, res) => {
    try {
        const { playerAddress, amount } = req.body;
        
        if (!web3.isValidAddress(playerAddress)) {
            return res.status(400).json({ error: 'Invalid player address' });
        }
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid withdrawal amount' });
        }
        
        // Simulate token withdrawal (in production, this would mint actual tokens)
        const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
        
        res.json({
            success: true,
            txHash: mockTxHash,
            amount: amount,
            message: `Successfully withdrew ${amount} RPS tokens to Base network`
        });
    } catch (error) {
        console.error('Withdrawal API error:', error);
        res.status(500).json({ 
            error: 'Failed to process withdrawal',
            message: error.message 
        });
    }
});

app.get('/api/web3/balance/:address', async (req, res) => {
    try {
        const { address } = req.params;
        
        if (!web3.isValidAddress(address)) {
            return res.status(400).json({ error: 'Invalid address' });
        }
        
        // Simulate token balance
        const mockBalance = (Math.random() * 1000).toFixed(2);
        
        res.json({
            address: address,
            balance: mockBalance,
            stats: {
                wins: 0,
                totalRewards: mockBalance,
                lastRewardTime: Date.now()
            }
        });
    } catch (error) {
        console.error('Balance API error:', error);
        res.status(500).json({ 
            error: 'Failed to get balance',
            message: error.message 
        });
    }
});

app.get('/api/web3/network-config', (req, res) => {
    try {
        const baseConfig = {
            chainId: '0x14A34', // Base Sepolia for testing
            chainName: 'Base Sepolia',
            nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18
            },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia.basescan.org']
        };
        
        res.json({
            network: baseConfig,
            contractAddress: '0x1234567890123456789012345678901234567890'
        });
    } catch (error) {
        console.error('Network config error:', error);
        res.status(500).json({ error: 'Failed to get network config' });
    }
});

// Error handling
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Frame Server running on port ${PORT}`);
    console.log(`📱 Frame URL: http://localhost:${PORT}/frame`);
});

module.exports = app;