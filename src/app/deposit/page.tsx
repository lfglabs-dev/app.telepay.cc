/* eslint-disable @next/next/no-img-element */
"use client";

import { type FC, useEffect, useState } from 'react';
import { Wallet, Copy } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Page } from '@/components/Page'
import { useUserDetails } from '@/utils/telegram';
import { QRCodeSVG } from 'qrcode.react';

const DepositPage: FC = () => {
    const user = useUserDetails();
    const { toast } = useToast();
    const [receivingAddress, setReceivingAddress] = useState<string>('');

    // Get public key from localStorage on component mount
    useEffect(() => {
        const publicKey = localStorage.getItem('publicKey');
        if (publicKey) {
            setReceivingAddress(publicKey);
        }
    }, []);

    // Create EIP-681 compatible URI for USDC
    const getPaymentUri = () => {
        if (!receivingAddress) return '';

        // USDC contract address (this is Ethereum mainnet - adjust for other networks)
        const usdcContract = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
        return `ethereum:${usdcContract}/transfer?address=${receivingAddress}&uint256=0`;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: "The value has been copied to your clipboard.",
            duration: 2000,
        });
    };

    return (
        <Page>
            <div className="flex flex-col items-center justify-center gap-6 p-6 max-w-md mx-auto">
                <h1 className="text-4xl my-4 font-bold text-center">How to deposit</h1>

                {receivingAddress ? (
                    <div className="w-full aspect-square mx-auto bg-white rounded-xl flex items-center justify-center">
                        <QRCodeSVG
                            value={getPaymentUri()}
                            size={250}
                            level="H"
                            includeMargin={true}
                            className="w-full h-full"
                        />
                    </div>
                ) : (
                    <div className="w-full aspect-square max-w-[250px] mx-auto bg-zinc-900 rounded-xl flex items-center justify-center">
                        <div className="text-zinc-400 text-sm text-center p-4">
                            No wallet address available
                        </div>
                    </div>
                )}

                <div className="space-y-3">

                    <Button
                        variant="ghost"
                        className="w-full bg-zinc-900 hover:bg-zinc-800 p-4 flex items-center justify-between h-auto"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
                                <Wallet className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-white">From an External Wallet</div>
                                <div className="text-sm text-zinc-400">Use QR code to send USDC</div>
                            </div>
                        </div>
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full bg-zinc-900 hover:bg-zinc-800 p-4 flex items-center justify-between h-auto"
                        onClick={() => user?.username && copyToClipboard(`${user.username}.telepay.cc`)}
                    >
                        <div className="flex items-center gap-4">
                            <img src="/logos/ens-logo.jpg" alt="Telegram" className="w-12 h-12 border-10 rounded-full" />
                            <div className="text-left">
                                <div className="font-semibold text-white">Send with ENS</div>
                                <div className="text-sm text-zinc-400">Send to {user?.username}.telepay.cc</div>
                            </div>
                        </div>
                        <Copy className="h-5 w-5 text-zinc-400 hover:text-white" />
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full bg-zinc-900 hover:bg-zinc-800 p-4 flex items-center justify-between h-auto"
                        onClick={() => user?.username && copyToClipboard(user.username)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#28A8EA] rounded-full flex items-center justify-center">
                                <img src="/logos/telegram-logo.webp" alt="Telegram" className="w-12 h-12" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-white">From a Telepay wallet</div>
                                <div className="text-sm text-zinc-400">Send to @{user?.username}</div>
                            </div>
                        </div>
                        <Copy className="h-5 w-5 text-zinc-400 hover:text-white" />
                    </Button>

                </div>
            </div>
        </Page>
    )
}

export default DepositPage;