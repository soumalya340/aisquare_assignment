// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

interface ISimpleCoin {
    function mint(address to, uint256 amount) external;
}

/**
 * @title SimpleStaking
 * @dev A simple staking contract that allows users to deposit ERC20 tokens and earn interest over time.
 * @notice This contract should have the authority to mint new tokens when interest is incurred for the users.
 * @custom:security-considerations The contract assumes it has minting privileges for the staking token.
 */
contract SimpleStaking {
    uint256 public constant INTEREST_RATE = 5; // 5% annual interest rate
    uint256 public constant INTEREST_RATE_DENOMINATOR = 100;
    uint256 public constant SECONDS_PER_YEAR = 31536000; // 365 days

    mapping(address => uint256) public depositedTokens; // Tracks the staked balance of each user
    mapping(address => uint256) public depositTimestamp; // Tracks the timestamp of each user's deposit

    IERC20 public asset; // The ERC20 token being staked
    address public stakingToken;

    /**
     * @dev Emitted when a user deposits tokens into the contract.
     * @param user The address of the user making the deposit.
     * @param amount The amount of tokens deposited.
     */
    event Deposit(address indexed user, uint256 amount);

    /**
     * @dev Emitted when a user withdraws tokens from the contract.
     * @param user The address of the user making the withdrawal.
     * @param amount The amount of tokens withdrawn.
     */
    event Withdraw(address indexed user, uint256 amount);

    /**
     * @dev Initializes the staking contract with the specified ERC20 token.
     * @param token The address of the ERC20 token to be used for staking.
     */
    constructor(address token) {
        asset = IERC20(token);
        stakingToken = token;
    }

    /**
     * @notice Deposit a specified amount of tokens into the staking contract.
     * @param _amount The amount of tokens to deposit.
     * @dev The user must have approved the contract to spend at least `_amount` of tokens.
     */
    function deposit(uint256 _amount) public {
        require(_amount > 0, "Deposit amount must be greater than 0");
        require(asset.balanceOf(msg.sender) >= _amount, "Insufficient balance");

        // If user has an existing deposit, add the new deposit to their balance
        asset.transferFrom(msg.sender, address(this), _amount);
        uint256 interest = calculateInterest(msg.sender);
        // To get the interest
        depositedTokens[msg.sender] += interest;

        depositedTokens[msg.sender] += _amount;

        depositTimestamp[msg.sender] = block.timestamp;
        emit Deposit(msg.sender, _amount);
    }

    /**
     * @notice Withdraw a specified amount of tokens from the staking contract
     * @dev This function allows users to withdraw their staked tokens along with accrued interest
     * @param _amount The amount of tokens to withdraw
     * @custom:requirements
     *   - The withdrawal amount must be greater than 0
     *   - The user must have an active deposit
     *   - The user must have sufficient balance (including interest) to cover the withdrawal
     * @custom:effects
     *   - Calculates and mints accrued interest to the user
     *   - Transfers the requested amount of tokens to the user
     *   - Updates the user's deposited token balance
     *   - Resets the user's deposit timestamp
     * @custom:emits Withdraw event with the user's address and withdrawn amount
     */
    function withdraw(uint256 _amount) public {
        // Ensure the withdrawal amount is valid
        require(_amount > 0, "Withdraw amount must be greater than 0");

        // Verify that the user has an active deposit
        require(depositTimestamp[msg.sender] != 0, "No active deposit");

        uint256 interest = calculateInterest(msg.sender);
        // Mint the accrued interest to the user
        // Note: This assumes the staking token has a mint function
        ISimpleCoin(stakingToken).mint(msg.sender, interest);

        require(depositedTokens[msg.sender] >= _amount, "Insufficient balance");

        // Transfer the requested amount to the user
        asset.transfer(msg.sender, _amount);

        // Update the user's deposited token balance
        depositedTokens[msg.sender] = depositedTokens[msg.sender] - _amount;

        // Reset the deposit timestamp for the remaining balance
        // This ensures interest is only accrued on the remaining balance from this point forward
        depositTimestamp[msg.sender] = block.timestamp;

        // Emit the Withdraw event
        emit Withdraw(msg.sender, _amount);
    }

    /**
     * @notice Calculate the accrued interest for a specific user.
     * @param _user The address of the user.
     * @return The amount of interest accrued by the user.
     */
    function calculateInterest(address _user) public view returns (uint256) {
        if (depositTimestamp[_user] == 0) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - depositTimestamp[_user];
        uint256 interest = (depositedTokens[_user] *
            INTEREST_RATE *
            timeElapsed) / (INTEREST_RATE_DENOMINATOR * SECONDS_PER_YEAR);
        return interest;
    }

    /**
     * @notice Get the total balance of a user, including the principal and accrued interest.
     * @param _user The address of the user.
     * @return The total balance of the user.
     */
    function getBalance(address _user) public view returns (uint256) {
        return depositedTokens[_user] + calculateInterest(_user);
    }
}
