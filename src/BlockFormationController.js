import {BlocksController} from "./BlocksController";
import {Block} from "./Block";
import {Axis, Scalar, Space, Mesh, StandardMaterial, Vector3, Color3, MeshBuilder, TransformNode} from "@babylonjs/core";
import {AdvancedDynamicTexture, Control, Style, TextBlock} from "@babylonjs/gui";
import State from "./State";
import {Barrier} from "./Barrier";
import {Explosion} from "./Explosion";
import {shortenAddress} from "./utils/shortenAddress";
//import eirlumeConfig from "../eirlume.config";

export class BlockFormationController {

  defaultParams = {
    columns: 2,
    rows: 0,
    spacing: {
      x: -16,
      y: 16
    },
    formationAnimInterval: 1500, //1500 is good start value
    formationAnimSpeed: 0.15,
    fireRate: 1, // Avg bullets per second
    numBarriers: 0,
    block1Lives: 0
  }
  maxBlocks = 12;
  minX = -45;
  maxX = 45;
  minY = -6;
  blocks = [];
  bullets = [];
  barriers = [];

  constructor(scene, chainIndex, chainCount, gameAssets = null) {
    this.scene = scene;
    this.chainIndex = chainIndex;
    this.chainCount = chainCount;
    this.gameAssets = gameAssets;
    //this.blocksController = new BlocksController(scene);
    this.x = ((this.chainIndex-1) * this.defaultParams.spacing.x) - (this.defaultParams.spacing.x / 2);

    this.direction = Math.random() < 0.5 ? "left" : "right";
    this.movementStarted = false;
    this.levelParams = this.levelFormationAlgorithm();
    this.level = State.level;
    this.buildFormation();
    this.buildBarriers(this.levelParams.numBarriers);
    this.setLoop();

    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
  }

  buildBarriers(numBarriers) {
    let posy = 15;
    let totalWidth = (this.maxX - this.minX);
    let distance = totalWidth / (numBarriers - 1);
    let posx = this.minX;
    for (let i = 0; i < numBarriers; i++) {
      let pos = new Vector3(posx, posy, 0);
      let barrier = new Barrier(this.gameAssets, this.scene, pos);
      this.barriers.push(barrier);
      posx += distance;
    }
  }

  destroyBarriers() {
    let i = 0;
    for (let barrier of this.barriers) {
      barrier.destroyBarrierMesh();
      if (!barrier.bricks.length) {
        this.barriers.splice(i, 1);
        break;
      }
      i++;
    }
  }

  createMempoolTxn(txn) {
    this.blocks[0].createTxn(txn);
  }

  updateMempool(minedBlock) {
    this.blocks[0].updateMempool(minedBlock);
  }

  createMempool(network) {
    const rc = 0;
   
    let y = (rc * this.levelParams.spacing.y) - (this.levelParams.spacing.y / 2);

    let block = new Block(this.scene, null, this.x, y, true);
    block.mesh.metadata.lives = this.levelParams.block1Lives ?? 0;
    block.mesh.metadata.scoreValue = 10;

    // Scaling
    block.mesh.scaling = new Vector3(1 - (rc * 0.14), 1 - (rc * 0.14), 1 - (rc * 0.14));
    block.x = this.x;
    block.y = y;
    block.id = block.mesh.id;
    block.mesh.onDispose = (mesh) => {
      if (State.state !== "GAMEOVER") {
        this.onDestroyMesh(mesh);
      }
    };
    this.blocks.push(block);

    //block.mesh.rotation.y = 1.57;
    //block.mesh.rotate(new Vector3(1,0,0));
    //var advancedTexture2 = AdvancedDynamicTexture.CreateForMesh(block.mesh, 512, 256, false);
    //advancedTexture2.wAng = -Math.PI/2;

    var label = new TextBlock("mempoolLabel" + this.chainIndex, `${network.protocol}\n(${network.name})`);
    label.fontSize = 18;
    label.fontFamily = '"Exo"';
    label.color = "white";
    this.advancedTexture.addControl(label);
    //advancedTexture2.addControl(label);
    label.linkWithMesh(block.mesh);
    label.linkOffsetY = 180;
    block.label = label;
  }

  createBlock(chainBlock) {
    const cc = this.chainIndex - 1;
    const rc = 1;

    let y = (rc * this.levelParams.spacing.y) - (this.levelParams.spacing.y / 2);

    let block = new Block(this.scene, null, this.x, y, false, chainBlock);
    block.mesh.metadata.lives = this.levelParams.block1Lives ?? 0;
    block.mesh.metadata.scoreValue = 10;

    // Scaling
    block.mesh.scaling = new Vector3(1 - (rc * 0.14), 1 - (rc * 0.14), 1 - (rc * 0.14));

    // Start at 1 to skip the mempool and move all the blocks back to create space for the new one
    const blockCount = this.blocks.length;
    this.blocks.forEach((a, i) => {
      if(i === 0) return;
      const aI = blockCount - i;
      a.y = ((aI + 1) * this.levelParams.spacing.y);
      a.mesh.scaling = new Vector3(1 - ((aI + 1) * 0.14), 1 - ((aI + 1) * 0.14), 1 - ((aI + 1) * 0.14));
      a.label.fontSize = Math.abs(13 - aI);
    });

    block.x = this.x;
    block.y = y;
    block.id = block.mesh.id;
    block.setYRotation(this.blocks[this.blocks.length-1].mesh.rotation.y + 0.2, this.blocks.length/50.0);

    block.mesh.onDispose = (mesh) => {
      if (State.state !== "GAMEOVER") {
        this.onDestroyMesh(mesh);
      }
    };
    this.blocks.push(block);

    for(let i = 0; i < chainBlock.transactions.length; i++){
      block.createTxn(chainBlock.transactions[i]);
    }

    var labelNode = new TransformNode("labelNode", this.scene);
    labelNode.parent = block.mesh;
    //labelNode.position.x = block.mesh.x;
    //labelNode.position.y = block.mesh.y;
    //labelNode.position.z = block.mesh.z;
    let hash = shortenAddress(chainBlock.hash);
    var label = new TextBlock("blockLabel" + hash.replace('...', '-'), hash + '\n' + chainBlock.transactions.length);
    label.fontSize = 14;
    label.fontFamily = '"Exo"';
    label.color = "white";
    this.advancedTexture.addControl(label);
    label.linkWithMesh(labelNode);
    block.label = label;
    block.labelNode = labelNode;
    //label.linkOffsetY = -200;

    if(this.blocks.length > this.maxBlocks) {
      let a = this.blocks.splice(1,1)[0];
      a.label.dispose();
      a.labelNode.dispose();
      a.mesh.dispose();
    }
  }

