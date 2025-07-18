export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { accessKey, ...data } = request.body;
    const expectedApiKey = process.env.MY_SECRET_API_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!expectedApiKey || !botToken || !chatId) {
        return response.status(500).json({ error: 'Server configuration error' });
    }

    if (accessKey !== expectedApiKey) {
        return response.status(401).json({ error: 'Unauthorized' });
    }

    if (!data.message) {
        return response.status(400).json({ error: 'Message field missing' });
    }

    try {
        const rawText = data.message;

        const device = (rawText.match(/\*\*(INFINIX.*?)\*\*/) || [])[1] || 'N/A';
        const time = (rawText.match(/\*\*Time:\*\* ([\d:]+)/) || [])[1] || 'N/A';
        const status = (rawText.match(/\*\*(SENT|RECEIVED)\*\*/) || [])[1] || 'Status N/A';
        const chat = (rawText.match(/\*\*Chat:\*\* (.*?)(?=\s*\*\*|$)/) || [])[1] || 'Chat N/A';
        const message = (rawText.match(/\*\*Message:\*\* (.*)/s) || [])[1] || 'Message N/A';

        // 'SENT' ko 'SEND' karne ka system
        const displayStatus = status.trim().toUpperCase() === 'SENT' ? 'SEND' : status.trim();
        const statusIcon = displayStatus === 'SEND' ? '📤' : '📥';

        let formattedMessage = `📱 ${device.trim()}
🕒 Time: ${time.trim()}

${statusIcon} ${displayStatus}

Chat: ${chat.trim()}
Message: ${message.trim()}`;

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
        return response.status(500).json({ error: 'Failed to format and forward data' });
    }
}
