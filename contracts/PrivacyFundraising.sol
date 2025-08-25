// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";

contract PrivacyFundraising is GatewayCaller {
    struct Project {
        address creator;
        string title;
        string description;
        string category;
        string imageUrl;
        euint64 targetAmount;    // Encrypted target amount
        euint64 currentAmount;   // Encrypted current amount
        uint64 deadline;
        bool active;
        bool targetReached;
        uint256 backersCount;
        mapping(address => euint64) contributions; // Encrypted contributions
    }

    struct ContributionRecord {
        address contributor;
        uint256 projectId;
        uint256 timestamp;
        euint64 amount;
        bool claimed;
    }

    uint256 public nextProjectId = 1;
    mapping(uint256 => Project) public projects;
    mapping(address => uint256[]) public creatorProjects;
    mapping(address => ContributionRecord[]) public contributorRecords;
    
    // Events
    event ProjectCreated(
        uint256 indexed projectId,
        address indexed creator,
        string title,
        uint64 deadline
    );
    
    event ContributionMade(
        uint256 indexed projectId,
        address indexed contributor,
        uint256 timestamp
    );
    
    event ProjectFunded(
        uint256 indexed projectId,
        address indexed creator
    );
    
    event FundsWithdrawn(
        uint256 indexed projectId,
        address indexed creator,
        uint256 amount
    );
    
    event ContributionClaimed(
        uint256 indexed projectId,
        address indexed contributor
    );

    modifier onlyProjectCreator(uint256 _projectId) {
        require(projects[_projectId].creator == msg.sender, "Not project creator");
        _;
    }
    
    modifier projectExists(uint256 _projectId) {
        require(_projectId < nextProjectId && _projectId > 0, "Project does not exist");
        _;
    }
    
    modifier projectActive(uint256 _projectId) {
        require(projects[_projectId].active, "Project not active");
        require(block.timestamp <= projects[_projectId].deadline, "Project deadline passed");
        _;
    }

    function createProject(
        string memory _title,
        string memory _description,
        string memory _category,
        string memory _imageUrl,
        einput _encryptedTarget,
        bytes32 _inputProof,
        uint64 _deadline
    ) external returns (uint256) {
        require(_deadline > block.timestamp, "Deadline must be in future");
        require(bytes(_title).length > 0, "Title required");
        require(bytes(_description).length > 0, "Description required");
        
        euint64 targetAmount = TFHE.asEuint64(_encryptedTarget, _inputProof);
        
        uint256 projectId = nextProjectId++;
        Project storage newProject = projects[projectId];
        
        newProject.creator = msg.sender;
        newProject.title = _title;
        newProject.description = _description;
        newProject.category = _category;
        newProject.imageUrl = _imageUrl;
        newProject.targetAmount = targetAmount;
        newProject.currentAmount = TFHE.asEuint64(0);
        newProject.deadline = _deadline;
        newProject.active = true;
        newProject.targetReached = false;
        newProject.backersCount = 0;
        
        creatorProjects[msg.sender].push(projectId);
        
        emit ProjectCreated(projectId, msg.sender, _title, _deadline);
        return projectId;
    }
    
    function contributeToProject(
        uint256 _projectId,
        einput _encryptedAmount,
        bytes32 _inputProof
    ) external payable projectExists(_projectId) projectActive(_projectId) {
        require(msg.value > 0, "Contribution must be positive");
        
        Project storage project = projects[_projectId];
        euint64 contributionAmount = TFHE.asEuint64(_encryptedAmount, _inputProof);
        
        // Check if this is a new contributor
        if (TFHE.decrypt(project.contributions[msg.sender]) == 0) {
            project.backersCount++;
        }
        
        // Add to contributor's total contribution
        project.contributions[msg.sender] = TFHE.add(
            project.contributions[msg.sender], 
            contributionAmount
        );
        
        // Add to project's current amount
        project.currentAmount = TFHE.add(project.currentAmount, contributionAmount);
        
        // Store contribution record
        contributorRecords[msg.sender].push(ContributionRecord({
            contributor: msg.sender,
            projectId: _projectId,
            timestamp: block.timestamp,
            amount: contributionAmount,
            claimed: false
        }));
        
        // Check if target is reached (requires decryption - would need gateway in production)
        emit ContributionMade(_projectId, msg.sender, block.timestamp);
    }
    
    function withdrawFunds(uint256 _projectId) 
        external 
        projectExists(_projectId) 
        onlyProjectCreator(_projectId) 
    {
        Project storage project = projects[_projectId];
        require(!project.targetReached || block.timestamp > project.deadline, "Cannot withdraw yet");
        
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No funds to withdraw");
        
        project.active = false;
        
        payable(project.creator).transfer(contractBalance);
        emit FundsWithdrawn(_projectId, project.creator, contractBalance);
    }
    
    function getProjectBasicInfo(uint256 _projectId) 
        external 
        view 
        projectExists(_projectId) 
        returns (
            address creator,
            string memory title,
            string memory description,
            string memory category,
            string memory imageUrl,
            uint64 deadline,
            bool active,
            uint256 backersCount
        ) 
    {
        Project storage project = projects[_projectId];
        return (
            project.creator,
            project.title,
            project.description,
            project.category,
            project.imageUrl,
            project.deadline,
            project.active,
            project.backersCount
        );
    }
    
    function getMyContribution(uint256 _projectId) 
        external 
        view 
        projectExists(_projectId) 
        returns (euint64) 
    {
        return projects[_projectId].contributions[msg.sender];
    }
    
    function getMyContributions() external view returns (ContributionRecord[] memory) {
        return contributorRecords[msg.sender];
    }
    
    function getCreatorProjects(address _creator) external view returns (uint256[] memory) {
        return creatorProjects[_creator];
    }
    
    function claimContribution(uint256 _contributionIndex) external {
        require(_contributionIndex < contributorRecords[msg.sender].length, "Invalid contribution index");
        
        ContributionRecord storage record = contributorRecords[msg.sender][_contributionIndex];
        require(!record.claimed, "Already claimed");
        require(record.contributor == msg.sender, "Not your contribution");
        
        Project storage project = projects[record.projectId];
        require(block.timestamp > project.deadline, "Project still active");
        require(!project.targetReached, "Project was successful");
        
        record.claimed = true;
        
        // In a real implementation, you would transfer tokens or ETH back to contributor
        emit ContributionClaimed(record.projectId, msg.sender);
    }
    
    // Function to request decryption of encrypted amounts (using gateway)
    function requestTargetAmountDecryption(uint256 _projectId) 
        external 
        projectExists(_projectId) 
        onlyProjectCreator(_projectId) 
        returns (uint256) 
    {
        Project storage project = projects[_projectId];
        uint256[] memory cts = new uint256[](1);
        cts[0] = Gateway.toUint256(project.targetAmount);
        return Gateway.requestDecryption(cts, this.callbackTargetAmount.selector, 0, block.timestamp + 100, false);
    }
    
    // Callback for target amount decryption
    function callbackTargetAmount(uint256, uint64 decryptedAmount) public onlyGateway {
        // Handle decrypted target amount
        // This is a simplified callback - in production you'd store and use this value
    }
}