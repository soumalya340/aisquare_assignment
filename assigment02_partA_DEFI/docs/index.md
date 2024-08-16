# Solidity API

## SimpleCoin

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### constructor

```solidity
constructor() public
```

### mint

```solidity
function mint(address to, uint256 amount) public
```

## ISouSwap

### getInputPrice

```solidity
function getInputPrice(uint256 input_amount, uint256 input_reserve, uint256 output_reserve) external pure returns (uint256)
```

## SouSimpleLendingProtocol

A simplified lending protocol where users deposit USDC to receive cUSDC and borrow USDC by providing SimpleCoin tokens as collateral.

### COLLATERAL_RATIO

```solidity
uint256 COLLATERAL_RATIO
```

### INTEREST_RATE

```solidity
uint256 INTEREST_RATE
```

### INTEREST_DENOMINATOR

```solidity
uint256 INTEREST_DENOMINATOR
```

### SECONDS_PER_YEAR

```solidity
uint256 SECONDS_PER_YEAR
```

### SIMPLECOIN_USDC_PRICE

```solidity
uint256 SIMPLECOIN_USDC_PRICE
```

### UserAccount

```solidity
struct UserAccount {
  uint256 depositedUSDC;
  uint256 borrowedUSDC;
  uint256 depositedSimpleCoin;
  uint256 depositTimestamp;
  uint256 borrowTimestamp;
}
```

### accounts

```solidity
mapping(address => struct SouSimpleLendingProtocol.UserAccount) accounts
```

### usdc

```solidity
contract IERC20 usdc
```

### simpleCoin

```solidity
contract IERC20 simpleCoin
```

### souSwap

```solidity
contract ISouSwap souSwap
```

### DepositUSDC

```solidity
event DepositUSDC(address user, uint256 amount)
```

### WithdrawUSDC

```solidity
event WithdrawUSDC(address user, uint256 amount)
```

### BorrowUSDC

```solidity
event BorrowUSDC(address user, uint256 amount)
```

### RepayUSDC

```solidity
event RepayUSDC(address user, uint256 amount)
```

### DepositSimpleCoin

```solidity
event DepositSimpleCoin(address user, uint256 amount)
```

### WithdrawSimpleCoin

```solidity
event WithdrawSimpleCoin(address user, uint256 amount)
```

### Liquidate

```solidity
event Liquidate(address user, uint256 collateral, uint256 debt)
```

### constructor

```solidity
constructor(address _usdcAddress, address _simpleCoinAddress, address _souSwapAddress) public
```

### depositUSDC

```solidity
function depositUSDC(uint256 amount) external
```

Allows a user to deposit USDC and receive cUSDC.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of USDC to deposit. |

### withdrawUSDC

```solidity
function withdrawUSDC(uint256 amount) external
```

Allows a user to withdraw USDC by burning cUSDC.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of USDC to withdraw. |

### depositSimpleCoinAsCollateral

```solidity
function depositSimpleCoinAsCollateral(uint256 amount) external
```

Allows a user to deposit SimpleCoin as collateral.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of SimpleCoin to deposit. |

### withdrawSimpleCoin

```solidity
function withdrawSimpleCoin(uint256 amount) external
```

Allows a user to withdraw SimpleCoin if they have enough collateral after the withdrawal.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of SimpleCoin to withdraw. |

### borrowUSDC

```solidity
function borrowUSDC(uint256 amount) external
```

Allows a user to borrow USDC using their deposited SimpleCoin as collateral.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of USDC to borrow. |

### repayUSDC

```solidity
function repayUSDC(uint256 amount) external
```

Allows a user to repay their borrowed USDC with interest.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of USDC to repay. |

### liquidate

```solidity
function liquidate(address user) external
```

Allows anyone to liquidate a user's collateral if their collateral ratio falls below 150%.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user to liquidate. |

### calculateInterest

```solidity
function calculateInterest(uint256 principal, uint256 timestamp) internal view returns (uint256)
```

Calculates interest for a given amount based on the time elapsed.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| principal | uint256 | The principal amount. |
| timestamp | uint256 | The timestamp of the last deposit or borrow. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The interest accrued. |

