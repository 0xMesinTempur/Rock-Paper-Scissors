#!/usr/bin/env node

// Frame validation script
const http = require('http');

const BASE_URL = 'http://localhost:5000';

async function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(typeof data === 'string' ? data : JSON.stringify(data));
        }
        
        req.end();
    });
}

async function validateFrame() {
    console.log('🧪 Starting Frame validation...\n');
    
    // Test 1: Frame endpoint
    try {
        console.log('1. Testing Frame endpoint...');
        const frameResponse = await makeRequest('/frame');
        
        if (frameResponse.status === 200) {
            const hasFrameMeta = frameResponse.body.includes('fc:frame');
            const hasButtons = frameResponse.body.includes('fc:frame:button');
            const hasImage = frameResponse.body.includes('fc:frame:image');
            
            console.log(`   ✅ Frame endpoint (${frameResponse.status})`);
            console.log(`   ${hasFrameMeta ? '✅' : '❌'} Frame meta tags`);
            console.log(`   ${hasButtons ? '✅' : '❌'} Frame buttons`);
            console.log(`   ${hasImage ? '✅' : '❌'} Frame image`);
        } else {
            console.log(`   ❌ Frame endpoint failed (${frameResponse.status})`);
        }
    } catch (error) {
        console.log(`   ❌ Frame endpoint error: ${error.message}`);
    }

    // Test 2: Image generation
    try {
        console.log('\n2. Testing Image generation...');
        const imageResponse = await makeRequest('/api/frame/image?session=test123');
        
        if (imageResponse.status === 200) {
            const isSVG = imageResponse.headers['content-type']?.includes('svg');
            const hasContent = imageResponse.body.length > 100;
            
            console.log(`   ✅ Image endpoint (${imageResponse.status})`);
            console.log(`   ${isSVG ? '✅' : '❌'} SVG content type`);
            console.log(`   ${hasContent ? '✅' : '❌'} Valid image content`);
        } else {
            console.log(`   ❌ Image endpoint failed (${imageResponse.status})`);
        }
    } catch (error) {
        console.log(`   ❌ Image endpoint error: ${error.message}`);
    }

    // Test 3: Game play
    try {
        console.log('\n3. Testing Game play...');
        const playResponse = await makeRequest('/api/frame/play?choice=rock&session=test456', 'POST', '{}');
        
        if (playResponse.status === 200) {
            const hasResult = playResponse.body.includes('Play Again');
            const hasGameButtons = playResponse.body.includes('fc:frame:button');
            const hasResultImage = playResponse.body.includes('fc:frame:image');
            
            console.log(`   ✅ Play endpoint (${playResponse.status})`);
            console.log(`   ${hasResult ? '✅' : '❌'} Game result`);
            console.log(`   ${hasGameButtons ? '✅' : '❌'} Result buttons`);
            console.log(`   ${hasResultImage ? '✅' : '❌'} Result image`);
        } else {
            console.log(`   ❌ Play endpoint failed (${playResponse.status})`);
        }
    } catch (error) {
        console.log(`   ❌ Play endpoint error: ${error.message}`);
    }

    // Test 4: State management
    try {
        console.log('\n4. Testing State management...');
        const balanceResponse = await makeRequest('/api/frame/balance?session=test456', 'POST', '{}');
        
        if (balanceResponse.status === 200) {
            const hasBalance = balanceResponse.body.includes('Balance');
            const hasBalanceButtons = balanceResponse.body.includes('Play Game');
            
            console.log(`   ✅ Balance endpoint (${balanceResponse.status})`);
            console.log(`   ${hasBalance ? '✅' : '❌'} Balance display`);
            console.log(`   ${hasBalanceButtons ? '✅' : '❌'} Balance buttons`);
        } else {
            console.log(`   ❌ Balance endpoint failed (${balanceResponse.status})`);
        }
    } catch (error) {
        console.log(`   ❌ Balance endpoint error: ${error.message}`);
    }

    // Test 5: Daily reward
    try {
        console.log('\n5. Testing Daily reward...');
        const rewardResponse = await makeRequest('/api/frame/reward?session=test789', 'POST', '{}');
        
        if (rewardResponse.status === 200) {
            const hasReward = rewardResponse.body.includes('coins');
            const hasRewardImage = rewardResponse.body.includes('fc:frame:image');
            
            console.log(`   ✅ Reward endpoint (${rewardResponse.status})`);
            console.log(`   ${hasReward ? '✅' : '❌'} Reward content`);
            console.log(`   ${hasRewardImage ? '✅' : '❌'} Reward image`);
        } else {
            console.log(`   ❌ Reward endpoint failed (${rewardResponse.status})`);
        }
    } catch (error) {
        console.log(`   ❌ Reward endpoint error: ${error.message}`);
    }

    console.log('\n🏁 Frame validation complete!');
}

// Run validation
validateFrame().catch(console.error);