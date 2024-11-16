import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

interface StorePublicKeyRequest {
    publicKey: string;
    nillionAppId: string;
    telegramId: number;
}

export async function POST(request: Request) {
    try {
        const { publicKey, nillionAppId, telegramId }: StorePublicKeyRequest = await request.json();

        const client = new MongoClient(process.env.MONGODB_URI || "");
        await client.connect();

        const db = client.db('telepay');
        const collection = db.collection('public_key');

        const existingKey = await collection.findOne({ telegramId });
        if (existingKey) {
            await client.close();
            return NextResponse.json(
                { success: false, error: 'Public key already exists for this Telegram ID' },
                { status: 400 }
            );
        }

        const result = await collection.insertOne({
            publicKey,
            nillionAppId,
            telegramId,
            createdAt: new Date()
        });

        await client.close();
        return NextResponse.json({ success: true, result });

    } catch (error) {
        console.error('Error storing public key in MongoDB:', error);
        return NextResponse.json({ success: false, error: 'Failed to store public key' }, { status: 500 });
    }
} 