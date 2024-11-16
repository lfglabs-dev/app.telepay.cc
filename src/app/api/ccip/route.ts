export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { MongoClient } from "mongodb";
import { Telegraf } from "telegraf";
import { ParamType } from "ethers";

interface ResolveQuery {
  name: string; // DNS-encoded name
  data: string; // ABI encoded function data
  sender: string; // resolver contract address
}

interface PublicKeyData {
  publicKey: string;
  telegramId: string;
}

// New decodeData function
async function decodeData(data: string): Promise<[string, any]> {
  // Strip the prefix
  const prefix = "0x9061b923";
  if (!data.startsWith(prefix)) {
    throw new Error("Invalid prefix");
  }

  // Decode the hex data
  const hexData = data.slice(prefix.length);
  const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
    [ParamType.from("bytes"), ParamType.from("bytes")],
    ethers.getBytes(hexData)
  );

  // Extract and decode the DNS-encoded name
  const dnsEncodedName = ethers.getBytes(decoded[0]);
  const name = ethers.toUtf8String(dnsEncodedName);

  // Decode the rest of the data
  const restOfTheData = ethers.getBytes(decoded[1]);
  // Extract function selector (first 4 bytes) and parameters
  const functionSelector = ethers.hexlify(restOfTheData.slice(0, 4));
  const parameters = ethers.hexlify(restOfTheData.slice(4));
  const resolverFunctionCall = { functionSelector, parameters };

  return [name, resolverFunctionCall];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResolveQuery;
    const { name, data, sender } = body;

    console.log("Received request:", { name, data, sender });

    if (!name || !data || !sender) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Use the new decodeData function
    const [decodedName, resolverFunctionCall] = await decodeData(data);
    console.log("Decoded DNS name:", decodedName);

    const username = decodedName.split(".")[0].toLowerCase();
    console.log("Extracted username:", username);

    // Initialize Telegram bot
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
    await bot.launch();

    try {
      // Get user info from Telegram
      const chat = await bot.telegram.getChat(username);
      const telegramId = chat.id.toString();
      console.log("Found Telegram ID:", telegramId);

      // Connect to MongoDB and query the correct collection
      const client = new MongoClient(process.env.MONGODB_URI!);
      await client.connect();
      console.log("Connected to MongoDB");

      try {
        const db = client.db(process.env.MONGODB_DB_NAME);
        const publicKeys = db.collection<PublicKeyData>("public_key");

        // Find public key by telegramId
        const publicKeyDoc = await publicKeys.findOne({ telegramId });
        console.log("Database query result:", publicKeyDoc);

        if (!publicKeyDoc || !publicKeyDoc.publicKey) {
          console.log("No public key found for telegramId:", telegramId);
          return NextResponse.json(
            { error: "No public key found for username" },
            { status: 404 }
          );
        }

        // Decode the function selector and parameters from data
        const functionSelector = data.slice(0, 10); // First 4 bytes (including 0x)
        const parameters = "0x" + data.slice(10); // Remaining parameters

        // Format response based on the function selector
        let responseData;
        if (functionSelector === "0x3b3b57de") {
          // addr(bytes32) - return the address
          responseData = ethers.AbiCoder.defaultAbiCoder().encode(
            ["address"],
            [publicKeyDoc.publicKey]
          );
        } else if (functionSelector === "0xf1cb7e06") {
          // addr(bytes32,uint256) - return same address for all chains
          responseData = ethers.AbiCoder.defaultAbiCoder().encode(
            ["bytes"],
            [ethers.getBytes(publicKeyDoc.publicKey)]
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
          ethers.getBytes("0x1900"), // Magic bytes - changed to hex string
          ethers.getBytes(sender), // Resolver address
          ethers.zeroPadValue(ethers.toBeHex(expires), 8), // uint64 expires
          requestHash,
          resultHash,
        ]);

        const messageHash = ethers.keccak256(message);
        const signature = await wallet.signMessage(
          ethers.getBytes(messageHash)
        );

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
    } finally {
      await bot.stop("SIGINT");
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
