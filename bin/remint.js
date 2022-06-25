let {ethers} = require('ethers');
let fs = require('fs');
let contractABI = require('../artifacts/contracts/MultichainNFT.sol/MultichainNFT.json');

/** CONFIG **/
let file = 'snapshot.json';
let dryrun = true;

// Export one of your Metamask wallets (with required rights and funds, and paste the private key here)
// On Metamask; Click the three dots next to your account (at the top), then Account Details > Export Private Key
let mintingWallet = '...';
let newContract = '0x...';

// Network to mint the new NFTs on
let RPC_URL = 'http://localhost:7545/';
let RPC_NETWORK_ID = 1337;

/** EXECUTION **/
/* Wallet setup */
let provider = new ethers.providers.JsonRpcProvider(RPC_URL, RPC_NETWORK_ID);

let wallet = new ethers.Wallet(mintingWallet);
const account = wallet.connect(provider);

let contract = new ethers.Contract(newContract, contractABI.abi, account);

/* Read snapshot */
let data = fs.readFileSync(file);
let owners = JSON.parse(data);

/* Start minting */
let mint = async function(owner, tokenId) {
    let currentOwner = null;
    try {
        currentOwner = await contract.ownerOf(tokenId);
    } catch(e) {
        // No owner; token not minted yet
    }
    if(!currentOwner) {
        await (await contract.mint(owner, tokenId)).wait();
    }
}

let main = async function () {
    for (var i in owners) {
        console.log('Minting ' + owners[i].tokenId + ' to ' + owners[i].owner + ' ' + i + ' / ' + owners.length);

        if(!dryrun) {
            await mint(owners[i].owner, owners[i].tokenId);
        }
    }
}

main();