### getCollateralValueInUSDC

```solidity
function getCollateralValueInUSDC(uint256 simpleCoinAmount) public view returns (uint256)
```

Gets the value of a user's deposited SimpleCoin in terms of USDC.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| simpleCoinAmount | uint256 | The amount of SimpleCoin deposited. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The equivalent value in USDC. |

## ISimpleCoin

### mint

```solidity
function mint(address to, uint256 amount) external
```

## SimpleStaking

This contract should have the authority to mint new tokens when interest is incurred for the users.

_A simple staking contract that allows users to deposit ERC20 tokens and earn interest over time._

### INTEREST_RATE

```solidity
uint256 INTEREST_RATE
```

### INTEREST_RATE_DENOMINATOR

```solidity
uint256 INTEREST_RATE_DENOMINATOR
```

### SECONDS_PER_YEAR

```solidity
uint256 SECONDS_PER_YEAR
```

### depositedTokens

```solidity
mapping(address => uint256) depositedTokens
```

### depositTimestamp

```solidity
mapping(address => uint256) depositTimestamp
```

### asset

```solidity
contract IERC20 asset
```

### stakingToken

```solidity
address stakingToken
```

### Deposit

```solidity
event Deposit(address user, uint256 amount)
```

_Emitted when a user deposits tokens into the contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user making the deposit. |
| amount | uint256 | The amount of tokens deposited. |

### Withdraw

```solidity
event Withdraw(address user, uint256 amount)
```

_Emitted when a user withdraws tokens from the contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user making the withdrawal. |
| amount | uint256 | The amount of tokens withdrawn. |

### constructor

```solidity
constructor(address token) public
```

_Initializes the staking contract with the specified ERC20 token._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The address of the ERC20 token to be used for staking. |

### deposit

```solidity
function deposit(uint256 _amount) public
```

Deposit a specified amount of tokens into the staking contract.

_The user must have approved the contract to spend at least `_amount` of tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 | The amount of tokens to deposit. |

### withdraw

```solidity
function withdraw(uint256 _amount) public
```

Withdraw a specified amount of tokens from the staking contract

_This function allows users to withdraw their staked tokens along with accrued interest_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 | The amount of tokens to withdraw @custom:requirements   - The withdrawal amount must be greater than 0   - The user must have an active deposit   - The user must have sufficient balance (including interest) to cover the withdrawal @custom:effects   - Calculates and mints accrued interest to the user   - Transfers the requested amount of tokens to the user   - Updates the user's deposited token balance   - Resets the user's deposit timestamp |

### calculateInterest

```solidity
function calculateInterest(address _user) public view returns (uint256)
```

Calculate the accrued interest for a specific user.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address | The address of the user. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of interest accrued by the user. |

### getBalance

```solidity
function getBalance(address _user) public view returns (uint256)
```

Get the total balance of a user, including the principal and accrued interest.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address | The address of the user. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total balance of the user. |

## SouSwap

### token

```solidity
contract IERC20 token
```

### totalLiquidity

```solidity
uint256 totalLiquidity
```

### liquidityByUser

```solidity
mapping(address => uint256) liquidityByUser
```

### constructor

```solidity
constructor(address token_addr) public
```

### init

```solidity
function init(uint256 _tokens) public payable returns (uint256)
```

### ethToToken

```solidity
function ethToToken() public payable returns (uint256)
```

### tokenToEth

```solidity
function tokenToEth(uint256 _tokens) public returns (uint256)
```

### getInputPrice

```solidity
function getInputPrice(uint256 input_amount, uint256 input_reserve, uint256 output_reserve) public pure returns (uint256)
```

### provideLiquidity

```solidity
function provideLiquidity() public payable returns (uint256)
```

### withdrawLiquidity

```solidity
function withdrawLiquidity(uint256 _amount) public returns (uint256, uint256)
```

## MockERC20

### constructor

```solidity
constructor() public
```

### mint

```solidity
function mint(address to, uint256 amount) public
```

