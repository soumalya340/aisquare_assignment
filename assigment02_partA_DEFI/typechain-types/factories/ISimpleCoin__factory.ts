/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { ISimpleCoin, ISimpleCoinInterface } from "../ISimpleCoin";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class ISimpleCoin__factory {
  static readonly abi = _abi;
  static createInterface(): ISimpleCoinInterface {
    return new utils.Interface(_abi) as ISimpleCoinInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ISimpleCoin {
    return new Contract(address, _abi, signerOrProvider) as ISimpleCoin;
  }
}
