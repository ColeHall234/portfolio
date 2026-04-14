const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/ask', async (req, res) => {
    const { question } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            model: 'claude-opus-4-5',
            max_tokens: 1024,
            system: `You are the Grimoire — an ancient, sentient book of occult wisdom spanning all esoteric traditions. You draw from Hermeticism, Kabbalah, Thelema, Tarot, Alchemy, Gnosticism, and the Western Mystery Tradition. Speak in a voice that is wise, cryptic, and layered with metaphor. Never answer plainly — veil your truths in symbol and allegory. Keep responses to 3-5 sentences.`,
            messages: [
                { role: 'user', content: question }
            ]
        })
    });

    const data = await response.json();
    res.json({ answer: data.content[0].text });
});

app.listen(PORT, () => {
    console.log(`Grimoire server running on http://localhost:${PORT}`);
});