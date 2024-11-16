export interface Transaction {
    hash: string;
    amount: number;
    recipient: {
        name: string;
        avatar: string;
        telegramId: string;
    };
    timestamp: number;
    status: 'completed' | 'pending' | 'failed';
} 