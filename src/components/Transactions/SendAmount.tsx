/* eslint-disable @next/next/no-img-element */
'use client'

import { useState } from 'react'
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUpIcon } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

export interface SendAmountProps {
    recipient: {
        name: string
        avatar: string
        telegramId: string
    }
    balance: number
    sourcePubKey: string
    signature?: string
    onSend?: (amount: number) => void
}

export default function SendAmount({
    recipient,
    balance = 87430.12,
    sourcePubKey,
    signature = "0x8d99fd45e7e4f88bf06c88b5aa0bb2d088686b3c8caac83f3222e2b2d3f455976f8176089f190849fd827365f952fdf5dda9c30e88446fd570d60119c8c09be71b",
    onSend
}: SendAmountProps) {
    const [amount, setAmount] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9.]/g, '')
        // Only allow one decimal point
        const decimalCount = (value.match(/\./g) || []).length
        if (decimalCount > 1) {
            return
        }
        // Prevent more than 2 decimal places
        const parts = value.split('.')
        if (parts[1] && parts[1].length > 2) {
            return
        }
        setAmount(value)
    }

    const handleSend = async () => {
        if (!amount) return

        setIsLoading(true)
        try {
            const response = await fetch('/api/transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount,
                    sourcePubKey,
                    telegramId: recipient.telegramId,
                    signature,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.details || data.error || 'Transfer failed')
            }

            toast({
                title: "Transfer successful",
                description: `Transaction hash: ${data.txHash}`,
            })

            if (onSend) {
                onSend(parseFloat(amount))
            }
        } catch (error: any) {
            console.error('Transfer error:', error)
            toast({
                title: "Transfer failed",
                description: error.message || 'An unexpected error occurred',
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-zinc-950 text-white p-6">
            <div className="w-full max-w-md space-y-16">
                <div className="flex flex-col items-center gap-2">
                    <Avatar className="w-16 h-16 border-2 border-zinc-800">
                        <img src={recipient.avatar} alt={recipient.name} className="rounded-full" />
                    </Avatar>
                    <div className="text-sm text-zinc-400">Send to</div>
                    <div className="text-xl font-semibold flex items-center gap-1">
                        {recipient.name}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center justify-center w-full">
                        <span className="text-5xl mr-2">$</span>
                        <Input
                            type="text"
                            value={amount}
                            onChange={handleAmountChange}
                            className="text-6xl font-bold bg-transparent border-none text-center w-40 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-white/20"
                            placeholder="0"
                        />
                    </div>
                    <div className="px-4 py-2 bg-zinc-900/50 rounded-full text-sm text-zinc-400">
                        Your Balance - ${balance.toLocaleString()}
                    </div>
                </div>

                <Button
                    className="w-full h-14 text-lg bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-800 disabled:text-zinc-500"
                    disabled={!amount || amount === '0' || isLoading}
                    onClick={handleSend}
                >
                    {isLoading ? (
                        "Sending..."
                    ) : (
                        <>
                            <ArrowUpIcon className="mr-2 h-5 w-5" />
                            Send
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}