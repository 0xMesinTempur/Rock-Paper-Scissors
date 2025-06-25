// Web3 Wallet Connection and Base Network Integration
class WalletConnection {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.contract = null;
        this.isConnected = false;
        
        // Base Network Configuration
        this.baseMainnet = {
            chainId: '0x2105',
            chainName: 'Base',
            nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18
            },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org']
        };
        
        this.baseSepolia = {
            chainId: '0x14A34',
            chainName: 'Base Sepolia',
            nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18
            },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia.basescan.org']
        };
        
        // Contract configuration (would be set after deployment)
        this.contractAddress = '0x1234567890123456789012345678901234567890'; // Placeholder
        this.contractABI = [
            {
                "inputs": [{"internalType": "address", "name": "player", "type": "address"}, {"internalType": "string", "name": "result", "type": "string"}],
                "name": "rewardGame",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "claimDailyReward",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
                "name": "getPlayerStats",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
                "name": "transfer",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ];
    }
    
    async detectWallet() {
        if (typeof window.ethereum !== 'undefined') {
            this.web3 = window.ethereum;
            console.log('✅ MetaMask detected');
            return true;
        } else {
            console.log('❌ MetaMask not detected');
            return false;
        }
    }
    
    async connectWallet() {
        try {
            if (!await this.detectWallet()) {
                throw new Error('MetaMask not installed');
            }
            
            const accounts = await this.web3.request({ method: 'eth_requestAccounts' });
            this.account = accounts[0];
            this.isConnected = true;
            
            console.log('✅ Wallet connected:', this.account);
            
            // Auto-switch to Base network
            await this.switchToBase();
            
            return {
                success: true,
                account: this.account,
                shortAccount: this.formatAddress(this.account)
            };
        } catch (error) {
            console.error('❌ Wallet connection failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async addBaseNetwork() {
        try {
            const network = process.env.NODE_ENV === 'production' ? this.baseMainnet : this.baseSepolia;
            
            await this.web3.request({
                method: 'wallet_addEthereumChain',
                params: [network]
            });
            
            console.log('✅ Base network added');
            return true;
        } catch (error) {
            console.error('❌ Failed to add Base network:', error);
            return false;
        }
    }
    
    async switchToBase() {
        try {
            const chainId = process.env.NODE_ENV === 'production' ? this.baseMainnet.chainId : this.baseSepolia.chainId;
            
            try {
                await this.web3.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId }]
                });
                console.log('✅ Switched to Base network');
                return true;
            } catch (switchError) {
                // If network doesn't exist, add it
                if (switchError.code === 4902) {
                    await this.addBaseNetwork();
                    return await this.switchToBase();
                }
                throw switchError;
            }
        } catch (error) {
            console.error('❌ Failed to switch to Base network:', error);
            return false;
        }
    }
    
    async getCurrentNetwork() {
        try {
            const chainId = await this.web3.request({ method: 'eth_chainId' });
            const targetChainId = process.env.NODE_ENV === 'production' ? this.baseMainnet.chainId : this.baseSepolia.chainId;
            
            return {
                chainId,
                isBase: chainId === targetChainId,
                networkName: chainId === targetChainId ? 'Base' : 'Other'
            };
        } catch (error) {
            console.error('❌ Failed to get current network:', error);
            return { chainId: null, isBase: false, networkName: 'Unknown' };
        }
    }
    
    async getBalance() {
        try {
            if (!this.account) return '0';
            
            const balance = await this.web3.request({
                method: 'eth_getBalance',
                params: [this.account, 'latest']
            });
            
            return (parseInt(balance, 16) / 1e18).toFixed(6);
        } catch (error) {
            console.error('❌ Failed to get balance:', error);
            return '0';
        }
    }
    
    async getTokenBalance() {
        try {
            if (!this.account || !this.contract) return '0';
            
            const balance = await this.contract.methods.balanceOf(this.account).call();
            return (balance / 1e18).toFixed(2);
        } catch (error) {
            console.error('❌ Failed to get token balance:', error);
            return '0';
        }
    }
    
    async claimDailyReward() {
        try {
            if (!this.account || !this.contract) {
                throw new Error('Wallet not connected');
            }
            
            const tx = await this.contract.methods.claimDailyReward().send({ from: this.account });
            
            console.log('✅ Daily reward claimed:', tx.transactionHash);
            return {
                success: true,
                txHash: tx.transactionHash
            };
        } catch (error) {
            console.error('❌ Failed to claim daily reward:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async withdrawTokens(amount, recipientAddress) {
        try {
            if (!this.account || !this.contract) {
                throw new Error('Wallet not connected');
            }
            
            const amountWei = (amount * 1e18).toString();
            const tx = await this.contract.methods.transfer(recipientAddress, amountWei).send({ from: this.account });
            
            console.log('✅ Tokens withdrawn:', tx.transactionHash);
            return {
                success: true,
                txHash: tx.transactionHash
            };
        } catch (error) {
            console.error('❌ Failed to withdraw tokens:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async getPlayerStats() {
        try {
            if (!this.account || !this.contract) return null;
            
            const stats = await this.contract.methods.getPlayerStats(this.account).call();
            return {
                wins: stats[0],
                totalRewards: (stats[1] / 1e18).toFixed(2),
                balance: (stats[2] / 1e18).toFixed(2),
                lastRewardTime: stats[3]
            };
        } catch (error) {
            console.error('❌ Failed to get player stats:', error);
            return null;
        }
    }
    
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    formatTokenAmount(amount) {
        return parseFloat(amount).toFixed(2);
    }
    
    isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    
    disconnect() {
        this.account = null;
        this.isConnected = false;
        this.contract = null;
        console.log('✅ Wallet disconnected');
    }
    
    // Event listeners for wallet changes
    setupEventListeners() {
        if (this.web3) {
            this.web3.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.account = accounts[0];
                    console.log('🔄 Account changed:', this.account);
                }
            });
            
            this.web3.on('chainChanged', (chainId) => {
                console.log('🔄 Network changed:', chainId);
                window.location.reload(); // Reload to update UI
            });
        }
    }
}

// Export for use in other scripts
window.WalletConnection = WalletConnection;