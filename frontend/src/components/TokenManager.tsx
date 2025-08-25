import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { useWalletContext } from '../providers/WalletProvider';
import { ethers } from 'ethers';

const TokenContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const TokenCard = styled.div`
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

const TokenGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const TokenItem = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  padding: 10px;
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
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
`;

const SmallButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// 简单的ERC20 ABI
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
}

const TokenManager: React.FC = () => {
  const { account, provider } = useWalletContext();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 默认代币列表 (Sepolia测试网)
  const defaultTokens = [
    {
      address: '0x779877A7B0D9E8603169DdbD7836e478b4624789', // Sepolia LINK
      symbol: 'LINK'
    },
    {
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI (如果有的话)
      symbol: 'UNI'
    }
  ];

  useEffect(() => {
    if (account && provider) {
      loadDefaultTokens();
    }
  }, [account, provider]);

  const loadDefaultTokens = async () => {
    const tokenInfos: TokenInfo[] = [];
    
    for (const token of defaultTokens) {
      try {
        const tokenInfo = await getTokenInfo(token.address);
        if (tokenInfo) {
          tokenInfos.push(tokenInfo);
        }
      } catch (error) {
        console.warn(`Failed to load token ${token.symbol}:`, error);
      }
    }
    
    setTokens(tokenInfos);
  };

  const getTokenInfo = async (tokenAddress: string): Promise<TokenInfo | null> => {
    if (!provider || !account) return null;

    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      const [name, symbol, decimals, balance] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.balanceOf(account)
      ]);

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals: Number(decimals),
        balance: ethers.formatUnits(balance, decimals)
      };
    } catch (error) {
      console.error('Failed to get token info:', error);
      return null;
    }
  };

  const handleAddToken = async () => {
    if (!newTokenAddress || !ethers.isAddress(newTokenAddress)) {
      toast.error('Please enter a valid token address');
      return;
    }

    if (tokens.some(token => token.address.toLowerCase() === newTokenAddress.toLowerCase())) {
      toast.error('Token already added');
      return;
    }

    setLoading(true);
    try {
      const tokenInfo = await getTokenInfo(newTokenAddress);
      if (tokenInfo) {
        setTokens(prev => [...prev, tokenInfo]);
        setNewTokenAddress('');
        toast.success(`${tokenInfo.symbol} token added successfully!`);
      } else {
        toast.error('Failed to load token information');
      }
    } catch (error) {
      toast.error('Failed to add token');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedToken || !transferTo || !transferAmount || !provider || !account) {
      toast.error('Please fill all fields');
      return;
    }

    if (!ethers.isAddress(transferTo)) {
      toast.error('Invalid recipient address');
      return;
    }

    const token = tokens.find(t => t.address === selectedToken);
    if (!token) return;

    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(selectedToken, ERC20_ABI, signer);
      
      const amount = ethers.parseUnits(transferAmount, token.decimals);
      const tx = await contract.transfer(transferTo, amount);
      
      toast.info('Transaction submitted...');
      await tx.wait();
      
      toast.success('Transfer successful!');
      setTransferTo('');
      setTransferAmount('');
      
      // Refresh token balances
      loadDefaultTokens();
    } catch (error: any) {
      console.error('Transfer failed:', error);
      toast.error(`Transfer failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshTokens = async () => {
    if (!account || !provider) return;
    
    setLoading(true);
    try {
      const updatedTokens: TokenInfo[] = [];
      for (const token of tokens) {
        const tokenInfo = await getTokenInfo(token.address);
        if (tokenInfo) {
          updatedTokens.push(tokenInfo);
        }
      }
      setTokens(updatedTokens);
      toast.success('Token balances refreshed!');
    } catch (error) {
      toast.error('Failed to refresh tokens');
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <TokenContainer>
        <TokenCard>
          <Title>🪙 Token Manager</Title>
          <div style={{ textAlign: 'center', color: '#fbbf24' }}>
            Please connect your wallet to manage tokens
          </div>
        </TokenCard>
      </TokenContainer>
    );
  }

  return (
    <TokenContainer>
      <TokenCard>
        <Title>🪙 Token Manager</Title>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Your Tokens</h3>
          <SmallButton onClick={refreshTokens} disabled={loading}>
            {loading ? '⏳ Refreshing...' : '🔄 Refresh'}
          </SmallButton>
        </div>

        <TokenGrid>
          {tokens.map((token) => (
            <TokenItem key={token.address}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{token.symbol}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{token.name}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                  {token.address.slice(0, 8)}...{token.address.slice(-6)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold' }}>
                  {parseFloat(token.balance).toFixed(4)}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{token.symbol}</div>
              </div>
            </TokenItem>
          ))}
          
          {tokens.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px', 
              color: 'rgba(255,255,255,0.7)',
              gridColumn: '1 / -1'
            }}>
              No tokens found. Add some tokens below.
            </div>
          )}
        </TokenGrid>

        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          padding: '20px', 
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <h4>Add Token</h4>
          <InputGroup>
            <Label>Token Contract Address:</Label>
            <Input
              type="text"
              value={newTokenAddress}
              onChange={(e) => setNewTokenAddress(e.target.value)}
              placeholder="0x..."
            />
          </InputGroup>
          <ActionButton onClick={handleAddToken} disabled={loading}>
            {loading ? '⏳ Adding...' : '➕ Add Token'}
          </ActionButton>
        </div>

        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          padding: '20px', 
          borderRadius: '10px'
        }}>
          <h4>Transfer Tokens</h4>
          <InputGroup>
            <Label>Select Token:</Label>
            <select 
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '8px', 
                border: 'none',
                fontSize: '14px'
              }}
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
            >
              <option value="">Select a token</option>
              {tokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol} ({parseFloat(token.balance).toFixed(4)} available)
                </option>
              ))}
            </select>
          </InputGroup>
          
          <InputGroup>
            <Label>Recipient Address:</Label>
            <Input
              type="text"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              placeholder="0x..."
            />
          </InputGroup>
          
          <InputGroup>
            <Label>Amount:</Label>
            <Input
              type="number"
              step="0.000001"
              min="0"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0.0"
            />
          </InputGroup>
          
          <ActionButton 
            onClick={handleTransfer} 
            disabled={loading || !selectedToken || !transferTo || !transferAmount}
          >
            {loading ? '⏳ Transferring...' : '💸 Transfer Tokens'}
          </ActionButton>
        </div>
      </TokenCard>
    </TokenContainer>
  );
};

export default TokenManager;