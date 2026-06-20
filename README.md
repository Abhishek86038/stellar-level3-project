# Stellar Payment dApp

## Description
A production-ready Stellar testnet dApp built with React and Vite. 
Features multi-wallet integration, two deployed Soroban smart contracts 
with inter-contract communication, real-time event streaming, automated 
testing, CI/CD pipeline, and a fully mobile-responsive interface.

## Live Demo
https://stellar-level3-project.vercel.app/

## Demo Video
https://youtu.be/gfPN5L6c26U?si=ZkMfQsuMiSIuKP7C


## Prerequisites
- Node.js installed
- Rust and Cargo installed (for contract development/testing)
- A Stellar wallet browser extension (Freighter, xBull, Lobstr, or Albedo)
- Wallet set to Stellar Testnet network

## Setup Instructions
1. Clone the repository
   git clone <your-repo-url>
   cd <project-folder>
2. Install dependencies
   npm install
3. Start the development server
   npm run dev
4. Open browser at http://localhost:5173

## Deployed Contracts

### SimpleStorage Contract
- Contract Address: CCAPG2U42HTAHWLUY46I5J5ZQ7V6CKUC2NXZWNUXMBO7RAV3NNYPXJOA
- Network: Stellar Testnet
- Explorer: https://lab.stellar.org/r/testnet/contract/CCAPG2U42HTAHWLUY46I5J5ZQ7V6CKUC2NXZWNUXMBO7RAV3NNYPXJOA

### PaymentTracker Contract
- Contract Address: CAC75NNARRWQXNJK2NI22JQF3KV2NJY2VYYRYHYXFHNH66VDDNYXU727
- Network: Stellar Testnet
- Explorer: https://lab.stellar.org/r/testnet/contract/CAC75NNARRWQXNJK2NI22JQF3KV2NJY2VYYRYHYXFHNH66VDDNYXU727
- Calls SimpleStorage contract internally (inter-contract communication)

## Transaction Hashes

### Contract Deployment
- Hash: 4ff4e48125e40e52d6cf621c4e244d6f4533d870c6757fcde52d106028e4803b
- Verify: https://stellar.expert/explorer/testnet/tx/4ff4e48125e40e52d6cf621c4e244d6f4533d870c6757fcde52d106028e4803b

### Contract Interaction (PaymentTracker call)
- Hash: c6418d4e4ca1b35b9bdc5a2ab653335bddd323bc71f8b01feaa8b531bb299137
- Verify: https://stellar.expert/explorer/testnet/tx/c6418d4e4ca1b35b9bdc5a2ab653335bddd323bc71f8b01feaa8b531bb299137

## Features
- Multi-wallet connection via StellarWalletsKit (Freighter, xBull, Lobstr, Albedo)
- Real-time XLM balance display
- Send XLM transactions on testnet
- Transaction history viewer
- Two deployed Soroban smart contracts with inter-contract communication
- Real-time Activity Feed using Soroban event streaming (auto-updates, no manual refresh)
- Transaction status tracking (pending/success/failed)
- Error handling for: wallet not found, user rejected connection, insufficient balance
- Fully mobile responsive design (tested at 768px and 480px breakpoints)

## Testing

### Smart Contract Tests
Run with:
cd contract && cargo test
- 4 tests passing (SimpleStorage: 2, PaymentTracker: 2)

### Frontend Tests
Run with:
npm run test
- 2 tests passing

## CI/CD Pipeline
This project uses GitHub Actions for continuous integration.
Pipeline runs automatically on every push to main branch and includes:
- Frontend dependency install and test execution
- Frontend build verification
- Rust/Soroban contract test execution
View pipeline status: https://github.com/Abhishek86038/stellar-level3-project/actions

## Screenshots

### 1. Wallet Options / Selection Modal
![alt text](image-12.png)

### 2. Wallet Connected State
![alt text](image-11.png)

### 3. XLM Balance Displayed
![alt text](image-13.png)

### 4. Successful Testnet Transaction
![alt text](image-14.png)

### 5. Real-time Activity Feed
![alt text](image-15.png)

### 6. Mobile Responsive UI
![alt text](image-16.png)  ![alt text](image-17.png)

### 7. CI/CD Pipeline Running (GitHub Actions)
![alt text](image-18.png)

### 8. Test Output (3+ passing tests)
![alt text](image-20.png)

### 9. Error Handling Examples
![alt text](image-21.png)

## Tech Stack
- React + Vite
- @creit-tech/stellar-wallets-kit
- @stellar/stellar-sdk
- Soroban Smart Contracts (Rust)
- Vitest (frontend testing)
- GitHub Actions (CI/CD)
- Vercel (deployment)
- Stellar Horizon Testnet
- Stellar Soroban RPC Testnet
