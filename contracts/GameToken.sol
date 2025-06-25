// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract GameToken is ERC20, Ownable, ReentrancyGuard {
    
    // Game reward tracking
    mapping(address => uint256) public gameWins;
    mapping(address => uint256) public totalRewards;
    mapping(address => uint256) public lastRewardTime;
    
    // Reward configuration
    uint256 public constant WIN_REWARD = 10 * 10**18; // 10 tokens
    uint256 public constant TIE_REWARD = 5 * 10**18;  // 5 tokens
    uint256 public constant LOSS_REWARD = 2 * 10**18; // 2 tokens
    uint256 public constant DAILY_REWARD = 50 * 10**18; // 50 tokens
    
    // Events
    event GameReward(address indexed player, uint256 amount, string gameResult);
    event DailyReward(address indexed player, uint256 amount);
    event TokensWithdrawn(address indexed player, uint256 amount);
    
    constructor() ERC20("Rock Paper Scissors Token", "RPS") {
        // Mint initial supply to contract owner
        _mint(msg.sender, 1000000 * 10**18); // 1M tokens
    }
    
    /**
     * Reward player for game result
     */
    function rewardGame(address player, string memory result) external onlyOwner nonReentrant {
        require(player != address(0), "Invalid player address");
        
        uint256 reward;
        
        if (keccak256(abi.encodePacked(result)) == keccak256(abi.encodePacked("win"))) {
            reward = WIN_REWARD;
            gameWins[player]++;
        } else if (keccak256(abi.encodePacked(result)) == keccak256(abi.encodePacked("tie"))) {
            reward = TIE_REWARD;
        } else {
            reward = LOSS_REWARD;
        }
        
        totalRewards[player] += reward;
        _mint(player, reward);
        
        emit GameReward(player, reward, result);
    }
    
    /**
     * Claim daily reward
     */
    function claimDailyReward() external nonReentrant {
        require(block.timestamp >= lastRewardTime[msg.sender] + 24 hours, "Daily reward already claimed");
        
        lastRewardTime[msg.sender] = block.timestamp;
        totalRewards[msg.sender] += DAILY_REWARD;
        _mint(msg.sender, DAILY_REWARD);
        
        emit DailyReward(msg.sender, DAILY_REWARD);
    }
    
    /**
     * Batch reward multiple players (for admin use)
     */
    function batchReward(address[] calldata players, uint256[] calldata amounts) external onlyOwner {
        require(players.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < players.length; i++) {
            if (players[i] != address(0) && amounts[i] > 0) {
                totalRewards[players[i]] += amounts[i];
                _mint(players[i], amounts[i]);
            }
        }
    }
    
    /**
     * Get player stats
     */
    function getPlayerStats(address player) external view returns (
        uint256 wins,
        uint256 rewards,
        uint256 balance,
        uint256 lastReward
    ) {
        return (
            gameWins[player],
            totalRewards[player],
            balanceOf(player),
            lastRewardTime[player]
        );
    }
    
    /**
     * Emergency withdraw (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(owner()).transfer(balance);
        }
    }
    
    /**
     * Update reward amounts (owner only)
     */
    function updateRewards(uint256 winReward, uint256 tieReward, uint256 lossReward) external onlyOwner {
        // Implementation would update reward constants if needed
        // For simplicity, we keep them as constants in this version
    }
}