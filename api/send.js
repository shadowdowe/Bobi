export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { accessKey, ...data } = request.body;
    const expectedApiKey = process.env.MY_SECRET_API_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!expectedApiKey || !botToken || !chatId) {
        return response.status(500).json({ error: 'Server config fucked up' });
    }

    if (accessKey !== expectedApiKey) {
        return response.status(401).json({ error: 'Unauthorized: Invalid Key' });
    }

    // Yahan hum data object se pehli value nikal rahe hain,
    // jo ki tera pre-formatted message string hai.
    const preFormattedMessage = Object.values(data)[0];

    if (!preFormattedMessage || typeof preFormattedMessage !== 'string') {
        return response.status(400).json({ error: 'RAT is not sending a valid message string.' });
    }

    try {
        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        // Yahan hum wahi string bhej rahe hain jo RAT se aayi hai.
        // Koi extra formatting nahi.
        await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: preFormattedMessage,
            }),
        });
        
        return response.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Failed to forward the damn message' });
    }
            }
