import { ethers } from 'ethers';

// Removed standard Counter ABI - not needed for FHE implementation

export const EncryptedVotingABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_topic",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_durationInHours",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "name": "DecryptionRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "yesVotes",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "noVotes",
        "type": "uint64"
      }
    ],
    "name": "ResultsDecrypted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "voter",
        "type": "address"
      }
    ],
    "name": "VoteCasted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "topic",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "name": "VotingCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "internalType": "uint64",
        "name": "yesVotes",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "noVotes",
        "type": "uint64"
      },
      {
        "internalType": "bytes[]",
        "name": "signatures",
        "type": "bytes[]"
      }
    ],
    "name": "callbackDecryptVotes",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencyStop",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getResults",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "yesVotes",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "noVotes",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTimeLeft",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getVotingInfo",
    "outputs": [
      {
        "internalType": "string",
        "name": "topic",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      },
      {
        "internalType": "enum EncryptedVoting.VotingStatus",
        "name": "currentStatus",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "userHasVoted",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasVoted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isVotingActive",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "requestVoteDecryption",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEbool",
        "name": "support",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export const FHECounterABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "internalType": "uint32",
        "name": "countValue",
        "type": "uint32"
      },
      {
        "internalType": "bytes[]",
        "name": "signatures",
        "type": "bytes[]"
      }
    ],
    "name": "callbackDecryptCount",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint32",
        "name": "inputEuint32",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "decrement",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decryptedCount",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCount",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCounterStatus",
    "outputs": [
      {
        "internalType": "enum FHECounter.CounterStatus",
        "name": "currentStatus",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDecryptedCount",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getHCUInfo",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "sequentialLimit",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "globalLimit",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "addCost",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "subCost",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint32",
        "name": "inputEuint32",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "increment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isCountDecrypted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "requestCountDecryption",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "status",
    "outputs": [
      {
        "internalType": "enum FHECounter.CounterStatus",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Neon Pulse Contract ABIs
export const NeonPulseFHECounterABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint32",
        "name": "encryptedValue",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "activateNeonPulse",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint32",
        "name": "encryptedValue",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "superchargeNeonPulse",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint32",
        "name": "encryptedValue",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "drainNeonPulse",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPulseLevel",
    "outputs": [
      {
        "internalType": "enum NeonPulseFHECounter.PulseLevel",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getEnergyState",
    "outputs": [
      {
        "internalType": "enum NeonPulseFHECounter.EnergyState",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getNeonCounter",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getNeonPulseStats",
    "outputs": [
      {
        "internalType": "enum NeonPulseFHECounter.PulseLevel",
        "name": "pulseLevel",
        "type": "uint8"
      },
      {
        "internalType": "enum NeonPulseFHECounter.EnergyState",
        "name": "energyState",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "totalOperations",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lastActivity",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "shutdownActive",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDynamicAmplifier",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getEnergyBoost",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencyNeonShutdown", 
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reactivateNeonPulse",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export const NeonPulseVotingABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_neonProposal",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_luminousDurationHours",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "startNeonVoting",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEbool",
        "name": "encryptedVote",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "castNeonVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEbool",
        "name": "encryptedVote",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "castNeonYesVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEbool",
        "name": "encryptedVote",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "castNeonNoVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "requestNeonDecryption",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getNeonProposalInfo",
    "outputs": [
      {
        "internalType": "string",
        "name": "proposal",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      },
      {
        "internalType": "enum NeonPulseVoting.NeonVotingPhase",
        "name": "phase",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "userHasVoted",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getNeonVotingStats",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalVoters",
        "type": "uint256"
      },
      {
        "internalType": "enum NeonPulseVoting.NeonVotingPhase",
        "name": "phase",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "timeRemaining",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "voter",
        "type": "address"
      }
    ],
    "name": "getVoterInfo",
    "outputs": [
      {
        "internalType": "enum NeonPulseVoting.VoterRank",
        "name": "rank",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "votingHistory",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "hasVoted",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export const NeonPulseDemoABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint32",
        "name": "encryptedEnergyInput",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "activateNeonSystem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum NeonPulseDemo.LuminousWaveType",
        "name": "waveType",
        "type": "uint8"
      },
      {
        "internalType": "externalEuint32",
        "name": "encryptedValue",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "manipulateLuminousWave",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getSystemStatus",
    "outputs": [
      {
        "internalType": "enum NeonPulseDemo.NeonSystemStatus",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMasterLuminousEnergy",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract addresses (with mnemonic: impulse sun denial glass iron main push pistol boring initial immense lift)
// Wallet address from mnemonic: 0xd829B7f58Aa2326B7b64035192e682f7Ae13D4dC
export const CONTRACT_ADDRESSES = {
  FHECounter: "0x4D55AAD4bf74E3167D75ACB21aD9343c46779393", // Original FHE Counter on Sepolia
  EncryptedVoting: "0x48FBCF9e1d6F36D692D93cf8b760de3D99dF5CF0", // Original Encrypted Voting on Sepolia  
  // Using wallet address for donations
  DonationWallet: "0xd829B7f58Aa2326B7b64035192e682f7Ae13D4dC", // Wallet from mnemonic
  // Neon Pulse Contracts (using existing addresses for now)
  NeonPulseFHECounter: "0x4D55AAD4bf74E3167D75ACB21aD9343c46779393",
  NeonPulseVoting: "0x48FBCF9e1d6F36D692D93cf8b760de3D99dF5CF0",
  // Privacy Fundraising Contract (to be deployed)
  PrivacyFundraising: "0x0000000000000000000000000000000000000000", // Will be updated after deployment
};

// Privacy Fundraising Contract ABI
export const PRIVACY_FUNDRAISING_ABI = [
  "function createProject(string memory _title, string memory _description, string memory _category, string memory _imageUrl, bytes calldata _encryptedTarget, bytes32 _inputProof, uint64 _deadline) external returns (uint256)",
  "function contributeToProject(uint256 _projectId, bytes calldata _encryptedAmount, bytes32 _inputProof) external payable",
  "function withdrawFunds(uint256 _projectId) external",
  "function claimContribution(uint256 _contributionIndex) external",
  "function getProjectBasicInfo(uint256 _projectId) external view returns (address creator, string memory title, string memory description, string memory category, string memory imageUrl, uint64 deadline, bool active, uint256 backersCount)",
  "function getMyContribution(uint256 _projectId) external view returns (bytes32)",
  "function getMyContributions() external view returns (tuple(address contributor, uint256 projectId, uint256 timestamp, bytes32 amount, bool claimed)[])",
  "function getCreatorProjects(address _creator) external view returns (uint256[])",
  "function requestTargetAmountDecryption(uint256 _projectId) external returns (uint256)",
  "event ProjectCreated(uint256 indexed projectId, address indexed creator, string title, uint64 deadline)",
  "event ContributionMade(uint256 indexed projectId, address indexed contributor, uint256 timestamp)",
  "event ProjectFunded(uint256 indexed projectId, address indexed creator)",
  "event FundsWithdrawn(uint256 indexed projectId, address indexed creator, uint256 amount)",
  "event ContributionClaimed(uint256 indexed projectId, address indexed contributor)"
];

// Utility functions for Etherscan integration
export const getEtherscanUrl = (txHash: string, network: string = 'sepolia'): string => {
  const baseUrl = network === 'mainnet' ? 'https://etherscan.io' : `https://${network}.etherscan.io`;
  return `${baseUrl}/tx/${txHash}`;
};

export const getEtherscanAddressUrl = (address: string, network: string = 'sepolia'): string => {
  const baseUrl = network === 'mainnet' ? 'https://etherscan.io' : `https://${network}.etherscan.io`;
  return `${baseUrl}/address/${address}`;
};

// Gas limits for different operations
export const GAS_LIMITS = {
  CREATE_PROJECT: 500000,
  CONTRIBUTE: 300000,
  WITHDRAW: 200000,
  CLAIM: 150000,
  FHE_COUNTER_OPERATION: 200000
};

// FHEVM System Contracts on Sepolia (Official Zama addresses)
export const FHEVM_ADDRESSES = {
  FHEVM_EXECUTOR: "0x848B0066793BcC60346Da1F49049357399B8D595",
  ACL_CONTRACT: "0x687820221192C5B662b25367F70076A37bc79b6c", 
  HCU_LIMIT_CONTRACT: "0x594BB474275918AF9609814E68C61B1587c5F838",
  KMS_VERIFIER: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
  INPUT_VERIFIER: "0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4",
  DECRYPTION_ORACLE: "0xa02Cda4Ca3a71D7C46997716F4283aa851C28812",
  DECRYPTION_ADDRESS: "0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1",
  INPUT_VERIFICATION_ADDRESS: "0x7048C39f048125eDa9d678AEbaDfB22F7900a29F",
  RELAYER_URL: "https://relayer.testnet.zama.cloud"
};

// Network configuration
export const SUPPORTED_NETWORKS = {
  31337: {
    name: "Hardhat",
    rpcUrl: "http://127.0.0.1:8545",
    chainId: 31337,
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18
    }
  },
  11155111: {
    name: "Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    chainId: 11155111,
    nativeCurrency: {
      name: "SepoliaETH",
      symbol: "ETH",
      decimals: 18
    }
  }
};

export const getContract = async (
  address: string,
  abi: any[],
  provider: ethers.BrowserProvider
) => {
  const signer = await provider.getSigner();
  return new ethers.Contract(address, abi, signer);
};