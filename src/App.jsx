import { useState, useEffect } from 'react';
import { connectWallet, getBalance, sendPayment } from './stellar';
import { recordPayment, PAYMENT_CONTRACT_ADDRESS, getTotalByCategory } from './paymentContract';
import ActivityFeed from './components/ActivityFeed';
import './index.css';

function App() {
  const [publicKey, setPublicKey] = useState('');
  const [balance, setBalance] = useState('');
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [isDestinationValid, setIsDestinationValid] = useState(null); // null, true, false
  
  // Transaction State
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');

  // Payment Tracking State
  const [category, setCategory] = useState('Rent');
  const [insightsCategory, setInsightsCategory] = useState('Rent');
  const [categoryTotal, setCategoryTotal] = useState(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);

  // Toast State
  const [toasts, setToasts] = useState([]);
  
  // Clipboard Copy State
  const [copiedText, setCopiedText] = useState('');

  const addToast = (message, type = 'info', hash = '') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, hash }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    addToast(`${label} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedText(''), 2000);
  };

  const fetchBalance = async (pubKey) => {
    try {
      const bal = await getBalance(pubKey);
      setBalance(bal);
    } catch (err) {
      console.error(err);
      addToast(`Error updating balance: ${err.message}`, 'error');
    }
  };

  // Poll balance every 10 seconds when connected
  useEffect(() => {
    if (!publicKey) return;
    const interval = setInterval(() => {
      fetchBalance(publicKey);
    }, 10000);
    return () => clearInterval(interval);
  }, [publicKey]);

  // Validate Stellar Destination Address on keypress
  useEffect(() => {
    if (!destination) {
      setIsDestinationValid(null);
      return;
    }
    // Stellar address starts with 'G', uppercase, 56 chars
    const isValid = /^G[A-D2-7][A-Z2-7]{54}$/.test(destination);
    setIsDestinationValid(isValid);
  }, [destination]);

  const handleConnect = async () => {
    try {
      setLoading(true);
      const pubKey = await connectWallet();
      setPublicKey(pubKey);
      await fetchBalance(pubKey);
      addToast('Wallet connected successfully!', 'success');
    } catch (err) {
      addToast(`Connection failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setPublicKey('');
    setBalance('');
    setDestination('');
    setAmount('');
    setTxHash('');
    setCategoryTotal(null);
    addToast('Wallet disconnected', 'info');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!destination || !amount) {
      addToast('Please fill out all payment fields', 'error');
      return;
    }
    if (!isDestinationValid) {
      addToast('Invalid Stellar destination address', 'error');
      return;
    }

    try {
      setLoading(true);
      addToast('Initiating transaction...', 'info');
      
      const response = await sendPayment(destination, amount, publicKey);
      const hash = response.hash || response.id;
      setTxHash(hash);
      addToast('Payment sent! Recording on-chain...', 'info', hash);
      
      await recordPayment(publicKey, destination, amount, category, publicKey);
      addToast('Recorded successfully on-chain!', 'success', hash);
      
      setDestination('');
      setAmount('');
      await fetchBalance(publicKey); // Auto refresh balance
      
      // Auto-refresh insights if same category
      if (insightsCategory === category) {
        handleGetInsights(null, category);
      }
    } catch (err) {
      addToast(`Transaction failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGetInsights = async (e, overrideCategory) => {
    if (e) e.preventDefault();
    const catToFetch = overrideCategory || insightsCategory;
    try {
      setIsInsightsLoading(true);
      const total = await getTotalByCategory(publicKey, catToFetch);
      setCategoryTotal(total.toString());
      addToast(`Fetched insights for ${catToFetch}`, 'success');
    } catch (err) {
      addToast(`Failed to fetch insights: ${err.message}`, 'error');
    } finally {
      setIsInsightsLoading(false);
    }
  };

  return (
    <div className="app-layout">
      {/* Background Blobs and Space Grid */}
      <div className="space-grid"></div>
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      {/* Navigation Header */}
      <header className="navbar">
        <div className="logo-section">
          <svg className="stellar-logo" viewBox="0 0 24 24" width="28" height="28">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <span className="logo-title">Stellar Pay</span>
        </div>

        <div className="auth-pill-section">
          {!publicKey ? (
            <button className="btn btn-connect" onClick={handleConnect} disabled={loading}>
              {loading ? (
                <>
                  <div className="mini-spinner"></div> Connecting...
                </>
              ) : 'Connect Wallet'}
            </button>
          ) : (
            <div className="wallet-pill">
              <span className="pill-badge">Testnet</span>
              <span className="pill-address" title={publicKey} onClick={() => handleCopy(publicKey, 'Wallet Address')}>
                {publicKey.substring(0, 5)}...{publicKey.substring(publicKey.length - 4)}
                <span className="copy-icon">
                  {copiedText === 'Wallet Address' ? '✓' : '❐'}
                </span>
              </span>
              <button className="btn-disconnect" onClick={handleDisconnect} title="Disconnect Wallet">
                ✕
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        {!publicKey ? (
          <section className="welcome-hero">
            <h1 className="hero-title">
              Manage Stellar Payments with <span className="gradient-text">Soroban Tracking</span>
            </h1>
            <p className="hero-subtitle">
              Securely sign transactions on Stellar Testnet, trigger cross-contract calls, and stream real-time events.
            </p>
            <button className="btn btn-hero" onClick={handleConnect} disabled={loading}>
              {loading ? (
                <>
                  <div className="mini-spinner"></div> Connecting...
                </>
              ) : 'Get Started'}
            </button>
          </section>
        ) : (
          <div className="dashboard-grid">
            {/* Left Column: Balance & Send Card */}
            <div className="dashboard-column">
              {/* Balance Card */}
              <div className="glass-card balance-card">
                <span className="card-label">Available Balance</span>
                <div className="balance-display">
                  <span className="balance-amount">{balance || '0.00'}</span>
                  <span className="balance-unit">XLM</span>
                </div>
                <div className="pulse-network-indicator">
                  <div className="pulse-dot"></div>
                  <span>Connected to Stellar Testnet</span>
                </div>
              </div>

              {/* Send Form */}
              <div className="glass-card">
                <h2 className="card-title">Send XLM</h2>
                <form onSubmit={handleSend} className="space-y-4">
                  <div className="form-group">
                    <label>Destination Address</label>
                    <div className="input-relative">
                      <input
                        type="text"
                        placeholder="G..."
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className={`input-styled ${
                          isDestinationValid === true ? 'border-success' : 
                          isDestinationValid === false ? 'border-error' : ''
                        }`}
                        required
                      />
                      {isDestinationValid === true && <span className="valid-indicator">✓</span>}
                      {isDestinationValid === false && <span className="invalid-indicator">✗</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Amount (XLM)</label>
                    <input
                      type="number"
                      step="0.0000001"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="input-styled"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input-styled"
                    >
                      <option value="Rent">Rent</option>
                      <option value="Family Support">Family Support</option>
                      <option value="Business">Business</option>
                      <option value="Savings">Savings</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <button className="btn btn-primary full" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="mini-spinner"></div> Processing Transaction...
                      </>
                    ) : 'Send Transaction'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Contract & Activity */}
            <div className="dashboard-column">
              {/* Payment Insights Card */}
              <div className="glass-card">
                <div className="card-header-with-badge">
                  <h2 className="card-title">Payment Insights</h2>
                  <span 
                    className="contract-chip" 
                    title="Click to copy contract address"
                    onClick={() => handleCopy(PAYMENT_CONTRACT_ADDRESS, 'Contract Address')}
                  >
                    {PAYMENT_CONTRACT_ADDRESS.substring(0, 6)}...{PAYMENT_CONTRACT_ADDRESS.substring(PAYMENT_CONTRACT_ADDRESS.length - 4)}
                    <span className="copy-icon">
                      {copiedText === 'Contract Address' ? '✓' : '❐'}
                    </span>
                  </span>
                </div>

                <form onSubmit={handleGetInsights} className="space-y-4">
                  <div className="form-group">
                    <label>Select Category</label>
                    <select
                      value={insightsCategory}
                      onChange={(e) => setInsightsCategory(e.target.value)}
                      className="input-styled"
                    >
                      <option value="Rent">Rent</option>
                      <option value="Family Support">Family Support</option>
                      <option value="Business">Business</option>
                      <option value="Savings">Savings</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <button 
                    className="btn btn-secondary full" 
                    type="submit" 
                    disabled={isInsightsLoading}
                  >
                    {isInsightsLoading ? (
                      <>
                        <div className="mini-spinner"></div> Fetching...
                      </>
                    ) : 'Get Category Total'}
                  </button>
                </form>

                {categoryTotal !== null && (
                  <div className="contract-response-box">
                    <span className="response-label">Total Spent on {insightsCategory}:</span>
                    <pre className="response-value">{categoryTotal} XLM</pre>
                  </div>
                )}
              </div>

              {/* Activity Feed Card */}
              <div className="glass-card">
                <ActivityFeed />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-credits">
          Built with React • Vite • Soroban • GitHub Actions
        </div>
        <div className="footer-links">
          <a href="https://github.com/Abhishek86038/stellar-level3-project" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <span className="divider">•</span>
          <a href="https://stellar.expert/explorer/testnet" target="_blank" rel="noreferrer">
            Stellar Expert
          </a>
        </div>
      </footer>

      {/* Floating Toast Notification Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <div className="toast-body">
              <span className="toast-msg">{t.message}</span>
              {t.hash && (
                <a 
                  href={`https://stellar.expert/explorer/testnet/tx/${t.hash}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="toast-hash-link"
                >
                  View on Stellar.expert ↗
                </a>
              )}
            </div>
            <button className="toast-close-btn" onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
