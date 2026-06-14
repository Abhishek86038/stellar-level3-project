import { useState } from 'react';
import { connectWallet, getBalance, sendPayment } from './stellar';
import './index.css';

function App() {
  const [publicKey, setPublicKey] = useState('');
  const [balance, setBalance] = useState('');
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setStatus('');
      setLoading(true);
      const pubKey = await connectWallet();
      setPublicKey(pubKey);
      await fetchBalance(pubKey);
    } catch (err) {
      setStatus(`Error connecting wallet: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setPublicKey('');
    setBalance('');
    setDestination('');
    setAmount('');
    setStatus('');
    setTxHash('');
  };

  const fetchBalance = async (pubKey) => {
    try {
      const bal = await getBalance(pubKey);
      setBalance(bal);
    } catch (err) {
      setStatus(`Error fetching balance: ${err.message}`);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!destination || !amount) {
      setStatus('Please enter destination and amount');
      return;
    }
    try {
      setStatus('Processing transaction...');
      setTxHash('');
      setLoading(true);
      const response = await sendPayment(destination, amount, publicKey);
      setTxHash(response.hash);
      setStatus('Transaction successful!');
      await fetchBalance(publicKey); // Auto refresh balance
    } catch (err) {
      setStatus(`Transaction failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Stellar Payment dApp</h1>
        <p className="subtitle">Testnet Environment</p>

        {!publicKey ? (
          <button className="btn primary" onClick={handleConnect} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect Freighter Wallet'}
          </button>
        ) : (
          <div className="wallet-info">
            <div className="info-row">
              <span className="label">Public Key:</span>
              <span className="value truncate" title={publicKey}>{publicKey}</span>
            </div>
            <div className="info-row">
              <span className="label">Balance:</span>
              <span className="value xl">{balance} XLM</span>
            </div>
            <button className="btn secondary" onClick={handleDisconnect}>
              Disconnect
            </button>

            <form onSubmit={handleSend} className="send-form">
              <h3>Send XLM</h3>
              <div className="form-group">
                <label>Destination Address</label>
                <input
                  type="text"
                  placeholder="G..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount (XLM)</label>
                <input
                  type="number"
                  step="0.0000001"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <button className="btn primary full" type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Send Transaction'}
              </button>
            </form>
          </div>
        )}

        {status && <div className={`status ${txHash ? 'success' : 'error'}`}>{status}</div>}
        {txHash && (
          <div className="tx-hash">
            <strong>Transaction Hash:</strong>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {txHash}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
