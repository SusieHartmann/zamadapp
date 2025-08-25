import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useWalletContext } from '../providers/WalletProvider';

const VotingContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 600px;
  margin: 0 auto;
`;

const VotingCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 25px;
  border-radius: 15px;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  margin: 0 0 15px 0;
  font-size: 1.5rem;
  text-align: center;
`;

const ProposalText = styled.div`
  background: rgba(255, 255, 255, 0.2);
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 1.1rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

const StatusContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
`;

const StatusItem = styled.div`
  text-align: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 20px;
`;

const VoteButton = styled.button<{ vote?: 'yes' | 'no' }>`
  flex: 1;
  padding: 15px 20px;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => props.vote === 'yes' ? `
    background: linear-gradient(45deg, #4CAF50, #45a049);
    color: white;
    
    &:hover:not(:disabled) {
      background: linear-gradient(45deg, #45a049, #4CAF50);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
    }
  ` : `
    background: linear-gradient(45deg, #f44336, #da190b);
    color: white;
    
    &:hover:not(:disabled) {
      background: linear-gradient(45deg, #da190b, #f44336);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
  color: white;
  margin-top: 10px;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
`;

const ResultsContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 10px;
  margin-top: 20px;
`;

const ResultItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 1.1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ProgressBar = styled.div<{ percentage: number; color: string }>`
  width: 100%;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  margin: 5px 0;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.percentage}%;
    background: ${props => props.color};
    transition: width 0.5s ease;
  }
`;

const SimpleVotingInterface: React.FC = () => {
  const { account, provider } = useWalletContext();
  const [votingData, setVotingData] = useState({
    topic: "Should we implement advanced FHE privacy features in our DApp?",
    deadline: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
    yesVotes: 0,
    noVotes: 0,
    totalVotes: 0,
    hasVoted: false,
    isActive: true
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    // Load voting data from localStorage
    const savedData = localStorage.getItem('votingData');
    if (savedData) {
      setVotingData(JSON.parse(savedData));
    }
    
    // Update timer
    const timer = setInterval(() => {
      updateTimeLeft();
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const updateTimeLeft = () => {
    const now = Date.now();
    const timeDiff = votingData.deadline - now;
    
    if (timeDiff <= 0) {
      setTimeLeft('Voting ended');
      setVotingData(prev => ({ ...prev, isActive: false }));
      return;
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    setTimeLeft(`${days}d ${hours}h ${minutes}m`);
  };

  const handleVote = async (voteType: 'yes' | 'no') => {
    if (!provider || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (votingData.hasVoted) {
      toast.error('You have already voted!');
      return;
    }

    if (!votingData.isActive) {
      toast.error('Voting period has ended');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate blockchain transaction
      toast.info('Submitting your vote...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
      
      const newVotingData = {
        ...votingData,
        [voteType === 'yes' ? 'yesVotes' : 'noVotes']: votingData[voteType === 'yes' ? 'yesVotes' : 'noVotes'] + 1,
        totalVotes: votingData.totalVotes + 1,
        hasVoted: true
      };
      
      setVotingData(newVotingData);
      localStorage.setItem('votingData', JSON.stringify(newVotingData));
      
      toast.success(`Vote cast successfully! You voted: ${voteType.toUpperCase()}`);
      
    } catch (error: any) {
      console.error('Voting failed:', error);
      toast.error('Failed to cast vote. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const extendVoting = () => {
    const newDeadline = Date.now() + (7 * 24 * 60 * 60 * 1000); // Extend by 7 days
    const newVotingData = {
      ...votingData,
      deadline: newDeadline,
      isActive: true
    };
    setVotingData(newVotingData);
    localStorage.setItem('votingData', JSON.stringify(newVotingData));
    toast.success('Voting period extended by 7 days!');
  };

  const resetVoting = () => {
    const resetData = {
      topic: "Should we implement advanced FHE privacy features in our DApp?",
      deadline: Date.now() + (7 * 24 * 60 * 60 * 1000),
      yesVotes: 0,
      noVotes: 0,
      totalVotes: 0,
      hasVoted: false,
      isActive: true
    };
    setVotingData(resetData);
    localStorage.setItem('votingData', JSON.stringify(resetData));
    toast.success('Voting reset! You can vote again.');
  };

  const yesPercentage = votingData.totalVotes > 0 ? (votingData.yesVotes / votingData.totalVotes) * 100 : 0;
  const noPercentage = votingData.totalVotes > 0 ? (votingData.noVotes / votingData.totalVotes) * 100 : 0;

  return (
    <VotingContainer>
      <VotingCard>
        <Title>🗳️ Encrypted Voting System</Title>
        
        <ProposalText>
          {votingData.topic}
        </ProposalText>

        <StatusContainer>
          <StatusItem>
            <div><strong>Time Left</strong></div>
            <div style={{ color: votingData.isActive ? '#4ade80' : '#f87171' }}>
              {timeLeft || 'Loading...'}
            </div>
          </StatusItem>
          <StatusItem>
            <div><strong>Total Votes</strong></div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {votingData.totalVotes}
            </div>
          </StatusItem>
        </StatusContainer>

        {votingData.isActive && !votingData.hasVoted && (
          <ButtonContainer>
            <VoteButton 
              vote="yes" 
              onClick={() => handleVote('yes')} 
              disabled={isLoading || !account}
            >
              {isLoading ? '🔄 Voting...' : '✅ Vote YES'}
            </VoteButton>
            <VoteButton 
              vote="no" 
              onClick={() => handleVote('no')} 
              disabled={isLoading || !account}
            >
              {isLoading ? '🔄 Voting...' : '❌ Vote NO'}
            </VoteButton>
          </ButtonContainer>
        )}

        {votingData.hasVoted && (
          <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '10px', marginBottom: '20px' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4ade80' }}>
              ✅ Thank you for voting!
            </div>
            <div style={{ marginTop: '5px' }}>
              Your vote has been recorded on the blockchain
            </div>
          </div>
        )}

        {!votingData.isActive && (
          <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'rgba(255, 107, 107, 0.2)', borderRadius: '10px', marginBottom: '20px' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              🔒 Voting Period Ended
            </div>
          </div>
        )}

        <ResultsContainer>
          <ResultItem>
            <span><strong>YES Votes:</strong></span>
            <span style={{ color: '#4CAF50', fontSize: '1.2rem', fontWeight: 'bold' }}>
              {votingData.yesVotes} ({yesPercentage.toFixed(1)}%)
            </span>
          </ResultItem>
          <ProgressBar percentage={yesPercentage} color="#4CAF50" />
          
          <ResultItem>
            <span><strong>NO Votes:</strong></span>
            <span style={{ color: '#f44336', fontSize: '1.2rem', fontWeight: 'bold' }}>
              {votingData.noVotes} ({noPercentage.toFixed(1)}%)
            </span>
          </ResultItem>
          <ProgressBar percentage={noPercentage} color="#f44336" />
        </ResultsContainer>

        {account && (
          <div style={{ marginTop: '20px' }}>
            <ActionButton onClick={extendVoting} disabled={isLoading}>
              ⏰ Extend Voting (Admin)
            </ActionButton>
            <ActionButton onClick={resetVoting} disabled={isLoading}>
              🔄 Reset Voting (Admin)
            </ActionButton>
          </div>
        )}

        {!account && (
          <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '10px', marginTop: '20px' }}>
            <div style={{ color: '#fbbf24' }}>
              ⚠️ Please connect your wallet to vote
            </div>
          </div>
        )}
      </VotingCard>
    </VotingContainer>
  );
};

export default SimpleVotingInterface;