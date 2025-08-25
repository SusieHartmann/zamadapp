import { ethers } from "ethers";
import { FhevmInstance } from "../hooks/useFhevm";
import { publicKeyStorageGet, publicKeyStorageSet } from "./PublicKeyStorage";

const SDK_CDN_URL = "https://cdn.zama.ai/relayer-sdk-js/0.1.2/relayer-sdk-js.umd.cjs";

export class FhevmAbortError extends Error {
  constructor(message = "FHEVM operation was cancelled") {
    super(message);
    this.name = "FhevmAbortError";
  }
}

// Load RelayerSDK from CDN
const loadRelayerSDK = async (): Promise<void> => {
  console.log("[RelayerSDKLoader] load...");
  if (typeof window === "undefined") {
    throw new Error("RelayerSDKLoader: can only be used in the browser.");
  }

  if ("relayerSDK" in window && isValidRelayerSDK(window.relayerSDK)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      `script[src="${SDK_CDN_URL}"]`
    );
    if (existingScript) {
      if (!isValidRelayerSDK(window.relayerSDK)) {
        reject(
          new Error(
            "RelayerSDKLoader: window object does not contain a valid relayerSDK object."
          )
        );
      }
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = SDK_CDN_URL;
    script.type = "text/javascript";
    script.async = true;

    script.onload = () => {
      if (!isValidRelayerSDK(window.relayerSDK)) {
        console.log("[RelayerSDKLoader] script onload FAILED...");
        reject(
          new Error(
            `RelayerSDKLoader: Relayer SDK script has been successfully loaded from ${SDK_CDN_URL}, however, the window.relayerSDK object is invalid.`
          )
        );
      }
      resolve();
    };

    script.onerror = () => {
      console.log("[RelayerSDKLoader] script onerror... ");
      reject(
        new Error(
          `RelayerSDKLoader: Failed to load Relayer SDK from ${SDK_CDN_URL}`
        )
      );
    };

    console.log("[RelayerSDKLoader] add script to DOM...");
    document.head.appendChild(script);
    console.log("[RelayerSDKLoader] script added!")
  });
};

// Initialize RelayerSDK
const initRelayerSDK = async (): Promise<void> => {
  if (!window.relayerSDK) {
    throw new Error("RelayerSDK not available");
  }
  
  if (window.relayerSDK.__initialized__) {
    return;
  }

  console.log("🔧 Initializing FHEVM Relayer SDK...");
  const result = await window.relayerSDK.initSDK();
  window.relayerSDK.__initialized__ = result;
  
  if (!result) {
    throw new Error("Failed to initialize RelayerSDK");
  }
  
  console.log("✅ FHEVM Relayer SDK initialized");
};

// Validation functions
const isValidRelayerSDK = (o: unknown): boolean => {
  if (typeof o === "undefined") {
    console.log("RelayerSDKLoader: relayerSDK is undefined");
    return false;
  }
  if (o === null) {
    console.log("RelayerSDKLoader: relayerSDK is null");
    return false;
  }
  if (typeof o !== "object") {
    console.log("RelayerSDKLoader: relayerSDK is not an object");
    return false;
  }
  if (!hasProperty(o, "initSDK", "function")) {
    console.log("RelayerSDKLoader: relayerSDK.initSDK is invalid");
    return false;
  }
  if (!hasProperty(o, "createInstance", "function")) {
    console.log("RelayerSDKLoader: relayerSDK.createInstance is invalid");
    return false;
  }
  if (!hasProperty(o, "SepoliaConfig", "object")) {
    console.log("RelayerSDKLoader: relayerSDK.SepoliaConfig is invalid");
    return false;
  }
  if ("__initialized__" in o) {
    if (o.__initialized__ !== true && o.__initialized__ !== false) {
      console.log("RelayerSDKLoader: relayerSDK.__initialized__ is invalid");
      return false;
    }
  }
  return true;
};

const hasProperty = (obj: any, propertyName: string, propertyType: string): boolean => {
  if (!obj || typeof obj !== "object") {
    return false;
  }

  if (!(propertyName in obj)) {
    console.log(`RelayerSDKLoader: missing ${propertyName}.`);
    return false;
  }

  const value = obj[propertyName];

  if (value === null || value === undefined) {
    console.log(`RelayerSDKLoader: ${propertyName} is null or undefined.`);
    return false;
  }

  if (typeof value !== propertyType) {
    console.log(`RelayerSDKLoader: ${propertyName} is not a ${propertyType}.`);
    return false;
  }

  return true;
};

// Get chainId from provider
async function getChainId(providerOrUrl: ethers.Eip1193Provider | string): Promise<number> {
  if (typeof providerOrUrl === "string") {
    const provider = new ethers.JsonRpcProvider(providerOrUrl);
    return Number((await provider.getNetwork()).chainId);
  }
  const chainId = await providerOrUrl.request({ method: "eth_chainId" });
  return Number.parseInt(chainId as string, 16);
}

// Resolve Mock vs Real chains  
type MockResolveResult = { isMock: true; chainId: number; rpcUrl: string };
type GenericResolveResult = { isMock: false; chainId: number; rpcUrl?: string };
type ResolveResult = MockResolveResult | GenericResolveResult;

