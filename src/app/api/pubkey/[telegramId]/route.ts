// ... existing imports and POST handler ...

import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: { telegramId: string } }
) {
    try {
        const telegramId = params.telegramId;

        if (!telegramId) {
            return NextResponse.json(
                { success: false, error: 'Telegram ID is required' },
                { status: 400 }
            );
        }

        const client = new MongoClient(process.env.MONGODB_URI || "");
        await client.connect();

        const db = client.db('telepay');
        const collection = db.collection('public_key');

        // Find the most recent entry for this telegramId
        const result = await collection.findOne(
            { telegramId: parseInt(telegramId) },
            { sort: { createdAt: -1 } }
        );

        await client.close();

        if (!result) {
            return NextResponse.json(
                { success: false, error: 'No public key found for this Telegram ID' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                publicKey: result.publicKey,
                nillionAppId: result.nillionAppId,
                telegramId: result.telegramId,
                createdAt: result.createdAt
            }
        });

    } catch (error) {
        console.error('Error retrieving public key from MongoDB:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to retrieve public key' },
            { status: 500 }
        );
    }
}