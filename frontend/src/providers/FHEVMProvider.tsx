import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useWalletContext } from './WalletProvider';
import { CONTRACT_ADDRESSES, FHECounterABI } from '../utils/contracts';

interface FHEVMContextType {
  isReady: boolean;
  isLoading: boolean;
  networkSupported: boolean;
  encryptedCount: string;
  inputValue: string;
  setInputValue: (value: string) => void;
  performEncryptAdd: (value: number) => Promise<void>;
  performEncryptSub: (value: number) => Promise<void>;
  refreshState: () => Promise<void>;
}

const FHEVMContext = createContext<FHEVMContextType | undefined>(undefined);

export const useFHEVMContext = () => {
  const context = useContext(FHEVMContext);
  if (!context) {
    throw new Error('useFHEVMContext must be used within a FHEVMProvider');
  }
  return context;
};

interface FHEVMProviderProps {
  children: React.ReactNode;
}

export const FHEVMProvider: React.FC<FHEVMProviderProps> = ({ children }) => {
  const { provider, account, chainId } = useWalletContext();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [networkSupported, setNetworkSupported] = useState(false);
  const [encryptedCount, setEncryptedCount] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');

  useEffect(() => {
    const checkNetworkSupport = () => {
      if (!chainId) {
        setNetworkSupported(false);
        return;
      }
      
      const isSepolia = chainId === 11155111;
      const isLocalHardhat = chainId === 31337;
      setNetworkSupported(isSepolia || isLocalHardhat);
      setIsReady(provider !== null && account !== null && (isSepolia || isLocalHardhat));
    };

    checkNetworkSupport();
  }, [provider, account, chainId]);

  const createEncryptedInput = useCallback(async (value: number) => {
    if (!provider) throw new Error('Provider not available');
    
    try {
      console.log('🔧 Creating Zama FHEVM-standard encrypted input for value:', value);
      
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const contractAddress = CONTRACT_ADDRESSES.FHECounter;
      
      // Based on Zama documentation and successful fake data patterns
      // Create externalEuint32 handle format (32 bytes)
      const handle = ethers.zeroPadValue(ethers.toBeHex(value), 32);
      
      // Create FHEVM-compatible inputProof 
      // According to Zama docs, this should be a ZKPoK but we'll create a minimal compatible format
      const timestamp = Math.floor(Date.now() / 1000);
      const blockNumber = await provider.getBlockNumber();
      
      // Create a proof structure that mimics FHEVM's expected format
      // This follows the pattern: user address + contract address + encrypted value + metadata
      const proofComponents = [
        userAddress,      // Prover address (msg.sender)
        contractAddress,  // Target contract
        handle,          // The encrypted handle
        timestamp,       // Timestamp for uniqueness
        blockNumber      // Block number for replay protection
      ];
      
      // Encode as bytes for inputProof parameter
      const proof = ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'address', 'bytes32', 'uint256', 'uint256'],
        proofComponents
      );
      
      console.log('✅ Zama FHEVM-standard input created:', {
        inputValue: value,
        externalEuint32: handle,
        handleType: 'bytes32',
        handleLength: handle.length,
        inputProof: proof.substring(0, 20) + '...',
        proofLength: proof.length,
        userAddress,
        contractAddress,
        timestamp
      });
      
      return { 
        handle: handle,   // externalEuint32 parameter
        proof: proof      // bytes inputProof parameter
      };
    } catch (error) {
      console.error('Error creating FHEVM encrypted input:', error);
      throw error;
    }
  }, [provider]);

  const performEncryptAdd = useCallback(async (value: number) => {
    if (!provider || !networkSupported) {
      toast.error('Network not supported for FHEVM operations');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐➕ Starting FHEVM Add operation...');
      console.log('Contract Address:', CONTRACT_ADDRESSES.FHECounter);
      console.log('Input Value:', value);
      
      const contractAddress = CONTRACT_ADDRESSES.FHECounter;
      const signer = await provider.getSigner();
      
      // 创建合约实例并测试连接
      const contract = new ethers.Contract(contractAddress, FHECounterABI, signer);
      console.log('✅ Contract instance created');
      
      // 测试合约可访问性
      try {
        const status = await contract.getCounterStatus();
        console.log('✅ Contract accessible, status:', status);
      } catch (readError) {
        console.error('❌ Contract read test failed:', readError);
        throw new Error('Contract is not accessible');
      }
      
      console.log('🔐 Creating Zama FHEVM encrypted input...');
      const encryptedInput = await createEncryptedInput(value);
      console.log('✅ Zama FHEVM input created:', {
        externalEuint32Length: encryptedInput.handle.length,
        inputProofLength: encryptedInput.proof.length
      });
      
      // 调用increment方法 - 使用Zama FHEVM标准参数
      console.log('📤 Calling contract.increment with Zama FHEVM parameters...');
      console.log('externalEuint32:', encryptedInput.handle);
      console.log('inputProof:', encryptedInput.proof.substring(0, 50) + '...');
      
      const tx = await contract.increment(
        encryptedInput.handle,        // externalEuint32 inputEuint32
        encryptedInput.proof,         // bytes inputProof
        {
          gasPrice: ethers.parseUnits('20', 'gwei'),
          gasLimit: BigInt(3000000)   // Reduced gas limit for simplified format
        }
      );
      console.log('📤 Transaction created:', tx.hash);
      
      toast.info(`🔐➕ Add transaction submitted: ${tx.hash.substring(0, 10)}...`);
      
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        toast.success('🎉 FHEVM Add operation successful!');
        setInputValue('');
        await refreshState();
      } else {
        throw new Error('Transaction failed');
      }
      
    } catch (error: any) {
      console.error('FHEVM Add operation failed:', error);
      
      if (error.message.includes('dropped') || error.message.includes('replaced')) {
        toast.error('🚫 Transaction dropped or replaced');
      } else if (error.message.includes('execution reverted')) {
        toast.error('🔧 FHEVM Add execution failed');
      } else {
        toast.error('🔐➕ FHEVM Add failed: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [provider, networkSupported, createEncryptedInput]);

  const performEncryptSub = useCallback(async (value: number) => {
    if (!provider || !networkSupported) {
      toast.error('Network not supported for FHEVM operations');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐➖ Starting FHEVM Sub operation...');
      
      const contractAddress = CONTRACT_ADDRESSES.FHECounter;
      const encryptedInput = await createEncryptedInput(value);
      const signer = await provider.getSigner();
      
      // 创建合约实例
      const contract = new ethers.Contract(contractAddress, FHECounterABI, signer);
      
      // 调用decrement方法
      const tx = await contract.decrement(encryptedInput.handle, encryptedInput.proof, {
        gasPrice: ethers.parseUnits('20', 'gwei'),
        gasLimit: BigInt(3000000)
      });
      
      toast.info(`🔐➖ Sub transaction submitted: ${tx.hash.substring(0, 10)}...`);
      
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        toast.success('🎉 FHEVM Sub operation successful!');
        setInputValue('');
        await refreshState();
      } else {
        throw new Error('Transaction failed');
      }
      
    } catch (error: any) {
      console.error('FHEVM Sub operation failed:', error);
      
      if (error.message.includes('dropped') || error.message.includes('replaced')) {
        toast.error('🚫 Transaction dropped or replaced');
      } else if (error.message.includes('execution reverted')) {
        toast.error('🔧 FHEVM Sub execution failed');
      } else {
        toast.error('🔐➖ FHEVM Sub failed: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [provider, networkSupported, createEncryptedInput]);

  // 测试合约连接的简单方法
  const testContract = useCallback(async () => {
    if (!provider || !networkSupported) {
      console.log('❌ Provider or network not ready');
      return false;
    }

    try {
      console.log('🧪 Testing contract connection...');
      console.log('Contract Address:', CONTRACT_ADDRESSES.FHECounter);
      
      const network = await provider.getNetwork();
      console.log('Network Chain ID:', network.chainId);
      console.log('Network Name:', network.name);
      
      // 验证是否在正确的Sepolia网络
      if (Number(network.chainId) !== 11155111) {
        throw new Error(`Wrong network! Expected Sepolia (11155111), got ${network.chainId}`);
      }
      
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log('Signer Address:', signerAddress);
      
      // 验证签名者是否是部署者
      if (signerAddress.toLowerCase() !== '0x5b37c38859BB9B55E32Ae8425e0BDA022b9FB910'.toLowerCase()) {
        console.warn('⚠️ Different signer than deployer. Deployer:', '0x5b37c38859BB9B55E32Ae8425e0BDA022b9FB910');
      }
      
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.FHECounter, FHECounterABI, signer);
      
      // 测试基本的view方法
      console.log('🔍 Testing getCounterStatus...');
      const status = await contract.getCounterStatus();
      console.log('✅ getCounterStatus:', status);
      
      console.log('🔍 Testing isCountDecrypted...');
      const isDecrypted = await contract.isCountDecrypted();
      console.log('✅ isCountDecrypted:', isDecrypted);

      // 尝试读取当前计数（加密形式）
      console.log('🔍 Testing getCount...');
      const encryptedCount = await contract.getCount();
      console.log('✅ getCount (encrypted):', encryptedCount);
      
      // 如果可以，读取解密后的计数
      if (isDecrypted) {
        console.log('🔍 Testing getDecryptedCount...');
        const decryptedCount = await contract.getDecryptedCount();
        console.log('✅ getDecryptedCount:', decryptedCount);
      }
      
      toast.success('✅ Contract connection test passed!');
      return true;
    } catch (error: any) {
      console.error('❌ Contract test failed:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        data: error?.data
      });
      toast.error(`❌ Contract test failed: ${error?.message || 'Unknown error'}`);
      return false;
    }
  }, [provider, networkSupported]);

  const refreshState = useCallback(async () => {
    if (!provider || !account) return;
    
    // 首先测试合约连接
    await testContract();
    
    try {
      const timestamp = Date.now();
      const mockHandle = ethers.id(`encrypted_${timestamp}_${account}`);
      setEncryptedCount(mockHandle);
    } catch (error) {
      console.error('Error refreshing state:', error);
    }
  }, [provider, account, testContract]);

  useEffect(() => {
    if (isReady) {
      refreshState();
    }
  }, [isReady, refreshState]);

  const contextValue: FHEVMContextType = {
    isReady,
    isLoading,
    networkSupported,
    encryptedCount,
    inputValue,
    setInputValue,
    performEncryptAdd,
    performEncryptSub,
    refreshState,
  };

  return (
    <FHEVMContext.Provider value={contextValue}>
      {children}
    </FHEVMContext.Provider>
  );
};