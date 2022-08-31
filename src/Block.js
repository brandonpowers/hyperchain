import {Color3, Color4, MeshBuilder, Scalar, Vector3, Vector4, StandardMaterial, DynamicTexture, Space, ActionManager, ExecuteCodeAction} from "@babylonjs/core";
import '@babylonjs/core/Rendering/edgesRenderer';
import {BlocksController} from "./BlocksController";
import _ from 'lodash';
import eirlumeConfig from "../eirlume.config";

export class Block extends BlocksController {

  constructor(scene, mesh = null, x = 0, y = 0, isMempool = false, block = null) {
    super();
    this.sourceMesh = mesh;
    this.size = 8;
    this.txnSize = 1;
    this.txnCount = 0;
    this.x = x;
    this.y = y;
    this.z = 0;
    this.friction = 0;
    this.scene = scene;
    this.isMempool = isMempool;
    this.txnsPos = {
      x: 0,
      y: 0,
      z: 0
    };
    this.txns = [];
    this.initBlock();
  }

  initBlock() {
    let id = Math.floor(Math.random() * 100000).toString(16);
    
    const faceColors = new Array(6);
    for (let i = 0; i < 6; i++) {
      faceColors[i] = new Color4(1, 1, 1, 1);
    }
    const faceUV = new Array(6);
    for (let i = 0; i < 6; i++) {
        faceUV[i] = new Vector4(0, 0, 0, 0);
    }
    faceUV[5] = new Vector4(0, 0, 1, 1);

    this.mesh = new MeshBuilder.CreateBox("block-" + id, {
      width: this.size,
      height: this.size,
      depth: this.size,
      faceColors: faceColors,
      faceUV: faceUV
    }, this.scene);

    let material = new StandardMaterial("texture1", this.scene);
    this.mesh.edgesWidth = 4.0;

    if(this.isMempool){
      material.diffuseColor = new Color3(.2, .2, .2);
      material.alpha = 0.3;
      this.mesh.edgesColor = new Color4(0, 1, 1, 1);
    }
    else{
      //this.dynamicTexture = new DynamicTexture("dynamictexture", {width:512, height:256}, this.scene);
      //material.diffuseTexture = this.dynamicTexture;
      material.diffuseColor = new Color3(.9, .9, .9);
      material.alpha = 0.3;
      this.mesh.edgesColor = new Color4(1, 0, 1, 1);
    }
    material.specularColor=Color3.Black();

    this.mesh.material = material;
    this.mesh.enableEdgesRendering();

    this.mesh.name = "block-" + id;
    this.mesh.position.x = this.x;
    this.mesh.position.y = this.y;
    this.mesh.position.z = this.z;
    this.mesh.checkCollisions = false;
    //this.mesh.collisionGroup = 2;
    //this.mesh.collisionMask = 17;
    this.mesh.metadata = {
      type: "block",
      scoreValue: 10
    };

    this.mesh.actionManager = new ActionManager(this.scene);
    this.mesh.actionManager.registerAction(new ExecuteCodeAction(
      ActionManager.OnPickTrigger, 
      function (evt) {
          const sourceBox = evt.meshUnderPointer;
          //update the color
          sourceBox.material.alpha = 0.5;
      }));
  }

  setYRotation(y, friction){
    this.mesh.rotation.y = y;
    this.friction = friction;
  }

  updateMeshPosition(v = 0.05) {
    let currentPosition = this.mesh.position;
    let newPosition = {
      x: this.formation.x + this.x,
      y: this.formation.y + this.y
    };

    // Rotate the blockchain blocks
    if(!this.isMempool){
      // Delta time smoothes the animation.
      var deltaTimeInMillis = this.scene.getEngine().getDeltaTime();
      this.mesh.rotation.y += ((eirlumeConfig.blockchainRPM - this.friction) / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
    }

    let newX = Scalar.Lerp(currentPosition.x, newPosition.x, v);
    let newY = Scalar.Lerp(currentPosition.y, newPosition.y, v);
    let scalarX = newX - currentPosition.x;
    let scalarY = newY - currentPosition.y;
    this.mesh.moveWithCollisions(new Vector3(scalarX, scalarY, currentPosition.z));
    //this.mesh.translate(new Vector3(scalarX, scalarY, currentPosition.z), 1, Space.LOCAL);

    //if (this.mesh.collider.collidedMesh) {
    //  this.handleCollision();
    //}

    return newPosition;
  }

  handleCollision() {
    let collidedWithType = (this.mesh.collider.collidedMesh.metadata).type;
    if (collidedWithType === "player") {
      //this.mesh.collider.collidedMesh.dispose(); // perform action with player meshes onDispose event.
      //this.mesh.dispose();
    }
    if (collidedWithType === "barrier") {
      //this.mesh.collider.collidedMesh.dispose(); // perform action with meshes onDispose event.
    }
  }

  createTxn(txn) {

    if(!txn || !txn.hash) return;

    const txnLimit = this.size * this.size * this.size / this.txnSize;
    const positionsPerDim = Math.cbrt(txnLimit);

    const name = "txn-" + txn.hash;
    const mesh = new MeshBuilder.CreateBox(name, {
      width: this.txnSize,
      height: this.txnSize,
      depth: this.txnSize,
    }, this.scene);

    mesh.material = new StandardMaterial("texture1", this.scene);
    mesh.edgesWidth = 4.0;

    if(this.isMempool){
      mesh.material.diffuseColor = new Color3(0, 1, 1);
      mesh.edgesColor = new Color4(0, 1, 1, 1);
      mesh.material.alpha = 0.5;
    }
    else{
      mesh.material.diffuseColor = new Color3(1, 0, 1);
      mesh.edgesColor = new Color4(1, 0, 1, 1);
      mesh.material.alpha = 0.5;
    }
    mesh.material.specularColor=Color3.Black();

    this.txns[this.txnCount] = txn;
    this.txnCount++;

    const p = {
      x: -((this.size/2) - (this.txnSize/2)),
      y: -((this.size/2) - (this.txnSize/2)),
      z: ((this.size/2) - (this.txnSize/2))
    };

    p.x += this.txnSize*this.txnsPos.x;
    p.y += this.txnSize*this.txnsPos.y;
    p.z -= this.txnSize*this.txnsPos.z;

    if(++this.txnsPos.y >= positionsPerDim){
      this.txnsPos.y = 0;
      this.txnsPos.x++;
    }
    if(this.txnsPos.x >= positionsPerDim){
      this.txnsPos.x = 0
      this.txnsPos.z++;
    }
    if(this.txnsPos.z >= positionsPerDim){
      console.log("Out of txn positions!");
      this.txnsPos.z = 0;
    }

    mesh.parent = this.mesh;
    mesh.position.x = p.x;
    mesh.position.y = p.y;
    mesh.position.z = p.z;
    mesh.checkCollisions = false;
    mesh.metadata = {
      hash: txn.hash
    };
    mesh.enableEdgesRendering();

    txn.mesh = mesh;
  }

  updateMempool(minedBlock) {

    //const remainingTxns = this.txns.filter(ar => !minedBlock.transactions.find(rm => (rm.hash === ar.hash)));
    const results = _.partition(this.txns, pt => minedBlock.transactions.find(mt => (mt.hash === pt.hash)));
    
    //console.log(results);

    if(minedBlock.transactions.length !== results[0].length){
      //console.log('Results don\'t match!!');
      console.log('Mined');
      console.log(minedBlock.transactions);
      console.log('0');
      console.log(results[0]);
      console.log('1');
      console.log(results[1]);
    }

    results[0].forEach(t => t.mesh.dispose());
  }
}
