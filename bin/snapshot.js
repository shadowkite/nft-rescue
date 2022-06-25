let {ethers} = require('ethers');
let fs = require('fs');
let contractABI = require('../abi/erc721.json');
let oasisABI = require('../abi/oasis.json');

let sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** Config **/
let file = 'snapshot.json';
let readOasis = true;
let oasisContract = '0x3b968177551a2aD9fc3eA06F2F41d88b22a081F7';

let oldContract = '...';

// Network of the old contract
let RPC_URL = 'https://smartbch.fountainhead.cash/mainnet';
let RPC_NETWORK_ID = 10000;

/** Contract reader **/
var provider = new ethers.providers.JsonRpcProvider(RPC_URL, RPC_NETWORK_ID);
let contract = new ethers.Contract(oldContract, contractABI, provider);
let marketContract = new ethers.Contract(oasisContract, oasisABI, provider);

let data = [];

let getOasisOwner = async (tokenId) => {
    return new Promise(async resolve => {
        let i = 0;
        let orderInfo = null;
        let result = false;
        while(!result) {
            result = await (new Promise(resolve => {
                marketContract.orderIdByToken(oldContract, tokenId, i).then(function (orderId) {
                    marketContract.orderInfo(orderId).then((info) => {
                        orderInfo = info;
                        resolve(false);
                    }).catch((e) => {
                        resolve(true);
                    });
                }).catch((e) => {
                    resolve(true);
                });
            }));
            i++;
        }
        resolve(orderInfo.seller);
    });
}

let reader = async function() {
    let supply = await contract.totalSupply();
    for(var i = 0;i < supply;i++) {
        contract.tokenByIndex(i).then((tokenId) => {
            contract.ownerOf(tokenId).then((owner) => {
                console.log(tokenId.toString(), owner);
                if(readOasis && owner === oasisContract) {
                    getOasisOwner(tokenId).then((seller) => {
                        console.log(tokenId.toString(), owner, seller);
                        data.push({owner: seller, tokenId: tokenId.toString()});
                    });
                } else {
                    data.push({owner: owner, tokenId: tokenId.toString()});
                }

                // If the data is complete; write file
                if(data.length == supply) {
                    fs.writeFileSync(file, JSON.stringify(data));
                }
            });
        });

        // Delay to not DDOS the RPC server unintentionally
        if(i % 10 === 0) {
            await sleep(1000);
        }
    }
}

reader();