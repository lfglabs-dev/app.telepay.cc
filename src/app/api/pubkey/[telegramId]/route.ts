// ... existing imports and POST handler ...

import { MongoClient } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { telegramId: string } }
) {
    try {
        const telegramId = params.telegramId;
        console.log("Attempting to fetch public key for telegramId:", telegramId);

        if (!telegramId) {
            return NextResponse.json(
                { success: false, error: 'Telegram ID is required' },
                { status: 400 }
            );
        }

        // Validate MongoDB URI
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('MongoDB URI is not defined in environment variables');
            return NextResponse.json(
                { success: false, error: 'Database configuration error' },
                { status: 500 }
            );
        }

        if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
            console.error('Invalid MongoDB URI format:', mongoUri.substring(0, 10) + '...');
            return NextResponse.json(
                { success: false, error: 'Invalid database configuration' },
                { status: 500 }
            );
        }

        console.log('Attempting to connect to MongoDB...');
        const client = new MongoClient(mongoUri);
        await client.connect();
        console.log('Successfully connected to MongoDB');

        const db = client.db('telepay');
        const collection = db.collection('public_key');

        // Find the most recent entry for this telegramId
        console.log('Querying for telegramId:', telegramId);
        const result = await collection.findOne(
            { telegramId: parseInt(telegramId) },
            { sort: { createdAt: -1 } }
        );
        console.log('Query result:', result ? 'Found' : 'Not found');

        await client.close();
        console.log('Closed MongoDB connection');

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

    } catch (error: any) {
        console.error('Error retrieving public key from MongoDB:', {
            error: error,
            message: error.message,
            stack: error.stack
        });
        return NextResponse.json(
            { success: false, error: 'Failed to retrieve public key' },
            { status: 500 }
        );
    }
}