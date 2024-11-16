/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, type FC } from 'react';
import { Search, Wallet } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Page } from '@/components/Page'
import { Avatar } from "@/components/ui/avatar"
import SendAmount from '@/components/Transactions/SendAmount';

interface Transaction {
    id: string
    name: string
    amount: number
    date: string
    avatar?: string
    isWallet?: boolean
    verified?: boolean
}

const recentTransactions: Transaction[] = [
    {
        id: '2',
        name: 'ThOrgal',
        amount: 18,
        date: '12 Nov',
        avatar: '/avatars/th0rgal.png',
        verified: true
    },
    {
        id: '3',
        name: 'Fricoben',
        amount: 28,
        date: '12 Nov',
        avatar: '/avatars/fricoben.jpg',
        verified: true
    },
    {
        id: '4',
        name: '0x06f...2E58',
        amount: 198,
        date: '25 Oct',
        isWallet: true
    }
]



const SendPage: FC = () => {
    const [search, setSearch] = useState('')
    const [isEnterPressed, setIsEnterPressed] = useState(false)

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && search) {
                setIsEnterPressed(true)
            }
        }

        window.addEventListener('keypress', handleKeyPress)
        return () => window.removeEventListener('keypress', handleKeyPress)
    }, [search])

    return (
        <Page>
            {isEnterPressed ? <SendAmount balance={430.12} recipient={{
                name: 'Th0rgal',
                avatar: '/avatars/th0rgal.png',
                telegramId: '1139694048',
            }} onSend={() => setIsEnterPressed(false)} sourcePubKey={localStorage.getItem('publicKey') || ''} /> : <div className="flex flex-col gap-6 p-6 max-w-md mx-auto">
                <h1 className="text-4xl font-bold text-center">How to send</h1>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
                    <Input
                        className="pl-10 pr-10 py-6 bg-zinc-900 border-zinc-800 text-zinc-300 placeholder:text-zinc-500"
                        placeholder="Name, @telegram, wallet address"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 6L14 14M6 14L14 6" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </Button>
                </div>

                <div className="space-y-3">
                    <Button
                        variant="ghost"
                        className="w-full bg-zinc-900 hover:bg-zinc-800 p-4 flex items-center justify-between h-auto"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#28A8EA] rounded-full flex items-center justify-center">
                                <img src="/logos/telegram-logo.webp" alt="Telegram" className="w-12 h-12" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-white">Your Contact Telegram</div>
                                <div className="text-sm text-zinc-400">Transfer within Telegram</div>
                            </div>
                        </div>
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full bg-zinc-900 hover:bg-zinc-800 p-4 flex items-center justify-between h-auto"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
                                <Wallet className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-white">External Wallet</div>
                                <div className="text-sm text-zinc-400">Send USDC to a crypto address</div>
                            </div>
                        </div>
                    </Button>
                </div>

                <div className="space-y-4">
                    {recentTransactions.map((transaction) => (
                        <Button
                            key={transaction.id}
                            variant="ghost"
                            className="w-full bg-zinc-900 hover:bg-zinc-800 p-4 flex items-center justify-between h-auto"
                        >
                            <div className="flex items-center gap-4">
                                {transaction.isWallet ? (
                                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
                                        <Wallet className="h-6 w-6 text-white" />
                                    </div>
                                ) : (
                                    <Avatar className="h-12 w-12 border border-zinc-800">
                                        <img src={transaction.avatar} alt={transaction.name} className="rounded-full" />
                                    </Avatar>
                                )}
                                <div className="text-left">
                                    <div className="font-semibold text-white flex items-center gap-1">
                                        {transaction.name}
                                    </div>
                                    <div className="text-sm text-zinc-400">You sent ${transaction.amount}</div>
                                </div>
                            </div>
                            <div className="text-sm text-zinc-400">{transaction.date}</div>
                        </Button>
                    ))}
                </div>
            </div>}

        </Page>
    )
}

export default SendPage;