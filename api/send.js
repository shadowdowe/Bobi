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
        // ### YAHAN MAGIC HO RAHA HAI ###
        // Main data object ko ek string mein badal raha hoon
        const dataString = Object.entries(data)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');

        // Ab us string se SENT ya RECEIVED dhoondh raha hoon
        let statusBlock;
        if (dataString.toLowerCase().includes('sent')) {
            statusBlock = '📤 SENT';
        } else {
            statusBlock = '📥 RECEIVED';
        }

        // Key-value pairs se important data nikal raha hoon
        // Ye tere gande format ko bhi handle kar lega
        const model = data.model || data.device || 'Unknown Device';
        const time = data.time || 'N/A';
        const chat = data.chat || 'N/A';
        const message = data.message || '';

        // Final message ko tere style mein jod raha hoon
        const formattedMessage = `
📱 ${model}
🕚 Time: ${time}

${statusBlock}

Chat: ${chat}
Message: ${message}
        `.trim().replace(/\*\*|__/g, ''); // Ye faltu ke ** ko hata dega

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
