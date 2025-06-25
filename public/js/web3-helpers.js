// Web3 Helper Functions
class Web3Helpers {
    static formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    static formatTokenAmount(amount) {
        return parseFloat(amount).toFixed(2);
    }
    
    static isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    
    static formatBalance(balance) {
        if (balance >= 1000000) {
            return (balance / 1000000).toFixed(1) + 'M';
        } else if (balance >= 1000) {
            return (balance / 1000).toFixed(1) + 'K';
        }
        return balance.toFixed(2);
    }
    
    static async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        
        // Add slide-in animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                document.body.removeChild(notification);
                document.head.removeChild(style);
            }, 300);
        }, duration);
    }
    
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                this.showNotification('Copied to clipboard!', 'success', 2000);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showNotification('Copied to clipboard!', 'success', 2000);
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showNotification('Failed to copy to clipboard', 'error');
        }
    }
    
    static getNetworkName(chainId) {
        const networks = {
            '0x1': 'Ethereum Mainnet',
            '0x5': 'Goerli Testnet',
            '0x2105': 'Base Mainnet', 
            '0x14A34': 'Base Sepolia',
            '0x89': 'Polygon',
            '0x13881': 'Mumbai Testnet'
        };
        
        return networks[chainId] || 'Unknown Network';
    }
    
    static formatGas(gasPrice) {
        const gwei = parseInt(gasPrice) / 1e9;
        return `${gwei.toFixed(2)} Gwei`;
    }
    
    static getExplorerUrl(chainId, txHash) {
        const explorers = {
            '0x1': 'https://etherscan.io/tx/',
            '0x5': 'https://goerli.etherscan.io/tx/',
            '0x2105': 'https://basescan.org/tx/',
            '0x14A34': 'https://sepolia.basescan.org/tx/',
            '0x89': 'https://polygonscan.com/tx/',
            '0x13881': 'https://mumbai.polygonscan.com/tx/'
        };
        
        const baseUrl = explorers[chainId];
        return baseUrl ? `${baseUrl}${txHash}` : null;
    }
    
    static createLoadingButton(button, loadingText = 'Loading...') {
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
        
        return () => {
            button.disabled = false;
            button.innerHTML = originalText;
        };
    }
    
    static async waitForTransaction(web3, txHash, maxWait = 60000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            try {
                const receipt = await web3.request({
                    method: 'eth_getTransactionReceipt',
                    params: [txHash]
                });
                
                if (receipt) {
                    return receipt;
                }
                
                await this.delay(2000); // Wait 2 seconds before checking again
            } catch (error) {
                console.error('Error checking transaction:', error);
                await this.delay(5000);
            }
        }
        
        throw new Error('Transaction confirmation timeout');
    }
}

// Export for use in other scripts
window.Web3Helpers = Web3Helpers;