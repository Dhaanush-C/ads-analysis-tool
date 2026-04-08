import { useState } from "react";

export default function App() {
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = (type, file) => {
    setFiles((prev) => ({ ...prev, [type]: file }));
  };

  const readCSV = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const text = e.target.result;

        const rows = text.split("\n").map((r) => r.split(","));
        const headers = rows[0];

        const data = rows.slice(1).map((row) => {
          let obj = {};
          headers.forEach((h, i) => {
            obj[h?.trim()] = row[i]?.trim();
          });
          return obj;
        });

        resolve(data.slice(0, 5));
      };

      reader.readAsText(file);
    });
  };

  const extractJSON = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {}
      }
      return { error: "Invalid response", raw: text };
    }
  };

  const runAudit = async () => {
    try {
      setLoading(true);
      setResult(null);

      const campaigns = files.campaigns ? await readCSV(files.campaigns) : [];
      const keywords = files.keywords ? await readCSV(files.keywords) : [];
      const ads = files.ads ? await readCSV(files.ads) : [];
      const searchTerms = files.searchTerms ? await readCSV(files.searchTerms) : [];

      const prompt = `
const prompt = `
Analyze this Google Ads data and return JSON only.

Campaigns: ${JSON.stringify(campaigns)}
Keywords: ${JSON.stringify(keywords)}

Return JSON:
{
  "overall_score": number,
  "key_issues": [],
  "recommendations": []
}
`;

      const resp = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      const raw = await resp.json();

      const txt = raw.text || "";

      const parsed = extractJSON(txt);

      setResult(parsed);

    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h1>🚀 Ads Audit Tool (Gemini)</h1>

      <h3>Upload CSV Files</h3>

      <input type="file" onChange={(e) => handleFile("campaigns", e.target.files[0])} />
      <br /><br />

      <input type="file" onChange={(e) => handleFile("keywords", e.target.files[0])} />
      <br /><br />

      <input type="file" onChange={(e) => handleFile("ads", e.target.files[0])} />
      <br /><br />

      <input type="file" onChange={(e) => handleFile("searchTerms", e.target.files[0])} />

      <br /><br />

      <button onClick={runAudit} disabled={loading}>
        {loading ? "Running Audit..." : "Run Audit"}
      </button>

      {result && (
        <div style={{ marginTop: 30 }}>
          <h2>Result</h2>
          <pre style={{ background: "#f4f4f4", padding: 15 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
