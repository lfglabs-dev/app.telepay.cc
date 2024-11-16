import { generateKeyPair } from './keys';
import { MongoClient } from 'mongodb';

const API_BASE = 'https://nillion-storage-apis-v0.onrender.com';
const APP_NILLION_SEED = "telepay.cc"; // Used for to access public keys of any users

// TODO: Check mongodb database for public key with telegramId
export async function hasAWallet(): Promise<boolean> {
  const publicKey = localStorage.getItem('publicKey');
  const privateKey = localStorage.getItem('privateKey');
  return !!(publicKey && privateKey);
}
export async function storePublicKeyAndAppId(publicKey: string, nillionAppId: string, telegramId: number): Promise<any> {
  try {
    const response = await fetch('/api/pubkey/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publicKey,
        nillionAppId,
        telegramId,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error);
    }

    return data.result;
  } catch (error) {
    console.error('Error storing public key:', error);
    throw error;
  }
}

export async function storePrivateKey(privateKey: string, userSeed: string, nillionAppId: string): Promise<any> {
  try {
    const storeResult = await fetch(`${API_BASE}/api/apps/${nillionAppId}/secrets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: {
          nillion_seed: userSeed,  // Using userSeed to keep it private to the user
          secret_value: privateKey,
          secret_name: 'private_key',
        },
        permissions: {
          retrieve: [],
          update: [],
          delete: [],
          compute: {},
        },
      }),
    }).then((res) => res.json());

    return storeResult;
  } catch (error) {
    console.error('Error storing private key:', error);
    throw error;
  }
}

/**
 * Gets existing wallet or creates new one for user
 * @param telegramId User's telegram ID
 * @param userSeed User's seed for private key access
 * @returns Object containing wallet keys
 */
export async function getOrCreateWallet(telegramId: number, userSeed: string) {
  try {
    const hasExistingWallet = await hasAWallet();

    if (!hasExistingWallet) {
      const response = await fetch('https://nillion-storage-apis-v0.onrender.com/api/apps/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      // Generate new wallet
      const keyPair = generateKeyPair();
      console.log("storing public key", keyPair.address);
      await storePublicKeyAndAppId(keyPair.address, data.appId, telegramId).then(() => {
        localStorage.setItem('publicKey', keyPair.address);
        localStorage.setItem('privateKey', keyPair.privateKey);
      });
      storePrivateKey(keyPair.privateKey, userSeed, data.appId);

      // Store both keys
      console.log("storing private key", keyPair.privateKey);
      await storePublicKeyAndAppId(keyPair.address, data.appId, telegramId);

      return {
        publicKey: keyPair.address,
        privateKey: keyPair.privateKey
      };
    }

    // TODO: Add dedicated functions to retrieve keys from API
    // For now, just get from localStorage
    const publicKey = localStorage.getItem('publicKey');
    const privateKey = localStorage.getItem('privateKey');

    return {
      publicKey,
      privateKey
    };
  } catch (error) {
    console.error('Error in getOrCreateWallet:', error);
    throw error;
  }
}




