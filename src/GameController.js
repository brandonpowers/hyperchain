import {BlockchainController} from "./BlockchainController";
import {BlockFormationController} from "./BlockFormationController";
import State from "./State";
import config from "../eirlume.config";
import {GameGUI} from "./GameGUI";
import eirlumeConfig from "../eirlume.config";

export class GameController {

  constructor(environment, inputController, gameAssets = null, UI) {
    this.UI = UI;
    this.environment = environment;
    this.scene = environment.scene;
    this.inputController = inputController;
    this.gameAssets = gameAssets;
    this.blockFormations = [];
    this.blockchains = [];
  }

  initialize() {
    State.lives = config.startingLives;
    State.level = config.startingLevel;
    State.score = 0;
    State.highScore = this.getHighScore();
    State.gameOverStep = 0;
    State.gameOverStep = 0;
  }

  setHighScore(score) {
    window.localStorage.setItem('highScore', score);
    State.highScore = score;
  }

  getHighScore() {
    return parseInt(window.localStorage.getItem('highScore') ?? 0);
  }

  startGame() {
    //this.fullScreen();
    this.initialize();
    this.nextLevel();
    this.loadGameGUI();
  }

  loadGameGUI(){
    this.UI.disable();
    this.gameGUI = new GameGUI();
  }

  fullScreen() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      let el = document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) { /* Safari */
        el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) { /* IE11 */
        el.msRequestFullscreen();
      }
    }
  }

  titleScreen() {
    this.UI.showTitleScreen();
    this.UI.hideLoadingScreen()
  }

  nextLevel() {
    State.level += 1;
    this.buildBlockFormation();
    State.state = "GAMELOOP";
    //this.gameAssets.sounds.levelStart.play();
  }

  checkStates() {
    /*
    this.playerController.actionCam();

    if (this.blockFormations[0].blockCount === 0) {
      State.state = "PLAYERWINS";
      setTimeout(() => {
        State.state = "CLEARLEVEL";
        this.gameAssets.sounds.clearLevel.play();
        this.UI.showGameUI();
        this.UI.showGameHints();
      }, 1500);
    }
    */
    this.gameGUI.update();
  }

  blocksWin() {
    State.lives = 0;
  }

  gameOver() {
    switch (State.gameOverStep) {
      case 0:
        this.UI.showGameUI();
        setTimeout(() => {
          this.UI.showGameOver();
          this.checkForNewHighScore();
          //this.gameAssets.sounds.gameOver.play();
        }, 2000);
        setTimeout(() => {
          this.UI.showPlayAgain();
          State.gameOverStep = 2;
        }, 4000);
        State.gameOverStep = 1;
        break;
      case 1:
        break;
      case 2:
        if (this.UI.playAgainPressed) {
          this.destroyGameGUI();
          this.UI.hideGameOver();
          this.UI.hidePlayAgain();
          this.UI.hideNewHighScore();
          State.gameOverStep = 3;
          //this.gameAssets.sounds.clearLevel.play();
        }
        break;
      case 3 :
        this.clearLevel();
        break;
      case 4:
        State.state = "TITLESCREEN";
        break;
      default:
        break;
    }
  }

  destroyGameGUI(){
    this.gameGUI.texture.dispose();
    delete this.gameGUI.texture;
  }

  checkForNewHighScore() {
    if (State.score > this.getHighScore()) {
      this.setHighScore(State.score);
      this.UI.showNewHighScore();
      this.gameGUI.update();
    }
  }

  buildBlockFormation() {
    for (let i=0; i < eirlumeConfig.blockchainNodes.length; i++){
      let node = eirlumeConfig.blockchainNodes[i];
      let blockFormation = new BlockFormationController(this.scene, i+1, this.gameAssets);
      let blockchain = new BlockchainController(this.scene, i+1, node, blockFormation);

      this.blockFormations.push(blockFormation);
      this.blockchains.push(blockchain);

      blockchain.initialize();
      blockchain.start();
    }
  }

  clearLevel() {
    let clearSteps = 4;
    this.gameGUI.update();
    // Step 1. All barriers must be destroyed.
    if (this.blockFormations[0].barriers.length) {
      this.blockFormations[0].destroyBarriers();
      clearSteps -= 1;
    }
    // Step 4. Destroy remaining block bullets.
    // Step 5. Destroy remaining blocks
    if (this.blockFormations[0].blocks.length) {
      let randID = Math.floor(Math.random() * this.blockFormations[0].blocks.length);
      this.blockFormations[0].blocks[randID].mesh.dispose();
      this.blockFormations[0].blocks.splice(randID, 1);
      clearSteps -= 1;
    }

    if (clearSteps === 4) {
      this.blockFormations[0].clearScene();
      delete this.blockFormations[0];
      // final cleanup to ensure everything has been disposed of.
      while (this.scene.meshes.length) {
        this.scene.meshes[0].dispose();
      }
      if (State.state === "GAMEOVER") {
        State.gameOverStep += 1;
      } else {
        State.state = "NEXTLEVEL";
      }
      this.UI.hideGameHints();
      this.UI.hideGameUI();
      this.UI.disable();
    }
  }
}
