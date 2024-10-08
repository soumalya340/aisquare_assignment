import { ethers } from "./ethers-5.6.esm.min.js"
import { abi, contractAddress } from "./constants.js"

const connectButton = document.getElementById("connectButton")
const mintButton = document.getElementById("mintButton")
const burnButton = document.getElementById("burnButton")
const transferButton = document.getElementById("transferButton")

connectButton.onclick = connect
mintButton.onclick = mintNFT
burnButton.onclick = burnNFT
transferButton.onclick = transferNFT

async function connect() {
    if (typeof window.ethereum !== "undefined") {
        try {
            // Check if the current network is Amoy
            const chainId = await ethereum.request({ method: "eth_chainId" })
            if (chainId !== "0x13882") {
                // 80002 in hex
                await ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: "0x13882" }],
                })
            }

            await ethereum.request({ method: "eth_requestAccounts" })
            connectButton.innerHTML = "Connected"
            const accounts = await ethereum.request({ method: "eth_accounts" })
            console.log(accounts)
        } catch (error) {
            console.log(error)
            connectButton.innerHTML = "Connection Failed"
        }
    } else {
        connectButton.innerHTML = "Please install MetaMask"
    }
}

async function mintNFT() {
    await connect()
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(contractAddress, abi, signer)
    try {
        const transactionResponse = await contract.createAsset("www.xyz.com")
        await listenForTransactionMine(transactionResponse, provider)
    } catch (error) {
        console.error("Minting failed:", error)
    }
}

async function burnNFT() {
    await connect()
    const tokenId = document.getElementById("burnTokenId").value
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(contractAddress, abi, signer)
    try {
        const transactionResponse = await contract.destroyAsset(tokenId)
        await listenForTransactionMine(transactionResponse, provider)
    } catch (error) {
        console.error("Burning failed:", error)
    }
}

async function transferNFT() {
    await connect()
    const toAddress = document.getElementById("toAddress").value
    const tokenId = document.getElementById("transferTokenId").value
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(contractAddress, abi, signer)
    try {
        const transactionResponse = await contract.transferFrom(
            await signer.getAddress(),
            toAddress,
            tokenId
        )
        await listenForTransactionMine(transactionResponse, provider)
    } catch (error) {
        console.error("Transfer failed:", error)
    }
}

function listenForTransactionMine(transactionResponse, provider) {
    console.log(`Mining transaction: ${transactionResponse.hash}`)
    return new Promise((resolve, reject) => {
        provider.once(transactionResponse.hash, (transactionReceipt) => {
            console.log(
                `Transaction completed with ${transactionReceipt.confirmations} confirmations.`
            )
            resolve()
        })
    })
}
