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
        if (data.error) return res.status(400).json(data);
        if (data.records) allRecords = [...allRecords, ...data.records];
        offset = data.offset || null;
      } while (offset);
      return res.status(200).json({ records: allRecords });
    }

    if (req.method === "POST") {
      const { fields, photoFile } = req.body;
      const payload = { fields };

      // If photo provided as base64, upload to imgur as public URL first
      if (photoFile) {
        try {
          const base64Data = photoFile.split(",")[1];
          const imgurRes = await fetch("https://api.imgur.com/3/image", {
            method: "POST",
            headers: { Authorization: "Client-ID 546c25a59c58ad7", "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64Data, type: "base64" }),
          });
          const imgurData = await imgurRes.json();
          if (imgurData.success) {
            payload.fields.Photo = [{ url: imgurData.data.link }];
          }
        } catch (e) {
          console.error("Photo upload failed:", e);
        }
      }

      const response = await fetch(base, { method: "POST", headers, body: JSON.stringify(payload) });
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === "PATCH") {
      const { id, fields, photoFile } = req.body;
      const payload = { fields };

      if (photoFile) {
        try {
          const base64Data = photoFile.split(",")[1];
          const imgurRes = await fetch("https://api.imgur.com/3/image", {
            method: "POST",
            headers: { Authorization: "Client-ID 546c25a59c58ad7", "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64Data, type: "base64" }),
          });
          const imgurData = await imgurRes.json();
          if (imgurData.success) {
            payload.fields.Photo = [{ url: imgurData.data.link }];
          }
        } catch (e) {
          console.error("Photo upload failed:", e);
        }
      }

      const response = await fetch(`${base}/${id}`, { method: "PATCH", headers, body: JSON.stringify(payload) });
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      const response = await fetch(`${base}/${id}`, { method: "DELETE", headers });
      const data = await response.json();
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}
