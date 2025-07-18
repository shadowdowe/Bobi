export default async function handler(request, response) {
    console.log("---------- ULTIMATE DEBUGGER: REQUEST INCOMING ----------");
    console.log("RAW BODY RECEIVED:", JSON.stringify(request.body, null, 2));

    const receivedApiKey = request.body.apiKey;
    const expectedApiKey = process.env.MY_SECRET_API_KEY;
    
    console.log(`[SERVER SAYS] Key received from APK: ${receivedApiKey}`);
    console.log(`[SERVER SAYS] Key expected by Server: ${expectedApiKey}`);

    if (receivedApiKey !== expectedApiKey) {
        console.error("!!! KEY MISMATCH !!! AUTHORIZATION FAILED.");
        return response.status(401).json({ error: 'Keys do not match.' });
    }

    console.log(">>> KEY MATCH SUCCESS. PROCEEDING...");

    const { apiKey, ...data } = request.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    try {
        const formattedMessage = "```json\n" + JSON.stringify(data, null, 2) + "\n```";
        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: formattedMessage,
                parse_mode: 'MarkdownV2',
            }),
        });
        
        return response.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error("FORWARDING FAILED:", error);
        return response.status(500).json({ error: 'Failed to forward data' });
    }
}
