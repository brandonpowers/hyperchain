export class BlocksController {

  static _formation = {
    x: 0,
    y: 16
  };

  constructor(scene) {
  }

  get formation() {
    return BlocksController._formation;
  }

  set formation(newformation) {
    BlocksController._formation = newformation;
  }

  recenterFormation() {
    BlocksController._formation = {
      x: 0,
      y: 16
    }
  }
}
