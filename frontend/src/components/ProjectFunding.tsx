import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { useWalletContext } from '../providers/WalletProvider';
import { ethers } from 'ethers';
import { useFhevm } from '../hooks/useFhevm';
import { CONTRACT_ADDRESSES, PRIVACY_FUNDRAISING_ABI, getEtherscanUrl, GAS_LIMITS } from '../utils/contracts';

const FundingContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 900px;
  margin: 0 auto;
`;

const FundingCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

const ProjectCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ProjectHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
`;

const ProjectTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 1.3rem;
  color: #ffffff;
`;

const ProjectStatus = styled.div<{ status: string }>`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => {
    switch (props.status) {
      case 'active': return 'rgba(76, 175, 80, 0.3)';
      case 'completed': return 'rgba(33, 150, 243, 0.3)';
      case 'expired': return 'rgba(255, 152, 0, 0.3)';
      default: return 'rgba(158, 158, 158, 0.3)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'active': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'expired': return '#FF9800';
      default: return '#9E9E9E';
    }
  }};
`;

const ProjectDescription = styled.p`
  margin: 0 0 15px 0;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
`;

const ProjectMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const MetaItem = styled.div`
  text-align: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
`;

const MetaLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
`;

const MetaValue = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 20px;
`;

const ProgressFill = styled.div<{ percentage: number }>`
  height: 100%;
  width: ${props => Math.min(props.percentage, 100)}%;
  background: linear-gradient(45deg, #4CAF50, #8BC34A);
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const FundingSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 10px;
  border-top: 2px solid rgba(255, 255, 255, 0.3);
`;

const InputGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
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
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
`;

const SmallButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(45deg, #4CAF50, #8BC34A);
  color: white;
  margin-right: 8px;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 3px 12px rgba(76, 175, 80, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
`;

const InfoBox = styled.div`
  background: rgba(76, 175, 80, 0.15);
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  border: 1px solid rgba(76, 175, 80, 0.3);
  font-size: 0.9rem;
`;

interface Project {
  id: string;
  title: string;
  description: string;
  targetAmount: string;
  currency: string;
  deadline: string;
  category: string;
  imageUrl: string;
  creator: string;
  currentAmount: string;
  backers: number;
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
  txHash?: string;
  blockNumber?: number;
  transactions?: Array<{
    txHash: string;
    blockNumber: number;
    contributor: string;
    amount: string;
    timestamp: string;
    encrypted: boolean;
  }>;
}

type TabType = 'fhe' | 'create' | 'fund' | 'projects' | 'claim';

interface ProjectFundingProps {
  onNavigate?: (tab: TabType) => void;
}

const ProjectFunding: React.FC<ProjectFundingProps> = ({ onNavigate }) => {
  const { account, provider } = useWalletContext();
  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({
    provider: provider || undefined,
    chainId: 11155111, // Sepolia
    enabled: true
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [fundingAmounts, setFundingAmounts] = useState<{ [key: string]: string }>({});
  const [showContributions, setShowContributions] = useState(false);
  const [myContributions, setMyContributions] = useState<any[]>([]);

  useEffect(() => {
    loadProjects();
    if (account) {
      loadMyContributions();
    }
  }, [account]);

  const loadMyContributions = () => {
    if (!account) return;
    
    try {
      const contributions = JSON.parse(localStorage.getItem(`contributions_${account}`) || '[]');
      setMyContributions(contributions);
    } catch (error) {
      console.error('Failed to load contributions:', error);
    }
  };

  const toggleContributionVisibility = (index: number) => {
    const updatedContributions = myContributions.map((contribution, i) => {
      if (i === index) {
        return { ...contribution, visible: !contribution.visible };
      }
      return contribution;
    });
    
    setMyContributions(updatedContributions);
    localStorage.setItem(`contributions_${account}`, JSON.stringify(updatedContributions));
  };

  const loadProjects = () => {
    try {
      const existingProjects = JSON.parse(localStorage.getItem('fundingProjects') || '[]') as Project[];
      
      // Update project statuses based on current time
      const updatedProjects = existingProjects.map(project => {
        const now = new Date();
        const deadline = new Date(project.deadline);
        const currentAmount = parseFloat(project.currentAmount);
        const targetAmount = parseFloat(project.targetAmount);
        
        let status: 'active' | 'completed' | 'expired' = project.status;
        
        if (currentAmount >= targetAmount) {
          status = 'completed';
        } else if (now > deadline) {
          status = 'expired';
        } else {
          status = 'active';
        }
        
        return { ...project, status };
      });
      
      // Save updated statuses
      localStorage.setItem('fundingProjects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const handleFundingAmountChange = (projectId: string, amount: string) => {
    setFundingAmounts(prev => ({
      ...prev,
      [projectId]: amount
    }));
  };

  const handleFundProject = async (project: Project) => {
    const amount = fundingAmounts[project.id];
    
    if (!account || !provider) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid funding amount');
      return;
    }

    if (parseFloat(amount) < 0.001) {
      toast.error('Minimum funding amount is 0.001 ETH');
      return;
    }

    if (project.status !== 'active') {
      toast.error('This project is not accepting funds');
      return;
    }

    if (fhevmStatus !== 'ready' || !fhevmInstance) {
      toast.error('FHE encryption not ready. Please wait...');
      return;
    }

    setLoading(true);
    try {
      toast.info(`🚀 Processing private contribution of ${amount} ${project.currency}...`);

      // Step 1: Create encrypted input for contribution amount
      toast.info('🔐 Encrypting contribution amount with FHE...');
      const contractAddress = CONTRACT_ADDRESSES.PrivacyFundraising || CONTRACT_ADDRESSES.FHECounter;
      const encryptedInput = fhevmInstance.createEncryptedInput(
        contractAddress,
        account
      );
      
      // Convert contribution amount to scaled integer (same as project creation)
      const contributionAmountScaled = Math.floor(parseFloat(amount) * 1000);
      
      if (contributionAmountScaled > 2**32 - 1) {
        throw new Error('Contribution amount too large for FHE encryption');
      }
      
      encryptedInput.add32(contributionAmountScaled);
      const encryptedData = await encryptedInput.encrypt();
      console.log('🔐 Encrypted contribution:', encryptedData);

      // Step 2: Prepare contract interaction
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, PRIVACY_FUNDRAISING_ABI, signer);

      // Step 3: Send contribution transaction with encrypted amount
      toast.info('💫 Sending private contribution to blockchain...');
      const tx = await contract.contributeToProject(
        project.id,
        encryptedData.handles[0], // Encrypted contribution amount
        encryptedData.inputProof,  // Proof for the encrypted input
        {
          value: ethers.parseEther(amount), // Actual ETH sent
          gasLimit: GAS_LIMITS.CONTRIBUTE
        }
      );

      toast.info('⏳ Waiting for transaction confirmation...');
      console.log('📋 Transaction hash:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);

      // Step 4: Update project funding locally and add transaction record
      const updatedProjects = projects.map(p => {
        if (p.id === project.id) {
          const newCurrentAmount = (parseFloat(p.currentAmount) + parseFloat(amount)).toString();
          const newBackers = p.backers + 1;
          
          return {
            ...p,
            currentAmount: newCurrentAmount,
            backers: newBackers,
            status: parseFloat(newCurrentAmount) >= parseFloat(p.targetAmount) ? 'completed' as const : p.status,
            // Add transaction records for tracking
            transactions: [...(p.transactions || []), {
              txHash: tx.hash,
              blockNumber: receipt.blockNumber,
              contributor: account,
              amount: amount,
              timestamp: new Date().toISOString(),
              encrypted: true
            }]
          };
        }
        return p;
      });

      setProjects(updatedProjects);
      localStorage.setItem('fundingProjects', JSON.stringify(updatedProjects));

      // Step 5: Store private contribution record for user
      const contributionRecord = {
        projectId: project.id,
        projectTitle: project.title,
        amount: amount,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        timestamp: new Date().toISOString(),
        contributor: account,
        encrypted: true,
        visible: true // User can toggle visibility
      };
      
      const existingContributions = JSON.parse(localStorage.getItem(`contributions_${account}`) || '[]');
      existingContributions.push(contributionRecord);
      localStorage.setItem(`contributions_${account}`, JSON.stringify(existingContributions));
      
      // Reload contributions to update UI
      loadMyContributions();

      // Step 6: Show success message with Etherscan link
      const etherscanUrl = getEtherscanUrl(tx.hash);
      toast.success(
        <div>
          <div>🎉 Private contribution successful!</div>
          <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>
            <a href={etherscanUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4CAF50' }}>
              📋 View on Etherscan
            </a>
          </div>
          <div style={{ fontSize: '0.8rem' }}>Amount: {amount} ETH (Encrypted)</div>
        </div>,
        { autoClose: 8000 }
      );
      
      // Clear the funding amount
      setFundingAmounts(prev => ({
        ...prev,
        [project.id]: ''
      }));

    } catch (error: any) {
      console.error('❌ Private contribution failed:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Private contribution failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (current: string, target: string): number => {
    return (parseFloat(current) / parseFloat(target)) * 100;
  };

  const formatTimeRemaining = (deadline: string): string => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  if (!account) {
    return (
      <FundingContainer>
        <FundingCard>
          <Title>💰 Fund Projects</Title>
          <div style={{ textAlign: 'center', color: '#fbbf24' }}>
            Please connect your wallet to fund projects
          </div>
        </FundingCard>
      </FundingContainer>
    );
  }

  return (
    <FundingContainer>
      <FundingCard>
        <Title>💰 Fund Projects</Title>
        
        <InfoBox>
          <strong>🔐 Private Funding with FHE</strong><br/>
          Your contribution amounts are encrypted using FHE technology for maximum privacy while supporting innovative projects.
          <br/><br/>
          <small>✅ Minimum funding: 0.001 ETH</small><br/>
          <small>🔐 FHE Status: {fhevmStatus === 'ready' ? '✅ Ready' : fhevmStatus === 'loading' ? '⏳ Loading' : '❌ Error'}</small><br/>
          <small>📊 Active Projects: {projects.filter(p => p.status === 'active').length}</small>
        </InfoBox>

        {projects.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: 'rgba(255,255,255,0.7)' 
          }}>
            No projects available for funding yet.<br/>
            <small>Check back later or create your own project!</small>
          </div>
        ) : (
          projects.map((project) => (
            <ProjectCard key={project.id}>
              <ProjectHeader>
                <div>
                  <ProjectTitle>{project.title}</ProjectTitle>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                    by {project.creator.slice(0, 8)}...{project.creator.slice(-6)}
                  </div>
                </div>
                <ProjectStatus status={project.status}>
                  {project.status === 'active' && '🟢 Active'}
                  {project.status === 'completed' && '✅ Completed'}
                  {project.status === 'expired' && '⏰ Expired'}
                </ProjectStatus>
              </ProjectHeader>

              <ProjectDescription>{project.description}</ProjectDescription>

              <ProgressBar>
                <ProgressFill percentage={getProgressPercentage(project.currentAmount, project.targetAmount)} />
              </ProgressBar>

              <ProjectMeta>
                <MetaItem>
                  <MetaLabel>Raised</MetaLabel>
                  <MetaValue>{parseFloat(project.currentAmount).toFixed(4)} {project.currency}</MetaValue>
                </MetaItem>
                <MetaItem>
                  <MetaLabel>Goal</MetaLabel>
                  <MetaValue>{parseFloat(project.targetAmount).toFixed(4)} {project.currency}</MetaValue>
                </MetaItem>
                <MetaItem>
                  <MetaLabel>Progress</MetaLabel>
                  <MetaValue>{getProgressPercentage(project.currentAmount, project.targetAmount).toFixed(1)}%</MetaValue>
                </MetaItem>
                <MetaItem>
                  <MetaLabel>Backers</MetaLabel>
                  <MetaValue>{project.backers}</MetaValue>
                </MetaItem>
                <MetaItem>
                  <MetaLabel>Time Left</MetaLabel>
                  <MetaValue>{formatTimeRemaining(project.deadline)}</MetaValue>
                </MetaItem>
                <MetaItem>
                  <MetaLabel>Category</MetaLabel>
                  <MetaValue style={{ fontSize: '0.9rem' }}>
                    {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                  </MetaValue>
                </MetaItem>
              </ProjectMeta>

              {project.status === 'active' && (
                <FundingSection>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>💝 Support This Project</h4>
                  
                  <InputGroup>
                    <Label>Contribution Amount ({project.currency})</Label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={fundingAmounts[project.id] || ''}
                      onChange={(e) => handleFundingAmountChange(project.id, e.target.value)}
                      placeholder="0.001"
                    />
                    <small style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
                      🔐 Amount will be encrypted using FHE technology
                    </small>
                  </InputGroup>

                  <ActionButton 
                    onClick={() => handleFundProject(project)} 
                    disabled={loading || !fundingAmounts[project.id] || parseFloat(fundingAmounts[project.id] || '0') < 0.001}
                  >
                    {loading ? '⏳ Processing...' : 
                     !fundingAmounts[project.id] ? '💝 Enter Amount to Fund' :
                     parseFloat(fundingAmounts[project.id] || '0') < 0.001 ? '❌ Minimum 0.001 ETH' :
                     `💝 Fund ${fundingAmounts[project.id]} ${project.currency}`}
                  </ActionButton>
                </FundingSection>
              )}

              {project.status === 'completed' && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '15px', 
                  background: 'rgba(76, 175, 80, 0.2)', 
                  borderRadius: '8px',
                  color: '#4CAF50',
                  fontWeight: 600
                }}>
                  🎉 Project Successfully Funded!
                </div>
              )}

              {project.status === 'expired' && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '15px', 
                  background: 'rgba(255, 152, 0, 0.2)', 
                  borderRadius: '8px',
                  color: '#FF9800',
                  fontWeight: 600
                }}>
                  ⏰ Funding Period Ended
                </div>
              )}
            </ProjectCard>
          ))
        )}

        {/* My Contributions Section */}
        {myContributions.length > 0 && (
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: '20px', 
            borderRadius: '10px',
            marginTop: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0 }}>🔐 My Private Contributions ({myContributions.length})</h4>
              <SmallButton onClick={() => setShowContributions(!showContributions)}>
                {showContributions ? '🙈 Hide Records' : '👁️ Show Records'}
              </SmallButton>
            </div>
            
            {showContributions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myContributions.map((contribution, index) => (
                  <div key={index} style={{
                    background: contribution.visible ? 'rgba(76, 175, 80, 0.1)' : 'rgba(158, 158, 158, 0.1)',
                    padding: '15px',
                    borderRadius: '8px',
                    border: `1px solid ${contribution.visible ? 'rgba(76, 175, 80, 0.3)' : 'rgba(158, 158, 158, 0.3)'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                          {contribution.projectTitle}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                          {contribution.visible ? (
                            <>
                              💰 Amount: {contribution.amount} ETH (Encrypted)<br/>
                              📅 Date: {new Date(contribution.timestamp).toLocaleDateString()}<br/>
                              🔗 Block: #{contribution.blockNumber}
                            </>
                          ) : (
                            <>
                              💰 Amount: [Hidden]<br/>
                              📅 Date: {new Date(contribution.timestamp).toLocaleDateString()}<br/>
                              🔗 Block: [Hidden]
                            </>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <SmallButton onClick={() => toggleContributionVisibility(index)}>
                          {contribution.visible ? '🙈 Hide' : '👁️ Show'}
                        </SmallButton>
                        <SmallButton 
                          onClick={() => window.open(getEtherscanUrl(contribution.txHash), '_blank')}
                        >
                          📋 Etherscan
                        </SmallButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </FundingCard>
    </FundingContainer>
  );
};

export default ProjectFunding;