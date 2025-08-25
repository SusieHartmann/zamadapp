import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useWalletContext } from '../providers/WalletProvider';
import { CONTRACT_ADDRESSES } from '../utils/contracts';

const DonationContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
  max-width: 600px;
  margin: 0 auto;
`;

const DonationCard = styled.div`
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
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

const Description = styled.p`
  text-align: center;
  margin-bottom: 20px;
  font-size: 1.1rem;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
`;

const Button = styled.button`
  width: 100%;
  padding: 15px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 10px;
  margin-top: 20px;
`;

const StatusItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

interface DonationInterfaceProps {}

const DonationInterface: React.FC<DonationInterfaceProps> = () => {
  const { account, provider } = useWalletContext();
  const [donationAmount, setDonationAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState(CONTRACT_ADDRESSES.DonationWallet); // Wallet from mnemonic
  const [isLoading, setIsLoading] = useState(false);
  const [totalDonations, setTotalDonations] = useState('0');
  const [userBalance, setUserBalance] = useState('0');

  useEffect(() => {
    if (account && provider) {
      loadUserBalance();
    }
  }, [account, provider]);

  const loadUserBalance = async () => {
    if (!provider || !account) return;
    
    try {
      const balance = await provider.getBalance(account);
      setUserBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handleDonate = async () => {
    if (!provider || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    const amountFloat = parseFloat(donationAmount);
    console.log('Donation amount:', donationAmount, 'Parsed:', amountFloat, 'Comparison:', amountFloat >= 0.001);
    
    if (!donationAmount || isNaN(amountFloat) || amountFloat < 0.001) {
      toast.error(`Minimum donation amount is 0.001 ETH. You entered: ${donationAmount} ETH`);
      return;
    }

    if (!ethers.isAddress(recipientAddress)) {
      toast.error('Please enter a valid recipient address');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting donation transaction...');
      console.log('Recipient:', recipientAddress);
      console.log('Amount:', donationAmount, 'ETH');
      
      const signer = await provider.getSigner();
      const parsedValue = ethers.parseEther(donationAmount);
      console.log('Parsed value (wei):', parsedValue.toString());
      
      const tx = await signer.sendTransaction({
        to: recipientAddress,
        value: parsedValue
      });

      console.log('Transaction submitted:', tx.hash);
      toast.info('Transaction submitted, waiting for confirmation...');
      await tx.wait();
      
      toast.success(`Successfully donated ${donationAmount} ETH! Transaction: ${tx.hash.slice(0, 10)}...`);
      
      // Update balances
      loadUserBalance();
      setDonationAmount('');
      
    } catch (error: any) {
      console.error('Donation failed:', error);
      if (error.code === 4001) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(`Donation failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const quickAmountButtons = ['0.001', '0.01', '0.1', '0.5'];

  return (
    <DonationContainer>
      <DonationCard>
        <Title>💝 Crypto Donation Platform</Title>
        <Description>
          Support the development of FHE privacy technology and blockchain innovation!<br/>
          <small style={{ fontSize: '0.9rem', opacity: '0.8' }}>Minimum donation: 0.001 ETH</small>
        </Description>
        
        <InputGroup>
          <Label>Recipient Address:</Label>
          <Input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="Enter recipient address"
          />
        </InputGroup>

        <InputGroup>
          <Label>Donation Amount (ETH):</Label>
          <Input
            type="number"
            step="0.001"
            min="0.001"
            value={donationAmount}
            onChange={(e) => setDonationAmount(e.target.value)}
            placeholder="Minimum: 0.001 ETH"
          />
        </InputGroup>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {quickAmountButtons.map(amount => (
            <Button
              key={amount}
              onClick={() => {
                console.log('Setting donation amount to:', amount);
                setDonationAmount(amount);
              }}
              style={{ width: 'auto', flex: 1, minWidth: '80px' }}
              disabled={isLoading}
            >
              {amount} ETH
            </Button>
          ))}
        </div>

        <Button onClick={handleDonate} disabled={isLoading || !account}>
          {isLoading ? '🔄 Processing...' : '💖 Donate Now'}
        </Button>

        {account && (
          <StatusSection>
            <StatusItem>
              <span>Your Balance:</span>
              <span>{parseFloat(userBalance).toFixed(6)} ETH</span>
            </StatusItem>
            <StatusItem>
              <span>Connected Account:</span>
              <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
            </StatusItem>
            <StatusItem>
              <span>Status:</span>
              <span style={{ color: '#4ade80' }}>✅ Ready to donate</span>
            </StatusItem>
          </StatusSection>
        )}

        {!account && (
          <StatusSection>
            <StatusItem style={{ justifyContent: 'center' }}>
              <span style={{ color: '#fbbf24' }}>⚠️ Please connect your wallet to donate</span>
            </StatusItem>
          </StatusSection>
        )}
      </DonationCard>
    </DonationContainer>
  );
};

export default DonationInterface;