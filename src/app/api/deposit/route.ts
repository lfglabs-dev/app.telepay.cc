import { NextResponse } from "next/server";
import { ethers } from "ethers";

// ABIs
const MessageTransmitterABI = [
  "function receiveMessage(bytes memory message, bytes memory attestation) external returns (bool)",
  "event MessageReceived(bytes32 indexed messageHash)",
];

async function getAttestation(messageHash: string) {
  interface AttestationResponse {
    status: string;
    attestation?: string;
  }

  let attestationResponse: AttestationResponse = { status: "pending" };
  while (attestationResponse.status !== "complete") {
    const response = await fetch(
      `https://iris-api-sandbox.circle.com/attestations/${messageHash}`
    );
    attestationResponse = await response.json();
    await new Promise((r) => setTimeout(r, 2000));
  }
  return attestationResponse.attestation!;
}

export async function POST(request: Request) {
  try {
    const { depositTxHash, chain } = await request.json();

    if (!depositTxHash || !chain) {
      return NextResponse.json(
        { error: "Missing depositTxHash or chain" },
        { status: 400 }
      );
    }

    console.log(`Processing deposit tx: ${depositTxHash} on chain: ${chain}`);

    // Connect to providers
    const ethProvider = new ethers.JsonRpcProvider(
      process.env.ETH_SEPOLIA_RPC!
    );
    const baseProvider = new ethers.JsonRpcProvider(
      process.env.BASE_SEPOLIA_RPC!
    );
    const sourceProvider = new ethers.JsonRpcProvider(getRpcUrl(chain));

    // Create wallet instances
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!);
    const ethWallet = wallet.connect(ethProvider);
    const baseWallet = wallet.connect(baseProvider);

    console.log("Connected wallet address:", await wallet.getAddress());

    // Get transaction receipt
    const receipt = await sourceProvider.getTransactionReceipt(depositTxHash);
    if (!receipt) {
      throw new Error("Transaction receipt not found");
    }

    // Find MessageSent events
    const messageSentTopic = ethers.id("MessageSent(bytes)");
    const messageLogs = receipt.logs.filter(
      (log) => log.topics[0] === messageSentTopic
    );

    console.log(`Found ${messageLogs.length} message(s) to process`);

    let vaultTxHash: string | undefined;
    let telepayTxHash: string | undefined;

    // Process each message
    for (const [index, log] of Array.from(messageLogs.entries())) {
      try {
        // Decode the message bytes from the event data
        const messageBytes = ethers.AbiCoder.defaultAbiCoder().decode(
          ["bytes"],
          log.data
        )[0];

        // Calculate message hash for attestation
        const messageHash = ethers.keccak256(messageBytes);
        console.log("Message hash:", messageHash);

        // Get attestation from Circle
        const attestation = await getAttestation(messageHash);
        console.log("Got attestation");

        if (index === 0) {
          // First message: Process on Ethereum (Vault)
          console.log("Processing Vault message on Ethereum...");
          const ethMessageTransmitter = new ethers.Contract(
            process.env.ETH_MESSAGE_TRANSMITTER_ADDRESS!,
            MessageTransmitterABI,
            ethWallet
          );

          try {
            const ethTx = await ethMessageTransmitter.receiveMessage(
              messageBytes,
              attestation
            );
            const receipt = await ethTx.wait();
            vaultTxHash = receipt.hash;
            console.log("Ethereum message processed:", vaultTxHash);
          } catch (error: any) {
            if (error.reason === "Nonce already used") {
              console.log("Message already processed on Ethereum");
              vaultTxHash = "already_processed";
            } else {
              throw error;
            }
          }
        } else {
          // Second message: Process on Base (Telepay)
          console.log("Processing Telepay message on Base...");
          const baseMessageTransmitter = new ethers.Contract(
            process.env.BASE_MESSAGE_TRANSMITTER_ADDRESS!,
            MessageTransmitterABI,
            baseWallet
          );

          try {
            console.log("Message bytes:", messageBytes);
            console.log("Attestation:", attestation);
            const baseTx = await baseMessageTransmitter.receiveMessage(
              messageBytes,
              attestation,
              {
                gasLimit: 500000, // Specify a fixed gas limit
              }
            );
            const receipt = await baseTx.wait();
            telepayTxHash = receipt.hash;
            console.log("Base message processed:", telepayTxHash);
          } catch (error: any) {
            if (error.reason === "Nonce already used") {
              console.log("Message already processed on Base");
              telepayTxHash = "already_processed";
            } else {
              throw error;
            }
          }
        }
      } catch (error: any) {
        console.error(`Failed to process message ${index}:`, error);
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${messageLogs.length} message(s)`,
      vault_tx: vaultTxHash,
      telepay_tx: telepayTxHash,
      status:
        vaultTxHash === "already_processed" ||
        telepayTxHash === "already_processed"
          ? "already_processed"
          : "processed",
    });
  } catch (error: any) {
    console.error("Deposit processing error:", error);
    return NextResponse.json(
      {
        error: "Deposit processing failed",
        details: error.message || "Unknown error",
        type: error.code || "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}

function getRpcUrl(chain: string): string {
  const rpcs: { [key: string]: string } = {
    "base-sepolia": process.env.BASE_SEPOLIA_RPC!,
    "ethereum-sepolia": process.env.ETH_SEPOLIA_RPC!,
    "arbitrum-sepolia": process.env.ARBITRUM_SEPOLIA_RPC!,
  };

  const rpc = rpcs[chain.toLowerCase()];
  if (!rpc) throw new Error(`Unsupported chain: ${chain}`);
  return rpc;
}
