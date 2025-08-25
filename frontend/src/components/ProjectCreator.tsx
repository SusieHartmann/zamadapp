import React, { useState } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { useWalletContext } from '../providers/WalletProvider';
import { ethers } from 'ethers';
import { useFhevm } from '../hooks/useFhevm';
import { CONTRACT_ADDRESSES, PRIVACY_FUNDRAISING_ABI, getEtherscanUrl, GAS_LIMITS } from '../utils/contracts';

const CreatorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const CreatorCard = styled.div`
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
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

const FormSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
`;

const InputGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  min-height: 100px;
  resize: vertical;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 15px 25px;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
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

const InfoBox = styled.div`
  background: rgba(255, 255, 255, 0.15);
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 0.9rem;
`;

interface ProjectData {
  title: string;
  description: string;
  targetAmount: string;
  currency: string;
  deadline: string;
  category: string;
  imageUrl: string;
}

type TabType = 'fhe' | 'create' | 'fund' | 'projects' | 'claim';

interface ProjectCreatorProps {
  onNavigate?: (tab: TabType) => void;
}

const ProjectCreator: React.FC<ProjectCreatorProps> = ({ onNavigate }) => {
  const { account, provider, chainId } = useWalletContext();
  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({
    provider: provider || undefined,
    chainId: chainId || undefined,
    enabled: true
  });

  const [projectData, setProjectData] = useState<ProjectData>({
    title: '',
    description: '',
    targetAmount: '',
    currency: 'ETH',
    deadline: '',
    category: 'technology',
    imageUrl: ''
  });

  const [loading, setLoading] = useState(false);

  // 支持的货币类型
  const supportedCurrencies = [
    { value: 'ETH', label: 'Sepolia ETH', symbol: 'ETH' },
    { value: 'USDC', label: 'USDC (if available)', symbol: 'USDC' },
    { value: 'LINK', label: 'Chainlink Token', symbol: 'LINK' }
  ];

  // 项目类别
  const categories = [
    { value: 'technology', label: '🔬 Technology' },
    { value: 'art', label: '🎨 Art & Creative' },
    { value: 'gaming', label: '🎮 Gaming' },
    { value: 'defi', label: '💰 DeFi' },
    { value: 'nft', label: '🖼️ NFT' },
    { value: 'dao', label: '🏛️ DAO' },
    { value: 'social', label: '🌍 Social Impact' },
    { value: 'other', label: '📦 Other' }
  ];

  const handleInputChange = (field: keyof ProjectData, value: string) => {
    setProjectData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!projectData.title.trim()) {
      toast.error('Please enter a project title');
      return false;
    }

    if (!projectData.description.trim()) {
      toast.error('Please enter a project description');
      return false;
    }

    if (!projectData.targetAmount || parseFloat(projectData.targetAmount) <= 0) {
      toast.error('Please enter a valid target amount');
      return false;
    }

    if (!projectData.deadline) {
      toast.error('Please select a deadline');
      return false;
    }

    const deadlineDate = new Date(projectData.deadline);
    if (deadlineDate <= new Date()) {
      toast.error('Deadline must be in the future');
      return false;
    }

    return true;
  };

  const handleCreateProject = async () => {
    if (!account || !provider) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (fhevmStatus !== 'ready' || !fhevmInstance) {
      toast.error('FHE encryption not ready. Please wait...');
      return;
    }

    setLoading(true);
    try {
      toast.info('🚀 Creating project on blockchain...');

      // Step 1: Create encrypted input for target amount
      toast.info('🔐 Encrypting target amount with FHE...');
      const contractAddress = CONTRACT_ADDRESSES.PrivacyFundraising || CONTRACT_ADDRESSES.FHECounter;
      const encryptedInput = fhevmInstance.createEncryptedInput(
        contractAddress,
        account
      );
      
      // Convert target amount to a 32-bit integer for FHE encryption
      // For simplicity, we'll work with amounts in ether scaled by 1000 to allow 3 decimal places
      const targetAmountScaled = Math.floor(parseFloat(projectData.targetAmount) * 1000);
      
      if (targetAmountScaled > 2**32 - 1) {
        throw new Error('Target amount too large for FHE encryption (max: 4,294,967 ETH)');
      }
      
      encryptedInput.add32(targetAmountScaled);
      
      const encryptedData = await encryptedInput.encrypt();
      console.log('🔐 Encrypted target amount:', encryptedData);

      // Step 2: Prepare contract interaction
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, PRIVACY_FUNDRAISING_ABI, signer);
      
      // Convert deadline to timestamp
      const deadlineTimestamp = Math.floor(new Date(projectData.deadline).getTime() / 1000);
      
      toast.info('📝 Sending transaction to blockchain...');
      
      // Step 3: Call smart contract
      const tx = await contract.createProject(
        projectData.title,
        projectData.description,
        projectData.category,
        projectData.imageUrl || `https://picsum.photos/400/300?random=${Date.now()}`,
        encryptedData.handles[0], // Encrypted target amount
        encryptedData.inputProof,  // Proof for the encrypted input
        deadlineTimestamp
      );

      toast.info('⏳ Waiting for transaction confirmation...');
      console.log('📋 Transaction hash:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);
      
      // Step 4: Extract project ID from events
      const projectCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'ProjectCreated';
        } catch {
          return false;
        }
      });
      
      let projectId = 'unknown';
      if (projectCreatedEvent) {
        const parsed = contract.interface.parseLog(projectCreatedEvent);
        projectId = parsed?.args[0]?.toString() || 'unknown';
        console.log('🎯 Created project ID:', projectId);
      }

      // Step 5: Save to local storage for UI (in addition to blockchain)
      const newProject = {
        id: projectId,
        title: projectData.title,
        description: projectData.description,
        targetAmount: projectData.targetAmount,
        currency: projectData.currency,
        deadline: projectData.deadline,
        category: projectData.category,
        imageUrl: projectData.imageUrl || `https://picsum.photos/400/300?random=${Date.now()}`,
        creator: account,
        currentAmount: '0',
        backers: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

      const existingProjects = JSON.parse(localStorage.getItem('fundingProjects') || '[]');
      existingProjects.push(newProject);
      localStorage.setItem('fundingProjects', JSON.stringify(existingProjects));

      // Step 6: Show success message with Etherscan link and navigation options
      const etherscanUrl = getEtherscanUrl(tx.hash);
      toast.success(
        <div>
          <div>🎉 Project created successfully!</div>
          <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>
            <a href={etherscanUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4CAF50' }}>
              📋 View on Etherscan
            </a>
          </div>
          <div style={{ fontSize: '0.8rem' }}>Project ID: {projectId}</div>
          {onNavigate && (
            <div style={{ marginTop: '10px' }}>
              <button 
                onClick={() => onNavigate('projects')}
                style={{ 
                  background: 'transparent', 
                  border: '1px solid #4CAF50', 
                  color: '#4CAF50',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  marginRight: '5px'
                }}
              >
                📊 View All Projects
              </button>
              <button 
                onClick={() => onNavigate('fund')}
                style={{ 
                  background: 'transparent', 
                  border: '1px solid #4CAF50', 
                  color: '#4CAF50',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                💰 Fund Projects
              </button>
            </div>
          )}
        </div>,
        { autoClose: 12000 }
      );
      
      // Clear form
      setProjectData({
        title: '',
        description: '',
        targetAmount: '',
        currency: 'ETH',
        deadline: '',
        category: 'technology',
        imageUrl: ''
      });

    } catch (error: any) {
      console.error('❌ Project creation failed:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Failed to create project: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <CreatorContainer>
        <CreatorCard>
          <Title>🚀 Create New Project</Title>
          <div style={{ textAlign: 'center', color: '#fbbf24' }}>
            Please connect your wallet to create a project
          </div>
        </CreatorCard>
      </CreatorContainer>
    );
  }

  return (
    <CreatorContainer>
      <CreatorCard>
        <Title>🚀 Create New Project</Title>
        
        <InfoBox>
          <strong>💡 Create Your Funding Project</strong><br/>
          Launch your project with privacy-preserving FHE technology. Your funding goals and sensitive information will be encrypted on-chain.
          <br/><br/>
          <small>✅ Supports Sepolia ETH and other tokens</small><br/>
          <small>🔐 FHE Status: {fhevmStatus === 'ready' ? '✅ Ready' : fhevmStatus === 'loading' ? '⏳ Loading' : '❌ Error'}</small>
        </InfoBox>

        <FormSection>
          <h3>📋 Basic Information</h3>
          
          <InputGroup>
            <Label>Project Title *</Label>
            <Input
              type="text"
              value={projectData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter your project title"
              maxLength={100}
            />
          </InputGroup>

          <InputGroup>
            <Label>Project Description *</Label>
            <TextArea
              value={projectData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your project, its goals, and what you plan to achieve..."
              maxLength={1000}
            />
          </InputGroup>

          <InputGroup>
            <Label>Category *</Label>
            <Select
              value={projectData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </InputGroup>

          <InputGroup>
            <Label>Project Image URL (Optional)</Label>
            <Input
              type="url"
              value={projectData.imageUrl}
              onChange={(e) => handleInputChange('imageUrl', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </InputGroup>
        </FormSection>

        <FormSection>
          <h3>💰 Funding Details</h3>
          
          <InputGroup>
            <Label>Funding Goal *</Label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Input
                type="number"
                step="0.001"
                min="0.001"
                value={projectData.targetAmount}
                onChange={(e) => handleInputChange('targetAmount', e.target.value)}
                placeholder="0.0"
                style={{ flex: 1 }}
              />
              <Select
                value={projectData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                style={{ flex: '0 0 150px' }}
              >
                {supportedCurrencies.map(currency => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </Select>
            </div>
            <small style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
              🔐 Amount will be encrypted using FHE technology
            </small>
          </InputGroup>

          <InputGroup>
            <Label>Project Deadline *</Label>
            <Input
              type="datetime-local"
              value={projectData.deadline}
              onChange={(e) => handleInputChange('deadline', e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </InputGroup>
        </FormSection>

        <ActionButton 
          onClick={handleCreateProject} 
          disabled={loading || fhevmStatus !== 'ready'}
        >
          {loading ? '⏳ Creating Project...' : 
           fhevmStatus !== 'ready' ? '🔄 Waiting for FHE...' : 
           '🚀 Create Project'}
        </ActionButton>

        {fhevmStatus !== 'ready' && (
          <div style={{ 
            textAlign: 'center', 
            marginTop: '10px', 
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.8)'
          }}>
            FHE encryption is required for secure project creation
          </div>
        )}
      </CreatorCard>
    </CreatorContainer>
  );
};

export default ProjectCreator;