import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { useWalletContext } from '../providers/WalletProvider';
import { CONTRACT_ADDRESSES } from '../utils/contracts';
import { useFhevm } from '../hooks/useFhevm';
import { useFHECounter } from '../hooks/useFHECounter';

const FHEContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 600px;
  margin: 0 auto;
`;

const FHECard = styled.div`
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

const ContractInfo = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 0.9rem;
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

const StatusSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 10px;
  margin-top: 15px;
`;

const StatusItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
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

const FHEContractInterface: React.FC = () => {
  const { account, provider, chainId } = useWalletContext();
  const [counterValue, setCounterValue] = useState<string>('1');

  // Initialize FHEVM instance
  const { instance: fhevmInstance, status: fhevmStatus, error: fhevmError } = useFhevm({
    provider: provider || undefined,
    chainId: chainId || undefined,
    enabled: true
  });

  // Initialize FHE Counter hook with correct parameters based on reference
  const fheCounter = useFHECounter({
    instance: fhevmInstance,
    provider: provider || undefined,
    account: account || undefined,
    chainId: chainId || undefined
  });

  // Debug logging
  useEffect(() => {
    console.log('🔍 FHE Debug Info:');
    console.log('- provider:', !!provider);
    console.log('- account:', account);
    console.log('- chainId:', chainId);
    console.log('- fhevmInstance:', !!fhevmInstance);
    console.log('- fhevmStatus:', fhevmStatus);
    console.log('- fhevmError:', fhevmError);
    console.log('- fheCounter.canIncOrDec:', fheCounter.canIncOrDec);
    console.log('- fheCounter.isDeployed:', fheCounter.isDeployed);
    console.log('- fheCounter object:', fheCounter);
    
    if (fhevmError) {
      console.error('🚨 FHEVM Error Details:', fhevmError);
      console.error('🚨 Error message:', fhevmError.message);
      console.error('🚨 Error stack:', fhevmError.stack);
    }
  }, [provider, account, chainId, fhevmInstance, fhevmStatus, fhevmError, fheCounter]);

  const handleIncrement = () => {
    const value = parseInt(counterValue);
    if (isNaN(value) || value <= 0) {
      toast.error('Please enter a valid positive number');
      return;
    }
    
    console.log('🚀 handleIncrement called with value:', value);
    console.log('🔍 fheCounter object:', fheCounter);
    console.log('🔍 incOrDec function:', fheCounter.incOrDec);
    console.log('🔍 canIncOrDec:', fheCounter.canIncOrDec);
    
    if (fheCounter.incOrDec) {
      toast.info(`🚀 Starting FHE increment by ${value}...`);
      fheCounter.incOrDec(value);
    } else {
      toast.error('FHE increment function not available');
    }
  };

  const handleDecrement = () => {
    const value = parseInt(counterValue);
    if (isNaN(value) || value <= 0) {
      toast.error('Please enter a valid positive number');
      return;
    }
    
    console.log('🚀 handleDecrement called with value:', value);
    console.log('🔍 fheCounter object:', fheCounter);
    
    if (fheCounter.incOrDec) {
      toast.info(`🚀 Starting FHE decrement by ${value}...`);
      fheCounter.incOrDec(-value);
    } else {
      toast.error('FHE decrement function not available');
    }
  };

  const handleRequestDecryption = () => {
    toast.info('🔓 Decryption functionality will be available in future versions');
  };

  return (
    <FHEContainer>
      <FHECard>
        <Title>🔐 FHEVM Contract Integration</Title>
        
        <ContractInfo>
          <strong>🔐 FHEVM Integration Status:</strong><br/>
          <small>🔢 FHE Counter: {CONTRACT_ADDRESSES.FHECounter.slice(0, 10)}...</small><br/>
          <small>📡 FHEVM Instance: {fhevmStatus === 'ready' ? '✅ Ready' : fhevmStatus === 'loading' ? '⏳ Loading' : fhevmStatus === 'error' ? '❌ Error' : '⚪ Idle'}</small><br/>
          <small>🏗️ Contract: {fheCounter.isDeployed ? '✅ Deployed' : '❌ Not Found'}</small><br/>
          <small>⚡ Template: fhevm-react-template</small><br/>
          <small>🎯 Status: {fhevmInstance ? 'Mock Instance Active' : 'Initializing...'}</small>
        </ContractInfo>
        
        {account ? (
          <>
            <InputGroup>
              <Label>Increment/Decrement Value:</Label>
              <Input
                type="number"
                min="1"
                value={counterValue}
                onChange={(e) => setCounterValue(e.target.value)}
                placeholder="Enter value for FHE operations"
              />
            </InputGroup>

            <ActionButton onClick={handleIncrement} disabled={!fheCounter.canIncOrDec}>
              {fheCounter.isIncOrDec ? '🔄 Processing FHE...' : 
               !fhevmInstance ? '⏳ Loading FHEVM...' : 
               !fheCounter.canIncOrDec ? `❌ Cannot Increment (provider: ${!!provider}, account: ${!!account}, instance: ${!!fhevmInstance})` : 
               '⬆️ FHE Increment'}
            </ActionButton>
            
            <ActionButton onClick={handleDecrement} disabled={!fheCounter.canIncOrDec}>
              {fheCounter.isIncOrDec ? '🔄 Processing FHE...' : 
               !fhevmInstance ? '⏳ Loading FHEVM...' : 
               !fheCounter.canIncOrDec ? `❌ Cannot Decrement (provider: ${!!provider}, account: ${!!account}, instance: ${!!fhevmInstance})` : 
               '⬇️ FHE Decrement'}
            </ActionButton>
            
            <ActionButton onClick={handleRequestDecryption} disabled={false}>
              {'🔓 Request Decryption (Coming Soon)'}
            </ActionButton>

            <div style={{ 
              background: fheCounter.message?.includes('failed') ? 'rgba(255, 152, 0, 0.15)' : 'rgba(76, 175, 80, 0.15)', 
              padding: '18px', 
              borderRadius: '10px', 
              marginTop: '15px',
              fontSize: '0.9rem',
              border: `1px solid ${fheCounter.message?.includes('failed') ? 'rgba(255, 152, 0, 0.3)' : 'rgba(76, 175, 80, 0.3)'}`
            }}>
              <strong>🚀 FHEVM Integration Active:</strong><br/>
              <small>✅ Based on official fhevm-react-template</small><br/>
              <small>⚡ Real FHE encryption with Zama RelayerSDK</small><br/>
              <small>🔐 Contract: {CONTRACT_ADDRESSES.FHECounter.slice(0, 10)}...</small><br/>
              <small>📊 Status: {fheCounter.message || 'Ready for operations'}</small><br/>
              {fhevmStatus === 'loading' && (
                <>
                  <br/>
                  <small style={{color: '#2196f3'}}>
                    ⏳ Loading FHEVM RelayerSDK and initializing encryption...
                  </small>
                </>
              )}
              {fhevmStatus === 'error' && (
                <>
                  <br/>
                  <small style={{color: '#f44336'}}>
                    ❌ Failed to initialize FHEVM. Please check network connection.
                  </small>
                </>
              )}
            </div>

            <StatusSection>
              <StatusItem>
                <span>FHEVM Status:</span>
                <span>{fhevmStatus === 'ready' ? '✅ Ready' : fhevmStatus === 'loading' ? '⏳ Loading' : fhevmStatus === 'error' ? '❌ Error' : '⚪ Idle'}</span>
              </StatusItem>
              <StatusItem>
                <span>Contract Handle:</span>
                <span>{fheCounter.handle ? `${fheCounter.handle.slice(0, 10)}...` : 'Loading...'}</span>
              </StatusItem>
              <StatusItem>
                <span>Can Operate:</span>
                <span>{fheCounter.canIncOrDec ? '✅ Yes' : '❌ No'}</span>
              </StatusItem>
              <StatusItem>
                <span>Connected Account:</span>
                <span>{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected'}</span>
              </StatusItem>
            </StatusSection>
          </>
        ) : (
          <StatusSection>
            <StatusItem style={{ justifyContent: 'center' }}>
              <span style={{ color: '#fbbf24' }}>⚠️ Please connect your wallet to interact with FHE contracts</span>
            </StatusItem>
          </StatusSection>
        )}
      </FHECard>
    </FHEContainer>
  );
};

export default FHEContractInterface;