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

      // First create the record without photo
      const response = await fetch(base, {
        method: "POST",
        headers,
        body: JSON.stringify({ fields }),
      });
      const data = await response.json();

      // If we have a photo and record was created, upload photo separately
      if (photoFile && data.id) {
        await uploadPhotoToRecord(data.id, photoFile, base, headers);
        // Fetch the updated record
        const updated = await fetch(`${base}/${data.id}`, { headers });
        const updatedData = await updated.json();
        return res.status(200).json(updatedData);
      }

      return res.status(200).json(data);
    }

    if (req.method === "PATCH") {
      const { id, fields, photoFile } = req.body;

      const response = await fetch(`${base}/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ fields }),
      });
      const data = await response.json();

      if (photoFile && data.id) {
        await uploadPhotoToRecord(data.id, photoFile, base, headers);
        const updated = await fetch(`${base}/${data.id}`, { headers });
        const updatedData = await updated.json();
        return res.status(200).json(updatedData);
      }

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

async function uploadPhotoToRecord(recordId, photoBase64, base, headers) {
  try {
    // Extract mime type and base64 data
    const matches = photoBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches) return;

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Convert base64 to binary
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Get file extension from mime type
    const ext = mimeType.split("/")[1] || "jpg";
    const filename = `photo.${ext}`;

    // Upload directly to Airtable attachment upload endpoint
    const uploadUrl = `https://content.airtable.com/v0/${BASE_ID}/${recordId}/Photo/uploadAttachment`;

    const formData = new FormData();
    const blob = new Blob([bytes], { type: mimeType });
    formData.append("file", blob, filename);

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      },
      body: formData,
    });

    const uploadData = await uploadResponse.json();
    console.log("Photo upload result:", JSON.stringify(uploadData));
    return uploadData;
  } catch (e) {
    console.error("Photo upload error:", e);
  }
}
