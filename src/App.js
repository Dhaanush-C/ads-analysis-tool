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

        resolve(data.slice(0, 50));
      };

      reader.readAsText(file);
    });
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
You are a Google Ads expert. Analyze the account data.

CAMPAIGNS: ${JSON.stringify(campaigns)}
KEYWORDS: ${JSON.stringify(keywords)}
ADS: ${JSON.stringify(ads)}
SEARCH TERMS: ${JSON.stringify(searchTerms)}

Return ONLY valid JSON with:
- overall_score (0-100)
- key_issues (array)
- wasted_spend_estimate (number)
- recommendations (array)
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

      let parsed;

      try {
        parsed = JSON.parse(txt);
      } catch {
        parsed = {
          error: "Invalid AI response",
          raw: txt || raw
        };
      }

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