  buildFormation() {
    this.blockCount = this.blocks.length;
    State.formation = 1;
  }

  onDestroyMesh(mesh) {
    // destroy the block object.
    let i = 0
    for (let a of this.blocks) {
      if (a.id === mesh.id) {
        State.score += mesh.metadata.scoreValue;

        // Bigger blocks have bigger explosions
        new Explosion(mesh, 20 * mesh.scaling.x, mesh.scaling.x / 1.5, this.scene);
        this.blocks.splice(i, 1);
      }
      i++;
    }
    this.blockCount = this.blocks.length;
  }

  setLoop() {
    this.formationAnimInterval = this.levelParams.formationAnimInterval;
    this.formationAnimSpeed = this.levelParams.formationAnimSpeed / 2;
    this.formationAnimTick = setTimeout(() => {
      this.formationAnimSpeed = this.levelParams.formationAnimSpeed;
      this.moveFormation();
      this.movementStarted = true;
    }, 3000);
    this.formationObserver = this.scene.onBeforeRenderObservable.add(() => {
      this.updateBlockMeshPositions();
    }, 1);
  }

  updateBlockMeshPositions() {
    for (const block of this.blocks) {
      let blockPosition = block.updateMeshPosition(this.formationAnimSpeed);
      //this.changeDirectionIfAtEdge(blockPosition);
      //this.checkCollisionWithGround(blockPosition);
    }
  }

  checkCollisionWithGround(position) {
    if (position.y < this.minY) {
      this.scene.onBeforeRenderObservable.remove(this.formationObserver);
      State.state = "ALIENSWIN";
    }
  }

  moveFormation() {
    //if (this.direction === "right") {
    //  this.blocksController.formation.x += 5;
    //}
    //if (this.direction === "left") {
    //  this.blocksController.formation.x -= 5;
    //}
    if (this.direction === "down") {
      // If the player has died no need to move further
      // down during the delay before loading the next level
      //if (State.state !== "GAMEOVER") {
      //  this.blocksController.formation.y -= 5;
      //}
      this.direction = this.nextDirection;
    }
    //this.formationAnimSpeed = Scalar.Lerp(this.formationAnimSpeed, 0.8, 0.013);
    if (State.state === "GAMELOOP" && this.blocks.length) {
      //this.gameAssets.sounds.blockMove.play();
      this.formationAnimInterval = Scalar.Lerp(this.formationAnimInterval, 100, 0.025);
    }
    this.formationAnimTick = setTimeout(() => {
      this.moveFormation();
    }, this.formationAnimInterval);
  }

  changeDirectionIfAtEdge(position) {
    if (position.x > this.maxX && this.direction === "right") {
      this.direction = "down";
      this.nextDirection = "left";
    }
    if (position.x < this.minX && this.direction === "left") {
      this.direction = "down";
      this.nextDirection = "right";
    }
  }

  clearScene() {
    this.scene.onBeforeRenderObservable.remove(this.formationObserver);
    clearTimeout(this.formationAnimTick);
    //this.blocksController.recenterFormation();
  }

  levelFormationAlgorithm() {
    let levelParams = this.defaultParams;

    // Block grid gets bigger each level up to a max size
    const maxColumns = 10;
    const maxRows = 6;
    levelParams.columns = this.defaultParams.columns + State.level - 1;
    levelParams.rows = this.defaultParams.rows + State.level - 1;
    if (levelParams.columns > maxColumns) levelParams.columns = maxColumns;
    if (levelParams.rows > maxRows) levelParams.rows = maxRows;

    // Fire rate increases every level by a multiple;
    const fireRateIncreaseMultiple = 1.2;
    levelParams.fireRate = this.defaultParams.fireRate * Math.pow(fireRateIncreaseMultiple, State.level - 1);

    // Increase the number of barriers;
    // Additional barrier every 2 levels
    // up to a maximum
    const maxBarriers = 6;
    levelParams.numBarriers = Math.floor(this.defaultParams.numBarriers + (State.level / 2) - 0.5);
    if (levelParams.numBarriers > maxBarriers) levelParams.numBarriers = maxBarriers;

    // Give blocks lives, so they take more than one hit to die.
    const maxBlockLives = 3;
    if (State.level > 3) {
      levelParams.block1Lives = 1 + Math.floor((State.level / 3) - 1);
      if (levelParams.block1Lives > maxBlockLives) levelParams.block1Lives = maxBlockLives;
    }

    // Motherships spawn faster at higher levels.
    //this.motherShip.interval = eirlumeConfig.motherShip.interval - (State.level / 2);
    //this.motherShip.fireRate = 2 + (State.level / 3);

    return levelParams
  }
}
