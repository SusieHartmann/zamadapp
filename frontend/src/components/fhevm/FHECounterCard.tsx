import React from 'react';
import { useFHEVMContext } from '../../providers/FHEVMProvider';
import './FHECounterCard.css';

const FHECounterCard: React.FC = () => {
  const {
    isReady,
    isLoading,
    encryptedCount,
    inputValue,
    setInputValue,
    performEncryptAdd,
    performEncryptSub,
    refreshState
  } = useFHEVMContext();

  const handleAddClick = async () => {
    const value = parseInt(inputValue);
    if (isNaN(value) || value <= 0) {
      return;
    }
    await performEncryptAdd(value);
  };

  const handleSubClick = async () => {
    const value = parseInt(inputValue);
    if (isNaN(value) || value <= 0) {
      return;
    }
    await performEncryptSub(value);
  };

  return (
    <div className="card fhe-counter-card">
      <div className="card-header">
        <h3 className="card-title">💜 NEON PULSE CIPHER</h3>
        <p className="card-subtitle">
          Execute luminous neon homomorphic computations on encrypted pulse network streams
        </p>
      </div>

      <div className="encrypted-display">
        <div className="encrypted-label">💜 NEON PULSE DATA MATRIX</div>
        <div className="encrypted-value">
          {encryptedCount ? (
            <code className="encrypted-hash">{encryptedCount}</code>
          ) : (
            <span className="encrypted-placeholder">💜 NEON PULSE CIRCUITS OFFLINE 💜</span>
          )}
        </div>
      </div>

      <div className="operation-controls">
        <div className="input-group">
          <label className="input-label">🎯 NEON VALUE INPUT:</label>
          <div className="input-with-refresh">
            <input
              type="number"
              className="input-field"
              placeholder="Initialize neon pulse payload..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading || !isReady}
              min="1"
            />
            <button
              className="btn btn-outline refresh-btn"
              onClick={refreshState}
              disabled={isLoading || !isReady}
              title="Refresh neon pulse matrix"
            >
              💜
            </button>
          </div>
        </div>

        <div className="operation-buttons">
          <button
            className="btn btn-primary operation-btn"
            onClick={handleAddClick}
            disabled={isLoading || !inputValue || !isReady || isNaN(parseInt(inputValue)) || parseInt(inputValue) <= 0}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Processing...
              </>
            ) : (
              <>
                💜 NEON BOOST
              </>
            )}
          </button>

          <button
            className="btn btn-danger operation-btn"
            onClick={handleSubClick}
            disabled={isLoading || !inputValue || !isReady || isNaN(parseInt(inputValue)) || parseInt(inputValue) <= 0}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Processing...
              </>
            ) : (
              <>
                ⚡ NEON DRAIN
              </>
            )}
          </button>
        </div>
      </div>

      <div className="fhe-info">
        <div className="status-indicator status-info">
          <strong>🔗 NEON LINK STATUS:</strong> Neon pulse pathways active
        </div>
        <div className="address-info">
          <div className="address-item">
            <span className="address-label">💜 Neon Network Status →</span>
            <code className="address-value">NEON PULSE ACTIVE</code>
          </div>
        </div>
        <div className="fhe-description">
          💜 All neon computations execute within luminous-encrypted data streams. 
          Neon pulse patterns remain permanently obfuscated during homomorphic operations.
        </div>
      </div>
    </div>
  );
};

export default FHECounterCard;