async function resolve(
  providerOrUrl: ethers.Eip1193Provider | string,
  mockChains?: Record<number, string>
): Promise<ResolveResult> {
  // Resolve chainId
  const chainId = await getChainId(providerOrUrl);
  
  // Resolve rpc url
  let rpcUrl = typeof providerOrUrl === "string" ? providerOrUrl : undefined;
  
  const _mockChains: Record<number, string> = {
    31337: "http://localhost:8545",
    ...(mockChains ?? {}),
  };
  
  // Help Typescript solver here:
  if (chainId in _mockChains) {
    if (!rpcUrl) {
      rpcUrl = _mockChains[chainId];
    }
    return { isMock: true, chainId, rpcUrl };
  }
  
  return { isMock: false, chainId, rpcUrl };
}

// Check if address is valid
function checkIsAddress(a: unknown): a is `0x${string}` {
  if (typeof a !== "string") {
    return false;
  }
  return ethers.isAddress(a);
}

// Main function to create FHEVM instance  
export const createFhevmInstance = async (parameters: {
  provider: ethers.Eip1193Provider | string;
  signal: AbortSignal;
  onStatusChange?: (status: string) => void;
  mockChains?: Record<number, string>;
}): Promise<FhevmInstance> => {
  const { provider: providerOrUrl, signal, onStatusChange, mockChains } = parameters;
  
  const throwIfAborted = () => {
    if (signal.aborted) throw new FhevmAbortError();
  };
  
  const notify = (status: string) => {
    if (onStatusChange) onStatusChange(status);
  };

  console.log(`🚀 Creating FHEVM instance...`);
  
  // Resolve chainId and determine if this is mock mode
  const { isMock, rpcUrl, chainId } = await resolve(providerOrUrl, mockChains);
  console.log(`🔍 Detected chainId: ${chainId}, isMock: ${isMock}, rpcUrl: ${rpcUrl}`);
  
  // Check if chainId is supported
  const supportedChains = [31337, 11155111]; // Hardhat, Sepolia
  if (!supportedChains.includes(chainId)) {
    throw new Error(`FHEVM is only supported on chainId 31337 (Hardhat) or 11155111 (Sepolia). Current chainId: ${chainId}. Please switch your MetaMask network.`);
  }

  // Handle Mock mode (chainId 31337 - Hardhat)
  if (isMock) {
    notify("creating");
    console.log("🔧 Mock mode detected - this would use FHEVM Mock implementation");
    console.log("⚠️ Mock mode not implemented yet, falling through to real mode for now");
    // TODO: Implement mock mode using fhevmMock from reference template
  }

  // Real mode - Sepolia network (chainId 11155111)  
  if (!isMock && chainId === 11155111) {
    console.log("🌐 Sepolia network detected - using real RelayerSDK");
    console.log("⚠️ Note: Sepolia requires proper FHEVM infrastructure setup");
  }

  // Load and initialize RelayerSDK
  try {
    notify("sdk-loading");
    console.log("📦 Step 1: Loading RelayerSDK...");
    await loadRelayerSDK();
    throwIfAborted();
    
    notify("sdk-initializing");
    console.log("🔧 Step 2: Initializing RelayerSDK...");
    await initRelayerSDK();
    throwIfAborted();
    
    notify("sdk-initialized");
    console.log("✅ RelayerSDK ready");
  } catch (loadError: any) {
    console.error("❌ Failed during SDK loading/initialization:", loadError);
    throw new Error(`FHEVM SDK Loading Failed: ${loadError?.message || loadError}`);
  }

  if (!window.relayerSDK) {
    throw new Error("RelayerSDK not available after initialization");
  }

  // Get ACL address and validate
  const relayerSDK = window.relayerSDK;
  const aclAddress = relayerSDK.SepoliaConfig.aclContractAddress;
  if (!checkIsAddress(aclAddress)) {
    throw new Error(`Invalid address: ${aclAddress}`);
  }
  
  // Load public key from storage
  console.log("🔧 Loading public key from storage for ACL:", aclAddress);
  const pub = await publicKeyStorageGet(aclAddress);
  console.log("🔍 Cached public key:", pub);
  throwIfAborted();

  // Create configuration
  const config = {
    ...relayerSDK.SepoliaConfig,
    network: providerOrUrl,
    ...(pub.publicKey && { publicKey: pub.publicKey }),
    ...(pub.publicParams && { publicParams: pub.publicParams }),
  };

  console.log("⚡ Creating FHEVM instance with config:", config);
  console.log("🔍 Config has publicKey:", !!config.publicKey);
  console.log("🔍 Config has publicParams:", !!config.publicParams);

  // Create instance
  try {
    notify("creating");
    console.log("🔧 Step 3: Calling createInstance...");
    const instance = await relayerSDK.createInstance(config);
    throwIfAborted();
    
    console.log("✅ Real FHEVM instance created successfully!");
    console.log("🔍 Instance methods:", Object.keys(instance));
    
    // Save public key and params to storage for future use
    console.log("💾 Saving public key to storage...");
    try {
      await publicKeyStorageSet(
        aclAddress,
        instance.getPublicKey(),
        instance.getPublicParams(2048)
      );
      console.log("✅ Public key saved to storage");
    } catch (saveError) {
      console.warn("⚠️ Failed to save public key to storage:", saveError);
      // Don't throw here, instance is still usable
    }
    
    throwIfAborted();
    return instance;
  } catch (createError: any) {
    console.error("❌ Failed during createInstance:", createError);
    console.error("🔍 Error details:", {
      message: createError?.message,
      code: createError?.code,
      stack: createError?.stack
    });
    throw new Error(`FHEVM Instance Creation Failed: ${createError?.message || createError}`);
  }
};