// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "hardhat/console.sol";

interface ISouSwap {
    function getInputPrice(
        uint256 input_amount,
        uint256 input_reserve,
        uint256 output_reserve
    ) external pure returns (uint256);
}

/// @title Simple Lending and Borrowing Protocol with cUSDC and SimpleCoin Collateral
/// @notice A simplified lending protocol where users deposit USDC to receive cUSDC and borrow USDC by providing SimpleCoin tokens as collateral.
contract SouSimpleLendingProtocol is ReentrancyGuard {
    // Constants
    uint256 public constant COLLATERAL_RATIO = 150; // Collateral ratio in percentage (150%)
    uint256 public constant INTEREST_RATE = 5; // Annual interest rate (5%)
    uint256 public constant INTEREST_DENOMINATOR = 100;
    uint256 public constant SECONDS_PER_YEAR = 31536000; // 365 days
    uint256 public constant SIMPLECOIN_USDC_PRICE = 2; // 1 SimpleCoin = 2 USDC

    // Struct to hold user account data
    struct UserAccount {
        uint256 depositedUSDC; // Amount of USDC deposited by the user
        uint256 borrowedUSDC; // Amount of USDC borrowed by the user
        uint256 depositedSimpleCoin; // Amount of SimpleCoin deposited as collateral
        uint256 depositTimestamp; // Timestamp of the last USDC deposit
        uint256 borrowTimestamp; // Timestamp of the last USDC borrow
    }

    // State variables
    mapping(address => UserAccount) public accounts; // Mapping of user accounts
    IERC20 public usdc; // Reference to the USDC token contract
    IERC20 public simpleCoin; // Reference to the SimpleCoin token contract
    // Add this as a state variable in SouSimpleLendingProtocol
    ISouSwap public souSwap;

    // Events
    event DepositUSDC(address indexed user, uint256 amount);
    event WithdrawUSDC(address indexed user, uint256 amount);
    event BorrowUSDC(address indexed user, uint256 amount);
    event RepayUSDC(address indexed user, uint256 amount);
    event DepositSimpleCoin(address indexed user, uint256 amount);
    event WithdrawSimpleCoin(address indexed user, uint256 amount);
    event Liquidate(address indexed user, uint256 collateral, uint256 debt);

    // Constructor to set the USDC and SimpleCoin token addresses
    constructor(
        address _usdcAddress,
        address _simpleCoinAddress,
        address _souSwapAddress
    ) {
        usdc = IERC20(_usdcAddress);
        simpleCoin = IERC20(_simpleCoinAddress);
        souSwap = ISouSwap(_souSwapAddress);
    }

    /// @notice Allows a user to deposit USDC and receive cUSDC.
    /// @param amount The amount of USDC to deposit.
    function depositUSDC(uint256 amount) external {
        require(amount > 0, "Deposit amount must be greater than 0");
        require(
            usdc.balanceOf(msg.sender) >= amount,
            "Insufficient USDC balance"
        );

        // Calculate interest if there was a previous deposit
        if (accounts[msg.sender].depositedUSDC > 0) {
            uint256 interest = calculateInterest(
                accounts[msg.sender].borrowedUSDC,
                accounts[msg.sender].borrowTimestamp
            );
            accounts[msg.sender].borrowedUSDC += interest;
        }

        // Transfer USDC to the contract
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );

        // Update user's deposit balance and timestamp
        accounts[msg.sender].depositedUSDC += amount;
        accounts[msg.sender].depositTimestamp = block.timestamp;

        emit DepositUSDC(msg.sender, amount);
    }

    /// @notice Allows a user to withdraw USDC by burning cUSDC.
    /// @param amount The amount of USDC to withdraw.
    function withdrawUSDC(uint256 amount) external nonReentrant {
        require(amount > 0, "Withdraw amount must be greater than 0");
        require(
            accounts[msg.sender].depositedUSDC >= amount,
            "Insufficient deposited USDC"
        );

        uint256 interest = calculateInterest(
            accounts[msg.sender].borrowedUSDC,
            accounts[msg.sender].borrowTimestamp
        );
        uint256 totalBalance = accounts[msg.sender].depositedUSDC + interest;

        require(totalBalance >= amount, "Insufficient balance after interest");

        // Update user's balance and timestamp
        accounts[msg.sender].depositedUSDC = totalBalance - amount;
        accounts[msg.sender].depositTimestamp = block.timestamp;

        // Transfer USDC to the user
        require(usdc.transfer(msg.sender, amount), "USDC transfer failed");

        emit WithdrawUSDC(msg.sender, amount);
    }

    /// @notice Allows a user to deposit SimpleCoin as collateral.
    /// @param amount The amount of SimpleCoin to deposit.
    function depositSimpleCoinAsCollateral(uint256 amount) external {
        require(amount > 0, "Deposit amount must be greater than 0");
        require(
            simpleCoin.balanceOf(msg.sender) >= amount,
            "Insufficient SimpleCoin balance"
        );

        // Transfer SimpleCoin to the contract
        require(
            simpleCoin.transferFrom(msg.sender, address(this), amount),
            "SimpleCoin transfer failed"
        );

        // Update user's SimpleCoin collateral balance
        accounts[msg.sender].depositedSimpleCoin += amount;

        emit DepositSimpleCoin(msg.sender, amount);
    }

    /// @notice Allows a user to withdraw SimpleCoin if they have enough collateral after the withdrawal.
    /// @param amount The amount of SimpleCoin to withdraw.
    function withdrawSimpleCoin(uint256 amount) external nonReentrant {
        require(amount > 0, "Withdraw amount must be greater than 0");
        require(
            accounts[msg.sender].depositedSimpleCoin >= amount,
            "Insufficient SimpleCoin balance"
        );
        uint256 value = accounts[msg.sender].depositedSimpleCoin - amount;
        uint256 collateralValueInUSDC = getCollateralValueInUSDC(value);
        uint256 requiredCollateral = (accounts[msg.sender].borrowedUSDC *
            COLLATERAL_RATIO) / 100;
        require(
            collateralValueInUSDC >= requiredCollateral,
            "Insufficient collateral after withdrawal"
        );

        // Update user's SimpleCoin collateral balance
        accounts[msg.sender].depositedSimpleCoin -= amount;
        // Transfer SimpleCoin to the user
        require(
            simpleCoin.transfer(msg.sender, amount),
            "SimpleCoin transfer failed"
        );

        emit WithdrawSimpleCoin(msg.sender, amount);
    }

    /// @notice Allows a user to borrow USDC using their deposited SimpleCoin as collateral.
    /// @param amount The amount of USDC to borrow.
    function borrowUSDC(uint256 amount) external nonReentrant {
        require(amount > 0, "Borrow amount must be greater than 0");

        uint256 collateralValueInUSDC = getCollateralValueInUSDC(
            accounts[msg.sender].depositedSimpleCoin
        );
        uint256 borrowValue = accounts[msg.sender].borrowedUSDC + amount;
        uint256 requiredCollateral = (borrowValue * COLLATERAL_RATIO) / 100;

        require(
            collateralValueInUSDC >= requiredCollateral,
            "Insufficient collateral for this borrow"
        );
        // Transfer USDC to the borrower
        require(usdc.transfer(msg.sender, amount), "USDC transfer failed");
        // Update user's borrow balance and timestamp
        accounts[msg.sender].borrowedUSDC += amount;
        accounts[msg.sender].borrowTimestamp = block.timestamp;

        emit BorrowUSDC(msg.sender, amount);
    }

    /// @notice Allows a user to repay their borrowed USDC with interest.
    /// @param amount The amount of USDC to repay.
    function repayUSDC(uint256 amount) external {
        require(amount > 0, "Repay amount must be greater than 0");
        require(accounts[msg.sender].borrowedUSDC > 0, "No active borrow");

        uint256 interest = calculateInterest(
            accounts[msg.sender].borrowedUSDC,
            accounts[msg.sender].borrowTimestamp
        );
        uint256 totalDebt = accounts[msg.sender].borrowedUSDC + interest;

        require(totalDebt >= amount, "Repay amount exceeds debt");

        // Transfer USDC from the user to the contract
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );

        // Update user's borrow balance and timestamp
        accounts[msg.sender].borrowedUSDC = totalDebt - amount;
        accounts[msg.sender].borrowTimestamp = block.timestamp;

        emit RepayUSDC(msg.sender, amount);
    }

    /// @notice Allows anyone to liquidate a user's collateral if their collateral ratio falls below 150%.
    /// @param user The address of the user to liquidate.
    function liquidate(address user) external nonReentrant {
        uint256 collateralValueInUSDC = getCollateralValueInUSDC(
            accounts[user].depositedSimpleCoin
        );
        uint256 borrowValue = accounts[user].borrowedUSDC;
        uint256 requiredCollateral = (borrowValue * COLLATERAL_RATIO) / 100;

        require(
            collateralValueInUSDC < requiredCollateral,
            "User's collateral ratio is sufficient"
        );

        // Seize the user's collateral
        uint256 liquidationAmountSimpleCoin = accounts[user]
            .depositedSimpleCoin;

        accounts[user].depositedSimpleCoin = 0;
        accounts[user].borrowedUSDC = 0;
        accounts[user].depositTimestamp = 0;
        accounts[user].borrowTimestamp = 0;

        // Transfer the seized SimpleCoin to the liquidator
        require(
            simpleCoin.transfer(msg.sender, liquidationAmountSimpleCoin),
            "SimpleCoin transfer failed"
        );

        emit Liquidate(user, liquidationAmountSimpleCoin, borrowValue);
    }

    /// @notice Calculates interest for a given amount based on the time elapsed.
    /// @param principal The principal amount.
    /// @param timestamp The timestamp of the last deposit or borrow.
    /// @return The interest accrued.
    function calculateInterest(
        uint256 principal,
        uint256 timestamp
    ) internal view returns (uint256) {
        uint256 timeElapsed = block.timestamp - timestamp;
        uint256 interest = (principal * INTEREST_RATE * timeElapsed) /
            (INTEREST_DENOMINATOR * SECONDS_PER_YEAR);
        return interest;
    }

    /// @notice Gets the value of a user's deposited SimpleCoin in terms of USDC.
    /// @param simpleCoinAmount The amount of SimpleCoin deposited.
    /// @return The equivalent value in USDC.
    function getCollateralValueInUSDC(
        uint256 simpleCoinAmount
    ) public view returns (uint256) {
        // Get the SimpleCoin to ETH price from SouSwap
        uint256 simpleCoinReserve = simpleCoin.balanceOf(address(souSwap));
        uint256 ethReserve = address(souSwap).balance;
        // Calculate how much ETH we would get for the simpleCoinAmount
        uint256 ethAmount = souSwap.getInputPrice(
            simpleCoinAmount,
            simpleCoinReserve,
            ethReserve
        );
        /// Convert ETH to USDC (assuming 1 ETH = 2000 USDC)
        /// Oracles can be used in place of this
        uint256 usdcValue = ethAmount * 2000;

        return usdcValue;
    }
}
