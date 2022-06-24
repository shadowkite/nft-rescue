let {ethers} = require('ethers');
let fs = require('fs');
let contractABI = require('../artifacts/contracts/MultichainNFT.sol/MultichainNFT.json');

/** CONFIG **/
let file = 'snapshot.json';

// Export one of your metamask wallet (with required rights and funds, and paste the private key here
// Click the three dots next to account, then Account Details > Export Private Key
let mintingWallet = '...';
let newContract = '0x...';

// Network to mint the new NFTs on
let RPC_URL = 'https://localhost:7545/';
let RPC_NETWORK_ID = 1337;

/** EXECUTION **/
/* Wallet setup */
var provider = new ethers.providers.JsonRpcProvider(RPC_URL, RPC_NETWORK_ID);

var wallet = new ethers.Wallet(mintingWallet);
const account = wallet.connect(provider);

let contract = new ethers.Contract(newContract, contractABI.abi, account);

/* Read snapshot */
let data = fs.readFileSync('snapshot.json');
let owners = JSON.parse(data);

/* Start minting */
let mint = async function(owner, tokenId) {
    await (await contract.mint(owner, tokenId)).wait();
}

for(var i in owners) {
    console.log('Minting ' + owners[i].tokenId + ' to ' + owners[i].owner);
    //mint(owners[i].address, owners[i].tokenId);
}




