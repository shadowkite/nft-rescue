let {ethers} = require('ethers');
let fs = require('fs');
let contractABI = require('../abi/erc721.json');
let oasisABIV1 = require('../abi/oasisv1.json');
let oasisABIV2 = require('../abi/oasisv2.json');

let sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** Config **/
let file = 'snapshot.json';
let readOasis = true;
let oasisContractV1 = '0x657061bf5D268F70eA3eB1BCBeb078234e5Df19d';
let oasisContractV2 = '0x3b968177551a2aD9fc3eA06F2F41d88b22a081F7';

// Enter contract address here
let oldContract = '...';

// Network of the old contract
let RPC_URL = 'https://smartbch.fountainhead.cash/mainnet';
let RPC_NETWORK_ID = 10000;

/** Contract reader **/
let provider = new ethers.providers.JsonRpcProvider(RPC_URL, RPC_NETWORK_ID);
let contract = new ethers.Contract(oldContract, contractABI, provider);

// Store ownership data
let data = [];

let getOasisOwner = async (oasisContract, tokenId) => {
    return new Promise(async resolve => {
        let i = 0;
        let orderInfo = null;
        let result = false;

        let marketContract = new ethers.Contract(oasisContract, oasisABIV2.abi, provider);
        if(oasisContract === oasisContractV1) {
            marketContract = new ethers.Contract(oasisContract, oasisABIV1.abi, provider);
        }


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
            let strTokenId = tokenId.toString();
            contract.ownerOf(strTokenId).then(async (owner) => {
                if(readOasis && (owner === oasisContractV2 || owner === oasisContractV1)) {
                    let seller = await getOasisOwner(owner, strTokenId);
                    console.log(strTokenId, owner, seller);
                    data.push({owner: seller, tokenId: strTokenId});
                } else {
                    console.log(strTokenId, owner);
                    data.push({owner: owner, tokenId: strTokenId});
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