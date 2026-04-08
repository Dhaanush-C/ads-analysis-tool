export default async function handler(req, res) {
  try {
    const { prompt } = req.body;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "Gemini API error",
        details: data
      });
    }

    console.log("Gemini RAW:", JSON.stringify(data));

    let output = "";

    if (data.candidates && data.candidates.length > 0) {
      const parts = data.candidates[0].content.parts;
      output = parts.map(p => p.text).join("");
    }

    res.status(200).json({
      text: output || "NO_RESPONSE"
    });

  } catch (err) {
    res.status(500).json({
      error: "Server error",
      message: err.message
    });
  }
}
