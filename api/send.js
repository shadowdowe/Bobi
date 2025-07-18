export default async function handler(request, response) {
    console.log("---------- REQUEST RECEIVED ----------");
    console.log("METHOD:", request.method);
    console.log("BODY:", JSON.stringify(request.body, null, 2));
    
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { apiKey, ...data } = request.body;
    const expectedApiKey = process.env.MY_SECRET_API_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!expectedApiKey || !botToken || !chatId) {
        console.error("Server config error: Environment variables missing.");
        return response.status(500).json({ error: 'Server configuration fucked up' });
    }

    if (apiKey !== expectedApiKey) {
        console.error("Authorization failed: Invalid API Key received.");
        return response.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }

    if (Object.keys(data).length === 0) {
        console.warn("Request successful, but no data to send.");
        return response.status(200).json({ status: 'ok, but no data' });
    }

    try {
        const formattedMessage = "```json\n" + JSON.stringify(data, null, 2) + "\n```";
        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        const telegramResponse = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: formattedMessage,
                parse_mode: 'MarkdownV2',
            }),
        });
        
        if (!telegramResponse.ok) {
            const errorBody = await telegramResponse.text();
            console.error("Telegram API Error:", errorBody);
        }

        return response.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error("CATCH BLOCK ERROR:", error);
        return response.status(500).json({ error: 'Failed to forward data' });
    }
}
