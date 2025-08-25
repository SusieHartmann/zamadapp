import { useCallback, useEffect, useState, useRef } from 'react';
import { ethers } from 'ethers';
import { FhevmInstance } from './useFhevm';
import { CONTRACT_ADDRESSES, FHECounterABI } from '../utils/contracts';

export const useFHECounter = (parameters: {
  instance: FhevmInstance | undefined;
  provider: ethers.BrowserProvider | undefined;
  account: string | undefined;
  chainId: number | undefined;
}) => {
  const { instance, provider, account, chainId } = parameters;

  // States
  const [countHandle, setCountHandle] = useState<string | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isIncOrDec, setIsIncOrDec] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [contractStatus, setContractStatus] = useState<any>({});

  // Refs to avoid stale closures
  const isIncOrDecRef = useRef<boolean>(false);
  const isRefreshingRef = useRef<boolean>(false);

  // Contract info
  const contractAddress = CONTRACT_ADDRESSES.FHECounter;
  const isDeployed = !!contractAddress && contractAddress !== ethers.ZeroAddress;

  // Can perform operations
  const canGetCount = contractAddress && provider && !isRefreshing;
  const canIncOrDec = contractAddress && instance && provider && account && !isRefreshing && !isIncOrDec;

  // Refresh count handle from contract
  const refreshCountHandle = useCallback(async () => {
    if (isRefreshingRef.current || !contractAddress || !provider) {
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);
    setMessage("Loading count handle...");

    try {
      const contract = new ethers.Contract(contractAddress, FHECounterABI, provider);
      const handle = await contract.getCount();
      
      setCountHandle(handle);
      setMessage(`Count handle loaded: ${handle.slice(0, 20)}...`);
      
      // Also try to get contract status
      try {
        const status = await contract.getCounterStatus();
        const isDecrypted = await contract.isCountDecrypted();
        
        setContractStatus({
          status: status.toString(),
          isDecrypted,
          handle: handle
        });
        
      } catch (statusError) {
        console.warn("Could not get contract status:", statusError);
        setContractStatus({
          status: "Connected",
          isDecrypted: false,
          handle: handle
        });
      }
      
    } catch (error: any) {
      console.error("Failed to refresh count handle:", error);
      setMessage(`Failed to load count: ${error.message}`);
      setCountHandle(undefined);
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [contractAddress, provider]);

  // Auto refresh on mount and when dependencies change
  useEffect(() => {
    refreshCountHandle();
  }, [refreshCountHandle]);

  // Increment/Decrement function
  const incOrDec = useCallback(async (value: number) => {
    if (isIncOrDecRef.current || !instance || !provider || !account || !contractAddress || value === 0) {
      return;
    }

    isIncOrDecRef.current = true;
    setIsIncOrDec(true);

    const operation = value > 0 ? "increment" : "decrement";
    const absValue = Math.abs(value);
    
    setMessage(`Starting ${operation} by ${absValue}...`);

    try {
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      const contract = new ethers.Contract(contractAddress, FHECounterABI, signer);

      // Create encrypted input using FHEVM instance
      setMessage("Creating encrypted input...");
      const input = instance.createEncryptedInput(contractAddress, signerAddress);
      input.add32(absValue);

      setMessage("Encrypting value (this may take a moment)...");
      const encryptedInput = await input.encrypt();

      setMessage(`Calling contract ${operation}...`);
      
      let tx: ethers.TransactionResponse;
      if (operation === "increment") {
        tx = await contract.increment(encryptedInput.handles[0], encryptedInput.inputProof);
      } else {
        tx = await contract.decrement(encryptedInput.handles[0], encryptedInput.inputProof);
      }

      setMessage(`Transaction submitted: ${tx.hash.slice(0, 20)}...`);
      
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        setMessage(`✅ ${operation.charAt(0).toUpperCase() + operation.slice(1)} successful! Refreshing...`);
        // Refresh the count handle after successful operation
        setTimeout(() => refreshCountHandle(), 2000);
      } else {
        setMessage(`❌ ${operation} transaction failed`);
      }

    } catch (error: any) {
      console.error(`${operation} failed:`, error);
      
      if (error.code === 4001) {
        setMessage(`❌ ${operation} cancelled by user`);
      } else if (error.data === '0xb9688461') {
        setMessage(`⚠️ FHE encryption error - this is expected in demo mode`);
      } else if (error.message?.includes('ENUM_RANGE_ERROR') || error.message?.includes('Panic due to ENUM_RANGE_ERROR')) {
        setMessage(`❌ ${operation} failed: Contract expects proper FHE encryption data. Please ensure you're connected to the correct network with FHE support.`);
      } else {
        setMessage(`❌ ${operation} failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      isIncOrDecRef.current = false;
      setIsIncOrDec(false);
    }
  }, [instance, provider, account, contractAddress, refreshCountHandle]);

  return {
    // Contract info
    contractAddress,
    isDeployed,
    
    // State
    handle: countHandle,
    contractStatus,
    message,
    
    // Status flags
    canGetCount,
    canIncOrDec,
    isRefreshing,
    isIncOrDec,
    
    // Actions
    refreshCountHandle,
    incOrDec
  };
};