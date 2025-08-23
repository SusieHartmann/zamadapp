// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PrivacyPad
 * @dev Privacy-focused launchpad platform using FHE-like encrypted contributions
 * @notice This contract simulates FHE functionality for private fundraising
 */
contract PrivacyPad is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;

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
        mapping(address => uint256) contributions;
        mapping(address => bool) hasContributed;
        address[] contributors;
    }

    struct EncryptedContribution {
        address contributor;
        uint256 campaignId;
        bytes32 encryptedAmount; // Simulated encrypted amount
        uint256 timestamp;
        bool isRevealed;
    }

    Counters.Counter private _campaignIds;
    Counters.Counter private _contributionIds;

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => EncryptedContribution) public encryptedContributions;
    mapping(address => uint256[]) public userCampaigns;
    mapping(address => uint256[]) public userContributions;

    // Platform fee (2%)
    uint256 public constant PLATFORM_FEE = 200; // 2% in basis points
    uint256 public constant BASIS_POINTS = 10000;

    // Events
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 targetAmount,
        uint256 deadline
    );

    event EncryptedContributionMade(
        uint256 indexed contributionId,
        uint256 indexed campaignId,
        address indexed contributor,
        bytes32 encryptedAmount,
        uint256 timestamp
    );

    event ContributionRevealed(
        uint256 indexed contributionId,
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 actualAmount
    );

    event CampaignFinalized(
        uint256 indexed campaignId,
        uint256 totalRaised,
        uint256 contributorCount,
        bool successful
    );

    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount
    );

    constructor() {}

    /**
     * @dev Create a new fundraising campaign
     */
    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _targetAmount,
        uint256 _durationInDays
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_targetAmount > 0, "Target amount must be greater than 0");
        require(_durationInDays > 0, "Duration must be greater than 0");

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

        userCampaigns[msg.sender].push(campaignId);

        emit CampaignCreated(
            campaignId,
            msg.sender,
            _title,
            _targetAmount,
            campaign.deadline
        );

        return campaignId;
    }

    /**
     * @dev Make an encrypted contribution to a campaign
     */
    function makeEncryptedContribution(
        uint256 _campaignId,
        bytes32 _encryptedAmount
    ) external payable nonReentrant {
        require(msg.value > 0, "Contribution must be greater than 0");
        require(campaigns[_campaignId].isActive, "Campaign is not active");
        require(
            block.timestamp < campaigns[_campaignId].deadline,
            "Campaign has ended"
        );
        require(
            !campaigns[_campaignId].isFinalized,
            "Campaign is already finalized"
        );

        _contributionIds.increment();
        uint256 contributionId = _contributionIds.current();

        encryptedContributions[contributionId] = EncryptedContribution({
            contributor: msg.sender,
            campaignId: _campaignId,
            encryptedAmount: _encryptedAmount,
            timestamp: block.timestamp,
            isRevealed: false
        });

        userContributions[msg.sender].push(contributionId);

        emit EncryptedContributionMade(
            contributionId,
            _campaignId,
            msg.sender,
            _encryptedAmount,
            block.timestamp
        );
    }

    /**
     * @dev Reveal an encrypted contribution (simulating FHE decryption)
     */
    function revealContribution(
        uint256 _contributionId,
        uint256 _actualAmount
    ) external {
        EncryptedContribution storage contribution = encryptedContributions[_contributionId];
        
        require(
            contribution.contributor == msg.sender,
            "Only contributor can reveal"
        );
        require(!contribution.isRevealed, "Contribution already revealed");
        require(_actualAmount > 0, "Amount must be greater than 0");

        Campaign storage campaign = campaigns[contribution.campaignId];
        require(campaign.isActive, "Campaign is not active");

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

        emit ContributionRevealed(
            _contributionId,
            contribution.campaignId,
            msg.sender,
            _actualAmount
        );
    }

    /**
     * @dev Finalize a campaign after the deadline
     */
    function finalizeCampaign(uint256 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(campaign.isActive, "Campaign is not active");
        require(
            block.timestamp >= campaign.deadline,
            "Campaign has not ended yet"
        );
        require(!campaign.isFinalized, "Campaign already finalized");

        campaign.isActive = false;
        campaign.isFinalized = true;

        bool successful = campaign.totalRaised >= campaign.targetAmount;

        emit CampaignFinalized(
            _campaignId,
            campaign.totalRaised,
            campaign.contributorCount,
            successful
        );
    }

    /**
     * @dev Withdraw funds from a successful campaign
     */
    function withdrawFunds(uint256 _campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(campaign.creator == msg.sender, "Only creator can withdraw");
        require(campaign.isFinalized, "Campaign not finalized");
        require(
            campaign.totalRaised >= campaign.targetAmount,
            "Campaign did not reach target"
        );
        require(address(this).balance >= campaign.totalRaised, "Insufficient balance");

        uint256 platformFee = (campaign.totalRaised * PLATFORM_FEE) / BASIS_POINTS;
        uint256 creatorAmount = campaign.totalRaised - platformFee;

        // Reset campaign funds to prevent re-withdrawal
        campaign.totalRaised = 0;

        // Transfer funds
        if (platformFee > 0) {
            payable(owner()).transfer(platformFee);
        }
        payable(msg.sender).transfer(creatorAmount);

        emit FundsWithdrawn(_campaignId, msg.sender, creatorAmount);
    }

    /**
     * @dev Refund contributors if campaign fails
     */
    function refundContributor(uint256 _campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(campaign.isFinalized, "Campaign not finalized");
        require(
            campaign.totalRaised < campaign.targetAmount,
            "Campaign was successful"
        );
        require(campaign.hasContributed[msg.sender], "No contribution found");
        
        uint256 refundAmount = campaign.contributions[msg.sender];
        require(refundAmount > 0, "No refund available");

        // Reset contribution to prevent double refund
        campaign.contributions[msg.sender] = 0;

        payable(msg.sender).transfer(refundAmount);
    }

    // View functions
    function getCampaign(uint256 _campaignId) external view returns (
        uint256 id,
        address creator,
        string memory title,
        string memory description,
        uint256 targetAmount,
        uint256 deadline,
        uint256 totalRaised,
        uint256 contributorCount,
        bool isActive,
        bool isFinalized
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
            campaign.isFinalized
        );
    }

    function getUserCampaigns(address _user) external view returns (uint256[] memory) {
        return userCampaigns[_user];
    }

    function getUserContributions(address _user) external view returns (uint256[] memory) {
        return userContributions[_user];
    }

    function getCampaignContributors(uint256 _campaignId) external view returns (address[] memory) {
        return campaigns[_campaignId].contributors;
    }

    function getTotalCampaigns() external view returns (uint256) {
        return _campaignIds.current();
    }

    function getTotalContributions() external view returns (uint256) {
        return _contributionIds.current();
    }

    // Emergency functions
    function pause() external onlyOwner {
        // Implementation for emergency pause
    }

    receive() external payable {
        // Accept direct ETH deposits
    }
}