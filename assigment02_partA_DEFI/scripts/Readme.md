# LAUNCH CONTRACTS

## Contract Deployment Parameters

This README file provides an overview of how to fetch contract deployment parameters from a JSON file. The JSON file contains the contract name and constructor parameters required for deploying different contracts. This guide assumes you have a basic understanding of JSON and contract deployment.

## JSON Format

The JSON file should have the following format:

**Caution**: Only the parameters should be altered for deployment, not the contract's name in JSON examples.

`SimpleCoin Contract`

```json
{
  "contractName": "SimpleCoin",
  "constructorParams": {}
}
```

`SouSimpleLendingProtocol Contract`

```json
{
  "contractName": "SouSimpleLendingProtocol",
  "constructorParams": {
    "param1": "0xC33343596c8b86BF46B7C05F583833079f9115ee",//USDC Address
    "param2": "0x37cCb2e3e2EDC1beA34F15689E582ec350792Ed5",// Simplecoin Address
    "param3": "0x94b6C28eB9d5a0a8440505391800cC5C58618cfb"/// SOUSWAP Address
  }
}
```

`SimpleStaking Contract`

```json
{
  "contractName": "SimpleStaking",
  "constructorParams": {
    "param1": "0x37cCb2e3e2EDC1beA34F15689E582ec350792Ed5"
  }
}
```

`SouSwap Contract`

```json
{
  "contractName": "SouSwap",
  "constructorParams": {
    "param1": "0x37cCb2e3e2EDC1beA34F15689E582ec350792Ed5"
  }
}
```

`MockERC20 Contract`

```json
{
  "contractName": "MockERC20",
  "constructorParams": {}
}
```

## Fetching Parameters

To fetch the contract deployment parameters from the JSON file, use your preferred programming language and JSON parsing library.

Here's an example in JavaScript:
javascriptCopyconst fs = require("fs")

const scripts = `scripts/launch/launch.json`
const data = fs.readFileSync(scripts, "utf8")
const jsonContent = JSON.parse(data)

```

```

```

```
