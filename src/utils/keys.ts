import { Wallet } from 'ethers';

/**
 * Generates a new Ethereum key pair
 * @returns {Object} Object containing the private key and public address
 */
export function generateKeyPair() {
    // Create a new random wallet
    const wallet = Wallet.createRandom();
    
    return {
        privateKey: wallet.privateKey,
        address: wallet.address
    };
}
