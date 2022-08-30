export class AliensController {

  static _formation = {
    x: 0,
    y: 16
  };

  constructor(scene) {
  }

  get formation() {
    return AliensController._formation;
  }

  set formation(newformation) {
    AliensController._formation = newformation;
  }

  recenterFormation() {
    AliensController._formation = {
      x: 0,
      y: 16
    }
  }
}
