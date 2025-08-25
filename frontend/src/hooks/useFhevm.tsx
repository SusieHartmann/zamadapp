import { ethers } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import { createFhevmInstance } from "../utils/createFhevmInstance";

// Real FHEVM types from @zama-fhe/relayer-sdk
export type FhevmInstance = {
  createEncryptedInput: (contractAddress: string, userAddress: string) => {
    add32: (value: number) => void;
    encrypt: () => Promise<{
      handles: string[];
      inputProof: string;
    }>;
  };
  userDecrypt?: (params: any) => Promise<any>;
  getPublicKey: () => {
    publicKeyId: string;
    publicKey: Uint8Array;
  } | null;
  getPublicParams: (size: number) => {
    publicParamsId: string;
    publicParams: Uint8Array;
  } | null;
};

export type FhevmGoState = "idle" | "loading" | "ready" | "error";

// Declare global types for relayer SDK
declare global {
  interface Window {
    relayerSDK?: {
      initSDK: (options?: any) => Promise<boolean>;
      createInstance: (config: any) => Promise<FhevmInstance>;
      SepoliaConfig: {
        aclContractAddress: string;
        network: any;
      };
      __initialized__: boolean;
    };
  }
}

export function useFhevm(parameters: {
  provider: string | ethers.Eip1193Provider | ethers.BrowserProvider | undefined;
  chainId: number | undefined;
  enabled?: boolean;
}): {
  instance: FhevmInstance | undefined;
  refresh: () => void;
  error: Error | undefined;
  status: FhevmGoState;
} {
  const { provider, chainId, enabled = true } = parameters;

  const [instance, setInstance] = useState<FhevmInstance | undefined>(undefined);
  const [status, setStatus] = useState<FhevmGoState>("idle");
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isRunning, setIsRunning] = useState<boolean>(enabled);
  const [providerChanged, setProviderChanged] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const providerRef = useRef(provider);
  const chainIdRef = useRef(chainId);

  const refresh = useCallback(() => {
    if (abortControllerRef.current) {
      providerRef.current = undefined;
      chainIdRef.current = undefined;
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    providerRef.current = provider;
    chainIdRef.current = chainId;
    
    setInstance(undefined);
    setError(undefined);
    setStatus("idle");

    if (provider !== undefined) {
      setProviderChanged((prev) => prev + 1);
    }
  }, [provider, chainId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setIsRunning(enabled);
  }, [enabled]);

  useEffect(() => {
    if (!isRunning) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setInstance(undefined);
      setError(undefined);
      setStatus("idle");
      return;
    }

    if (!providerRef.current || !chainId) {
      setInstance(undefined);
      setError(undefined);
      setStatus("idle");
      return;
    }

    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController();
    }

    setStatus("loading");
    setError(undefined);

    const signal = abortControllerRef.current.signal;
    const currentProvider = providerRef.current;
    const currentChainId = chainId;

    // Convert BrowserProvider to Eip1193Provider if needed
    let fhevmProvider = currentProvider;
    
    console.log('🔍 Original provider type:', typeof currentProvider);
    console.log('🔍 Original provider:', currentProvider);
    
    if (currentProvider && typeof currentProvider === 'object') {
      // Handle ethers BrowserProvider
      if ('provider' in currentProvider) {
        fhevmProvider = (currentProvider as any).provider;
        console.log('🔧 Extracted provider from BrowserProvider:', fhevmProvider);
      }
      
      // Double-check that we have the request method
      if (fhevmProvider && typeof fhevmProvider === 'object' && !('request' in fhevmProvider)) {
        console.warn('⚠️ Provider does not have request method, trying window.ethereum');
        if (typeof window !== 'undefined' && window.ethereum) {
          fhevmProvider = window.ethereum;
          console.log('🔧 Using window.ethereum as fallback:', fhevmProvider);
        }
      }
    }
    
    console.log('🔍 Final fhevmProvider:', fhevmProvider);
    console.log('🔍 Has request method:', fhevmProvider && typeof fhevmProvider === 'object' && 'request' in fhevmProvider);

    createFhevmInstance({
      provider: fhevmProvider as ethers.Eip1193Provider | string,
      signal: signal,
      onStatusChange: (status) => console.log(`[useFhevm] Status: ${status}`)
    })
      .then((newInstance) => {
        if (signal.aborted) return;
        
        if (currentProvider === providerRef.current && currentChainId === chainIdRef.current) {
          setInstance(newInstance);
          setStatus("ready");
          console.log("✅ FHEVM instance ready!");
        }
      })
      .catch((err) => {
        if (signal.aborted) return;
        
        if (currentProvider === providerRef.current && currentChainId === chainIdRef.current) {
          console.error("❌ FHEVM instance creation failed:", err);
          setError(err);
          setStatus("error");
        }
      });

  }, [isRunning, providerChanged, chainId]);

  return { instance, refresh, error, status };
}