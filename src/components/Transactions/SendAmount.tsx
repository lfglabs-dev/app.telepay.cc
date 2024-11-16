'use client'

import { useState } from 'react'
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUpIcon } from 'lucide-react'

export interface SendAmountProps {
    recipient?: {
        name: string
        avatar: string
    }
    balance: number
    onSend?: (amount: number) => void
}

export default function SendAmount({
    recipient = {
        name: 'Thomas Marchand',
        avatar: '/avatars/thomas.jpg',
    },
    balance = 87430.12,
    onSend
}: SendAmountProps) {
    const [amount, setAmount] = useState('')

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

    const handleSend = () => {
        if (onSend && amount) {
            onSend(parseFloat(amount))
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
                    disabled={!amount || amount === '0'}
                    onClick={handleSend}
                >
                    <ArrowUpIcon className="mr-2 h-5 w-5" />
                    Send
                </Button>
            </div>
        </div>
    )
}