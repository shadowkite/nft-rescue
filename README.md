# Remint
## Intro
This repository contains scripts to take a snapshot, and remint/airdrop the NFTs to the same owners. It even reads OASIS.cash for ownership details.

## Installing
Clone the repository, then use ``yarn`` to install dependencies.

## Workflow
Generally it is advised to take a snapshot of owners first. This is where ``node bin/snaphot.js`` comes in. Check the config at the top of the file; fill in the contract address. Running this script will save a ``snapshot.json`` in the root folder.

After that, deploy a new contract. I have provided two contracts; a very simple one with just the basic features, and one that is prepared for the multichain bridge, also used by The Council of Frogs and WaifuFaucet.

As a last step ``node bin/remint.js`` can start the reminting process. Check the config at the top; You'll need to export a private key, enter the new contract, and configure the RPC.
