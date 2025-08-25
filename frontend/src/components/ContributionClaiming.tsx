import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { useWalletContext } from '../providers/WalletProvider';
import { ethers } from 'ethers';
import { useFhevm } from '../hooks/useFhevm';
import { CONTRACT_ADDRESSES, PRIVACY_FUNDRAISING_ABI, getEtherscanUrl, GAS_LIMITS } from '../utils/contracts';

const ClaimingContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const ClaimingCard = styled.div`
  background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%);
  padding: 25px;
  border-radius: 15px;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  margin: 0 0 20px 0;
  font-size: 1.5rem;
  text-align: center;
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
`;

const ContributionItem = styled.div<{ canClaim: boolean }>`
  background: ${props => props.canClaim ? 'rgba(76, 175, 80, 0.2)' : 'rgba(158, 158, 158, 0.1)'};
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 15px;
  border: 2px solid ${props => props.canClaim ? 'rgba(76, 175, 80, 0.4)' : 'rgba(158, 158, 158, 0.3)'};
`;

const ActionButton = styled.button<{ variant?: 'claim' | 'query' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 10px;
  margin-top: 10px;
  
  ${props => props.variant === 'claim' ? `
    background: linear-gradient(45deg, #4CAF50, #8BC34A);
    color: white;
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
    }
  ` : props.variant === 'query' ? `
    background: linear-gradient(45deg, #2196F3, #03DAC6);
    color: white;
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
    }
  ` : `
    background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
    color: white;
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  margin-bottom: 10px;
`;

const InfoBox = styled.div<{ type?: 'success' | 'warning' | 'info' }>`
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 15px;
  font-size: 0.9rem;
  
  ${props => props.type === 'success' ? `
    background: rgba(76, 175, 80, 0.15);
    border: 1px solid rgba(76, 175, 80, 0.3);
    color: #4CAF50;
  ` : props.type === 'warning' ? `
    background: rgba(255, 152, 0, 0.15);
    border: 1px solid rgba(255, 152, 0, 0.3);
    color: #FF9800;
  ` : `
    background: rgba(33, 150, 243, 0.15);
    border: 1px solid rgba(33, 150, 243, 0.3);
    color: #2196F3;
  `}
`;

interface Contribution {
  projectId: string;
  projectTitle: string;
  amount: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  contributor: string;
  encrypted: boolean;
  visible: boolean;
  claimed?: boolean;
}

type TabType = 'fhe' | 'claim';

interface ContributionClaimingProps {
  onNavigate?: (tab: TabType) => void;
}

const ContributionClaiming: React.FC<ContributionClaimingProps> = ({ onNavigate }) => {
  const { account, provider } = useWalletContext();
  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({
    provider: provider || undefined,
    chainId: 11155111, // Sepolia
    enabled: true
  });

  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [queryAddress, setQueryAddress] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);

  useEffect(() => {
    if (account) {
      loadContributions();
    }
  }, [account]);

  const loadContributions = () => {
    if (!account) return;
    
    try {
      const userContributions = JSON.parse(localStorage.getItem(`contributions_${account}`) || '[]');
      setContributions(userContributions);
    } catch (error) {
      console.error('Failed to load contributions:', error);
      toast.error('Failed to load contributions');
    }
  };

  const checkClaimEligibility = (contribution: Contribution): boolean => {
    // Check if project failed (deadline passed and target not reached)
    const projects = JSON.parse(localStorage.getItem('fundingProjects') || '[]');
    const project = projects.find((p: any) => p.id === contribution.projectId);
    
    if (!project) return false;
    
    const now = new Date();
    const deadline = new Date(project.deadline);
    const targetReached = parseFloat(project.currentAmount) >= parseFloat(project.targetAmount);
    
    return now > deadline && !targetReached && !contribution.claimed;
  };

  const handleClaimContribution = async (contribution: Contribution, index: number) => {
    if (!account || !provider) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!checkClaimEligibility(contribution)) {
      toast.error('This contribution is not eligible for claiming');
      return;
    }

    setLoading(true);
    try {
      toast.info('🔄 Processing claim request...');

      // Step 1: Connect to contract
      const contractAddress = CONTRACT_ADDRESSES.PrivacyFundraising || CONTRACT_ADDRESSES.FHECounter;
      const signer = await provider!.getSigner();
      const contract = new ethers.Contract(contractAddress, PRIVACY_FUNDRAISING_ABI, signer);

      // Step 2: Call claim function
      toast.info('📝 Sending claim transaction...');
      const tx = await contract.claimContribution(index, {
        gasLimit: GAS_LIMITS.CLAIM
      });

      toast.info('⏳ Waiting for claim confirmation...');
      console.log('📋 Claim transaction hash:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Claim confirmed:', receipt);

      // Step 3: Update local storage
      const updatedContributions = contributions.map((contrib, i) => 
        i === index ? { ...contrib, claimed: true } : contrib
      );
      setContributions(updatedContributions);
      localStorage.setItem(`contributions_${account}`, JSON.stringify(updatedContributions));

      // Step 4: Show success message
      const etherscanUrl = getEtherscanUrl(tx.hash);
      toast.success(
        <div>
          <div>✅ Contribution claimed successfully!</div>
          <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>
            <a href={etherscanUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4CAF50' }}>
              📋 View on Etherscan
            </a>
          </div>
        </div>,
        { autoClose: 8000 }
      );

    } catch (error: any) {
      console.error('❌ Claim failed:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Claim failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const queryConfidentialBalance = async () => {
    if (!queryAddress || !ethers.isAddress(queryAddress)) {
      toast.error('Please enter a valid address');
      return;
    }

    if (!fhevmInstance || fhevmStatus !== 'ready') {
      toast.error('FHE not ready. Please wait...');
      return;
    }

    setLoading(true);
    try {
      toast.info('🔍 Querying confidential token balance...');

      // Step 1: Connect to contract
      const contractAddress = CONTRACT_ADDRESSES.PrivacyFundraising || CONTRACT_ADDRESSES.FHECounter;
      const signer = await provider!.getSigner();
      const contract = new ethers.Contract(contractAddress, PRIVACY_FUNDRAISING_ABI, signer);

      // Step 2: Query encrypted balance for all projects
      const allProjects = JSON.parse(localStorage.getItem('fundingProjects') || '[]');
      const results = [];

      for (const project of allProjects) {
        try {
          const encryptedBalance = await contract.getMyContribution(project.id);
          
          if (encryptedBalance && encryptedBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
            results.push({
              projectId: project.id,
              projectTitle: project.title,
              encryptedBalance: encryptedBalance,
              hasBalance: true
            });
          }
        } catch (error) {
          console.warn(`Failed to query balance for project ${project.id}:`, error);
        }
      }

      setQueryResult({
        address: queryAddress,
        results: results,
        timestamp: new Date().toISOString()
      });

      toast.success(`Found ${results.length} encrypted balance records`);

    } catch (error: any) {
      console.error('❌ Balance query failed:', error);
      toast.error(`Balance query failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <ClaimingContainer>
        <ClaimingCard>
          <Title>🎯 Token Claiming & Balance Query</Title>
          <div style={{ textAlign: 'center', color: '#fbbf24' }}>
            Please connect your wallet to access claiming features
          </div>
        </ClaimingCard>
      </ClaimingContainer>
    );
  }

  return (
    <ClaimingContainer>
      <ClaimingCard>
        <Title>🎯 Token Claiming & Balance Query</Title>
        
        <InfoBox type="info">
          <strong>🔐 Confidential Contribution Management</strong><br/>
          Claim your contributions from failed projects or query encrypted token balances using FHE technology.
          <br/><br/>
          <small>✅ Claim eligible contributions from expired projects</small><br/>
          <small>🔍 Query confidential balances by address</small><br/>
          <small>🔐 FHE Status: {fhevmStatus === 'ready' ? '✅ Ready' : fhevmStatus === 'loading' ? '⏳ Loading' : '❌ Error'}</small>
        </InfoBox>

        {/* My Claimable Contributions */}
        <Section>
          <h3>💰 My Claimable Contributions</h3>
          {contributions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.7)' }}>
              No contributions found
            </div>
          ) : (
            contributions.map((contribution, index) => {
              const canClaim = checkClaimEligibility(contribution);
              return (
                <ContributionItem key={index} canClaim={canClaim}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        {contribution.projectTitle}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                        💰 Amount: {contribution.amount} ETH<br/>
                        📅 Date: {new Date(contribution.timestamp).toLocaleDateString()}<br/>
                        📊 Status: {contribution.claimed ? '✅ Claimed' : canClaim ? '🟢 Claimable' : '⏳ Not Claimable'}
                      </div>
                    </div>
                    <div>
                      {canClaim && !contribution.claimed && (
                        <ActionButton 
                          variant="claim"
                          onClick={() => handleClaimContribution(contribution, index)}
                          disabled={loading}
                        >
                          {loading ? '⏳ Claiming...' : '🎯 Claim'}
                        </ActionButton>
                      )}
                      <ActionButton 
                        onClick={() => window.open(getEtherscanUrl(contribution.txHash), '_blank')}
                      >
                        📋 Etherscan
                      </ActionButton>
                    </div>
                  </div>
                </ContributionItem>
              );
            })
          )}
        </Section>

        {/* Confidential Balance Query */}
        <Section>
          <h3>🔍 Query Confidential Token Balance</h3>
          <div style={{ marginBottom: '15px' }}>
            <Input
              type="text"
              placeholder="Enter address to query confidential balance (0x...)"
              value={queryAddress}
              onChange={(e) => setQueryAddress(e.target.value)}
            />
            <ActionButton 
              variant="query"
              onClick={queryConfidentialBalance}
              disabled={loading || !queryAddress || fhevmStatus !== 'ready'}
            >
              {loading ? '🔍 Querying...' : '🔍 Query Balance'}
            </ActionButton>
          </div>

          {queryResult && (
            <div style={{ 
              background: 'rgba(33, 150, 243, 0.1)', 
              padding: '15px', 
              borderRadius: '8px',
              border: '1px solid rgba(33, 150, 243, 0.3)'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                Query Results for {queryResult.address.slice(0, 8)}...{queryResult.address.slice(-6)}
              </div>
              {queryResult.results.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                  No encrypted balances found for this address
                </div>
              ) : (
                queryResult.results.map((result: any, index: number) => (
                  <div key={index} style={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    padding: '10px', 
                    borderRadius: '6px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ fontWeight: 'bold' }}>{result.projectTitle}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                      🔐 Encrypted Balance: {result.encryptedBalance.slice(0, 10)}...{result.encryptedBalance.slice(-8)}
                    </div>
                  </div>
                ))
              )}
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: '10px' }}>
                Query Time: {new Date(queryResult.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </Section>
      </ClaimingCard>
    </ClaimingContainer>
  );
};

export default ContributionClaiming;