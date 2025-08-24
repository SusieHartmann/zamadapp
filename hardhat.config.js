import "@nomicfoundation/hardhat-toolbox";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      chainId: 11155111,
      accounts: {
        mnemonic: "impulse sun denial glass iron main push pistol boring initial immense lift"
      }
    },
    hardhat: {
      chainId: 31337,
      accounts: {
        mnemonic: "impulse sun denial glass iron main push pistol boring initial immense lift"
      }
    }
  }
};