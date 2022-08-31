import {AliensController} from "./AliensController";
import {Alien} from "./Alien";
import {Axis, Scalar, Space, Mesh, StandardMaterial, Vector3, Color3, MeshBuilder, TransformNode} from "@babylonjs/core";
import {AdvancedDynamicTexture, Control, Style, TextBlock} from "@babylonjs/gui";
import State from "./State";
import {Barrier} from "./Barrier";
import {Explosion} from "./Explosion";
import {shortenAddress} from "./utils/shortenAddress";
//import eirlumeConfig from "../eirlume.config";

export class AlienFormationController {

  defaultParams = {
    columns: 1,
    rows: 0,
    spacing: {
      x: -16,
      y: 16
    },
    formationAnimInterval: 1500, //1500 is good start value
    formationAnimSpeed: 0.15,
    fireRate: 1, // Avg bullets per second
    numBarriers: 0,
    alien1Lives: 0
  }
  maxBlocks = 12;
  minX = -45;
  maxX = 45;
  minY = -6;
  aliens = [];
  bullets = [];
  barriers = [];

  constructor(scene, chainIndex, chainCount, gameAssets = null) {
    this.scene = scene;
    this.chainIndex = chainIndex;
    this.chainCount = chainCount;
    this.gameAssets = gameAssets;
    this.aliensController = new AliensController(scene);
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
    this.aliens[0].createTxn(txn);
  }

  updateMempool(txns) {
    this.aliens[0].updateMempool(txns);
  }

  createMempool(network) {
    const rc = 0;
   
    let y = (rc * this.levelParams.spacing.y) - (this.levelParams.spacing.y / 2);

    let alien = new Alien(this.scene, null, this.x, y, true);
    alien.mesh.metadata.lives = this.levelParams.alien1Lives ?? 0;
    alien.mesh.metadata.scoreValue = 10;

    // Scaling
    alien.mesh.scaling = new Vector3(1 - (rc * 0.14), 1 - (rc * 0.14), 1 - (rc * 0.14));
    alien.x = this.x;
    alien.y = y;
    alien.id = alien.mesh.id;
    alien.mesh.onDispose = (mesh) => {
      if (State.state !== "GAMEOVER") {
        this.onDestroyMesh(mesh);
      }
    };
    this.aliens.push(alien);

    //alien.mesh.rotation.y = 1.57;
    //alien.mesh.rotate(new Vector3(1,0,0));
    //var advancedTexture2 = AdvancedDynamicTexture.CreateForMesh(alien.mesh, 512, 256, false);
    //advancedTexture2.wAng = -Math.PI/2;

    var label = new TextBlock("mempoolLabel" + this.chainIndex, `${network.protocol}\n(${network.name})`);
    label.fontSize = 18;
    label.fontFamily = '"Exo"';
    label.color = "white";
    this.advancedTexture.addControl(label);
    //advancedTexture2.addControl(label);
    label.linkWithMesh(alien.mesh);
    label.linkOffsetY = 180;
    alien.label = label;
  }

