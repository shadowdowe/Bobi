export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, apiKey } = request.body;
    const expectedApiKey = process.env.MY_SECRET_API_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!expectedApiKey || !botToken || !chatId) {
        return response.status(500).json({ error: 'Server configuration fucked up' });
    }

    if (apiKey !== expectedApiKey) {
        return response.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }

    if (!message) {
        return response.status(400).json({ error: 'Message is required' });
    }

    try {
        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: message }),
        });
        return response.status(200).json({ status: 'ok' });
    } catch (error) {
        return response.status(500).json({ error: 'Failed to forward message' });
    }
}
