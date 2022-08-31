import {AlienFormationController} from "./AlienFormationController";
import State from "./State";
import config from "../eirlume.config";
import { BigNumber, ethers } from "ethers";

import { Vector3, Color3, Color4 } from '@babylonjs/core';
import { Animation } from "@babylonjs/core/Animations/animation";
import { CubicEase, EasingFunction } from "@babylonjs/core/Animations/easing";
import '@babylonjs/core/Rendering/edgesRenderer';

export class BlockchainController {

    constructor(scene, index, blockchainNodeUrl, alienFormationController) {
        this.scene = scene;
        this.index = index;
        this.blockchainNodeUrl = blockchainNodeUrl;
        this.alienFormationController = alienFormationController;

        this.websocket = null;

        this.pendingTxns = [];
        this.network = null;
        this.blockchain = [];
    }

    initialize(){
        this.websocket = new ethers.providers.WebSocketProvider(this.blockchainNodeUrl);
  
        // Get the network info
        this.websocket.getNetwork().then((network) => {
            console.log(network);
            this.network = network;
            this.network.protocol = "ethereum";

            this.alienFormationController.createMempool(network);

            // Get the latest block
            this.websocket.getBlockNumber().then(async (blockNumber) => {
                const block = await this.websocket.getBlockWithTransactions(blockNumber);
                console.log(block);
        
                this.calcBlockStats(block);

                this.blockchain.push(block);
                this.alienFormationController.createAlien(block);
            });
        });
    }
  
    start(){
        // Subscribe to new mempool transactions
        this.websocket.on('pending', async (tx) => {
            const txInfo = await this.websocket.getTransaction(tx);
            
            //console.log(txInfo);

            this.pendingTxns.push(txInfo);

            this.alienFormationController.createMempoolTxn(txInfo);
        });

        // Subscribe to newly mined blocks
        this.websocket.on('block', async (blockNumber) => {
            const block = await this.websocket.getBlockWithTransactions(blockNumber);
            console.log(block);

            try{
                // Remove all pending transactions that are in the new block
                this.pendingTxns = pendingTxns.filter(ar => !block.transactions.find(rm => (rm.hash === ar.hash)));
                this.alienFormationController.updateMempool(this.pendingTxns);
            }catch (error) {
                console.log(error);
            }

            this.blockchain.push(block);

            this.alienFormationController.createAlien(block);
        });
    }

    stop(){
        this.websocket.off('pending');
        this.websocket.off('block');
    }

    calcBlockStats(block){
        let blockValue = BigNumber.from(0);
        //const blockValue = block.transactions.reduce((accumulator, object) => {
        block.transactions.forEach(txn => {
            blockValue.add(txn.value)
        });

        console.log("Money in the block: " + blockValue.div(ethers.constants.WeiPerEther));
    }
}