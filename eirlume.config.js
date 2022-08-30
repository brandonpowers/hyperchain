export default {
  actionCam: false, // This value is changed dynamically in the code based on the users selected mode.
  mode: 2, // 0=Traditional 2D, 1=2D oldschool CRT, 2=Action cam 3D
  light: {
    intensity: 1.5
  },
  motherShip: {
    interval: 20, //seconds
    rotateSpeed: 0.1,
    velocity: 0.75,
    fireRate: 5,
    hitsToKill: 4
  },
  oldSchoolEffects: {
    enabled: false, // This value is changed dynamically in the code based on the users selected mode.
    blurIntensity: 0.35,
    scanLines: true
  },
  starField: {
    speed: 0.1,
    minStarSize: 0.1,
    maxStarSize: 0.2,
    numberofStars: 500,
    ratioOfBlinkingStars: 0.3,
  },
  startingLevel: 0, // Starting level -1;
  startingLives: 2,
  blockchainRPM: 1,
  blockchainNodes: [
    'wss://ancient-solemn-fire.ethereum-goerli.discover.quiknode.pro/4b2a416e99c24a47e9e0064bf6866d2188f0b809/',
    //'wss://eth-rinkeby.alchemyapi.io/v2/wegUWwoHX7uj6ybq5_MX1_VaPNfLjADD',
    'wss://eth-mainnet.g.alchemy.com/v2/gV7JFDkOjNt-ySdbka-PzF_3LMFA_Or1'
  ]
}
