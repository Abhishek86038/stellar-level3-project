# Stellar testnet Payment dApp

A fully functional web application that allows users to connect their Freighter wallet, view their Stellar Testnet XLM balance, and send XLM to other addresses on the Testnet. This app interacts directly with the Stellar Horizon Testnet via the official SDKs.

## Features
- **Wallet Connection**: Connects to the Freighter browser extension to securely access the user's Stellar public key.
- **Balance Display**: Fetches the actual XLM balance from the Horizon Testnet API.
- **Send Payments**: Allows users to transfer XLM by constructing, signing, and submitting transactions to the Testnet.

## Technologies Used
- React
- Vite
- `@stellar/stellar-sdk`
- `@stellar/freighter-api`

## Getting Started

Follow these steps to run the application locally:

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open your browser to `http://localhost:5173` to view the application. 

### Usage Notes
- Ensure you have the [Freighter browser extension](https://www.freighter.app/) installed and configured.
- Make sure your Freighter wallet is set to **Testnet**.
- You can fund your Testnet account using the [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#account-creator?network=test).

## Deployed Contracts
### 1. SimpleStorage Contract
- Contract Address: `CCAPG2U42HTAHWLUY46I5J5ZQ7V6CKUC2NXZWNUXMBO7RAV3NNYPXJOA`
- Network: Stellar Testnet
- Transaction Hash of Contract Call: `fbb36760ca3ef1b0f4904f52011e10719309bfdaebe6318091e1d62a8e2be795`
- Verify on: https://stellar.expert/explorer/testnet/tx/fbb36760ca3ef1b0f4904f52011e10719309bfdaebe6318091e1d62a8e2be795

### 2. PaymentTracker Contract (Level 3 Orange Belt)
- Contract Address: `CAC75NNARRWQXNJK2NI22JQF3KV2NJY2VYYRYHYXFHNH66VDDNYXU727`
- Network: Stellar Testnet
- Features: 
  - Records payments (`record_payment`, `get_payment_count`, `get_payment_history`)
  - Calls `SimpleStorage` via cross-contract call (`env.invoke_contract`) to set the `last_pay` key with the payment amount
  - Emits Soroban events for real-time tracking
- Deployment Transaction Hash: `4ff4e48125e40e52d6cf621c4e244d6f4533d870c6757fcde52d106028e4803b`
- Verify on: https://stellar.expert/explorer/testnet/tx/4ff4e48125e40e52d6cf621c4e244d6f4533d870c6757fcde52d106028e4803b

## Screenshots
### 1. Wallet Selection Modal
[Add screenshot here]

### 2. Wallet Connected State  
[Add screenshot here]

### 3. XLM Balance Displayed
[Add screenshot here]

### 4. Contract Set Value Success
[Add screenshot here]

### 5. Contract Get Value Response
[Add screenshot here]

### 6. Transaction Status (Pending/Success/Fail)
[Add screenshot here]

### 7. Error Handling (wallet not found / rejected / insufficient balance)
[Add screenshot here]

## Testing
### Smart Contract Tests
Run with: `cd contract && cargo test` (for SimpleStorage) and `cd contract/payment_tracker && cargo test`
- 4 tests passing (2 SimpleStorage, 2 PaymentTracker)

### Frontend Tests
Run with: `npm run test`
- 2 tests passing

## CI/CD Pipeline
This project uses GitHub Actions for continuous integration.
Pipeline runs on every push to main branch and includes:
- Frontend test execution
- Frontend build verification
- Smart contract test execution
View pipeline status: https://github.com/Abhishek86038/stellar-level3-project/actions

## Live Demo
https://stellar-level3-project.vercel.app/

## Mobile Responsive
This application is fully responsive and tested on mobile viewports 
(480px and 768px breakpoints).
