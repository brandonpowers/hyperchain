export default {
  actionCam: false, // This value is changed dynamically in the code based on the users selected mode.
  mode: 2, // 0=Traditional 2D, 1=2D oldschool CRT, 2=Action cam 3D
  light: {
    intensity: 1.5
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
  blockchainNetworks: [
    // Ethereum Goerli on Quicknode
    {
      enabled: true,
      name: 'goerli',
      url: 'wss://ancient-solemn-fire.ethereum-goerli.discover.quiknode.pro/4b2a416e99c24a47e9e0064bf6866d2188f0b809/'
    },
    // Ethereum Mainnet on Quicknode
    {
      enabled: true,
      name: 'mainnet',
      url: 'wss://summer-blue-vineyard.quiknode.pro/be5c8e7da2a8a5080d75b03838b77ce2d5d617e6/'
    },
    // Ethereum Goerli testnet on Infura
    {
      enabled: false,
      name: 'goerli',
      url: 'wss://goerli.infura.io/ws/v3/980b3408691f48508cf26649dee2e49e'
    },
    // Ethereum Mainnet on Infura
    {
      enabled: false,
      name: 'mainnet',
      url: 'wss://mainnet.infura.io/ws/v3/980b3408691f48508cf26649dee2e49e'
    },
    // Ethereum 2.0 Prater testnet on Infura
    {
      enabled: false,
      name: null,
      url: 'wss://2E67sGBrz8n4vepFifc4vjOL1EB:831a2b6d9f7e6ec1e8ce43dbdf77617c@eth2-beacon-prater.infura.io'
    },
    // Ethereum 2.0 Beaconchain on Infura
    {
      enabled: false,
      name: 'beacon',
      url: 'wss://2E67sGBrz8n4vepFifc4vjOL1EB:831a2b6d9f7e6ec1e8ce43dbdf77617c@eth2-beacon-mainnet.infura.io'
    },
    // Ethereum Mainnet on Alchemy
    {
      enabled: false,
      name: 'mainnet',
      url: 'wss://eth-mainnet.g.alchemy.com/v2/gV7JFDkOjNt-ySdbka-PzF_3LMFA_Or1'
    }
  ]
}
