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
        let messageLines = [];
        let status = '⚪️ INFO'; 
        let dataType = data.type || data.status;

        if (dataType && typeof dataType === 'string') {
            if (dataType.toLowerCase().includes('sent')) {
                status = '📤 SENT';
            } else if (dataType.toLowerCase().includes('received')) {
                status = '📥 RECEIVED';
            }
            delete data.type;
            delete data.status;
        }
        
        messageLines.push(status);
        messageLines.push('');

        for (const [key, value] of Object.entries(data)) {
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
            messageLines.push(`*${formattedKey}*: \`${value}\``);
        }

        const formattedMessage = messageLines.join('\n');
        
        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: formattedMessage,
                parse_mode: 'Markdown',
            }),
        });
        
        return response.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Failed to forward data' });
    }
}
