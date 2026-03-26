import { useState, useEffect, useRef } from "react";

const DEFAULT_CATEGORIES = ["Event Supplies", "Equipment", "Costumes & Props", "Office", "Marketing & Merch", "Facilities", "Other"];

const CATEGORY_COLORS = {
  "Event Supplies": "#2a6b4a",
  "Equipment": "#2a4a6b",
  "Costumes & Props": "#6b2a6b",
  "Office": "#4a4a2a",
  "Marketing & Merch": "#6b4a2a",
  "Facilities": "#2a5a5a",
  "Other": "#3a3a3a",
};

function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] || "#5a3a5a";
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 30) return `${diff}d ago`;
  if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
  return `${Math.floor(diff / 365)}y ago`;
}

function recordToItem(record) {
  const f = record.fields;
  return {
    id: record.id,
    name: f.Name || "",
    location: f.Location || "",
    category: f.Category || "Other",
    notes: f.Notes || "",
    updatedBy: f["Updated By"] || "",
    updatedAt: f["Updated At"] || "",
    uncertain: f.Uncertain || false,
    photo: f.Photo && f.Photo[0] ? f.Photo[0].url : null,
    photoThumb: f.Photo && f.Photo[0] ? (f.Photo[0].thumbnails?.large?.url || f.Photo[0].url) : null,
  };
}

function Toast({ message, error }) {
  if (!message) return null;
  return (
    <div style={{ position: "fixed", bottom: "88px", left: "50%", transform: "translateX(-50%)", background: error ? "#3a1e1e" : "#1e3a1e", border: `1px solid ${error ? "#7a4a4a" : "#4a7a4a"}`, color: error ? "#d8a8a8" : "#a8d8a8", padding: "10px 22px", borderRadius: "8px", fontSize: "14px", zIndex: 300, whiteSpace: "nowrap" }}>
      {message}
    </div>
  );
}

function PhotoViewer({ src, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.93)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400, padding: "20px" }}>
      <img src={src} alt="Location" style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: "8px", objectFit: "contain" }} />
      <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "#2a2010", border: "1px solid #4a3a20", color: "#f0e6d3", width: "38px", height: "38px", borderRadius: "50%", cursor: "pointer", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
      <div style={{ position: "absolute", bottom: "20px", color: "#5a4a38", fontSize: "12px" }}>Tap anywhere to close</div>
    </div>
  );
}

