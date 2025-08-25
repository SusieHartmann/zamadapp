import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying FHE Contracts with mnemonic...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy ImprovedEncryptedVoting Contract
  console.log("\n📊 Deploying ImprovedEncryptedVoting Contract...");
  const ImprovedEncryptedVoting = await ethers.getContractFactory("ImprovedEncryptedVoting");
  const voting = await ImprovedEncryptedVoting.deploy();
  await voting.waitForDeployment();
  const votingAddress = await voting.getAddress();
  console.log("✅ ImprovedEncryptedVoting deployed to:", votingAddress);

  // Deploy NeonPulseFHECounter Contract  
  console.log("\n⚡ Deploying NeonPulseFHECounter Contract...");
  const NeonPulseFHECounter = await ethers.getContractFactory("NeonPulseFHECounter");
  const counter = await NeonPulseFHECounter.deploy();
  await counter.waitForDeployment();
  const counterAddress = await counter.getAddress();
  console.log("✅ NeonPulseFHECounter deployed to:", counterAddress);

  // Deploy NeonPulseVoting Contract
  console.log("\n🗳️ Deploying NeonPulseVoting Contract...");
  const NeonPulseVoting = await ethers.getContractFactory("NeonPulseVoting");
  const neonVoting = await NeonPulseVoting.deploy(
    "Should we implement advanced FHE privacy features?",
    24 * 7 // 7 days in hours
  );
  await neonVoting.waitForDeployment();
  const neonVotingAddress = await neonVoting.getAddress();
  console.log("✅ NeonPulseVoting deployed to:", neonVotingAddress);

  // Display summary
  console.log("\n🎉 Deployment Summary:");
  console.log("================================");
  console.log("Deployer Address:", deployer.address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("\n📄 Contract Addresses:");
  console.log("ImprovedEncryptedVoting:", votingAddress);
  console.log("NeonPulseFHECounter:", counterAddress);
  console.log("NeonPulseVoting:", neonVotingAddress);
  
  // Generate frontend configuration
  console.log("\n📝 Frontend Configuration:");
  console.log("Copy this to your contracts.ts file:");
  console.log(`
export const CONTRACT_ADDRESSES = {
  ImprovedEncryptedVoting: "${votingAddress}",
  NeonPulseFHECounter: "${counterAddress}", 
  NeonPulseVoting: "${neonVotingAddress}",
  FHECounter: "${counterAddress}",
  EncryptedVoting: "${votingAddress}",
};
  `);

  // Test basic functionality
  console.log("\n🧪 Testing Contract Functionality...");
  try {
    // Test voting contract
    const votingInfo = await voting.getVotingInfo();
    console.log("Voting Topic:", votingInfo[0]);
    console.log("Voting Deadline:", new Date(Number(votingInfo[1]) * 1000).toLocaleString());
    console.log("Voting Status:", votingInfo[2]);
    
    // Test counter contract
    const counterStats = await counter.getNeonPulseStats();
    console.log("Counter Pulse Level:", counterStats[0]);
    console.log("Counter Energy State:", counterStats[1]);
    
    console.log("✅ All contracts are functioning properly!");
    
  } catch (error) {
    console.error("⚠️ Contract testing failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });