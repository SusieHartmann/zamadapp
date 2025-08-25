// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "hardhat/console.sol";
import "fhevm/lib/TFHE.sol";
import "fhevm/abstracts/EIP712WithModifier.sol";

/**
 * @title NeonPulseFHECounter
 * @notice Neon Pulse themed encrypted counter with pulsating energy levels
 * @dev Advanced FHEVM counter showcasing neon pulse technology
 */
contract NeonPulseFHECounter is EIP712WithModifier {
    using TFHE for euint32;
    using TFHE for ebool;

    // ============ NEON PULSE COUNTER ENUMS ============
    
    enum PulseLevel { 
        Dormant, 
        Flickering, 
        Glowing, 
        Pulsating, 
        NeonStorm
    }
    
    enum EnergyState {
        Inactive, 
        Charging, 
        Active, 
        Overdrive, 
        NeonSingularity
    }

    // ============ NEON PULSE COUNTER STATE ============
    
    PulseLevel public currentPulseLevel;
    EnergyState public currentEnergyState;
    address public neonPulseOperator;
    bool public emergencyPulseShutdown;
    uint256 public lastNeonActivity;
    uint256 public totalPulseOperations;
    
    euint32 private neonCounter;
    euint32 private pulseEnergy;
    euint32 private neonAmplifier;
    
    mapping(address => bool) public authorizedPulseOperators;
    mapping(address => uint256) public pulseOperationCount;
    mapping(address => euint32) private personalNeonReserve;

    // ============ NEON PULSE COUNTER EVENTS ============
    
    event NeonPulseActivated(
        address indexed operator, 
        PulseLevel newLevel, 
        uint256 energyAmount, 
        uint256 timestamp
    );
    
    event PulseEnergyCharged(
        address indexed charger, 
        uint256 chargeAmount, 
        EnergyState newState, 
        uint256 timestamp
    );
    
    event NeonCounterUpdated(
        address indexed updater, 
        PulseLevel pulseLevel, 
        uint256 operationCount, 
        uint256 timestamp
    );
    
    event EmergencyPulseShutdown(
        address indexed initiator, 
        PulseLevel finalLevel, 
        uint256 timestamp
    );

    // ============ NEON PULSE COUNTER MODIFIERS ============
    
    modifier onlyAuthorizedPulseOperator() {
        require(
            authorizedPulseOperators[msg.sender] || msg.sender == neonPulseOperator, 
            "NeonPulse: Unauthorized pulse operator access"
        );
        _;
    }
    
    modifier onlyActivePulse() {
        require(!emergencyPulseShutdown, "NeonPulse: Emergency pulse shutdown active");
        require(currentEnergyState != EnergyState.Inactive, "NeonPulse: Neon energy inactive");
        _;
    }
    
    modifier validPulseState(EnergyState requiredState) {
        require(
            uint8(currentEnergyState) >= uint8(requiredState), 
            "NeonPulse: Insufficient energy state"
        );
        _;
    }

    // ============ CONSTRUCTOR ============
    
    constructor() EIP712WithModifier("NeonPulseFHECounter", "1") {
        console.log("NeonPulse: Initializing neon pulse FHE counter");
        
        neonPulseOperator = msg.sender;
        authorizedPulseOperators[msg.sender] = true;
        
        currentPulseLevel = PulseLevel.Dormant;
        currentEnergyState = EnergyState.Inactive;
        emergencyPulseShutdown = false;
        lastNeonActivity = block.timestamp;
        totalPulseOperations = 0;
        
        neonCounter = TFHE.asEuint32(42); // Starting with 42 neon units
        pulseEnergy = TFHE.asEuint32(100);
        neonAmplifier = TFHE.asEuint32(3);
        
        console.log("NeonPulse: Neon pulse counter initialized with pulsating energy");
    }

    // ============ CORE NEON PULSE COUNTER FUNCTIONS ============
    
    /**
     * @notice Activate neon pulse and increment counter
     * @param encryptedValue Encrypted value to add to neon counter  
     * @param inputProof Proof for encrypted input validation
     */
    function activateNeonPulse(
        externalEuint32 encryptedValue, 
        bytes calldata inputProof
    ) 
        external 
        onlyAuthorizedPulseOperator 
        onlyActivePulse
    {
        console.log("NeonPulse: Activating neon pulse energy");
        
        euint32 validatedValue = TFHE.asEuint32(encryptedValue, inputProof);
        
        // Amplify the neon pulse
        euint32 amplifiedValue = validatedValue.mul(neonAmplifier);
        neonCounter = neonCounter.add(amplifiedValue);
        
        // Charge pulse energy
        euint32 energyBoost = validatedValue.div(TFHE.asEuint32(2));
        pulseEnergy = pulseEnergy.add(energyBoost);
        
        // Update pulse level based on energy
        _updatePulseLevel();
        
        totalPulseOperations++;
        pulseOperationCount[msg.sender]++;
        lastNeonActivity = block.timestamp;
        
        emit NeonPulseActivated(
            msg.sender, 
            currentPulseLevel, 
            totalPulseOperations, 
            block.timestamp
        );
        
        emit PulseEnergyCharged(
            msg.sender, 
            pulseOperationCount[msg.sender], 
            currentEnergyState, 
            block.timestamp
        );
    }
    
    /**
     * @notice Drain neon pulse and decrement counter
     * @param encryptedValue Encrypted value to subtract from neon counter
     * @param inputProof Proof for encrypted input validation
     */
    function drainNeonPulse(
        externalEuint32 encryptedValue, 
        bytes calldata inputProof
    ) 
        external 
        onlyAuthorizedPulseOperator 
        validPulseState(EnergyState.Charging)
    {
        console.log("NeonPulse: Draining neon pulse energy");
        
        euint32 validatedValue = TFHE.asEuint32(encryptedValue, inputProof);
        
        // Check if we have enough neon energy to drain
        ebool canDrain = neonCounter.gte(validatedValue);
        neonCounter = TFHE.select(canDrain, neonCounter.sub(validatedValue), neonCounter);
        
        // Consume pulse energy for drain operation
        euint32 energyCost = validatedValue.div(TFHE.asEuint32(3));
        ebool canAfford = pulseEnergy.gte(energyCost);
        pulseEnergy = TFHE.select(canAfford, pulseEnergy.sub(energyCost), pulseEnergy);
        
        _updatePulseLevel();
        
        totalPulseOperations++;
        pulseOperationCount[msg.sender]++;
        lastNeonActivity = block.timestamp;
        
        emit NeonCounterUpdated(
            msg.sender, 
            currentPulseLevel, 
            totalPulseOperations, 
            block.timestamp
        );
    }

    // ============ NEON PULSE VIEW FUNCTIONS ============
    
    /**
     * @notice Get current pulse level
     * @return Current pulse level
     */
    function getPulseLevel() external view returns (PulseLevel) {
        return currentPulseLevel;
    }
    
    /**
     * @notice Get current energy state
     * @return Current energy state
     */
    function getEnergyState() external view returns (EnergyState) {
        return currentEnergyState;
    }
    
    /**
     * @notice Get encrypted neon counter
     * @return Encrypted neon counter value
     */
    function getNeonCounter() external view returns (euint32) {
        return neonCounter;
    }
    
    /**
     * @notice Get encrypted pulse energy
     * @return Encrypted pulse energy level
     */
    function getPulseEnergy() external view returns (euint32) {
        return pulseEnergy;
    }
    
    /**
     * @notice Get operator information
     * @param operator Address of the operator
     * @return isAuthorized Whether operator is authorized
     * @return operationCount Number of operations performed
     */
    function getOperatorInfo(address operator) 
        external 
        view 
        returns (bool isAuthorized, uint256 operationCount) 
    {
        return (authorizedPulseOperators[operator], pulseOperationCount[operator]);
    }
    
    /**
     * @notice Get comprehensive neon pulse statistics
     * @return pulseLevel Current pulse level
     * @return energyState Current energy state  
     * @return totalOperations Total pulse operations performed
     * @return lastActivity Timestamp of last activity
     * @return shutdownActive Whether emergency shutdown is active
     */
    function getNeonPulseStats() 
        external 
        view 
        returns (
            PulseLevel pulseLevel, 
            EnergyState energyState, 
            uint256 totalOperations, 
            uint256 lastActivity, 
            bool shutdownActive
        ) 
    {
        return (
            currentPulseLevel, 
            currentEnergyState, 
            totalPulseOperations, 
            lastNeonActivity, 
            emergencyPulseShutdown
        );
    }

    // ============ NEON PULSE ADMIN FUNCTIONS ============
    
    /**
     * @notice Authorize a new pulse operator
     * @param operator Address to authorize
     */
    function authorizePulseOperator(address operator) external {
        require(msg.sender == neonPulseOperator, "NeonPulse: Only operator can authorize");
        authorizedPulseOperators[operator] = true;
        console.log("NeonPulse: Authorized new pulse operator");
    }
    
    /**
     * @notice Emergency neon pulse shutdown
     */
    function emergencyNeonShutdown() external {
        require(
            msg.sender == neonPulseOperator || authorizedPulseOperators[msg.sender], 
            "NeonPulse: Unauthorized emergency shutdown"
        );
        
        emergencyPulseShutdown = true;
        currentEnergyState = EnergyState.Inactive;
        currentPulseLevel = PulseLevel.Dormant;
        
        console.log("NeonPulse: Emergency neon shutdown activated");
        
        emit EmergencyPulseShutdown(msg.sender, currentPulseLevel, block.timestamp);
    }
    
    /**
     * @notice Supercharge neon pulse with enhanced energy
     * @param encryptedValue Encrypted value to supercharge neon counter
     * @param inputProof Proof for encrypted input validation
     */
    function superchargeNeonPulse(
        externalEuint32 encryptedValue, 
        bytes calldata inputProof
    ) 
        external 
        onlyAuthorizedPulseOperator 
        validPulseState(EnergyState.Active)
    {
        console.log("NeonPulse: Initiating supercharge sequence");
        
        euint32 validatedValue = TFHE.asEuint32(encryptedValue, inputProof);
        
        // Supercharge multiplier based on consecutive operations
        uint256 consecutiveOps = pulseOperationCount[msg.sender];
        euint32 superchargeMultiplier = TFHE.asEuint32(_getSuperchargeMultiplier(consecutiveOps));
        
        euint32 superchargedValue = validatedValue.mul(superchargeMultiplier);
        neonCounter = neonCounter.add(superchargedValue);
        
        // Massive energy boost for supercharge
        euint32 megaBoost = validatedValue.mul(TFHE.asEuint32(3));
        pulseEnergy = pulseEnergy.add(megaBoost);
        
        // Update states
        _updatePulseLevel();
        totalPulseOperations += 3; // Supercharge counts as 3 operations
        pulseOperationCount[msg.sender] += 3;
        lastNeonActivity = block.timestamp;
        
        emit NeonPulseActivated(
            msg.sender, 
            currentPulseLevel, 
            totalPulseOperations, 
            block.timestamp
        );
    }
    
    /**
     * @notice Get dynamic amplifier based on energy state
     * @return Dynamic amplifier value
     */
    function getDynamicAmplifier() external view returns (uint256) {
        return _calculateDynamicAmplifier();
    }
    
    /**
     * @notice Get energy boost for current pulse level
     * @return Energy boost value
     */
    function getEnergyBoost() external view returns (uint256) {
        return _calculateEnergyBoost();
    }
    
    /**
     * @notice Reactivate neon pulse system
     */
    function reactivateNeonPulse() external {
        require(msg.sender == neonPulseOperator, "NeonPulse: Only operator can reactivate");
        
        emergencyPulseShutdown = false;
        currentEnergyState = EnergyState.Charging;
        currentPulseLevel = PulseLevel.Flickering;
        
        console.log("NeonPulse: Neon pulse system reactivated");
    }

    // ============ INTERNAL NEON PULSE LOGIC ============
    
    /**
     * @dev Update pulse level based on current activity and energy
     */
    function _updatePulseLevel() private {
        if (emergencyPulseShutdown) {
            currentPulseLevel = PulseLevel.Dormant;
            currentEnergyState = EnergyState.Inactive;
            return;
        }
        
        if (totalPulseOperations >= 500) {
            currentPulseLevel = PulseLevel.NeonStorm;
            currentEnergyState = EnergyState.NeonSingularity;
        } else if (totalPulseOperations >= 200) {
            currentPulseLevel = PulseLevel.Pulsating;
            currentEnergyState = EnergyState.Overdrive;
        } else if (totalPulseOperations >= 50) {
            currentPulseLevel = PulseLevel.Glowing;
            currentEnergyState = EnergyState.Active;
        } else if (totalPulseOperations >= 10) {
            currentPulseLevel = PulseLevel.Flickering;
            currentEnergyState = EnergyState.Charging;
        } else {
            currentPulseLevel = PulseLevel.Dormant;
            currentEnergyState = EnergyState.Inactive;
        }
    }
    
    /**
     * @dev Calculate dynamic amplifier based on energy state
     */
    function _calculateDynamicAmplifier() private view returns (uint256) {
        if (currentEnergyState == EnergyState.NeonSingularity) return 10;
        if (currentEnergyState == EnergyState.Overdrive) return 7;
        if (currentEnergyState == EnergyState.Active) return 5;
        if (currentEnergyState == EnergyState.Charging) return 3;
        return 1; // Inactive
    }
    
    /**
     * @dev Calculate energy boost for current pulse level
     */
    function _calculateEnergyBoost() private view returns (uint256) {
        if (currentPulseLevel == PulseLevel.NeonStorm) return 25;
        if (currentPulseLevel == PulseLevel.Pulsating) return 15;
        if (currentPulseLevel == PulseLevel.Glowing) return 10;
        if (currentPulseLevel == PulseLevel.Flickering) return 5;
        return 1; // Dormant
    }
    
    /**
     * @dev Get supercharge multiplier based on consecutive operations
     */
    function _getSuperchargeMultiplier(uint256 consecutiveOps) private pure returns (uint256) {
        if (consecutiveOps >= 100) return 8;
        if (consecutiveOps >= 50) return 6;
        if (consecutiveOps >= 25) return 4;
        if (consecutiveOps >= 10) return 3;
        return 2; // Minimum supercharge multiplier
    }
}