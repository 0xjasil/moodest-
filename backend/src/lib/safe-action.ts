import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';


// Base action client for public actions
export const actionClient = createSafeActionClient({
    handleServerError(e) {
        console.error('Action error:', e.message);

        if (e.message.includes('Invalid credentials')) {
            return e.message;
        }

        if (e.message.includes('Email already exists')) {
            return e.message;
        }

        return DEFAULT_SERVER_ERROR_MESSAGE;
    },
});