  createAlien(block) {
    const cc = this.chainIndex - 1;
    const rc = 1;

    let y = (rc * this.levelParams.spacing.y) - (this.levelParams.spacing.y / 2);

    let alien = new Alien(this.scene, null, this.x, y, false, block);
    alien.mesh.metadata.lives = this.levelParams.alien1Lives ?? 0;
    alien.mesh.metadata.scoreValue = 10;

    // Scaling
    alien.mesh.scaling = new Vector3(1 - (rc * 0.14), 1 - (rc * 0.14), 1 - (rc * 0.14));

    // Start at 1 to skip the mempool and move all the blocks back to create space for the new one
    for(let i=1; i < this.aliens.length; i++){
      let aI = this.aliens.length - i;
      let a = this.aliens[i];
      a.y = ((aI + 1) * this.levelParams.spacing.y);
      a.mesh.scaling = new Vector3(1 - ((aI + 1) * 0.14), 1 - ((aI + 1) * 0.14), 1 - ((aI + 1) * 0.14));
    }

    alien.x = this.x;
    alien.y = y;
    alien.id = alien.mesh.id;
    alien.setYRotation(this.aliens[this.aliens.length-1].mesh.rotation.y + 0.2, this.aliens.length/50.0);

    alien.mesh.onDispose = (mesh) => {
      if (State.state !== "GAMEOVER") {
        this.onDestroyMesh(mesh);
      }
    };
    this.aliens.push(alien);

    for(let i = 0; i < block.transactions.length; i++){
      alien.createTxn(block.transactions[i]);
    }

    var labelNode = new TransformNode("labelNode", this.scene);
    labelNode.parent = alien.mesh;
    //labelNode.position.x = alien.mesh.x;
    //labelNode.position.y = alien.mesh.y;
    //labelNode.position.z = alien.mesh.z;
    let hash = shortenAddress(block.hash);
    var label = new TextBlock("blockLabel" + hash.replace('...', '-'), hash);
    label.fontSize = 14;
    label.fontFamily = '"Exo"';
    label.color = "white";
    this.advancedTexture.addControl(label);
    label.linkWithMesh(labelNode);
    alien.label = label;
    alien.labelNode = labelNode;
    //label.linkOffsetY = -200;

    if(this.aliens.length > this.maxBlocks) {
      let a = this.aliens.splice(1,1)[0];
      a.label.dispose();
      a.labelNode.dispose();
      a.mesh.dispose();
    }
  }

  buildFormation() {
    this.alienCount = this.aliens.length;
    State.formation = 1;
  }

  onDestroyMesh(mesh) {
    // destroy the alien object.
    let i = 0
    for (let a of this.aliens) {
      if (a.id === mesh.id) {
        State.score += mesh.metadata.scoreValue;

        // Bigger aliens have bigger explosions
        new Explosion(mesh, 20 * mesh.scaling.x, mesh.scaling.x / 1.5, this.scene);
        //this.gameAssets.sounds.alienExplosion.play();
        this.aliens.splice(i, 1);
      }
      i++;
    }
    this.alienCount = this.aliens.length;
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
      this.updateAlienMeshPositions();
    }, 1);
  }

  updateAlienMeshPositions() {
    for (const alien of this.aliens) {
      let alienPosition = alien.updateMeshPosition(this.formationAnimSpeed);
      //this.changeDirectionIfAtEdge(alienPosition);
      //this.checkCollisionWithGround(alienPosition);
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
    //  this.aliensController.formation.x += 5;
    //}
    //if (this.direction === "left") {
    //  this.aliensController.formation.x -= 5;
    //}
    if (this.direction === "down") {
      // If the player has died no need to move further
      // down during the delay before loading the next level
      if (State.state !== "GAMEOVER") {
        this.aliensController.formation.y -= 5;
      }
      this.direction = this.nextDirection;
    }
    //this.formationAnimSpeed = Scalar.Lerp(this.formationAnimSpeed, 0.8, 0.013);
    if (State.state === "GAMELOOP" && this.aliens.length) {
      //this.gameAssets.sounds.alienMove.play();
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
    this.aliensController.recenterFormation();
  }

  levelFormationAlgorithm() {
    let levelParams = this.defaultParams;

    // Alien grid gets bigger each level up to a max size
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

    // Give aliens lives, so they take more than one hit to die.
    // From Level 4 Alien1 gets 1 life increasing by 1 every 3 levels.
    // From Level 6 Alien2 gets 1 life increasing by 1 every 3 levels.
    const maxAlienLives = 3;
    if (State.level > 3) {
      levelParams.alien1Lives = 1 + Math.floor((State.level / 3) - 1);
      if (levelParams.alien1Lives > maxAlienLives) levelParams.alien1Lives = maxAlienLives;
    }

    // Motherships spawn faster at higher levels.
    //this.motherShip.interval = eirlumeConfig.motherShip.interval - (State.level / 2);
    //this.motherShip.fireRate = 2 + (State.level / 3);

    return levelParams
  }
}
