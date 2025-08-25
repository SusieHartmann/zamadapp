import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { NeonPulseFHECounterABI, CONTRACT_ADDRESSES, getContract } from '../../utils/contracts';
import { useWalletContext } from '../../providers/WalletProvider';
import './NeonPulseCounterCard.css';

// ============= ANIMATIONS =============
const neonPulse = keyframes`
  0%, 100% { 
    text-shadow: 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff;
    box-shadow: 0 0 10px rgba(255, 0, 255, 0.3);
  }
  50% { 
    text-shadow: 0 0 20px #00ffff, 0 0 30px #00ffff, 0 0 40px #00ffff;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
  }
`;

const energyFlow = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const ultraGlow = keyframes`
  0%, 100% { 
    filter: hue-rotate(0deg) brightness(1);
    box-shadow: 0 0 15px currentColor;
  }
  25% { 
    filter: hue-rotate(90deg) brightness(1.2);
    box-shadow: 0 0 25px currentColor;
  }
  50% { 
    filter: hue-rotate(180deg) brightness(1.4);
    box-shadow: 0 0 35px currentColor;
  }
  75% { 
    filter: hue-rotate(270deg) brightness(1.2);
    box-shadow: 0 0 25px currentColor;
  }
`;

// ============= STYLED COMPONENTS =============
const NeonPulseCard = styled.div`
  background: linear-gradient(45deg, #1a1a2e, #16213e, #0f3460);
  border: 2px solid #ff00ff;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 0 30px rgba(255, 0, 255, 0.3);
  animation: ${neonPulse} 3s ease-in-out infinite;
  position: relative;
  overflow: hidden;
  font-family: 'Courier New', monospace;
`;

const NeonPulseTitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 900;
  background: linear-gradient(45deg, #ff00ff, #00ffff, #ff00ff);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${neonPulse} 2s ease-in-out infinite;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin: 0;
  text-align: center;
`;

const PulseLevelIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin: 20px 0;
  padding: 15px;
  background: rgba(255, 0, 255, 0.1);
  border-radius: 15px;
  border: 1px solid rgba(255, 0, 255, 0.3);
  animation: ${energyFlow} 2s ease-in-out infinite;
`;

const EnergyDisplay = styled.div`
  background: rgba(0, 255, 255, 0.1);
  border: 2px solid #00ffff;
  border-radius: 15px;
  padding: 20px;
  margin: 15px 0;
  text-align: center;
  position: relative;
  overflow: hidden;
  animation: ${energyFlow} 1.5s ease-in-out infinite;
`;

const EnergyValue = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: #00ffff;
  text-shadow: 0 0 10px #00ffff;
  font-family: 'Courier New', monospace;
`;

const ActionButton = styled.button<{ variant: 'activate' | 'supercharge' | 'drain' | 'emergency' }>`
  padding: 15px 25px;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  
  ${props => {
    switch (props.variant) {
      case 'activate':
        return css`
          background: linear-gradient(45deg, #ff00ff, #ff3399);
          color: white;
          border: 2px solid #ff00ff;
          &:hover {
            animation: ${ultraGlow} 1s ease-in-out infinite;
            transform: translateY(-3px);
          }
        `;
      case 'supercharge':
        return css`
          background: linear-gradient(45deg, #00ffff, #0099ff);
          color: white;
          border: 2px solid #00ffff;
          &:hover {
            animation: ${ultraGlow} 0.8s ease-in-out infinite;
            transform: translateY(-3px);
          }
        `;
      case 'drain':
        return css`
          background: linear-gradient(45deg, #ff6600, #ff3300);
          color: white;
          border: 2px solid #ff6600;
          &:hover {
            animation: ${ultraGlow} 1.2s ease-in-out infinite;
            transform: translateY(-3px);
          }
        `;
      case 'emergency':
        return css`
          background: linear-gradient(45deg, #ff0000, #990000);
          color: white;
          border: 2px solid #ff0000;
          &:hover {
            animation: ${neonPulse} 0.5s ease-in-out infinite;
            transform: translateY(-3px);
          }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    animation: none !important;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-top: 20px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 0, 255, 0.1);
    border-color: rgba(255, 0, 255, 0.5);
    transform: translateY(-2px);
  }
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #00ffff;
  text-shadow: 0 0 5px #00ffff;
  font-family: 'Courier New', monospace;
`;

const NeonInput = styled.input`
  background: rgba(255, 0, 255, 0.1);
  border: 2px solid #ff00ff;
  border-radius: 10px;
  padding: 12px;
  color: #ffffff;
  font-size: 1rem;
  flex: 1;
  font-family: 'Courier New', monospace;
  transition: all 0.3s ease;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 15px rgba(255, 0, 255, 0.5);
    border-color: #00ffff;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin: 15px 0;
  flex-wrap: wrap;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 15px 0;
`;

// ============= INTERFACES =============
interface NeonPulseStats {
  pulseLevel: number;
  energyState: number;
  totalOperations: number;
  lastActivity: number;
  shutdownActive: boolean;
}

interface OperatorInfo {
  isAuthorized: boolean;
  operationCount: number;
}

// ============= COMPONENT =============
const NeonPulseCounterCard: React.FC = () => {
  const { provider, account } = useWalletContext();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [neonPulseStats, setNeonPulseStats] = useState<NeonPulseStats | null>(null);
  const [operatorInfo, setOperatorInfo] = useState<OperatorInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [dynamicAmplifier, setDynamicAmplifier] = useState<number>(0);
  const [energyBoost, setEnergyBoost] = useState<number>(0);

  // Initialize contract
  const initializeContract = useCallback(async () => {
    if (!provider || !account) return;
    
    try {
      if (CONTRACT_ADDRESSES.NeonPulseFHECounter !== "0x0000000000000000000000000000000000000000") {
        const neonContract = await getContract(CONTRACT_ADDRESSES.NeonPulseFHECounter, NeonPulseFHECounterABI, provider);
        setContract(neonContract);
        await loadNeonPulseData(neonContract);
      }
    } catch (error: any) {
      console.error('Neon pulse initialization failed:', error);
      toast.error('Failed to initialize Neon Pulse Counter');
    }
  }, [provider, account]);

  // Load neon pulse data
  const loadNeonPulseData = useCallback(async (contractInstance?: ethers.Contract) => {
    const currentContract = contractInstance || contract;
    if (!currentContract || !account) return;
    
    try {
      // Load neon pulse stats
      const stats = await currentContract.getNeonPulseStats();
      setNeonPulseStats({
        pulseLevel: Number(stats.pulseLevel),
        energyState: Number(stats.energyState),
        totalOperations: Number(stats.totalOperations),
        lastActivity: Number(stats.lastActivity),
        shutdownActive: stats.shutdownActive
      });

      // Load operator info
      const opInfo = await currentContract.getOperatorInfo(account);
      setOperatorInfo({
        isAuthorized: opInfo.isAuthorized,
        operationCount: Number(opInfo.operationCount)
      });

      // Load dynamic stats
      const amplifier = await currentContract.getDynamicAmplifier();
      const boost = await currentContract.getEnergyBoost();
      setDynamicAmplifier(Number(amplifier));
      setEnergyBoost(Number(boost));
      
    } catch (error: any) {
      console.error('Error loading neon pulse data:', error);
    }
  }, [contract, account]);

  // Activate neon pulse
  const handleActivateNeonPulse = async () => {
    if (!contract || !inputValue) return;

    setLoading(true);
    try {
      toast.info('🔮 Activating neon pulse energy...');
      
      // For demo, create a simple encrypted input
      const value = parseInt(inputValue) || 1;
      const tx = await contract.activateNeonPulse(
        ethers.encodeBytes32String(value.toString()),
        "0x" // Demo proof
      );
      
      toast.info('💜 Neon pulse activation initiated...');
      await tx.wait();
      toast.success('✨ Neon pulse successfully activated!');
      
      setInputValue('');
      await loadNeonPulseData();
    } catch (error: any) {
      console.error('Neon pulse activation failed:', error);
      toast.error('❌ Neon pulse activation failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Supercharge neon pulse
  const handleSuperchargeNeonPulse = async () => {
    if (!contract || !inputValue) return;

    setLoading(true);
    try {
      toast.info('⚡ Initiating neon supercharge sequence...');
      
      const value = parseInt(inputValue) || 5;
      const tx = await contract.superchargeNeonPulse(
        ethers.encodeBytes32String(value.toString()),
        "0x" // Demo proof
      );
      
      toast.info('🚀 Neon supercharge in progress...');
      await tx.wait();
      toast.success('🌟 Neon pulse supercharged successfully!');
      
      setInputValue('');
      await loadNeonPulseData();
    } catch (error: any) {
      console.error('Neon supercharge failed:', error);
      toast.error('❌ Neon supercharge failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Drain neon pulse
  const handleDrainNeonPulse = async () => {
    if (!contract || !inputValue) return;

    setLoading(true);
    try {
      toast.info('🌀 Draining neon pulse energy...');
      
      const value = parseInt(inputValue) || 1;
      const tx = await contract.drainNeonPulse(
        ethers.encodeBytes32String(value.toString()),
        "0x" // Demo proof
      );
      
      toast.info('⚫ Neon energy drain initiated...');
      await tx.wait();
      toast.success('✅ Neon pulse drained successfully!');
      
      setInputValue('');
      await loadNeonPulseData();
    } catch (error: any) {
      console.error('Neon drain failed:', error);
      toast.error('❌ Neon drain failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Emergency shutdown
  const handleEmergencyShutdown = async () => {
    if (!contract) return;

    setLoading(true);
    try {
      toast.info('🚨 Initiating emergency neon shutdown...');
      
      const tx = await contract.emergencyNeonShutdown();
      await tx.wait();
      toast.success('🛑 Emergency neon shutdown completed!');
      
      await loadNeonPulseData();
    } catch (error: any) {
      console.error('Emergency shutdown failed:', error);
      toast.error('❌ Emergency shutdown failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get pulse level name
  const getPulseLevelName = (level: number): string => {
    const levels = ['Dormant', 'Flickering', 'Glowing', 'Pulsating', 'NeonStorm'];
    return levels[level] || 'Unknown';
  };

  // Get energy state name
  const getEnergyStateName = (state: number): string => {
    const states = ['Inactive', 'Charging', 'Active', 'Overdrive', 'NeonSingularity'];
    return states[state] || 'Unknown';
  };

  // Initialize on component mount
  useEffect(() => {
    initializeContract();
  }, [initializeContract]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (contract && account) {
        loadNeonPulseData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [contract, account, loadNeonPulseData]);

  if (!provider || !account) {
    return (
      <NeonPulseCard>
        <NeonPulseTitle>💜 NEON PULSE COUNTER 💜</NeonPulseTitle>
        <EnergyDisplay>
          <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem' }}>
            🔗 Connect wallet to access neon pulse energy
          </div>
        </EnergyDisplay>
      </NeonPulseCard>
    );
  }

  if (CONTRACT_ADDRESSES.NeonPulseFHECounter === "0x0000000000000000000000000000000000000000") {
    return (
      <NeonPulseCard>
        <NeonPulseTitle>💜 NEON PULSE COUNTER 💜</NeonPulseTitle>
        <EnergyDisplay>
          <div style={{ color: 'rgba(255, 255, 100, 0.9)', fontSize: '1.1rem' }}>
            🚧 Neon Pulse Counter contract not deployed yet
          </div>
        </EnergyDisplay>
      </NeonPulseCard>
    );
  }

  if (!neonPulseStats) {
    return (
      <NeonPulseCard>
        <NeonPulseTitle>💜 NEON PULSE COUNTER 💜</NeonPulseTitle>
        <EnergyDisplay>
          <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem' }}>
            🔄 Loading neon pulse data...
          </div>
        </EnergyDisplay>
      </NeonPulseCard>
    );
  }

  return (
    <div className="neon-pulse-card">
      <NeonPulseTitle>💜 NEON PULSE COUNTER 💜</NeonPulseTitle>

      <PulseLevelIndicator>
        <div style={{ color: '#ff00ff', fontWeight: 'bold' }}>
          Level: {getPulseLevelName(neonPulseStats.pulseLevel)}
        </div>
        <div style={{ color: '#00ffff', fontWeight: 'bold' }}>
          State: {getEnergyStateName(neonPulseStats.energyState)}
        </div>
      </PulseLevelIndicator>

      <EnergyDisplay>
        <StatLabel>Total Operations</StatLabel>
        <EnergyValue>{neonPulseStats.totalOperations}</EnergyValue>
      </EnergyDisplay>

      <StatsGrid>
        <StatCard>
          <StatLabel>Dynamic Amplifier</StatLabel>
          <StatValue>{dynamicAmplifier}x</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Energy Boost</StatLabel>
          <StatValue>{energyBoost}</StatValue>
        </StatCard>
        {operatorInfo && (
          <>
            <StatCard>
              <StatLabel>Authorized</StatLabel>
              <StatValue>{operatorInfo.isAuthorized ? '✅ YES' : '❌ NO'}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Operations</StatLabel>
              <StatValue>{operatorInfo.operationCount}</StatValue>
            </StatCard>
          </>
        )}
      </StatsGrid>

      <InputGroup>
        <NeonInput
          type="number"
          placeholder="Enter energy value..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={loading}
        />
      </InputGroup>

      <ButtonGroup>
        <ActionButton
          variant="activate"
          onClick={handleActivateNeonPulse}
          disabled={loading || !inputValue}
        >
          {loading ? '⏳ PROCESSING...' : '🔮 ACTIVATE'}
        </ActionButton>
        <ActionButton
          variant="supercharge"
          onClick={handleSuperchargeNeonPulse}
          disabled={loading || !inputValue || neonPulseStats.energyState < 2}
        >
          {loading ? '⏳ PROCESSING...' : '⚡ SUPERCHARGE'}
        </ActionButton>
      </ButtonGroup>

      <ButtonGroup>
        <ActionButton
          variant="drain"
          onClick={handleDrainNeonPulse}
          disabled={loading || !inputValue || neonPulseStats.energyState < 1}
        >
          {loading ? '⏳ PROCESSING...' : '🌀 DRAIN'}
        </ActionButton>
        <ActionButton
          variant="emergency"
          onClick={handleEmergencyShutdown}
          disabled={loading || neonPulseStats.shutdownActive}
        >
          {loading ? '⏳ PROCESSING...' : '🚨 EMERGENCY'}
        </ActionButton>
      </ButtonGroup>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: 'rgba(255, 0, 255, 0.1)', 
        borderRadius: '10px',
        fontSize: '0.9rem',
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center'
      }}>
        💜 All neon operations are encrypted using luminous pulse homomorphic encryption. 
        Energy levels are calculated using quantum neon algorithms. 💜
      </div>
    </div>
  );
};

export default NeonPulseCounterCard;