const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = "Items";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const base = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;
  const headers = {
    Authorization: `Bearer ${AIRTABLE_TOKEN}`,
    "Content-Type": "application/json",
  };

  try {
    if (req.method === "GET") {
      let allRecords = [];
      let offset = null;
      do {
        const url = offset ? `${base}?offset=${offset}` : base;
        const response = await fetch(url, { headers });
        const data = await response.json();
        if (data.error) {
          console.error("Airtable GET error:", JSON.stringify(data));
          return res.status(400).json(data);
        }
        if (data.records) allRecords = [...allRecords, ...data.records];
        offset = data.offset || null;
      } while (offset);
      return res.status(200).json({ records: allRecords });
    }

    if (req.method === "POST") {
      const { fields } = req.body;
      const { Photo, ...safeFields } = fields;
      const payload = { fields: safeFields };
      console.log("POST payload:", JSON.stringify(payload));
      const response = await fetch(base, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      console.log("Airtable POST response:", JSON.stringify(data));
      return res.status(200).json(data);
    }

    if (req.method === "PATCH") {
      const { id, fields } = req.body;
      const { Photo, ...safeFields } = fields;
      const response = await fetch(`${base}/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ fields: safeFields }),
      });
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      const response = await fetch(`${base}/${id}`, {
        method: "DELETE",
        headers,
      });
      const data = await response.json();
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}
