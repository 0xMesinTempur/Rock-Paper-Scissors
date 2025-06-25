const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false // Allow inline styles for frames
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Frame state storage (in production, use Redis or database)
const frameStates = new Map();

// Game choices and emojis
const CHOICES = {
    rock: { emoji: '🗿', name: 'Rock' },
    paper: { emoji: '📄', name: 'Paper' },
    scissors: { emoji: '✂️', name: 'Scissors' }
};

// Helper function to determine winner
function determineWinner(playerChoice, computerChoice) {
    if (playerChoice === computerChoice) return 'tie';
    
    const winConditions = {
        rock: 'scissors',
        paper: 'rock',
        scissors: 'paper'
    };
    
    return winConditions[playerChoice] === computerChoice ? 'win' : 'lose';
}

// Generate dynamic game image
async function generateGameImage(gameState) {
    const width = 800;
    const height = 418; // Frame standard aspect ratio 1.91:1
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Rock Paper Scissors', width / 2, 80);

    if (gameState.phase === 'start') {
        // Starting state
        ctx.fillStyle = '#4299e1';
        ctx.font = '32px Arial';
        ctx.fillText('Choose your move!', width / 2, 180);
        
        // Choice buttons representation
        const choices = Object.keys(CHOICES);
        const buttonWidth = 120;
        const spacing = 50;
        const startX = (width - (choices.length * buttonWidth + (choices.length - 1) * spacing)) / 2;
        
        choices.forEach((choice, index) => {
            const x = startX + index * (buttonWidth + spacing);
            const y = 220;
            
            // Button background
            ctx.fillStyle = '#2d3748';
            ctx.roundRect(x, y, buttonWidth, 80, 10);
            ctx.fill();
            
            // Choice emoji
            ctx.font = '40px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(CHOICES[choice].emoji, x + buttonWidth / 2, y + 55);
        });
        
    } else if (gameState.phase === 'result') {
        // Game result state
        const { playerChoice, computerChoice, result } = gameState;
        
        // Player section
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('You:', 150, 180);
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(CHOICES[playerChoice].emoji, 200, 240);
        
        // VS text
        ctx.fillStyle = '#4299e1';
        ctx.font = 'bold 36px Arial';
        ctx.fillText('VS', width / 2, 220);
        
        // Computer section
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Computer:', width - 150, 180);
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(CHOICES[computerChoice].emoji, width - 200, 240);
        
        // Result
        ctx.font = 'bold 32px Arial';
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
        
        ctx.fillStyle = resultColor;
        ctx.fillText(resultText, width / 2, 320);
        
        // Balance display
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText(`Balance: ${gameState.balance || 0} coins`, width / 2, 360);
    }

    return canvas.toBuffer('image/png');
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

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Rock Paper Scissors Game</title>
            
            <!-- Farcaster Frame Meta Tags -->
            <meta name="fc:frame" content="vNext" />
            <meta name="fc:frame:image" content="${baseUrl}/api/frame/image?session=${sessionId}" />
            <meta name="fc:frame:image:aspect_ratio" content="1.91:1" />
            ${buttons}
            
            <!-- Open Graph -->
            <meta property="og:title" content="Rock Paper Scissors Game" />
            <meta property="og:description" content="Play Rock Paper Scissors and earn coins!" />
            <meta property="og:image" content="${baseUrl}/api/frame/image?session=${sessionId}" />
            <meta property="og:url" content="${baseUrl}" />
            
            <!-- Twitter Card -->
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Rock Paper Scissors Game" />
            <meta name="twitter:description" content="Play Rock Paper Scissors and earn coins!" />
            <meta name="twitter:image" content="${baseUrl}/api/frame/image?session=${sessionId}" />
        </head>
        <body>
            <h1>Rock Paper Scissors Game</h1>
            <p>This is a Farcaster Frame game. View in a Frame-enabled client to play!</p>
            <a href="/">Play the full game</a>
        </body>
        </html>
    `;
}

// Routes

// Frame entry point
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

// Dynamic image generation
app.get('/api/frame/image', async (req, res) => {
    try {
        const sessionId = req.query.session;
        const gameState = frameStates.get(sessionId) || { phase: 'start', balance: 100 };
        
        const imageBuffer = await generateGameImage(gameState);
        
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-cache');
        res.send(imageBuffer);
    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).send('Error generating image');
    }
});

// Game play endpoint
app.post('/api/frame/play', (req, res) => {
    try {
        const { choice, session } = req.query;
        const gameState = frameStates.get(session) || { phase: 'start', balance: 100, wins: 0, losses: 0, ties: 0 };
        
        if (!CHOICES[choice]) {
            return res.status(400).json({ error: 'Invalid choice' });
        }
        
        // Generate computer choice
        const computerChoice = Object.keys(CHOICES)[Math.floor(Math.random() * 3)];
        const result = determineWinner(choice, computerChoice);
        
        // Update balance and stats
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

// Restart game
app.post('/api/frame/restart', (req, res) => {
    try {
        const { session } = req.query;
        const gameState = frameStates.get(session) || { balance: 100, wins: 0, losses: 0, ties: 0 };
        
        gameState.phase = 'start';
        delete gameState.playerChoice;
        delete gameState.computerChoice;
        delete gameState.result;
        delete gameState.coinReward;
        
        frameStates.set(session, gameState);
        
        res.setHeader('Content-Type', 'text/html');
        res.send(generateFrameHTML(gameState, session));
    } catch (error) {
        console.error('Error in restart endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Balance view
app.post('/api/frame/balance', async (req, res) => {
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

// Daily reward
app.post('/api/frame/reward', (req, res) => {
    try {
        const { session } = req.query;
        const gameState = frameStates.get(session) || { balance: 100, wins: 0, losses: 0, ties: 0 };
        
        const today = new Date().toDateString();
        
        if (gameState.lastReward === today) {
            gameState.phase = 'balance';
            gameState.rewardMessage = 'Already claimed today!';
        } else {
            const reward = 50;
            gameState.balance = (gameState.balance || 100) + reward;
            gameState.lastReward = today;
            gameState.phase = 'balance';
            gameState.rewardMessage = `+${reward} coins claimed!`;
        }
        
        frameStates.set(session, gameState);
        
        res.setHeader('Content-Type', 'text/html');
        res.send(generateFrameHTML(gameState, session));
    } catch (error) {
        console.error('Error in reward endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Stats view
app.post('/api/frame/stats', async (req, res) => {
    try {
        const { session } = req.query;
        const gameState = frameStates.get(session) || { balance: 100, wins: 0, losses: 0, ties: 0 };
        
        // Generate stats image
        const width = 800;
        const height = 418;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Your Game Stats', width / 2, 80);

        // Stats
        const stats = [
            `Balance: ${gameState.balance || 0} coins`,
            `Wins: ${gameState.wins || 0}`,
            `Losses: ${gameState.losses || 0}`,
            `Ties: ${gameState.ties || 0}`,
            `Total Games: ${(gameState.wins || 0) + (gameState.losses || 0) + (gameState.ties || 0)}`
        ];

        ctx.font = '28px Arial';
        stats.forEach((stat, index) => {
            ctx.fillText(stat, width / 2, 150 + index * 50);
        });

        const imageBuffer = canvas.toBuffer('image/png');
        
        // Update image URL in state
        const baseUrl = process.env.REPL_URL || `http://localhost:${PORT}`;
        gameState.phase = 'stats';
        frameStates.set(session, gameState);
        
        const statsHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Game Stats</title>
                
                <meta name="fc:frame" content="vNext" />
                <meta name="fc:frame:image" content="data:image/png;base64,${imageBuffer.toString('base64')}" />
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
            </html>
        `;
        
        res.setHeader('Content-Type', 'text/html');
        res.send(statsHTML);
    } catch (error) {
        console.error('Error in stats endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Rock Paper Scissors Frame Server running on port ${PORT}`);
    console.log(`📱 Frame URL: http://localhost:${PORT}/frame`);
});

module.exports = app;