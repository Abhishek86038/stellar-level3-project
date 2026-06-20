import { useState, useEffect } from 'react';
import { connectWallet, getBalance, sendPayment } from './stellar';
import { setContractValue, getContractValue, CONTRACT_ADDRESS } from './contract';
import { recordPayment } from './paymentContract';
import ActivityFeed from './components/ActivityFeed';
import './index.css';
import './styles/responsive.css';

function App() {
  const [publicKey, setPublicKey] = useState('');
  const [balance, setBalance] = useState('');
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  
  // Transaction State
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState(''); // pending, success, failed
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);

  // Contract State
  const [contractKey, setContractKey] = useState('');
  const [contractValue, setContractValueState] = useState('');
  const [contractResponse, setContractResponse] = useState('');
  const [isContractLoading, setIsContractLoading] = useState(false);

  const fetchBalance = async (pubKey) => {
    try {
      const bal = await getBalance(pubKey);
      setBalance(bal);
    } catch (err) {
      console.error(err);
    }
  };

  // Poll contract state and balance every 10 seconds when connected
  useEffect(() => {
    if (!publicKey) return;

    const interval = setInterval(() => {
      fetchBalance(publicKey);
    }, 10000);

    return () => clearInterval(interval);
  }, [publicKey]);

  const handleConnect = async () => {
    try {
      setStatus('');
      setLoading(true);
      const pubKey = await connectWallet();
      setPublicKey(pubKey);
      await fetchBalance(pubKey);
    } catch (err) {
      setStatusType('failed');
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
    setContractResponse('');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!destination || !amount) {
      setStatusType('failed');
      setStatus('Please enter destination and amount');
      return;
    }
    try {
      setStatusType('pending');
      setStatus('Transaction submitted, waiting...');
      setTxHash('');
      setLoading(true);
      const response = await sendPayment(destination, amount, publicKey);
      setTxHash(response.hash || response.id);
      
      setStatus('Payment sent. Recording on smart contract...');
      await recordPayment(publicKey, destination, amount, publicKey);

      setStatusType('success');
      setStatus('Transaction and recording successful!');
      await fetchBalance(publicKey); // Auto refresh balance
    } catch (err) {
      setStatusType('failed');
      setStatus(`Transaction failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetContract = async (e) => {
    e.preventDefault();
    if (!contractKey || !contractValue) return;
    try {
      setIsContractLoading(true);
      setStatusType('pending');
      setStatus('Contract transaction submitted, waiting...');
      setTxHash('');
      const response = await setContractValue(contractKey, contractValue, publicKey);
      setTxHash(response.hash || response.id);
      setStatusType('success');
      setStatus('Contract Set successful!');
      
      // Auto-refresh the stored value
      handleGetContract(null, contractKey);
    } catch (err) {
      setStatusType('failed');
      setStatus(`Contract Set failed: ${err.message}`);
    } finally {
      setIsContractLoading(false);
    }
  };

  const handleGetContract = async (e, overrideKey) => {
    if (e) e.preventDefault();
    const keyToUse = overrideKey || contractKey;
    if (!keyToUse) return;
    try {
      setContractResponse('Fetching...');
      const value = await getContractValue(keyToUse);
      setContractResponse(`Value for ${keyToUse}: ${value}`);
    } catch (err) {
      setContractResponse(`Error: ${err.message}`);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Stellar Payment dApp</h1>
        <p className="subtitle">Testnet Environment (Yellow Belt)</p>

        {!publicKey ? (
          <button className="btn primary" onClick={handleConnect} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect Wallet'}
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

            <div className="contract-form">
              <h3>Contract Interaction</h3>
              <p className="small-text">Contract: <span className="truncate">{CONTRACT_ADDRESS}</span></p>
              <div className="form-group">
                <label>Key (Symbol)</label>
                <input
                  type="text"
                  placeholder="my_key"
                  value={contractKey}
                  onChange={(e) => setContractKey(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Value (Number)</label>
                <input
                  type="number"
                  placeholder="123"
                  value={contractValue}
                  onChange={(e) => setContractValueState(e.target.value)}
                />
              </div>
              <div className="btn-group">
                 <button className="btn primary" onClick={handleSetContract} disabled={isContractLoading || !contractKey || !contractValue}>
                   {isContractLoading ? 'Processing...' : 'Set Value'}
                 </button>
                 <button className="btn secondary" onClick={(e) => handleGetContract(e)} disabled={!contractKey}>
                   Get Value
                 </button>
              </div>
              {contractResponse && (
                <div className="contract-response">
                  <strong>Response:</strong> {contractResponse}
                </div>
              )}
            </div>
          </div>
        )}

        {status && (
          <div className={`status ${statusType}`}>
            {status}
          </div>
        )}
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

        {publicKey && <ActivityFeed />}
      </div>
    </div>
  );
}

export default App;
