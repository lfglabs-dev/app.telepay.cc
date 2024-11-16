"use client";

import type { FC } from 'react';
import { DownloadIcon, SendIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader } from "@/components/ui/card"
import { Page } from '@/components/Page';
import { TransactionItem } from '@/components/Transactions/transactionItem';
import { useRouter } from 'next/navigation';

const IndexPage: FC = () => {
  const router = useRouter();
  return (
    <Page>
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full flex flex-col gap-10">
          <CardHeader className="space-y-4 flex flex-col gap-4">
            <div className='flex flex-col gap-2 items-center'>
              <div className="text-sm text-zinc-400">Balance Yielding at <strong className='text-blue-600' >8.75%/year</strong></div>
              <div className="text-4xl font-bold">$430.12</div>
            </div>

            <div className="flex gap-4">
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/send')}>
                <SendIcon className="mr-2 h-4 w-4" />
                Send
              </Button>
              <Button variant="outline" className="flex-1 text-blue-600 border-zinc-800 hover:bg-blue-200" onClick={() => router.push('/deposit')}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Deposit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="text-sm font-medium text-zinc-400">12 Nov</div>
              <TransactionItem
                name="Fricoben"
                time="21:19"
                amount={230.12}
                avatar="/avatars/fricoben.jpg"
                verified
              />
              <TransactionItem
                name="Th0rgal"
                time="21:19"
                amount={200}
                avatar="/avatars/th0rgal.png"
                verified
              />
            </div>
            <Button
              variant="ghost"
              className="w-full text-zinc-400 hover:text-white hover:bg-zinc-900"
            >
              See All
            </Button>
          </CardContent>
        </div>
      </div>
    </Page>
  );
};

export default IndexPage;