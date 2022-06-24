# Remint
## Intro
Blockchain failed? Missed a feature? OASIS not supporting your contract? Someone rugpulled a project and you want to take over? Say no more.

This repository contains code to take a snapshot, and remint the NFTs to the NFT owners. It even reads OASIS to check for owners.

## Workflow
Generally it is advised to take a snapshot of owners. This is where ``node bin/snaphot.js`` comes in. Check the config at the top of the file. Running this will save a ``snapshot.json`` in the root folder.

After that, deploy a new contract. I have provided two simple contracts; a very simple one with just the basic features, and one that supports the multichain bridge used by The Council of Frogs.

As a last step ``node bin/remint.js`` can start the reminting. Check the config!
