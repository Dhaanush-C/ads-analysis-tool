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
        const rows = text.split("\n").map(r => r.split(","));
        const headers = rows[0];
        const data = rows.slice(1).map(row => {
          let obj = {};
          headers.forEach((h, i) => obj[h] = row[i]);
          return obj;
        });
        resolve(data.slice(0, 50)); // limit rows
      };
      reader.readAsText(file);
    });
  };

  const runAudit = async () => {
    try {
      setLoading(true);

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

Return JSON with:
- overall_score
- key_issues
- wasted_spend_estimate
- recommendations
`;

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

      let parsed;
      try {
        parsed = JSON.parse(txt);
      } catch {
        parsed = { error: "Invalid response", raw: txt };
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

      <div style={{ marginBottom: 20 }}>
        <p>Upload CSV Files:</p>

        <input type="file" onChange={(e) => handleFile("campaigns", e.target.files[0])} />
        <br /><br />

        <input type="file" onChange={(e) => handleFile("keywords", e.target.files[0])} />
        <br /><br />

        <input type="file" onChange={(e) => handleFile("ads", e.target.files[0])} />
        <br /><br />

        <input type="file" onChange={(e) => handleFile("searchTerms", e.target.files[0])} />
      </div>

      <button onClick={runAudit} disabled={loading}>
        {loading ? "Running..." : "Run Audit"}
      </button>

      {result && (
        <div style={{ marginTop: 20 }}>
          <h2>Result:</h2>
          <pre style={{ background: "#f4f4f4", padding: 15 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
