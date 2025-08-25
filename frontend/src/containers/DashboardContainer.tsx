import React from 'react';
import { useWalletContext } from '../providers/WalletProvider';
import { useFHEVMContext } from '../providers/FHEVMProvider';
import FHEContractInterface from '../components/FHEContractInterface';
import WalletConnectionCard from '../components/wallet/WalletConnectionCard';
import NetworkWarningCard from '../components/network/NetworkWarningCard';
import './DashboardContainer.css';


const DashboardContainer: React.FC = () => {
  const { isConnected } = useWalletContext();
  const { networkSupported } = useFHEVMContext();

  if (!isConnected) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-grid">
          <WalletConnectionCard />
        </div>
      </div>
    );
  }

  if (!networkSupported) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-grid">
          <NetworkWarningCard />
        </div>
      </div>
    );
  }

  const renderActiveComponent = () => {
    return <FHEContractInterface />;
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">💜 NEON PULSE CIPHER</h2>
        <p className="dashboard-subtitle">
          Execute luminous neon homomorphic computations on encrypted pulse network streams
        </p>
      </div>
      
      
      {/* Main Content */}
      <div className="dashboard-content">
        {renderActiveComponent()}
      </div>
    </div>
  );
};

export default DashboardContainer;