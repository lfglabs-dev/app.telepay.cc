import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { MongoClient } from "mongodb";
import { Telegraf } from "telegraf";
import { GET as getPubKey } from "../pubkey/[telegramId]/route";

// Basic ABI for transfer function
const ABI = [
  "function transfer(uint256 amount, bytes memory sourcePubKey, bytes memory targetPubKey, bytes memory signature) public returns (bool)",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, sourcePubKey, telegramId, signature } = body;

    // More detailed input logging
    console.log("Full request body:", body);
    console.log("Amount type:", typeof amount, "Value:", amount);
    console.log("Source Public Key:", sourcePubKey);
    console.log("Telegram ID:", telegramId);
    console.log("Signature:", signature);

    if (!amount || !sourcePubKey || !telegramId || !signature) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Call the handler directly
    try {
      console.log("Attempting to fetch public key for telegramId:", telegramId);

      const pubKeyResponse = await getPubKey(
        { params: { telegramId: telegramId.toString() } } // Ensure telegramId is a string
      );

      console.log("Public key response status:", pubKeyResponse.status);
      console.log("Public key response ok:", pubKeyResponse.ok);

      if (!pubKeyResponse.ok) {
        const errorText = await pubKeyResponse.text();
        console.error("Failed to fetch public key. Response:", errorText);
        return NextResponse.json(
          {
            error: "Failed to fetch target public key",
            details: errorText,
            telegramId: telegramId,
            status: pubKeyResponse.status,
          },
          { status: 400 }
        );
      }

      const pubKeyData = await pubKeyResponse.json();
      console.log("Public key data received:", pubKeyData);

      if (!pubKeyData.data?.publicKey) {
        console.error("No public key found in response:", pubKeyData);
        return NextResponse.json(
          {
            error: "No public key found in response",
            response: pubKeyData,
          },
          { status: 400 }
        );
      }

      const targetPubKey = pubKeyData.data.publicKey;
      console.log("Successfully retrieved targetPubKey:", targetPubKey);

      // Connect to Base Sepolia
      const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC);
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

      console.log("Connected wallet address:", await wallet.getAddress());

      // Initialize contract
      const contract = new ethers.Contract(
        process.env.TELEPAY_CONTRACT_ADDRESS!,
        ABI,
        wallet
      );

      // Format parameters
      const formattedAmount = ethers.getBigInt(amount);

      // Ensure public keys and signature are properly formatted hex strings
      const formattedSourcePubKey = sourcePubKey.startsWith("0x")
        ? sourcePubKey
        : `0x${sourcePubKey}`;
      const formattedTargetPubKey = targetPubKey.startsWith("0x")
        ? targetPubKey
        : `0x${targetPubKey}`;
      const formattedSignature = signature.startsWith("0x")
        ? signature
        : `0x${signature}`;

      // Validate hex strings
      if (
        !ethers.isHexString(formattedSourcePubKey) ||
        !ethers.isHexString(formattedTargetPubKey) ||
        !ethers.isHexString(formattedSignature)
      ) {
        return NextResponse.json(
          { error: "Invalid hex format for public keys or signature" },
          { status: 400 }
        );
      }

      console.log("Formatted parameters:", {
        amount: formattedAmount.toString(),
        sourcePubKey: formattedSourcePubKey,
        targetPubKey: formattedTargetPubKey,
        signature: formattedSignature,
      });

      // Log contract details
      console.log("Contract address:", process.env.TELEPAY_CONTRACT_ADDRESS);
      console.log("RPC URL:", process.env.BASE_SEPOLIA_RPC);

      // Execute transfer with try-catch
      try {
        const tx = await contract.transfer(
          formattedAmount,
          formattedSourcePubKey,
          formattedTargetPubKey,
          formattedSignature,
          { gasLimit: 500000 } // Add explicit gas limit
        );

        console.log("Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction receipt:", receipt);

        // Initialize Telegram bot and send notification
        try {
          const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
          const usdcAmount = (Number(formattedAmount) / 1_000_000).toFixed(2);
          const txUrl = `https://base-sepolia.blockscout.com/tx/${receipt.hash}`;

          await bot.telegram.sendMessage(
            telegramId,
            `✅ You have received ${usdcAmount} USDC!\n\nView transaction: ${txUrl}`
          );
        } catch (telegramError) {
          console.error("Failed to send Telegram notification:", telegramError);
          // Don't fail the whole request if Telegram notification fails
        }

        return NextResponse.json({
          success: true,
          txHash: receipt.hash,
        });
      } catch (txError: any) {
        console.error("Transaction error details:", {
          error: txError,
          message: txError.message,
          code: txError.code,
          data: txError.data,
        });

        return NextResponse.json(
          {
            error: "Transfer failed",
            details: txError.message,
            code: txError.code,
            data: txError.data,
          },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error("Transfer error:", {
        error,
        message: error.message,
        code: error.code,
        stack: error.stack,
      });

      return NextResponse.json(
        {
          error: "Transfer failed",
          details: error.message || "Unknown error",
          type: error.code || "UNKNOWN_ERROR",
          stack:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Transfer error:", {
      error,
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: "Transfer failed",
        details: error.message || "Unknown error",
        type: error.code || "UNKNOWN_ERROR",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
