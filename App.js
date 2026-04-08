import { useState } from "react";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAudit = async () => {
    try {
      setLoading(true);

      const resp = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      const raw = await resp.json();

      const txt =
        raw.output?.[0]?.content?.[0]?.text ||
        raw.output_text ||
        "";

      const parsed = typeof txt === "string" ? JSON.parse(txt) : txt;

      setResult(parsed);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h1>🚀 Ads Audit Tool</h1>

      <textarea
        rows={10}
        style={{ width: "100%", marginBottom: 10 }}
        placeholder="Paste your prompt here..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button onClick={runAudit} disabled={loading}>
        {loading ? "Running..." : "Run Audit"}
      </button>

      {result && (
        <div style={{ marginTop: 20 }}>
          <h2>Result:</h2>
          <pre
            style={{
              background: "#f4f4f4",
              padding: 15,
              borderRadius: 8,
              overflowX: "auto"
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
