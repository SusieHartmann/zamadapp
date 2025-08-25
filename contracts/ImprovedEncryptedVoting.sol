// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "fhevm/lib/TFHE.sol";
import "fhevm/abstracts/EIP712WithModifier.sol";

contract ImprovedEncryptedVoting is EIP712WithModifier {
    struct VotingSession {
        string topic;
        uint256 startTime;
        uint256 deadline;
        euint64 yesVotes;
        euint64 noVotes;
        uint256 totalParticipants;
        VotingStatus status;
        mapping(address => bool) hasVoted;
    }

    enum VotingStatus { 
        Created, 
        Active, 
        Ended, 
        ResultsDecrypted 
    }

    VotingSession public currentVoting;
    address public owner;
    uint64 public decryptedYesVotes;
    uint64 public decryptedNoVotes;
    bool public resultsDecrypted = false;

    event VotingCreated(string topic, uint256 deadline);
    event VoteCasted(address indexed voter);
    event VotingEnded();
    event DecryptionRequested(uint256 requestId);
    event ResultsDecrypted(uint64 yesVotes, uint64 noVotes);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier votingActive() {
        require(currentVoting.status == VotingStatus.Active, "Voting is not active");
        require(block.timestamp <= currentVoting.deadline, "Voting period has ended");
        _;
    }

    constructor() EIP712WithModifier("ImprovedEncryptedVoting", "1") {
        owner = msg.sender;
        _createNewVoting("Should we implement advanced FHE privacy features?", 7 * 24); // 7 days
    }

    function _createNewVoting(string memory _topic, uint256 _durationInHours) private {
        currentVoting.topic = _topic;
        currentVoting.startTime = block.timestamp;
        currentVoting.deadline = block.timestamp + (_durationInHours * 1 hours);
        currentVoting.yesVotes = TFHE.asEuint64(0);
        currentVoting.noVotes = TFHE.asEuint64(0);
        currentVoting.totalParticipants = 0;
        currentVoting.status = VotingStatus.Active;
        
        // Reset results
        resultsDecrypted = false;
        decryptedYesVotes = 0;
        decryptedNoVotes = 0;

        emit VotingCreated(_topic, currentVoting.deadline);
    }

    function createNewVoting(string memory _topic, uint256 _durationInHours) external onlyOwner {
        require(currentVoting.status == VotingStatus.ResultsDecrypted || 
                block.timestamp > currentVoting.deadline, 
                "Previous voting must be completed");
        _createNewVoting(_topic, _durationInHours);
    }

    function extendVoting(uint256 _additionalHours) external onlyOwner {
        require(currentVoting.status == VotingStatus.Active, "No active voting to extend");
        currentVoting.deadline += _additionalHours * 1 hours;
        emit VotingCreated(currentVoting.topic, currentVoting.deadline);
    }

    function vote(bytes32 encryptedVote, bytes calldata inputProof) external votingActive {
        require(!currentVoting.hasVoted[msg.sender], "You have already voted");

        // Convert the encrypted input
        ebool vote = TFHE.asEbool(encryptedVote, inputProof);
        
        // Add vote to appropriate counter
        currentVoting.yesVotes = TFHE.add(currentVoting.yesVotes, TFHE.select(vote, TFHE.asEuint64(1), TFHE.asEuint64(0)));
        currentVoting.noVotes = TFHE.add(currentVoting.noVotes, TFHE.select(vote, TFHE.asEuint64(0), TFHE.asEuint64(1)));
        
        currentVoting.hasVoted[msg.sender] = true;
        currentVoting.totalParticipants++;
        
        emit VoteCasted(msg.sender);
    }

    function voteYes(bytes32 encryptedVote, bytes calldata inputProof) external votingActive {
        require(!currentVoting.hasVoted[msg.sender], "You have already voted");
        
        // For yes vote, we just add 1 to yes votes
        currentVoting.yesVotes = TFHE.add(currentVoting.yesVotes, TFHE.asEuint64(1));
        currentVoting.hasVoted[msg.sender] = true;
        currentVoting.totalParticipants++;
        
        emit VoteCasted(msg.sender);
    }

    function voteNo(bytes32 encryptedVote, bytes calldata inputProof) external votingActive {
        require(!currentVoting.hasVoted[msg.sender], "You have already voted");
        
        // For no vote, we just add 1 to no votes  
        currentVoting.noVotes = TFHE.add(currentVoting.noVotes, TFHE.asEuint64(1));
        currentVoting.hasVoted[msg.sender] = true;
        currentVoting.totalParticipants++;
        
        emit VoteCasted(msg.sender);
    }

    function endVoting() external {
        require(block.timestamp > currentVoting.deadline || msg.sender == owner, 
                "Voting is still active or you're not authorized");
        require(currentVoting.status == VotingStatus.Active, "Voting is not active");
        
        currentVoting.status = VotingStatus.Ended;
        emit VotingEnded();
    }

    function requestVoteDecryption() external {
        require(currentVoting.status == VotingStatus.Ended || 
                block.timestamp > currentVoting.deadline, 
                "Voting must be ended first");
        
        // Request decryption of both vote counts
        TFHE.allowThis(currentVoting.yesVotes);
        TFHE.allowThis(currentVoting.noVotes);
        
        uint256[] memory cts = new uint256[](2);
        cts[0] = TFHE.decrypt(currentVoting.yesVotes);
        cts[1] = TFHE.decrypt(currentVoting.noVotes);
        
        emit DecryptionRequested(1);
    }

    // Simplified decryption callback for testing
    function simulateDecryption() external onlyOwner {
        require(currentVoting.status == VotingStatus.Ended, "Voting must be ended");
        
        decryptedYesVotes = uint64(currentVoting.totalParticipants / 2); // Simplified for demo
        decryptedNoVotes = uint64(currentVoting.totalParticipants - decryptedYesVotes);
        resultsDecrypted = true;
        currentVoting.status = VotingStatus.ResultsDecrypted;
        
        emit ResultsDecrypted(decryptedYesVotes, decryptedNoVotes);
    }

    // View functions
    function getVotingInfo() external view returns (
        string memory topic,
        uint256 deadline,
        VotingStatus currentStatus,
        bool userHasVoted
    ) {
        return (
            currentVoting.topic,
            currentVoting.deadline,
            currentVoting.status,
            currentVoting.hasVoted[msg.sender]
        );
    }

    function getTimeLeft() external view returns (uint256) {
        if (block.timestamp >= currentVoting.deadline) {
            return 0;
        }
        return currentVoting.deadline - block.timestamp;
    }

    function isVotingActive() external view returns (bool) {
        return currentVoting.status == VotingStatus.Active && 
               block.timestamp <= currentVoting.deadline;
    }

    function getResults() external view returns (uint64 yesVotes, uint64 noVotes) {
        require(resultsDecrypted, "Results not yet decrypted");
        return (decryptedYesVotes, decryptedNoVotes);
    }

    function hasVoted(address voter) external view returns (bool) {
        return currentVoting.hasVoted[voter];
    }

    function getTotalParticipants() external view returns (uint256) {
        return currentVoting.totalParticipants;
    }

    function getVotingStats() external view returns (
        uint256 totalVoters,
        VotingStatus status,
        bool isActive,
        uint256 timeRemaining
    ) {
        return (
            currentVoting.totalParticipants,
            currentVoting.status,
            this.isVotingActive(),
            this.getTimeLeft()
        );
    }

    // Emergency functions
    function emergencyStop() external onlyOwner {
        currentVoting.status = VotingStatus.Ended;
        emit VotingEnded();
    }
}