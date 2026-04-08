export default async function handler(req, res) {
  try {
    const { prompt } = req.body;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5.3",
        input: [
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "OpenAI API error",
        details: data
      });
    }

    // ✅ SAFE extraction
    const output =
      data.output?.[0]?.content?.[0]?.text ||
      data.output_text ||
      "";

    res.status(200).json({
      text: output,
      full: data
    });

  } catch (err) {
    res.status(500).json({
      error: "Server error",
      message: err.message
    });
  }
}
