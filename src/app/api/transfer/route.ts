import { NextResponse } from "next/server";
import { ethers } from "ethers";

// Basic ABI for transfer function
const ABI = [
  "function transfer(uint256 amount, bytes memory sourcePubKey, bytes memory targetPubKey, bytes memory signature) public returns (bool)",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, sourcePubKey, targetPubKey, signature } = body;

    // Input validation and debug request
    console.log("Request body:", {
      amount,
      sourcePubKey: sourcePubKey.substring(0, 10) + "...",
      targetPubKey: targetPubKey.substring(0, 10) + "...",
      signature: signature.substring(0, 10) + "...",
    });

    if (!amount || !sourcePubKey || !targetPubKey || !signature) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

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
    const formattedSourcePubKey = ethers.hexlify(sourcePubKey);
    const formattedTargetPubKey = ethers.hexlify(targetPubKey);
    const formattedSignature = ethers.hexlify(signature);

    console.log("Formatted parameters:", {
      amount: formattedAmount.toString(),
      sourcePubKey: formattedSourcePubKey,
      targetPubKey: formattedTargetPubKey,
      signature: formattedSignature,
    });

    // Execute transfer
    const tx = await contract.transfer(
      formattedAmount,
      formattedSourcePubKey,
      formattedTargetPubKey,
      formattedSignature
    );

    // Wait for transaction confirmation
    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      txHash: receipt.hash,
    });
  } catch (error: any) {
    console.error("Transfer error:", error);
    return NextResponse.json(
      {
        error: "Transfer failed",
        details: error.message || "Unknown error",
        type: error.code || "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}
