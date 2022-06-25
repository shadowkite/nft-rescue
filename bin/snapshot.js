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

// Enter contract address here
let oldContract = '...';

// Network of the old contract
let RPC_URL = 'https://smartbch.fountainhead.cash/mainnet';
let RPC_NETWORK_ID = 10000;

/** Contract reader **/
let provider = new ethers.providers.JsonRpcProvider(RPC_URL, RPC_NETWORK_ID);
let contract = new ethers.Contract(oldContract, contractABI, provider);
let marketContract = new ethers.Contract(oasisContract, oasisABI, provider);

// Store ownership data
let data = [];

let getOasisOwner = async (tokenId) => {
    return new Promise(async resolve => {
        let i = 0;
        let orderInfo = null;
        let result = false;

        // Loop through orders and see which one is still active
        while(!result) {
            result = await (new Promise(resolve => {
                marketContract.orderIdByToken(oldContract, tokenId, i).then(function (orderId) {
                    marketContract.orderInfo(orderId).then((info) => {
                        // Order exists; Store order as last active, loop again
                        orderInfo = info;
                        resolve(false);
                    }).catch((e) => {
                        // Order doesn't exist; it seems we found the last owner
                        resolve(true);
                    });
                }).catch((e) => {
                    resolve(true);
                });
            }));
            i++;
        }

        // If this errors; OASIS seems to be owner? Should not happen
        resolve(orderInfo.seller);
    });
}

let main = async function() {
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
                    console.log('Done. File ' + file + ' written.');
                    fs.writeFileSync(file, JSON.stringify(data));
                }
            });
        });

        // Add a delay to not DDOS the RPC server unintentionally
        if(i % 10 === 0) {
            await sleep(1000);
        }
    }
}

main();