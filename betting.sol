// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}

contract BettingPool {

    IERC20 public usdc;
    address public owner;

    mapping(address => uint256) public bets;
    uint256 public totalPool;

    // ✅ Events — emitted on bet, fetchable from UI via logs
    event BetPlaced(address indexed bettor, uint256 amount, uint256 totalPool);
    event WinnersPaid(address indexed winner, uint256 amount);
    event PoolReset(uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
        owner = msg.sender;
    }

    // 1. Bet function
    function bet(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");

        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        bets[msg.sender] += amount;
        totalPool += amount;

        // ✅ Trigger emitted here — UI can listen/fetch this
        emit BetPlaced(msg.sender, amount, totalPool);
    }

    // 2. Win function
    function win(address[] calldata winners) external onlyOwner {
        require(winners.length > 0, "No winners");

        uint256 contractBalance = usdc.balanceOf(address(this));
        uint256 rewardPerWinner = contractBalance / winners.length;

        for(uint i = 0; i < winners.length; i++) {
            require(
                usdc.transfer(winners[i], rewardPerWinner),
                "Transfer failed"
            );
            // ✅ Emitted per winner
            emit WinnersPaid(winners[i], rewardPerWinner);
        }

        totalPool = 0;
        // ✅ Emitted after pool resets
        emit PoolReset(block.timestamp);
    }
}
