import { useState, useEffect, useCallback } from 'react';
import { decryptFingerprint, DecryptionStage } from '../utils/decryption';
import { decodeFingerprint, DecodedFingerprint } from '../../game1_analysis/decoder';
import './FingerprintDecoder.css';

declare global {
  interface Window {
    game1?: (callback: (fingerprint: string) => void) => void;
  }
}

export function FingerprintDecoder() {
  const [encoded, setEncoded] = useState('');
  const [decoded, setDecoded] = useState('');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  const [game1Loaded, setGame1Loaded] = useState(false);
  const [stages, setStages] = useState<DecryptionStage[]>([]);
  const [analysis, setAnalysis] = useState<DecodedFingerprint | null>(null);
  const [activeTab, setActiveTab] = useState<'json' | 'categories' | 'jsonobject'>('json');

  // Check if game1.js is loaded
  useEffect(() => {
    const checkGame1 = () => {
      if (typeof window.game1 === 'function') {
        setGame1Loaded(true);
      }
    };

    checkGame1();
    const timeout = setTimeout(checkGame1, 1000);

    return () => clearTimeout(timeout);
  }, []);

  const handleGenerate = useCallback(() => {
    if (typeof window.game1 !== 'function') {
      setStatus('ERROR: game1.js not loaded');
      setStatusType('error');
      return;
    }

    setStatus('generating...');
    setStatusType('');

    window.game1((fingerprint: string) => {
      setEncoded(fingerprint);
      processFingerprint(fingerprint);
    });
  }, []);

  const processFingerprint = (fingerprint: string) => {
    const result = decryptFingerprint(fingerprint);

    if (result.stages) {
      setStages(result.stages);
    }

    if (result.success && result.data) {
      setDecoded(JSON.stringify(result.data, null, 2));
      setStatus('OK - decoded');
      setStatusType('success');
      
      // Also run advanced analysis
      try {
        const decoded = decodeFingerprint(fingerprint);
        setAnalysis(decoded);
      } catch (e) {
        console.error('Advanced analysis failed:', e);
      }
    } else {
      setDecoded(`Error: ${result.error}`);
      setStatus('decryption error');
      setStatusType('error');
      setAnalysis(null);
    }
  };

  // Auto-generate on load
  useEffect(() => {
    if (game1Loaded) {
      const timer = setTimeout(handleGenerate, 500);
      return () => clearTimeout(timer);
    }
  }, [game1Loaded, handleGenerate]);

  const handleEncodedChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setEncoded(value);

    if (value.trim()) {
      processFingerprint(value);
    } else {
      setDecoded('');
      setStatus('');
      setStatusType('');
      setStages([]);
      setAnalysis(null);
    }
  };

  const renderCategorySection = (title: string, fields: Array<{ name: string; displayName: string; value: unknown; index: number }> | undefined) => {
    if (!fields || fields.length === 0) return null;
    
    // Sort by index to maintain fingerprint order
    const sortedFields = [...fields].sort((a, b) => a.index - b.index);
    
    return (
      <div className="category-section">
        <h4>{title} ({fields.length} fields)</h4>
        <div className="category-fields">
          {sortedFields.map((field) => (
            <div key={field.name} className="field-row">
              <span className="field-name">{field.displayName}:</span>
              <span className="field-value">
                {typeof field.value === 'string' && field.value.length > 50 
                  ? `${field.value.substring(0, 50)}... (${field.value.length} chars)`
                  : typeof field.value === 'object' && field.value !== null
                    ? JSON.stringify(field.value).substring(0, 80)
                    : String(field.value)
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="decoder-container">
      <h1>game1.js inspector</h1>
      <p className="subtitle">Advanced Browser Fingerprinting Analysis Tool</p>

      <div className="controls">
        <button
          onClick={handleGenerate}
          disabled={!game1Loaded}
          className="generate-btn"
        >
          GENERATE FINGERPRINT
        </button>
        <span className={`status ${statusType}`}>{status}</span>
      </div>

      <div className="row">
        <div className="col">
          <label>ENCODED (game1 output):</label>
          <textarea
            value={encoded}
            onChange={handleEncodedChange}
            placeholder="Encoded fingerprint will appear here... (or paste one to analyze)"
            className="encoded-textarea"
          />
          {encoded && (
            <div className="encoded-info">
              Length: {encoded.length} chars | 
              First 20: {encoded.substring(0, 20)}...
            </div>
          )}
        </div>
        <div className="col">
          <div className="tabs">
            <button 
              className={activeTab === 'json' ? 'active' : ''}
              onClick={() => setActiveTab('json')}
            >
              JSON
            </button>
            <button 
              className={activeTab === 'categories' ? 'active' : ''}
              onClick={() => setActiveTab('categories')}
              disabled={!analysis}
            >
              Categories
            </button>
            <button 
              className={activeTab === 'jsonobject' ? 'active' : ''}
              onClick={() => setActiveTab('jsonobject')}
              disabled={!analysis}
            >
              JSON Object
            </button>
          </div>
          
          {activeTab === 'json' && (
            <textarea
              value={decoded}
              readOnly
              placeholder="Decoded JSON will appear here..."
              className="decoded-textarea"
            />
          )}
          
          {activeTab === 'categories' && analysis && (
            <div className="categories-view">
              {renderCategorySection('Metadata', analysis.categories.metadata)}
              {renderCategorySection('Hardware', analysis.categories.hardware)}
              {renderCategorySection('Browser', analysis.categories.browser)}
              {renderCategorySection('Screen', analysis.categories.screen)}
              {renderCategorySection('Canvas', analysis.categories.canvas)}
              {renderCategorySection('WebGL', analysis.categories.webgl)}
              {renderCategorySection('Audio', analysis.categories.audio)}
              {renderCategorySection('Bot Detection', analysis.categories.botDetection)}
              {renderCategorySection('Media', analysis.categories.media)}
              {renderCategorySection('OS', analysis.categories.os)}
              {analysis.unknownFields && analysis.unknownFields.length > 0 && (
                <div className="category-section">
                  <h4>Unknown ({analysis.unknownFields.length} fields)</h4>
                  <div className="category-fields">
                    {analysis.unknownFields.map((field) => (
                      <div key={field.index} className="field-row">
                        <span className="field-name">[{field.index}]:</span>
                        <span className="field-value">
                          {typeof field.value === 'string' && field.value.length > 50 
                            ? `${field.value.substring(0, 50)}... (${field.value.length} chars)`
                            : typeof field.value === 'object' && field.value !== null
                              ? JSON.stringify(field.value).substring(0, 80)
                              : String(field.value)
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'jsonobject' && analysis && (
            <textarea
              value={JSON.stringify(analysis.raw, null, 2)}
              readOnly
              placeholder="Named JSON object will appear here..."
              className="decoded-textarea"
            />
          )}
        </div>
      </div>

      {stages.length > 0 && (
        <div className="stages-section">
          <h2>Decryption Stages</h2>
          <div className="stages-list">
            {stages.map((stage, index) => (
              <div key={index} className="stage-card">
                <div className="stage-number">{index + 1}</div>
                <div className="stage-content">
                  <div className="stage-name">{stage.name}</div>
                  <div className="stage-description">{stage.description}</div>
                  <div className="stage-io">
                    <div className="io-row">
                      <span className="io-label">Input:</span>
                      <span className="io-value input">{stage.input}</span>
                    </div>
                    <div className="io-arrow">↓</div>
                    <div className="io-row">
                      <span className="io-label">Output:</span>
                      <span className="io-value output">{stage.output}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis && (
        <div className="analysis-summary">
          <h2>Fingerprint Analysis Summary</h2>
          <div className="summary-grid">
            <div className="summary-item">
              <label>Total Fields:</label>
              <span>{analysis.metadata.fieldCount}</span>
            </div>
            <div className="summary-item">
              <label>Data Size:</label>
              <span>{analysis.metadata.dataSize} bytes</span>
            </div>
            {analysis.metadata.timestamp && (
              <div className="summary-item">
                <label>Generated:</label>
                <span>{analysis.metadata.timestamp}</span>
              </div>
            )}
            {analysis.metadata.generationTimeMs && (
              <div className="summary-item">
                <label>Gen Time:</label>
                <span>{analysis.metadata.generationTimeMs}ms</span>
              </div>
            )}
            {analysis.unknownFields.length > 0 && (
              <div className="summary-item warning">
                <label>Unknown Fields:</label>
                <span>{analysis.unknownFields.length} (need mapping)</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
