import { initData } from "@telegram-apps/sdk-react";
import { useSignal } from "@telegram-apps/sdk-react";

type TelegramUser = {
    firstName: string;
    lastName: string;
    username: string;
    id: number;
    isPremium: boolean;
    languageCode: string;
    photoUrl: string;
}

type UserDetails = {
    id: number;
    username: string;
    fullName: string;
    isPremium: boolean;
    languageCode: string;
    signatureHash: string;
}

export function useUserDetails(): UserDetails | null {
    const initDataState = useSignal(initData.state);

    if (!initDataState?.user) {
        return null;
    }

    const user = initDataState.user as TelegramUser;
    return {
        id: user.id,                    // Numerical ID (e.g. 99281932)
        username: user.username, // Handle without @ (e.g. "rogue")
        fullName: `${user.firstName} ${user.lastName || ''}`.trim(),
        isPremium: user.isPremium || false,
        languageCode: user.languageCode,
        signatureHash: initDataState.hash
    };
}
