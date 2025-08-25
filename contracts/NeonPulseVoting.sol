// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "hardhat/console.sol";
import "fhevm/lib/TFHE.sol";
import "fhevm/abstracts/EIP712WithModifier.sol";

/**
 * @title NeonPulseVoting
 * @notice Neon Pulse themed encrypted voting system with luminous democracy
 * @dev Advanced FHEVM voting with neon-enhanced democratic processes
 */
contract NeonPulseVoting is EIP712WithModifier {
    using TFHE for euint32;
    using TFHE for ebool;

    // ============ NEON PULSE VOTING ENUMS ============
    
    enum NeonVotingPhase {
        Initialization, 
        LuminousVoting, 
        PulseValidation, 
        NeonConsensus, 
        IlluminatedResolution
    }
    
    enum VoterRank {
        Newcomer, 
        NeonVoter, 
        PulseAdept, 
        LuminousGuard, 
        NeonCouncil
    }

    // ============ NEON PULSE VOTING STATE ============
    
    string public neonProposal;
    uint256 public luminousDeadline;
    NeonVotingPhase public currentPhase;
    
    euint32 private encryptedNeonYesVotes;
    euint32 private encryptedNeonNoVotes;
    euint32 private totalLuminousParticipation;
    
    address public proposalCreator;
    bool public neonVotingActive;
    bool public emergencyNeonShutdown;
    uint256 public neonVotingStartTime;
    uint256 private totalNeonVoters;
    
    mapping(address => bool) public hasNeonVoted;
    mapping(address => VoterRank) public voterRanks;
    mapping(address => uint256) public neonVotingHistory;
    mapping(address => euint32) private personalVotingPower;

    // ============ NEON PULSE VOTING EVENTS ============
    
    event NeonVotingCreated(
        string indexed proposal, 
        uint256 deadline, 
        address creator, 
        uint256 timestamp
    );
    
    event NeonVoteCasted(
        address indexed voter, 
        VoterRank voterRank, 
        NeonVotingPhase phase, 
        uint256 timestamp
    );
    
    event LuminousValidationReached(
        NeonVotingPhase newPhase, 
        uint256 totalParticipation, 
        uint256 timestamp
    );
    
    event NeonConsensusAchieved(
        address indexed initiator, 
        uint256 finalYesVotes, 
        uint256 finalNoVotes, 
        uint256 timestamp
    );
    
    event NeonVotingResolved(
        string proposal, 
        bool approved, 
        uint256 totalVoters, 
        uint256 timestamp
    );

    // ============ NEON PULSE VOTING MODIFIERS ============
    
    modifier onlyAuthorizedVoter() {
        require(voterRanks[msg.sender] != VoterRank.Newcomer || msg.sender == proposalCreator, 
                "NeonPulse: Insufficient voter authorization");
        _;
    }
    
    modifier onlyDuringNeonVoting() {
        require(neonVotingActive, "NeonPulse: Neon voting not active");
        require(block.timestamp <= luminousDeadline, "NeonPulse: Luminous deadline exceeded");
        require(!emergencyNeonShutdown, "NeonPulse: Emergency neon shutdown active");
        _;
    }
    
    modifier hasNotNeonVoted() {
        require(!hasNeonVoted[msg.sender], "NeonPulse: Already participated in neon voting");
        _;
    }
    
    modifier validNeonPhase(NeonVotingPhase requiredPhase) {
        require(currentPhase == requiredPhase, "NeonPulse: Invalid neon voting phase");
        _;
    }

    // ============ CONSTRUCTOR ============
    
    constructor(
        string memory _neonProposal, 
        uint256 _luminousDurationHours
    ) EIP712WithModifier("NeonPulseVoting", "1") {
        console.log("NeonPulse: Initializing neon pulse voting system");
        
        neonProposal = _neonProposal;
        luminousDeadline = block.timestamp + (_luminousDurationHours * 1 hours);
        proposalCreator = msg.sender;
        
        encryptedNeonYesVotes = TFHE.asEuint32(0);
        encryptedNeonNoVotes = TFHE.asEuint32(0);
        totalLuminousParticipation = TFHE.asEuint32(0);
        
        currentPhase = NeonVotingPhase.Initialization;
        neonVotingActive = false;
        emergencyNeonShutdown = false;
        neonVotingStartTime = 0;
        totalNeonVoters = 0;
        
        // Set creator as LuminousGuard
        voterRanks[msg.sender] = VoterRank.LuminousGuard;
        personalVotingPower[msg.sender] = TFHE.asEuint32(5); // Higher voting power
        
        console.log("NeonPulse: Neon voting system initialized for proposal:", _neonProposal);
        
        emit NeonVotingCreated(_neonProposal, luminousDeadline, msg.sender, block.timestamp);
    }

    // ============ CORE NEON PULSE VOTING FUNCTIONS ============
    
    /**
     * @notice Start the neon voting phase
     */
    function startNeonVoting() 
        external 
        validNeonPhase(NeonVotingPhase.Initialization)
    {
        require(msg.sender == proposalCreator, "NeonPulse: Only proposal creator can start voting");
        console.log("NeonPulse: Starting neon voting phase");
        
        currentPhase = NeonVotingPhase.LuminousVoting;
        neonVotingActive = true;
        neonVotingStartTime = block.timestamp;
        
        emit LuminousValidationReached(currentPhase, totalNeonVoters, block.timestamp);
    }
    
    /**
     * @notice Cast encrypted YES vote in neon pulse voting
     * @param encryptedVote Encrypted boolean vote (true for YES)
     * @param inputProof Proof for encrypted input validation
     */
    function castNeonYesVote(
        externalEbool encryptedVote, 
        bytes calldata inputProof
    ) 
        external 
        onlyAuthorizedVoter 
        onlyDuringNeonVoting 
        hasNotNeonVoted 
        validNeonPhase(NeonVotingPhase.LuminousVoting)
    {
        console.log("NeonPulse: Casting encrypted YES vote with neon power");
        
        ebool validatedVote = TFHE.asEbool(encryptedVote, inputProof);
        euint32 votingPower = _getVotingPower(msg.sender);
        
        // Add weighted vote based on voter rank
        euint32 weightedVote = TFHE.select(validatedVote, votingPower, TFHE.asEuint32(0));
        encryptedNeonYesVotes = encryptedNeonYesVotes.add(weightedVote);
        
        // Update participation tracking
        totalLuminousParticipation = totalLuminousParticipation.add(TFHE.asEuint32(1));
        hasNeonVoted[msg.sender] = true;
        neonVotingHistory[msg.sender]++;
        totalNeonVoters++;
        
        // Potentially upgrade voter rank based on participation
        _upgradeVoterRank(msg.sender);
        
        emit NeonVoteCasted(msg.sender, voterRanks[msg.sender], currentPhase, block.timestamp);
        
        // Check if we should advance to pulse validation
        _checkLuminousValidationProgress();
    }
    
    /**
     * @notice Cast encrypted NO vote in neon pulse voting
     * @param encryptedVote Encrypted boolean vote (false for NO)
     * @param inputProof Proof for encrypted input validation
     */
    function castNeonNoVote(
        externalEbool encryptedVote, 
        bytes calldata inputProof
    ) 
        external 
        onlyAuthorizedVoter 
        onlyDuringNeonVoting 
        hasNotNeonVoted 
        validNeonPhase(NeonVotingPhase.LuminousVoting)
    {
        console.log("NeonPulse: Casting encrypted NO vote with neon power");
        
        ebool validatedVote = TFHE.asEbool(encryptedVote, inputProof);
        euint32 votingPower = _getVotingPower(msg.sender);
        
        // Add weighted vote (inverted logic for NO votes)
        euint32 weightedVote = TFHE.select(validatedVote.not(), votingPower, TFHE.asEuint32(0));
        encryptedNeonNoVotes = encryptedNeonNoVotes.add(weightedVote);
        
        // Update participation tracking
        totalLuminousParticipation = totalLuminousParticipation.add(TFHE.asEuint32(1));
        hasNeonVoted[msg.sender] = true;
        neonVotingHistory[msg.sender]++;
        totalNeonVoters++;
        
        // Potentially upgrade voter rank based on participation
        _upgradeVoterRank(msg.sender);
        
        emit NeonVoteCasted(msg.sender, voterRanks[msg.sender], currentPhase, block.timestamp);
        
        // Check if we should advance to pulse validation
        _checkLuminousValidationProgress();
    }
    
    /**
     * @notice Unified neon vote casting function
     * @param encryptedVote Encrypted boolean vote
     * @param inputProof Proof for encrypted input validation
     */
    function castNeonVote(
        externalEbool encryptedVote, 
        bytes calldata inputProof
    ) 
        external 
        onlyAuthorizedVoter 
        onlyDuringNeonVoting 
        hasNotNeonVoted 
        validNeonPhase(NeonVotingPhase.LuminousVoting)
    {
        console.log("NeonPulse: Casting unified neon vote");
        
        ebool validatedVote = TFHE.asEbool(encryptedVote, inputProof);
        euint32 votingPower = _getVotingPower(msg.sender);
        
        // Add weighted vote based on voter rank and encrypted choice
        euint32 yesWeight = TFHE.select(validatedVote, votingPower, TFHE.asEuint32(0));
        euint32 noWeight = TFHE.select(validatedVote.not(), votingPower, TFHE.asEuint32(0));
        
        encryptedNeonYesVotes = encryptedNeonYesVotes.add(yesWeight);
        encryptedNeonNoVotes = encryptedNeonNoVotes.add(noWeight);
        
        // Update participation tracking
        totalLuminousParticipation = totalLuminousParticipation.add(TFHE.asEuint32(1));
        hasNeonVoted[msg.sender] = true;
        neonVotingHistory[msg.sender]++;
        totalNeonVoters++;
        
        // Potentially upgrade voter rank based on participation
        _upgradeVoterRank(msg.sender);
        
        emit NeonVoteCasted(msg.sender, voterRanks[msg.sender], currentPhase, block.timestamp);
        
        // Check if we should advance to pulse validation
        _checkLuminousValidationProgress();
    }

    /**
     * @notice Request neon vote decryption after voting ends
     */
    function requestNeonDecryption() 
        external 
        validNeonPhase(NeonVotingPhase.NeonConsensus)
    {
        require(block.timestamp > luminousDeadline, "NeonPulse: Neon voting still in progress");
        console.log("NeonPulse: Requesting neon vote decryption");
        
        // In a real implementation, this would trigger the decryption oracle
        currentPhase = NeonVotingPhase.IlluminatedResolution;
        
        emit NeonConsensusAchieved(msg.sender, totalNeonVoters, totalNeonVoters, block.timestamp);
    }

    // ============ NEON PULSE VIEW FUNCTIONS ============
    
    /**
     * @notice Get neon proposal information
     * @return proposal The neon proposal text
     * @return deadline Luminous voting deadline
     * @return phase Current neon voting phase
     * @return userHasVoted Whether caller has voted
     */
    function getNeonProposalInfo() 
        external 
        view 
        returns (
            string memory proposal, 
            uint256 deadline, 
            NeonVotingPhase phase, 
            bool userHasVoted
        ) 
    {
        return (neonProposal, luminousDeadline, currentPhase, hasNeonVoted[msg.sender]);
    }
    
    /**
     * @notice Get encrypted neon vote counts
     * @return encryptedYes Encrypted YES vote count
     * @return encryptedNo Encrypted NO vote count
     */
    function getEncryptedNeonVotes() 
        external 
        view 
        returns (euint32 encryptedYes, euint32 encryptedNo) 
    {
        return (encryptedNeonYesVotes, encryptedNeonNoVotes);
    }
    
    /**
     * @notice Get voter information
     * @param voter Address of the voter
     * @return rank Voter rank
     * @return votingHistory Number of votes cast
     * @return hasVoted Whether voter has voted in current proposal
     */
    function getVoterInfo(address voter) 
        external 
        view 
        returns (VoterRank rank, uint256 votingHistory, bool hasVoted) 
    {
        return (voterRanks[voter], neonVotingHistory[voter], hasNeonVoted[voter]);
    }
    
    /**
     * @notice Get current neon voting statistics
     * @return totalVoters Total number of neon voters
     * @return phase Current voting phase
     * @return isActive Whether voting is currently active
     * @return timeRemaining Time remaining for voting
     */
    function getNeonVotingStats() 
        external 
        view 
        returns (
            uint256 totalVoters, 
            NeonVotingPhase phase, 
            bool isActive, 
            uint256 timeRemaining
        ) 
    {
        uint256 remaining = block.timestamp >= luminousDeadline ? 0 : luminousDeadline - block.timestamp;
        return (totalNeonVoters, currentPhase, neonVotingActive, remaining);
    }

    // ============ NEON PULSE ADMIN FUNCTIONS ============
    
    /**
     * @notice Authorize a voter and set their rank
     * @param voter Address to authorize
     * @param rank Voter rank to assign
     */
    function authorizeNeonVoter(address voter, VoterRank rank) 
        external 
    {
        require(msg.sender == proposalCreator, "NeonPulse: Only proposal creator can authorize");
        require(rank != VoterRank.NeonCouncil || voterRanks[msg.sender] == VoterRank.NeonCouncil, 
                "NeonPulse: Cannot assign NeonCouncil rank");
        
        voterRanks[voter] = rank;
        personalVotingPower[voter] = TFHE.asEuint32(_getRankVotingPower(rank));
        
        console.log("NeonPulse: Authorized neon voter with rank");
    }
    
    /**
     * @notice Emergency neon shutdown
     */
    function emergencyNeonShutdown() external {
        require(voterRanks[msg.sender] == VoterRank.LuminousGuard || 
                voterRanks[msg.sender] == VoterRank.NeonCouncil ||
                msg.sender == proposalCreator, 
                "NeonPulse: Unauthorized emergency shutdown");
        
        emergencyNeonShutdown = true;
        neonVotingActive = false;
        currentPhase = NeonVotingPhase.IlluminatedResolution;
        
        console.log("NeonPulse: Emergency neon shutdown activated");
        
        emit NeonVotingResolved(neonProposal, false, totalNeonVoters, block.timestamp);
    }

    // ============ INTERNAL NEON PULSE LOGIC ============
    
    /**
     * @dev Get voting power based on voter rank
     */
    function _getVotingPower(address voter) private view returns (euint32) {
        if (personalVotingPower[voter].unwrap() != 0) {
            return personalVotingPower[voter];
        }
        
        uint8 rankPower = _getRankVotingPower(voterRanks[voter]);
        return TFHE.asEuint32(rankPower);
    }
    
    /**
     * @dev Get base voting power for rank
     */
    function _getRankVotingPower(VoterRank rank) private pure returns (uint8) {
        if (rank == VoterRank.NeonCouncil) return 7;
        if (rank == VoterRank.LuminousGuard) return 5;
        if (rank == VoterRank.PulseAdept) return 4;
        if (rank == VoterRank.NeonVoter) return 2;
        return 1; // Newcomer
    }
    
    /**
     * @dev Upgrade voter rank based on participation
     */
    function _upgradeVoterRank(address voter) private {
        uint256 history = neonVotingHistory[voter];
        VoterRank currentRank = voterRanks[voter];
        
        if (history >= 30 && currentRank == VoterRank.PulseAdept) {
            voterRanks[voter] = VoterRank.LuminousGuard;
            personalVotingPower[voter] = TFHE.asEuint32(5);
        } else if (history >= 15 && currentRank == VoterRank.NeonVoter) {
            voterRanks[voter] = VoterRank.PulseAdept;
            personalVotingPower[voter] = TFHE.asEuint32(4);
        } else if (history >= 8 && currentRank == VoterRank.Newcomer) {
            voterRanks[voter] = VoterRank.NeonVoter;
            personalVotingPower[voter] = TFHE.asEuint32(2);
        }
    }
    
    /**
     * @dev Check if we should advance to luminous validation phase
     */
    function _checkLuminousValidationProgress() private {
        if (totalNeonVoters >= 15 && currentPhase == NeonVotingPhase.LuminousVoting) {
            currentPhase = NeonVotingPhase.PulseValidation;
            emit LuminousValidationReached(currentPhase, totalNeonVoters, block.timestamp);
        }
        
        if (totalNeonVoters >= 35 && currentPhase == NeonVotingPhase.PulseValidation) {
            currentPhase = NeonVotingPhase.NeonConsensus;
            emit LuminousValidationReached(currentPhase, totalNeonVoters, block.timestamp);
        }
    }
}