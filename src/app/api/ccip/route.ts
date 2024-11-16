export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { MongoClient } from "mongodb";

interface ResolveQuery {
  name: string; // DNS-encoded name
  data: string; // ABI encoded function data
  sender: string; // resolver contract address
}

interface UserData {
  telegramId: string;
  publicKey: string;
  username: string;
}

// Add DNS name decoder function
function dnsDecodeName(data: Uint8Array): string {
  let offset = 0;
  const labels = [];
  while (offset < data.length) {
    const length = data[offset];
    if (length === 0) break;
    offset += 1;
    labels.push(ethers.toUtf8String(data.slice(offset, offset + length)));
    offset += length;
  }
  return labels.join(".");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResolveQuery;
    const { name, data, sender } = body;

    if (!name || !data || !sender) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Decode the DNS name
    const nameBytes = ethers.getBytes(name);
    const dnsDecodedName = dnsDecodeName(nameBytes);
    const username = dnsDecodedName.split(".")[0].toLowerCase();

    // Decode the function selector and parameters from data
    const functionSelector = data.slice(0, 10); // First 4 bytes (including 0x)
    const parameters = "0x" + data.slice(10); // Remaining parameters

    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();

    try {
      const db = client.db(process.env.MONGODB_DB_NAME);
      const users = db.collection<UserData>("users");

      // Find user by username
      const user = await users.findOne({ username: username.toLowerCase() });

      if (!user || !user.publicKey) {
        return NextResponse.json(
          { error: "No public key found for username" },
          { status: 404 }
        );
      }

      // Format response based on the function selector
      let responseData;
      if (functionSelector === "0x3b3b57de") {
        // addr(bytes32) - return the address
        responseData = ethers.AbiCoder.defaultAbiCoder().encode(
          ["address"],
          [user.publicKey]
        );
      } else if (functionSelector === "0xf1cb7e06") {
        // addr(bytes32,uint256) - return same address for all chains
        responseData = ethers.AbiCoder.defaultAbiCoder().encode(
          ["bytes"],
          [ethers.getBytes(user.publicKey)]
        );
      } else {
        return NextResponse.json(
          { error: "Unsupported function selector" },
          { status: 400 }
        );
      }

      // Get current timestamp and TTL
      const ttl = 3600; // 1 hour
      const expires = Math.floor(Date.now() / 1000) + ttl;

      // Calculate hashes for the original callData
      const callData = ethers.getBytes(data);
      const requestHash = ethers.keccak256(callData);
      const resultHash = ethers.keccak256(responseData);

      // Sign the message
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!);

      // Create message to sign (following CCIP-read format)
      const message = ethers.concat([
        ethers.hexlify([0x19, 0x00]), // Magic bytes
        ethers.getBytes(sender), // Resolver address
        ethers.zeroPadValue(ethers.toBeHex(expires), 8), // uint64 expires
        requestHash,
        resultHash,
      ]);

      const messageHash = ethers.keccak256(message);
      const signature = await wallet.signMessage(ethers.getBytes(messageHash));

      return NextResponse.json({
        data: {
          response: responseData,
          expires: expires,
          signature: signature,
        },
      });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error("CCIP processing error:", error);
    return NextResponse.json(
      {
        error: "CCIP processing failed",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
