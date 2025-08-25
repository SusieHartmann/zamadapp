import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { NeonPulseVotingABI, CONTRACT_ADDRESSES, getContract } from '../utils/contracts';
import { createFHEVMClient, FHEVMClient } from '../utils/fhevm';
import './NeonPulseVotingInterface.css';

// ============= ANIMATIONS =============
const neonFlicker = keyframes`
  0%, 100% { 
    text-shadow: 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff;
    box-shadow: 0 0 10px rgba(255, 0, 255, 0.3);
  }
  50% { 
    text-shadow: 0 0 20px #00ffff, 0 0 30px #00ffff, 0 0 40px #00ffff;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
  }
`;

const pulseWave = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const voteGlow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 15px currentColor;
    filter: brightness(1);
  }
  50% { 
    box-shadow: 0 0 30px currentColor;
    filter: brightness(1.3);
  }
`;

// ============= STYLED COMPONENTS =============
const NeonVotingContainer = styled.div`
  background: linear-gradient(45deg, #1a1a2e, #16213e, #0f3460);
  border: 2px solid #ff00ff;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 0 30px rgba(255, 0, 255, 0.3);
  animation: ${neonFlicker} 4s ease-in-out infinite;
  position: relative;
  overflow: hidden;
  font-family: 'Courier New', monospace;
`;

const VotingHeader = styled.div`
  text-align: center;
  margin-bottom: 25px;
`;

const NeonVotingTitle = styled.h2`
  font-size: 2rem;
  font-weight: 900;
  background: linear-gradient(45deg, #ff00ff, #00ffff, #ff00ff);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${neonFlicker} 3s ease-in-out infinite;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin: 0;
`;

const ProposalContainer = styled.div`
  background: rgba(255, 0, 255, 0.1);
  border: 2px solid #ff00ff;
  border-radius: 15px;
  padding: 20px;
  margin: 20px 0;
  text-align: center;
  animation: ${pulseWave} 2s ease-in-out infinite;
`;

const ProposalText = styled.div`
  font-size: 1.2rem;
  color: #ffffff;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
`;

const VotingPhaseIndicator = styled.div<{ phase: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin: 20px 0;
  padding: 15px;
  background: rgba(0, 255, 255, 0.1);
  border-radius: 15px;
  border: 1px solid rgba(0, 255, 255, 0.3);
  animation: ${pulseWave} 1.5s ease-in-out infinite;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin: 20px 0;
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
`;

const VoteButtonContainer = styled.div`
  display: flex;
  gap: 15px;
  margin: 25px 0;
`;

const VoteButton = styled.button<{ variant: 'yes' | 'no' }>`
  flex: 1;
  padding: 18px 25px;
  border: none;
  border-radius: 15px;
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 2px;
  position: relative;
  overflow: hidden;
  font-family: 'Courier New', monospace;
  
  ${props => props.variant === 'yes' ? css`
    background: linear-gradient(45deg, #00ff00, #00cc00);
    color: white;
    border: 2px solid #00ff00;
    
    &:hover {
      animation: ${voteGlow} 1s ease-in-out infinite;
      transform: translateY(-3px) scale(1.05);
    }
  ` : css`
    background: linear-gradient(45deg, #ff0040, #cc0033);
    color: white;
    border: 2px solid #ff0040;
    
    &:hover {
      animation: ${voteGlow} 1s ease-in-out infinite;
      transform: translateY(-3px) scale(1.05);
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    animation: none !important;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const ActionButton = styled.button`
  padding: 15px 25px;
  border: 2px solid #00ffff;
  background: rgba(0, 255, 255, 0.2);
  color: white;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: 'Courier New', monospace;
  
  &:hover {
    background: rgba(0, 255, 255, 0.4);
    transform: translateY(-2px);
    animation: ${voteGlow} 1s ease-in-out infinite;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    animation: none !important;
  }
`;

const WarningMessage = styled.div<{ type?: 'info' | 'warning' | 'error' | 'success' }>`
  padding: 20px;
  border-radius: 12px;
  margin: 20px 0;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  
  ${props => {
    switch (props.type) {
      case 'warning':
        return css`
          background: rgba(255, 193, 7, 0.1);
          border: 2px solid rgba(255, 193, 7, 0.5);
          color: #ffc107;
          text-shadow: 0 0 10px rgba(255, 193, 7, 0.8);
        `;
      case 'error':
        return css`
          background: rgba(220, 53, 69, 0.1);
          border: 2px solid rgba(220, 53, 69, 0.5);
          color: #dc3545;
          text-shadow: 0 0 10px rgba(220, 53, 69, 0.8);
        `;
      case 'success':
        return css`
          background: rgba(40, 167, 69, 0.1);
          border: 2px solid rgba(40, 167, 69, 0.5);
          color: #28a745;
          text-shadow: 0 0 10px rgba(40, 167, 69, 0.8);
        `;
      default:
        return css`
          background: rgba(0, 255, 255, 0.1);
          border: 2px solid rgba(0, 255, 255, 0.5);
          color: #00ffff;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
        `;
    }
  }}
`;

const ResultsContainer = styled.div`
  background: rgba(0, 255, 255, 0.1);
  border: 2px solid rgba(0, 255, 255, 0.5);
  border-radius: 16px;
  padding: 25px;
  margin-top: 25px;
  animation: ${pulseWave} 2s ease-in-out infinite;
`;

const ResultItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 1.1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

// ============= INTERFACES =============
interface VotingInfo {
  proposal: string;
  deadline: number;
  phase: number;
  userHasVoted: boolean;
}

interface VotingStats {
  totalVoters: number;
  phase: number;
  isActive: boolean;
  timeRemaining: number;
}

interface VoterInfo {
  rank: number;
  votingHistory: number;
  hasVoted: boolean;
}

interface NeonPulseVotingInterfaceProps {
  provider: ethers.BrowserProvider | null;
  account: string | null;
}

// ============= COMPONENT =============
const NeonPulseVotingInterface: React.FC<NeonPulseVotingInterfaceProps> = ({ provider, account }) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [votingInfo, setVotingInfo] = useState<VotingInfo | null>(null);
  const [votingStats, setVotingStats] = useState<VotingStats | null>(null);
  const [voterInfo, setVoterInfo] = useState<VoterInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fhevmClient, setFhevmClient] = useState<FHEVMClient | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Initialize contract and FHEVM client
  const initializeContract = useCallback(async () => {
    if (!provider || !account) return;
    
    try {
      const client = await createFHEVMClient(provider);
      setFhevmClient(client);
      
      if (CONTRACT_ADDRESSES.NeonPulseVoting !== "0x0000000000000000000000000000000000000000") {
        const votingContract = await getContract(CONTRACT_ADDRESSES.NeonPulseVoting, NeonPulseVotingABI, provider);
        setContract(votingContract);
        await loadVotingData(votingContract);
      }
    } catch (error: any) {
      console.error('Neon voting initialization failed:', error);
      toast.error('Failed to initialize Neon Pulse Voting system');
    }
  }, [provider, account]);

  // Load voting data
  const loadVotingData = useCallback(async (contractInstance?: ethers.Contract) => {
    const currentContract = contractInstance || contract;
    if (!currentContract || !account) return;
    
    try {
      // Load proposal info
      const proposalInfo = await currentContract.getNeonProposalInfo();
      setVotingInfo({
        proposal: proposalInfo.proposal,
        deadline: Number(proposalInfo.deadline),
        phase: Number(proposalInfo.phase),
        userHasVoted: proposalInfo.userHasVoted
      });

      // Load voting stats
      const stats = await currentContract.getNeonVotingStats();
      setVotingStats({
        totalVoters: Number(stats.totalVoters),
        phase: Number(stats.phase),
        isActive: stats.isActive,
        timeRemaining: Number(stats.timeRemaining)
      });

      // Load voter info
      const voterData = await currentContract.getVoterInfo(account);
      setVoterInfo({
        rank: Number(voterData.rank),
        votingHistory: Number(voterData.votingHistory),
        hasVoted: voterData.hasVoted
      });
      
    } catch (error: any) {
      console.error('Error loading neon voting data:', error);
    }
  }, [contract, account]);

  // Cast neon vote
  const handleCastVote = async (support: boolean) => {
    if (!contract || !votingInfo || !fhevmClient) return;

    if (votingInfo.userHasVoted) {
      toast.error('🚫 You have already cast your neon vote!');
      return;
    }

    setLoading(true);
    try {
      toast.info(`🔮 Casting ${support ? 'YES' : 'NO'} vote with neon power...`);
      
      // Create encrypted input for vote
      const encryptedInput = await fhevmClient.createEncryptedBoolInput(CONTRACT_ADDRESSES.NeonPulseVoting, support);
      
      // Cast the unified neon vote
      const tx = await contract.castNeonVote(encryptedInput.handle, encryptedInput.proof);
      toast.info('💜 Neon vote transmission initiated...');
      await tx.wait();
      toast.success(`✨ Neon ${support ? 'YES' : 'NO'} vote successfully recorded!`);
      
      await loadVotingData();
    } catch (error: any) {
      console.error('Neon vote failed:', error);
      
      if (error.message.includes('missing revert data')) {
        toast.error('Vote failed - please check contract and network');
      } else if (error.message.includes('user rejected')) {
        toast.error('Vote cancelled by user');
      } else {
        toast.error('❌ Neon vote failed: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Request decryption
  const handleRequestDecryption = async () => {
    if (!contract) return;
    
    setLoading(true);
    try {
      toast.info('🔓 Requesting neon vote decryption...');
      
      const tx = await contract.requestNeonDecryption();
      await tx.wait();
      toast.success('✅ Neon decryption request submitted!');
      
      await loadVotingData();
    } catch (error: any) {
      console.error('Decryption request failed:', error);
      toast.error('❌ Failed to request decryption: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get phase name
  const getPhaseName = (phase: number): string => {
    const phases = ['Initialization', 'LuminousVoting', 'PulseValidation', 'NeonConsensus', 'IlluminatedResolution'];
    return phases[phase] || 'Unknown';
  };

  // Get voter rank name
  const getVoterRankName = (rank: number): string => {
    const ranks = ['Newcomer', 'NeonVoter', 'PulseAdept', 'LuminousGuard', 'NeonCouncil'];
    return ranks[rank] || 'Unknown';
  };

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'EXPIRED';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  // Initialize on component mount
  useEffect(() => {
    initializeContract();
  }, [initializeContract]);

  // Update time countdown
  useEffect(() => {
    if (!votingStats || votingStats.timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prevTime => Math.max(0, prevTime - 1));
    }, 1000);

    setTimeLeft(votingStats.timeRemaining);

    return () => clearInterval(interval);
  }, [votingStats]);

  if (!provider || !account) {
    return (
      <NeonVotingContainer>
        <VotingHeader>
          <NeonVotingTitle>💜 NEON PULSE DEMOCRACY 💜</NeonVotingTitle>
          <WarningMessage>
            🔗 Connect wallet to participate in neon pulse voting
          </WarningMessage>
        </VotingHeader>
      </NeonVotingContainer>
    );
  }

  if (CONTRACT_ADDRESSES.NeonPulseVoting === "0x0000000000000000000000000000000000000000") {
    return (
      <NeonVotingContainer>
        <VotingHeader>
          <NeonVotingTitle>💜 NEON PULSE DEMOCRACY 💜</NeonVotingTitle>
          <WarningMessage type="warning">
            🚧 Neon Pulse Voting contract not deployed yet
          </WarningMessage>
        </VotingHeader>
      </NeonVotingContainer>
    );
  }

  if (!votingInfo || !votingStats) {
    return (
      <NeonVotingContainer>
        <VotingHeader>
          <NeonVotingTitle>💜 NEON PULSE DEMOCRACY 💜</NeonVotingTitle>
          <WarningMessage>
            🔄 Loading neon pulse voting data...
          </WarningMessage>
        </VotingHeader>
      </NeonVotingContainer>
    );
  }

  return (
    <NeonVotingContainer>
      <VotingHeader>
        <NeonVotingTitle>💜 NEON PULSE DEMOCRACY 💜</NeonVotingTitle>
        <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
          Luminous Encrypted Democratic Consensus
        </div>
      </VotingHeader>

      <ProposalContainer>
        <ProposalText>{votingInfo.proposal}</ProposalText>
      </ProposalContainer>

      <VotingPhaseIndicator phase={votingInfo.phase}>
        <div style={{ color: '#ff00ff', fontWeight: 'bold' }}>
          Phase: {getPhaseName(votingInfo.phase)}
        </div>
        <div style={{ color: '#00ffff', fontWeight: 'bold' }}>
          Time: {formatTimeRemaining(timeLeft)}
        </div>
      </VotingPhaseIndicator>

      <StatsGrid>
        <StatCard>
          <StatLabel>Total Voters</StatLabel>
          <StatValue>{votingStats.totalVoters}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Voting Status</StatLabel>
          <StatValue>{votingStats.isActive ? '✅ ACTIVE' : '❌ INACTIVE'}</StatValue>
        </StatCard>
        {voterInfo && (
          <>
            <StatCard>
              <StatLabel>Your Rank</StatLabel>
              <StatValue>{getVoterRankName(voterInfo.rank)}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Voting History</StatLabel>
              <StatValue>{voterInfo.votingHistory}</StatValue>
            </StatCard>
          </>
        )}
      </StatsGrid>

      {votingInfo.userHasVoted ? (
        <WarningMessage type="success">
          ✅ You have successfully cast your neon pulse vote
        </WarningMessage>
      ) : null}

      {votingStats.isActive && votingInfo.phase === 1 && timeLeft > 0 && (
        <VoteButtonContainer>
          <VoteButton
            variant="yes"
            onClick={() => handleCastVote(true)}
            disabled={loading || votingInfo.userHasVoted}
          >
            {loading ? '⏳ PROCESSING...' : '✅ NEON YES'}
          </VoteButton>
          <VoteButton
            variant="no"
            onClick={() => handleCastVote(false)}
            disabled={loading || votingInfo.userHasVoted}
          >
            {loading ? '⏳ PROCESSING...' : '❌ NEON NO'}
          </VoteButton>
        </VoteButtonContainer>
      )}

      {votingInfo.phase === 3 && timeLeft <= 0 && (
        <ActionButton
          onClick={handleRequestDecryption}
          disabled={loading}
        >
          {loading ? '⏳ Processing...' : '🔓 REQUEST NEON DECRYPTION'}
        </ActionButton>
      )}

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: 'rgba(255, 0, 255, 0.1)', 
        borderRadius: '10px',
        fontSize: '0.9rem',
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center'
      }}>
        💜 All neon votes are encrypted using luminous pulse homomorphic encryption. 
        Vote privacy is guaranteed through neon quantum obfuscation protocols. 💜
      </div>
    </NeonVotingContainer>
  );
};

export default NeonPulseVotingInterface;