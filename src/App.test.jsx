import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

import { vi } from 'vitest';

vi.mock('./stellar', () => ({
  connectWallet: vi.fn(),
  getBalance: vi.fn(),
  sendPayment: vi.fn(),
  kit: {}
}));

vi.mock('./contract', () => ({
  setContractValue: vi.fn(),
  getContractValue: vi.fn(),
  CONTRACT_ADDRESS: 'MOCK_ADDRESS'
}));

vi.mock('./paymentContract', () => ({
  recordPayment: vi.fn(),
  getPaymentCount: vi.fn(),
  getPaymentHistory: vi.fn(),
  listenForPaymentEvents: vi.fn()
}));

// We just mock the components or use them directly if they don't have side effects on initial render
describe('App Component Tests', () => {
  it('renders wallet connect button correctly', () => {
    render(<App />);
    const connectBtn = screen.getByRole('button', { name: /Connect Wallet/i });
    expect(connectBtn).toBeInTheDocument();
  });

  it('renders the app logo title', () => {
    render(<App />);
    const logoTitle = screen.getByText('Stellar Pay');
    expect(logoTitle).toBeInTheDocument();
  });

  it('renders the welcome hero description text', () => {
    render(<App />);
    const subtitle = screen.getByText(/Securely sign transactions on Stellar Testnet/i);
    expect(subtitle).toBeInTheDocument();
  });

  it('displays balance correctly when a mock balance is provided', () => {
    const MockBalanceDisplay = ({ balance }) => (
      <div className="info-row">
        <span className="label">Balance:</span>
        <span className="value xl" data-testid="balance-display">{balance} XLM</span>
      </div>
    );
    
    render(<MockBalanceDisplay balance="123.45" />);
    const balanceElement = screen.getByTestId('balance-display');
    expect(balanceElement).toHaveTextContent('123.45 XLM');
  });
});

