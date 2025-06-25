const { ethers } = require('ethers');

class Web3Integration {
    constructor() {
        this.provider = null;
        this.contract = null;
        this.wallet = null;
        this.contractAddress = null;
        
        // Base Network configuration
        this.baseConfig = {
            chainId: '0x2105', // Base Mainnet
            chainName: 'Base',
            nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18
            },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org']
        };
        
        this.baseTestnetConfig = {
            chainId: '0x14A34', // Base Sepolia
            chainName: 'Base Sepolia',
            nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18
            },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia.basescan.org']
        };
        
        // Contract ABI (simplified for the token contract)
        this.contractABI = [
            "function rewardGame(address player, string memory result) external",
            "function claimDailyReward() external",
            "function getPlayerStats(address player) external view returns (uint256, uint256, uint256, uint256)",
            "function balanceOf(address account) external view returns (uint256)",
            "function transfer(address to, uint256 amount) external returns (bool)",
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function totalSupply() external view returns (uint256)",
            "function name() external view returns (string)",
            "function symbol() external view returns (string)",
            "function decimals() external view returns (uint8)",
            "event GameReward(address indexed player, uint256 amount, string gameResult)",
            "event DailyReward(address indexed player, uint256 amount)",
            "event Transfer(address indexed from, address indexed to, uint256 value)"
        ];
    }
    
    async initialize() {
        try {
            // Initialize provider with Base RPC
            const rpcUrl = process.env.BASE_RPC_URL || 'https://sepolia.base.org';
            this.provider = new ethers.JsonRpcProvider(rpcUrl);
            
            // Initialize wallet if private key is provided
            if (process.env.PRIVATE_KEY) {
                this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
                console.log('✅ Wallet connected:', this.wallet.address);
            }
            
            // For demo purposes, we'll use a placeholder contract address
            // In production, this would be deployed first
            this.contractAddress = "0x1234567890123456789012345678901234567890";
            
            if (this.wallet && this.contractAddress) {
                this.contract = new ethers.Contract(
                    this.contractAddress,
                    this.contractABI,
                    this.wallet
                );
            }
            
            console.log('✅ Web3 Integration initialized');
            return true;
        } catch (error) {
            console.error('❌ Web3 Integration failed:', error);
            return false;
        }
    }
    
    async addBaseNetwork() {
        try {
            // This would be called from the frontend
            const networkConfig = process.env.NODE_ENV === 'production' 
                ? this.baseConfig 
                : this.baseTestnetConfig;
                
            return {
                method: 'wallet_addEthereumChain',
                params: [networkConfig]
            };
        } catch (error) {
            console.error('Error adding Base network:', error);
            throw error;
        }
    }
    
    async switchToBase() {
        try {
            const chainId = process.env.NODE_ENV === 'production' 
                ? this.baseConfig.chainId 
                : this.baseTestnetConfig.chainId;
                
            return {
                method: 'wallet_switchEthereumChain',
                params: [{ chainId }]
            };
        } catch (error) {
            console.error('Error switching to Base network:', error);
            throw error;
        }
    }
    
    async rewardPlayer(playerAddress, gameResult) {
        try {
            if (!this.contract || !this.wallet) {
                throw new Error('Contract not initialized');
            }
            
            const tx = await this.contract.rewardGame(playerAddress, gameResult);
            await tx.wait();
            
            console.log(`✅ Player ${playerAddress} rewarded for ${gameResult}`);
            return tx.hash;
        } catch (error) {
            console.error('Error rewarding player:', error);
            throw error;
        }
    }
    
    async claimDailyReward(playerAddress) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }
            
            // This would be called from the frontend with the player's wallet
            const tx = await this.contract.claimDailyReward();
            await tx.wait();
            
            console.log(`✅ Daily reward claimed by ${playerAddress}`);
            return tx.hash;
        } catch (error) {
            console.error('Error claiming daily reward:', error);
            throw error;
        }
    }
    
    async getPlayerStats(playerAddress) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }
            
            const stats = await this.contract.getPlayerStats(playerAddress);
            return {
                wins: stats[0].toString(),
                totalRewards: ethers.formatEther(stats[1]),
                balance: ethers.formatEther(stats[2]),
                lastRewardTime: stats[3].toString()
            };
        } catch (error) {
            console.error('Error getting player stats:', error);
            throw error;
        }
    }
    
    async getTokenBalance(playerAddress) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }
            
            const balance = await this.contract.balanceOf(playerAddress);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error('Error getting token balance:', error);
            throw error;
        }
    }
    
    async transferTokens(fromAddress, toAddress, amount) {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }
            
            const amountWei = ethers.parseEther(amount.toString());
            const tx = await this.contract.transfer(toAddress, amountWei);
            await tx.wait();
            
            console.log(`✅ Transferred ${amount} tokens from ${fromAddress} to ${toAddress}`);
            return tx.hash;
        } catch (error) {
            console.error('Error transferring tokens:', error);
            throw error;
        }
    }
    
    // Utility functions
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    formatTokenAmount(amount) {
        return parseFloat(amount).toFixed(2);
    }
    
    isValidAddress(address) {
        return ethers.isAddress(address);
    }
}

module.exports = Web3Integration;