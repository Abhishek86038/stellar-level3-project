import * as StellarSdk from '@stellar/stellar-sdk';
export const Server = StellarSdk.Server || (StellarSdk.Horizon && StellarSdk.Horizon.Server);