// VIEW modal - read only
function ViewModal({ item, onClose, onEdit }) {
  const color = getCategoryColor(item.category);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,8,6,0.85)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#16120e", borderTop: "2px solid #c8622a", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: "640px", padding: "20px 20px 36px", maxHeight: "94vh", overflowY: "auto" }}>
        <div style={{ width: "36px", height: "4px", background: "#3a2e20", borderRadius: "2px", margin: "0 auto 18px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#f0e6d3", fontSize: "20px", margin: 0, fontWeight: 700 }}>Item Details</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#6a5848", fontSize: "24px", cursor: "pointer" }}>×</button>
        </div>

        {/* Photo */}
        {item.photo && (
          <div style={{ marginBottom: "20px", borderRadius: "10px", overflow: "hidden", border: "1px solid #2e2416" }}>
            <img src={item.photo} alt="Location" style={{ width: "100%", maxHeight: "260px", objectFit: "cover", display: "block" }} />
          </div>
        )}

        {/* Name and category */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
          <h3 style={{ color: "#f0e6d3", fontSize: "22px", margin: 0, fontWeight: 700 }}>{item.name}</h3>
          <span style={{ background: color + "30", border: `1px solid ${color}55`, color: "#b8a070", fontSize: "11px", padding: "3px 10px", borderRadius: "10px" }}>{item.category}</span>
          {item.uncertain && <span style={{ background: "#6b3a1030", border: "1px solid #6b3a10", color: "#f0c070", fontSize: "11px", padding: "3px 10px", borderRadius: "10px" }}>⚠️ Unconfirmed</span>}
        </div>

        {/* Location */}
        <div style={{ background: "#0f0c09", border: "1px solid #2e2416", borderRadius: "10px", padding: "14px 16px", marginBottom: "12px" }}>
          <div style={{ color: "#b8a898", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", marginBottom: "6px" }}>Location</div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ fontSize: "16px", flexShrink: 0 }}>📍</span>
            <span style={{ color: "#c8622a", fontSize: "16px", fontWeight: 600, lineHeight: 1.4 }}>{item.location}</span>
          </div>
        </div>

        {/* Notes */}
        {item.notes && (
          <div style={{ background: "#0f0c09", border: "1px solid #2e2416", borderRadius: "10px", padding: "14px 16px", marginBottom: "12px" }}>
            <div style={{ color: "#b8a898", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", marginBottom: "6px" }}>Notes</div>
            <div style={{ color: "#c8b898", fontSize: "15px", lineHeight: 1.5 }}>{item.notes}</div>
          </div>
        )}

        {/* Last updated */}
        <div style={{ color: "#4a3a28", fontSize: "12px", marginBottom: "24px", textAlign: "right" }}>
          Last updated by {item.updatedBy} · {timeAgo(item.updatedAt)}
        </div>

        {/* Edit button */}
        <button onClick={onEdit} style={{ width: "100%", background: "#c8622a", border: "none", color: "#fff", padding: "14px", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: 600 }}>
          ✏️ Edit This Item
        </button>
      </div>
    </div>
  );
}

// EDIT modal
function EditModal({ item, onClose, onSave, onDelete, allCategories, onAddCategory }) {
  const [form, setForm] = useState(item || { name: "", category: allCategories[0] || "Event Supplies", location: "", notes: "", updatedBy: "", uncertain: false });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(item?.photo || null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState("");
  const cameraRef = useRef();
  const galleryRef = useRef();
  const isNew = !item?.id;

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
  }

  function handleAddCategory() {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    onAddCategory(trimmed);
    setForm(f => ({ ...f, category: trimmed }));
    setShowNewCat(false);
    setNewCatInput("");
  }

  async function handleSave() {
    if (!form.name.trim() || !form.location.trim() || !form.updatedBy.trim()) return;
    setSaving(true);
    await onSave(form, photoFile, item?.id);
    setSaving(false);
  }

  const valid = form.name.trim() && form.location.trim() && form.updatedBy.trim();

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,8,6,0.85)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#16120e", borderTop: "2px solid #c8622a", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: "640px", padding: "20px 20px 36px", maxHeight: "94vh", overflowY: "auto" }}>
        <div style={{ width: "36px", height: "4px", background: "#3a2e20", borderRadius: "2px", margin: "0 auto 18px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#f0e6d3", fontSize: "20px", margin: 0, fontWeight: 700 }}>
            {isNew ? "Add New Item" : "Edit Item"}
          </h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#6a5848", fontSize: "24px", cursor: "pointer" }}>×</button>
        </div>

        {/* Photo - with separate camera and gallery buttons */}
        <div style={{ marginBottom: "18px" }}>
          <label style={{ display: "block", color: "#b8a898", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px", fontFamily: "monospace" }}>
            Location Photo <span style={{ color: "#5a4a38", textTransform: "none", letterSpacing: 0 }}>(optional but super helpful)</span>
          </label>
          {photoPreview ? (
            <div style={{ position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid #2e2416" }}>
              <img src={photoPreview} alt="Preview" style={{ width: "100%", maxHeight: "200px", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", top: "8px", right: "8px", display: "flex", gap: "6px" }}>
                <button onClick={() => galleryRef.current?.click()} style={{ background: "rgba(0,0,0,0.75)", border: "1px solid #4a3a20", color: "#f0e6d3", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>Replace</button>
                <button onClick={removePhoto} style={{ background: "rgba(80,20,20,0.85)", border: "1px solid #6b2a2a", color: "#d97474", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>Remove</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "10px" }}>
              {/* Take photo with camera */}
              <div onClick={() => cameraRef.current?.click()}
                style={{ flex: 1, border: "1.5px dashed #3a2e20", borderRadius: "8px", padding: "20px 12px", textAlign: "center", cursor: "pointer", color: "#6a5848" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#c8622a"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#3a2e20"}
              >
                <div style={{ fontSize: "26px", marginBottom: "6px" }}>📷</div>
                <div style={{ fontSize: "12px" }}>Take Photo</div>
              </div>
              {/* Choose from library */}
              <div onClick={() => galleryRef.current?.click()}
                style={{ flex: 1, border: "1.5px dashed #3a2e20", borderRadius: "8px", padding: "20px 12px", textAlign: "center", cursor: "pointer", color: "#6a5848" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#c8622a"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#3a2e20"}
              >
                <div style={{ fontSize: "26px", marginBottom: "6px" }}>🖼️</div>
                <div style={{ fontSize: "12px" }}>Photo Library</div>
              </div>
            </div>
          )}
          {/* Camera input */}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: "none" }} />
          {/* Gallery input - no capture attribute so it opens library */}
          <input ref={galleryRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
        </div>

        {/* Fields */}
        {[["name", "Item Name *", "e.g. Gala swag bags"], ["location", "Where Is It? *", "e.g. Storage Room B, back shelf"]].map(([field, label, placeholder]) => (
          <div key={field} style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", color: "#b8a898", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", fontFamily: "monospace" }}>{label}</label>
            <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder}
              style={{ width: "100%", background: "#0f0c09", border: "1px solid #2e2416", borderRadius: "6px", padding: "12px", color: "#f0e6d3", fontSize: "15px", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>
        ))}

        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", color: "#b8a898", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", fontFamily: "monospace" }}>Your Name *</label>
          <input value={form.updatedBy} onChange={e => setForm(f => ({ ...f, updatedBy: e.target.value }))} placeholder="e.g. Ivan (he knows where everything is anyway)"
            style={{ width: "100%", background: "#0f0c09", border: "1px solid #2e2416", borderRadius: "6px", padding: "12px", color: "#f0e6d3", fontSize: "15px", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", color: "#b8a898", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", fontFamily: "monospace" }}>Category</label>
          {showNewCat ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <input autoFocus value={newCatInput} onChange={e => setNewCatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddCategory()} placeholder="New category name..."
                style={{ flex: 1, background: "#0f0c09", border: "1px solid #c8622a", borderRadius: "6px", padding: "12px", color: "#f0e6d3", fontSize: "15px", fontFamily: "inherit" }} />
              <button onClick={handleAddCategory} style={{ background: "#c8622a", border: "none", color: "#fff", padding: "12px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Add</button>
              <button onClick={() => { setShowNewCat(false); setNewCatInput(""); }} style={{ background: "transparent", border: "1px solid #3a2e20", color: "#7a6858", padding: "12px 14px", borderRadius: "6px", cursor: "pointer" }}>✕</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ flex: 1, background: "#0f0c09", border: "1px solid #2e2416", borderRadius: "6px", padding: "12px", color: "#f0e6d3", fontSize: "15px", fontFamily: "inherit" }}>
                {allCategories.map(c => <option key={c}>{c}</option>)}
              </select>
              <button onClick={() => setShowNewCat(true)} style={{ background: "#1a1410", border: "1px solid #3a2e20", color: "#c8622a", padding: "12px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "18px", flexShrink: 0 }}>+</button>
            </div>
          )}
          <div style={{ color: "#4a3a28", fontSize: "11px", marginTop: "5px" }}>Tap + to create a custom category</div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", color: "#b8a898", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", fontFamily: "monospace" }}>Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Quantity, condition, color, anything that helps someone find it fast..." rows={3}
            style={{ width: "100%", background: "#0f0c09", border: "1px solid #2e2416", borderRadius: "6px", padding: "12px", color: "#f0e6d3", fontSize: "15px", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
        </div>

        <div onClick={() => setForm(f => ({ ...f, uncertain: !f.uncertain }))}
          style={{ display: "flex", alignItems: "center", gap: "12px", background: form.uncertain ? "#3a2010" : "#0f0c09", border: `1px solid ${form.uncertain ? "#c8622a" : "#2e2416"}`, borderRadius: "8px", padding: "12px 14px", cursor: "pointer", marginBottom: "24px" }}>
          <div style={{ width: "20px", height: "20px", borderRadius: "4px", border: `2px solid ${form.uncertain ? "#c8622a" : "#4a3a20"}`, background: form.uncertain ? "#c8622a" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {form.uncertain && <span style={{ color: "#fff", fontSize: "13px", fontWeight: 700 }}>✓</span>}
          </div>
          <div>
            <div style={{ color: form.uncertain ? "#f0d0a0" : "#7a6858", fontSize: "14px", fontWeight: 500 }}>Flag as "Not Sure Where This Is"</div>
            <div style={{ color: "#5a4a38", fontSize: "12px", marginTop: "2px" }}>Marks it so the team knows to double-check</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button onClick={handleSave} disabled={!valid || saving}
            style={{ width: "100%", background: valid ? "#c8622a" : "#2a1a0a", border: "none", color: valid ? "#fff" : "#5a3a1a", padding: "14px", borderRadius: "8px", cursor: valid ? "pointer" : "default", fontSize: "16px", fontWeight: 600 }}>
            {saving ? "Saving..." : isNew ? "Add to Inventory" : "Save Changes"}
          </button>
          {!isNew && (
            confirmDelete ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, background: "transparent", border: "1px solid #3a2e20", color: "#8a7868", padding: "11px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
                <button onClick={() => onDelete(item.id)} style={{ flex: 1, background: "#6b2a2a", border: "1px solid #8b3a3a", color: "#ffaaaa", padding: "11px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Yes, Delete</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} style={{ background: "transparent", border: "1px solid #3a2010", color: "#6a4030", padding: "11px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>Remove Item</button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function ItemCard({ item, onClick }) {
  const color = getCategoryColor(item.category);
  return (
    <div onClick={onClick} style={{ background: item.uncertain ? "#1a1008" : "#12100d", border: `1px solid ${item.uncertain ? "#6b3a10" : "#2a2010"}`, borderRadius: "12px", overflow: "hidden", cursor: "pointer" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#c8622a"}
      onMouseLeave={e => e.currentTarget.style.borderColor = item.uncertain ? "#6b3a10" : "#2a2010"}
    >
      {item.uncertain && (
        <div style={{ background: "#6b3a10", padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "13px" }}>⚠️</span>
          <span style={{ color: "#f0c070", fontSize: "12px", fontWeight: 600 }}>Location unconfirmed — someone should double-check</span>
        </div>
      )}
      {item.photoThumb && (
        <div style={{ position: "relative", height: "150px", overflow: "hidden" }}>
          <img src={item.photoThumb} alt="Location" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(18,16,13,0.9) 100%)" }} />
        </div>
      )}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
              <span style={{ fontWeight: 600, fontSize: "15px", color: "#f0e6d3" }}>{item.name}</span>
              <span style={{ background: color + "30", border: `1px solid ${color}55`, color: "#b8a070", fontSize: "10px", padding: "2px 8px", borderRadius: "10px", whiteSpace: "nowrap" }}>{item.category}</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: item.notes ? "6px" : 0 }}>
              <span style={{ fontSize: "13px", flexShrink: 0, marginTop: "1px" }}>📍</span>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#c8622a", lineHeight: 1.4 }}>{item.location}</span>
            </div>
            {item.notes && <div style={{ color: "#7a6a58", fontSize: "13px", lineHeight: 1.5 }}>{item.notes}</div>}
          </div>
          <div style={{ color: "#4a3a28", fontSize: "11px", textAlign: "right", flexShrink: 0, lineHeight: 1.7 }}>
            <div>{item.updatedBy}</div>
            <div>{timeAgo(item.updatedAt)}</div>
          </div>
        </div>
        <div style={{ marginTop: "10px", borderTop: "1px solid #1e1a12", paddingTop: "8px", display: "flex", justifyContent: "flex-end" }}>
          <span style={{ color: "#4a3a28", fontSize: "12px" }}>👁 Tap to view</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [photoView, setPhotoView] = useState(null);
  const [toast, setToast] = useState({ message: "", error: false });

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    try {
      const res = await fetch("/api/items");
      const data = await res.json();
      if (data.records) {
        const mapped = data.records.map(recordToItem);
        setItems(mapped);
        const existingCats = [...new Set(mapped.map(i => i.category).filter(Boolean))];
        const merged = [...new Set([...DEFAULT_CATEGORIES, ...existingCats])];
        setCategories(merged);
      }
    } catch (e) {
      setLoadError(true);
    }
    setLoaded(true);
  }

  function showToast(message, error = false) {
    setToast({ message, error });
    setTimeout(() => setToast({ message: "", error: false }), 3000);
  }

  async function handleSave(form, photoFile, existingId) {
    try {
      const fields = {
        Name: form.name,
        Location: form.location,
        Category: form.category,
        Notes: form.notes,
        "Updated By": form.updatedBy,
        "Updated At": new Date().toISOString().split("T")[0],
        Uncertain: form.uncertain,
      };

      let res, data;
      if (existingId) {
        res = await fetch("/api/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: existingId, fields, photoFile: photoFile ? await fileToBase64(photoFile) : null }),
        });
      } else {
        res = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields, photoFile: photoFile ? await fileToBase64(photoFile) : null }),
        });
      }
      data = await res.json();

      if (data.id) {
        await loadItems();
        setEditItem(null);
        setViewItem(null);
        showToast(existingId ? "Item updated." : "Item added to inventory.");
      } else {
        showToast("Something went wrong. Try again.", true);
      }
    } catch (e) {
      showToast("Error saving item.", true);
    }
  }

  async function fileToBase64(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  async function handleDelete(id) {
    try {
      await fetch(`/api/items?id=${id}`, { method: "DELETE" });
      await loadItems();
      setEditItem(null);
      setViewItem(null);
      showToast("Item removed.");
    } catch (e) {
      showToast("Error deleting item.", true);
    }
  }

  function handleAddCategory(name) {
    if (categories.includes(name)) return;
    setCategories(prev => [...prev, name]);
  }

  const allCats = ["All", ...categories];

  const filtered = items.filter(item => {
    const matchCat = activeCategory === "All" || item.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || [item.name, item.location, item.notes, item.category].some(f => (f || "").toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "recent") return new Date(b.updatedAt) - new Date(a.updatedAt);
    if (sortBy === "uncertain") return (b.uncertain ? 1 : 0) - (a.uncertain ? 1 : 0);
    return a.name.localeCompare(b.name);
  });

  const countFor = cat => cat === "All" ? items.length : items.filter(i => i.category === cat).length;
  const uncertainCount = items.filter(i => i.uncertain).length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0806", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#f0e6d3" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      <div style={{ background: "linear-gradient(180deg, #1c1408 0%, #0f0c09 100%)", borderBottom: "1px solid #2a2010", padding: "20px 16px 0" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "10px", color: "#c8622a", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, marginBottom: "3px" }}>UrbanTheater Company</div>
              <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 900, color: "#f0e6d3", margin: 0, lineHeight: 1.1 }}>Where Is It?</h1>
              <div style={{ color: "#4a3a28", fontSize: "12px", marginTop: "5px", display: "flex", gap: "10px" }}>
                {loaded && <><span>{items.length} items</span>{uncertainCount > 0 && <span style={{ color: "#c87030" }}>⚠️ {uncertainCount} unconfirmed</span>}</>}
              </div>
            </div>
            <button onClick={() => setEditItem("new")} style={{ background: "#c8622a", border: "none", color: "#fff", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600, flexShrink: 0, marginTop: "6px" }}>
              + Add Item
            </button>
          </div>

          <div style={{ position: "relative", marginBottom: "12px" }}>
            <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", fontSize: "15px" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items, locations, notes..."
              style={{ width: "100%", background: "#1a1410", border: "1px solid #2a2010", borderRadius: "8px", padding: "12px 38px", color: "#f0e6d3", fontSize: "15px", fontFamily: "inherit", boxSizing: "border-box" }} />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#6a5848", cursor: "pointer", fontSize: "20px" }}>×</button>}
          </div>

          <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
            {[["name", "A–Z"], ["recent", "Recent"], ["uncertain", "Unconfirmed"]].map(([val, label]) => (
              <button key={val} onClick={() => setSortBy(val)} style={{ background: sortBy === val ? "#2a1e10" : "transparent", border: `1px solid ${sortBy === val ? "#c8622a" : "#2a2010"}`, color: sortBy === val ? "#c8622a" : "#6a5848", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: sortBy === val ? 600 : 400 }}>{label}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px" }}>
            {allCats.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{ background: activeCategory === cat ? "#c8622a" : "#1a1410", border: `1px solid ${activeCategory === cat ? "#c8622a" : "#2a2010"}`, color: activeCategory === cat ? "#fff" : "#7a6858", padding: "6px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: "5px" }}>
                {cat}
                <span style={{ background: activeCategory === cat ? "rgba(255,255,255,0.2)" : "#2a2010", borderRadius: "10px", padding: "1px 6px", fontSize: "10px" }}>{countFor(cat)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "16px 16px 110px" }}>
        {!loaded ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#4a3a28" }}><div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div><div>Loading inventory...</div></div>
        ) : loadError ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#8a4a38" }}><div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div><div>Could not connect to Airtable.</div></div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#5a4a38" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>📦</div>
            <div>Nothing found{search ? ` for "${search}"` : ""}.</div>
            {search && <div onClick={() => setSearch("")} style={{ color: "#c8622a", fontSize: "13px", marginTop: "8px", cursor: "pointer" }}>Clear search</div>}
            {!search && items.length === 0 && <div style={{ fontSize: "13px", marginTop: "8px", color: "#4a3a28" }}>Add your first item to get started.</div>}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {sorted.map(item => <ItemCard key={item.id} item={item} onClick={() => setViewItem(item)} />)}
            <div style={{ textAlign: "center", color: "#3a2e20", fontSize: "12px", marginTop: "6px" }}>Showing {sorted.length} of {items.length} items</div>
          </div>
        )}
      </div>

      <div style={{ position: "fixed", bottom: "28px", right: "20px", zIndex: 100 }}>
        <button onClick={() => setEditItem("new")} style={{ background: "#c8622a", border: "none", color: "#fff", width: "56px", height: "56px", borderRadius: "50%", fontSize: "28px", cursor: "pointer", boxShadow: "0 4px 24px rgba(200,98,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
      </div>

      <Toast message={toast.message} error={toast.error} />
      {photoView && <PhotoViewer src={photoView} onClose={() => setPhotoView(null)} />}

      {/* View modal */}
      {viewItem && !editItem && (
        <ViewModal
          item={viewItem}
          onClose={() => setViewItem(null)}
          onEdit={() => setEditItem(viewItem)}
        />
      )}

      {/* Edit modal */}
      {editItem && (
        <EditModal
          item={editItem === "new" ? null : editItem}
          onClose={() => { setEditItem(null); }}
          onSave={handleSave}
          onDelete={handleDelete}
          allCategories={categories}
          onAddCategory={handleAddCategory}
        />
      )}
    </div>
  );
}
