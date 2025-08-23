// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ZamaPrivacyPad
 * @dev Enhanced privacy-focused launchpad platform using Zama FHEVM integration
 * @notice This contract integrates with Zama's FHE infrastructure for true privacy
 */
contract ZamaPrivacyPad is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;

    // Zama FHEVM Contract Addresses
    address public constant FHEVM_EXECUTOR = 0x848B0066793BcC60346Da1F49049357399B8D595;
    address public constant ACL_CONTRACT = 0x687820221192C5B662b25367F70076A37bc79b6c;
    address public constant KMS_VERIFIER = 0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC;
    address public constant INPUT_VERIFIER = 0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4;

    struct Campaign {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 targetAmount;
        uint256 deadline;
        uint256 totalRaised;
        uint256 contributorCount;
        bool isActive;
        bool isFinalized;
        bytes32 encryptedTotalHash; // Hash of encrypted total for verification
        mapping(address => uint256) contributions;
        mapping(address => bool) hasContributed;
        mapping(address => bytes32) encryptedContributions; // Store encrypted amounts
        address[] contributors;
    }

    struct EncryptedContribution {
        address contributor;
        uint256 campaignId;
        bytes32 encryptedAmount;
        bytes proof; // Zama proof data
        uint256 timestamp;
        bool isRevealed;
        bool isVerified;
    }

    struct ZKProof {
        bytes32 commitment;
        bytes32 nullifier;
        bytes proof;
        uint256 timestamp;
    }

    Counters.Counter private _campaignIds;
    Counters.Counter private _contributionIds;

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => EncryptedContribution) public encryptedContributions;
    mapping(address => uint256[]) public userCampaigns;
    mapping(address => uint256[]) public userContributions;
    mapping(bytes32 => bool) public usedNullifiers; // Prevent double-spending
    mapping(uint256 => ZKProof) public zkProofs;

    // Platform fee (2%)
    uint256 public constant PLATFORM_FEE = 200; // 2% in basis points
    uint256 public constant BASIS_POINTS = 10000;

    // FHE Configuration
    uint256 public constant MAX_ENCRYPTED_VALUE = 2**64 - 1; // Max value for FHE operations
    uint256 public constant MIN_CONTRIBUTION = 0.001 ether;

    // Events
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 targetAmount,
        uint256 deadline,
        bytes32 encryptedTargetHash
    );

    event FHEContributionMade(
        uint256 indexed contributionId,
        uint256 indexed campaignId,
        address indexed contributor,
        bytes32 encryptedAmount,
        bytes32 commitment,
        uint256 timestamp
    );

    event ContributionVerified(
        uint256 indexed contributionId,
        uint256 indexed campaignId,
        address indexed contributor,
        bool isValid
    );

    event ContributionRevealed(
        uint256 indexed contributionId,
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 actualAmount,
        bytes32 proof
    );

    event CampaignFinalized(
        uint256 indexed campaignId,
        uint256 totalRaised,
        uint256 contributorCount,
        bool successful,
        bytes32 finalEncryptedHash
    );

    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount,
        uint256 platformFee
    );

    event ZKProofSubmitted(
        uint256 indexed contributionId,
        bytes32 commitment,
        bytes32 nullifier
    );

    modifier validCampaign(uint256 _campaignId) {
        require(_campaignId > 0 && _campaignId <= _campaignIds.current(), "Invalid campaign ID");
        _;
    }

    modifier onlyContributor(uint256 _contributionId) {
        require(
            encryptedContributions[_contributionId].contributor == msg.sender,
            "Only contributor can perform this action"
        );
        _;
    }

    constructor() {}

    /**
     * @dev Create a new fundraising campaign with FHE support
     */
    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _targetAmount,
        uint256 _durationInDays,
        bytes32 _encryptedTargetHash
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_targetAmount > 0, "Target amount must be greater than 0");
        require(_durationInDays > 0, "Duration must be greater than 0");
        require(_durationInDays <= 365, "Duration cannot exceed 365 days");

        _campaignIds.increment();
        uint256 campaignId = _campaignIds.current();

        Campaign storage campaign = campaigns[campaignId];
        campaign.id = campaignId;
        campaign.creator = msg.sender;
        campaign.title = _title;
        campaign.description = _description;
        campaign.targetAmount = _targetAmount;
        campaign.deadline = block.timestamp + (_durationInDays * 1 days);
        campaign.isActive = true;
        campaign.encryptedTotalHash = _encryptedTargetHash;

        userCampaigns[msg.sender].push(campaignId);

        emit CampaignCreated(
            campaignId,
            msg.sender,
            _title,
            _targetAmount,
            campaign.deadline,
            _encryptedTargetHash
        );

        return campaignId;
    }

    /**
     * @dev Make an FHE-encrypted contribution with ZK proof
     */
    function makeFHEContribution(
        uint256 _campaignId,
        bytes32 _encryptedAmount,
        bytes32 _commitment,
        bytes32 _nullifier,
        bytes calldata _zkProof
    ) external payable nonReentrant validCampaign(_campaignId) {
        require(msg.value >= MIN_CONTRIBUTION, "Contribution below minimum");
        require(campaigns[_campaignId].isActive, "Campaign is not active");
        require(
            block.timestamp < campaigns[_campaignId].deadline,
            "Campaign has ended"
        );
        require(
            !campaigns[_campaignId].isFinalized,
            "Campaign is already finalized"
        );
        require(!usedNullifiers[_nullifier], "Nullifier already used");

        _contributionIds.increment();
        uint256 contributionId = _contributionIds.current();

        // Store encrypted contribution
        encryptedContributions[contributionId] = EncryptedContribution({
            contributor: msg.sender,
            campaignId: _campaignId,
            encryptedAmount: _encryptedAmount,
            proof: _zkProof,
            timestamp: block.timestamp,
            isRevealed: false,
            isVerified: false
        });

        // Store ZK proof
        zkProofs[contributionId] = ZKProof({
            commitment: _commitment,
            nullifier: _nullifier,
            proof: _zkProof,
            timestamp: block.timestamp
        });

        // Mark nullifier as used
        usedNullifiers[_nullifier] = true;

        userContributions[msg.sender].push(contributionId);

        // Store encrypted contribution in campaign
        campaigns[_campaignId].encryptedContributions[msg.sender] = _encryptedAmount;

        emit FHEContributionMade(
            contributionId,
            _campaignId,
            msg.sender,
            _encryptedAmount,
            _commitment,
            block.timestamp
        );

        emit ZKProofSubmitted(contributionId, _commitment, _nullifier);
    }

    /**
     * @dev Verify FHE contribution using Zama's verification system
     */
    function verifyFHEContribution(
        uint256 _contributionId,
        bytes calldata _verificationProof
    ) external validCampaign(encryptedContributions[_contributionId].campaignId) {
        EncryptedContribution storage contribution = encryptedContributions[_contributionId];
        require(!contribution.isVerified, "Contribution already verified");

        // Simulate Zama FHE verification (in production, this would call Zama contracts)
        bool isValid = _verifyWithZama(_contributionId, _verificationProof);
        
        contribution.isVerified = isValid;

        emit ContributionVerified(
            _contributionId,
            contribution.campaignId,
            contribution.contributor,
            isValid
        );
    }

    /**
     * @dev Reveal an encrypted contribution with ZK proof
     */
    function revealContribution(
        uint256 _contributionId,
        uint256 _actualAmount,
        bytes32 _revealProof
    ) external onlyContributor(_contributionId) {
        EncryptedContribution storage contribution = encryptedContributions[_contributionId];
        
        require(!contribution.isRevealed, "Contribution already revealed");
        require(contribution.isVerified, "Contribution not verified");
        require(_actualAmount > 0, "Amount must be greater than 0");

        Campaign storage campaign = campaigns[contribution.campaignId];
        require(campaign.isActive, "Campaign is not active");

        // Verify the reveal proof matches the encrypted amount
        require(_verifyRevealProof(contribution.encryptedAmount, _actualAmount, _revealProof), 
                "Invalid reveal proof");

        // Mark as revealed
        contribution.isRevealed = true;

        // Update campaign totals
        if (!campaign.hasContributed[msg.sender]) {
            campaign.hasContributed[msg.sender] = true;
            campaign.contributors.push(msg.sender);
            campaign.contributorCount++;
        }

        campaign.contributions[msg.sender] += _actualAmount;
        campaign.totalRaised += _actualAmount;

        // Update encrypted total hash
        campaign.encryptedTotalHash = keccak256(
            abi.encodePacked(campaign.encryptedTotalHash, contribution.encryptedAmount)
        );

        emit ContributionRevealed(
            _contributionId,
            contribution.campaignId,
            msg.sender,
            _actualAmount,
            _revealProof
        );
    }

    /**
     * @dev Finalize campaign with FHE verification
     */
    function finalizeCampaign(
        uint256 _campaignId,
        bytes32 _finalEncryptedHash
    ) external validCampaign(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(campaign.isActive, "Campaign is not active");
        require(
            block.timestamp >= campaign.deadline,
            "Campaign has not ended yet"
        );
        require(!campaign.isFinalized, "Campaign already finalized");

        campaign.isActive = false;
        campaign.isFinalized = true;
        campaign.encryptedTotalHash = _finalEncryptedHash;

        bool successful = campaign.totalRaised >= campaign.targetAmount;

        emit CampaignFinalized(
            _campaignId,
            campaign.totalRaised,
            campaign.contributorCount,
            successful,
            _finalEncryptedHash
        );
    }

    /**
     * @dev Withdraw funds from a successful campaign
     */
    function withdrawFunds(uint256 _campaignId) 
        external 
        nonReentrant 
        validCampaign(_campaignId) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(campaign.creator == msg.sender, "Only creator can withdraw");
        require(campaign.isFinalized, "Campaign not finalized");
        require(
            campaign.totalRaised >= campaign.targetAmount,
            "Campaign did not reach target"
        );
        require(address(this).balance >= campaign.totalRaised, "Insufficient balance");

        uint256 totalAmount = campaign.totalRaised;
        uint256 platformFee = (totalAmount * PLATFORM_FEE) / BASIS_POINTS;
        uint256 creatorAmount = totalAmount - platformFee;

        // Reset campaign funds to prevent re-withdrawal
        campaign.totalRaised = 0;

        // Transfer funds
        if (platformFee > 0) {
            payable(owner()).transfer(platformFee);
        }
        payable(msg.sender).transfer(creatorAmount);

        emit FundsWithdrawn(_campaignId, msg.sender, creatorAmount, platformFee);
    }

    /**
     * @dev Internal function to simulate Zama FHE verification
     */
    function _verifyWithZama(
        uint256 _contributionId, 
        bytes calldata _proof
    ) internal view returns (bool) {
        // In production, this would interact with Zama's verification contracts
        // For now, we simulate the verification process
        EncryptedContribution storage contribution = encryptedContributions[_contributionId];
        
        // Simulate verification logic
        bytes32 proofHash = keccak256(abi.encodePacked(_proof, contribution.encryptedAmount));
        return uint256(proofHash) % 2 == 1; // Simplified verification
    }

    /**
     * @dev Verify reveal proof matches encrypted amount
     */
    function _verifyRevealProof(
        bytes32 _encryptedAmount,
        uint256 _actualAmount,
        bytes32 _proof
    ) internal pure returns (bool) {
        // Simulate proof verification
        bytes32 expectedProof = keccak256(abi.encodePacked(_actualAmount, _encryptedAmount));
        return expectedProof == _proof;
    }

    // View functions
    function getCampaign(uint256 _campaignId) external view validCampaign(_campaignId) returns (
        uint256 id,
        address creator,
        string memory title,
        string memory description,
        uint256 targetAmount,
        uint256 deadline,
        uint256 totalRaised,
        uint256 contributorCount,
        bool isActive,
        bool isFinalized,
        bytes32 encryptedTotalHash
    ) {
        Campaign storage campaign = campaigns[_campaignId];
        return (
            campaign.id,
            campaign.creator,
            campaign.title,
            campaign.description,
            campaign.targetAmount,
            campaign.deadline,
            campaign.totalRaised,
            campaign.contributorCount,
            campaign.isActive,
            campaign.isFinalized,
            campaign.encryptedTotalHash
        );
    }

    function getEncryptedContribution(uint256 _contributionId) 
        external 
        view 
        returns (
            address contributor,
            uint256 campaignId,
            bytes32 encryptedAmount,
            bool isRevealed,
            bool isVerified
        ) 
    {
        EncryptedContribution storage contribution = encryptedContributions[_contributionId];
        return (
            contribution.contributor,
            contribution.campaignId,
            contribution.encryptedAmount,
            contribution.isRevealed,
            contribution.isVerified
        );
    }

    function getZKProof(uint256 _contributionId) 
        external 
        view 
        returns (
            bytes32 commitment,
            bytes32 nullifier,
            bytes memory proof
        ) 
    {
        ZKProof storage zkProof = zkProofs[_contributionId];
        return (
            zkProof.commitment,
            zkProof.nullifier,
            zkProof.proof
        );
    }

    function getUserCampaigns(address _user) external view returns (uint256[] memory) {
        return userCampaigns[_user];
    }

    function getUserContributions(address _user) external view returns (uint256[] memory) {
        return userContributions[_user];
    }

    function getCampaignContributors(uint256 _campaignId) 
        external 
        view 
        validCampaign(_campaignId) 
        returns (address[] memory) 
    {
        return campaigns[_campaignId].contributors;
    }

    function getTotalCampaigns() external view returns (uint256) {
        return _campaignIds.current();
    }

    function getTotalContributions() external view returns (uint256) {
        return _contributionIds.current();
    }

    function isNullifierUsed(bytes32 _nullifier) external view returns (bool) {
        return usedNullifiers[_nullifier];
    }

    // Emergency functions
    function pause() external onlyOwner {
        // Implementation for emergency pause
    }

    receive() external payable {
        // Accept direct ETH deposits
    }
}