import { useState, useEffect, useRef } from "react";

const DEFAULT_CATEGORIES = ["Event Supplies", "Equipment", "Costumes & Props", "Office", "Marketing & Merch", "Facilities", "Other"];

const CATEGORY_COLORS = {
  "Event Supplies": "#2a6b4a",
  "Equipment": "#2a4a6b",
  "Costumes & Props": "#6B1E2E",
  "Office": "#4a4a2a",
  "Marketing & Merch": "#6B1E2E",
  "Facilities": "#2a5a5a",
  "Other": "#555555",
};

function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] || "#6B1E2E";
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

// Theme definitions
const THEMES = {
  light: {
    bg: "#f5f5f5",
    surface: "#ffffff",
    surfaceAlt: "#f0f0f0",
    border: "#e0e0e0",
    borderHover: "#6B1E2E",
    text: "#1a1a1a",
    textSub: "#555555",
    textMuted: "#999999",
    accent: "#6B1E2E",
    accentText: "#ffffff",
    headerBg: "#ffffff",
    inputBg: "#f9f9f9",
    inputBorder: "#e0e0e0",
    tagBg: "#f0e8e8",
    tagBorder: "#d4a0a8",
    tagText: "#6B1E2E",
    uncertainBg: "#fff8e8",
    uncertainBorder: "#f0c040",
    uncertainBar: "#f0c040",
    cardShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  dark: {
    bg: "#0a0806",
    surface: "#12100d",
    surfaceAlt: "#1a1410",
    border: "#2a2010",
    borderHover: "#c8622a",
    text: "#f0e6d3",
    textSub: "#b8a898",
    textMuted: "#5a4a38",
    accent: "#c8622a",
    accentText: "#ffffff",
    headerBg: "#1c1408",
    inputBg: "#0f0c09",
    inputBorder: "#2e2416",
    tagBg: "#2a1a0a",
    tagBorder: "#4a2a10",
    tagText: "#c8a060",
    uncertainBg: "#1a1008",
    uncertainBorder: "#6b3a10",
    uncertainBar: "#6b3a10",
    cardShadow: "none",
  }
};

function Toast({ message, error, dark }) {
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
      <div style={{ position: "absolute", bottom: "20px", color: "#aaaaaa", fontSize: "12px" }}>Tap anywhere to close</div>
    </div>
  );
}

// Quick view popup - focused, no duplicate content
function ViewModal({ item, onClose, onEdit, t, onPhotoView }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: t.surface, borderTop: `3px solid ${t.accent}`, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: "640px", maxHeight: "90vh", overflowY: "auto" }}>

        {/* Photo - large and prominent */}
        {item.photo ? (
          <div onClick={() => onPhotoView(item.photo)} style={{ position: "relative", height: "260px", overflow: "hidden", cursor: "pointer" }}>
            <img src={item.photo} alt="Location" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 100%)" }} />
            <div style={{ position: "absolute", bottom: "12px", left: "16px", right: "16px" }}>
              <div style={{ color: "#ffffff", fontSize: "22px", fontWeight: 800, fontFamily: "'Playfair Display', Georgia, serif", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>{item.name}</div>
            </div>
            <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#ffffff", fontSize: "11px", padding: "4px 10px", borderRadius: "10px" }}>🔍 Tap to enlarge</div>
          </div>
        ) : (
          <div style={{ padding: "24px 20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: t.text, fontSize: "22px", margin: 0, fontWeight: 800 }}>{item.name}</h2>
          </div>
        )}

        <div style={{ padding: "16px 20px 32px" }}>
          {/* Category and uncertain badge */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            <span style={{ background: t.tagBg, border: `1px solid ${t.tagBorder}`, color: t.tagText, fontSize: "11px", padding: "3px 10px", borderRadius: "10px", fontWeight: 600 }}>{item.category}</span>
            {item.uncertain && <span style={{ background: "#fff8e8", border: "1px solid #f0c040", color: "#a06000", fontSize: "11px", padding: "3px 10px", borderRadius: "10px", fontWeight: 600 }}>⚠️ Location unconfirmed</span>}
          </div>

          {/* Location - the star of the show */}
          <div style={{ background: t.surfaceAlt, border: `2px solid ${t.accent}`, borderRadius: "12px", padding: "16px 18px", marginBottom: "12px" }}>
            <div style={{ color: t.textMuted, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "monospace", marginBottom: "6px" }}>📍 Location</div>
            <div style={{ color: t.accent, fontSize: "20px", fontWeight: 800, lineHeight: 1.3 }}>{item.location}</div>
          </div>

          {/* Notes if present */}
          {item.notes && (
            <div style={{ background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "14px 16px", marginBottom: "12px" }}>
              <div style={{ color: t.textMuted, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "monospace", marginBottom: "6px" }}>Notes</div>
              <div style={{ color: t.textSub, fontSize: "14px", lineHeight: 1.5 }}>{item.notes}</div>
            </div>
          )}

          {/* Last updated */}
          <div style={{ color: t.textMuted, fontSize: "12px", marginBottom: "20px", textAlign: "right" }}>
            Last updated by {item.updatedBy} · {timeAgo(item.updatedAt)}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={onClose} style={{ flex: 1, background: "transparent", border: `1px solid ${t.border}`, color: t.textSub, padding: "13px", borderRadius: "8px", cursor: "pointer", fontSize: "15px" }}>Close</button>
            <button onClick={onEdit} style={{ flex: 2, background: t.accent, border: "none", color: "#fff", padding: "13px", borderRadius: "8px", cursor: "pointer", fontSize: "15px", fontWeight: 700 }}>✏️ Edit This Item</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit modal
function EditModal({ item, onClose, onSave, onDelete, allCategories, onAddCategory, t }) {
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
  const inputStyle = { width: "100%", background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: "6px", padding: "12px", color: t.text, fontSize: "15px", fontFamily: "inherit", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: t.surface, borderTop: `3px solid ${t.accent}`, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: "640px", padding: "20px 20px 36px", maxHeight: "94vh", overflowY: "auto" }}>
        <div style={{ width: "36px", height: "4px", background: t.border, borderRadius: "2px", margin: "0 auto 18px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: t.text, fontSize: "20px", margin: 0, fontWeight: 700 }}>
            {isNew ? "Add New Item" : "Edit Item"}
          </h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: t.textMuted, fontSize: "24px", cursor: "pointer" }}>×</button>
        </div>

        {/* Photo */}
        <div style={{ marginBottom: "18px" }}>
          <label style={{ display: "block", color: t.textSub, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px", fontFamily: "monospace" }}>
            Location Photo <span style={{ color: t.textMuted, textTransform: "none", letterSpacing: 0 }}>(optional but super helpful)</span>
          </label>
          {photoPreview ? (
            <div style={{ position: "relative", borderRadius: "8px", overflow: "hidden", border: `1px solid ${t.border}` }}>
              <img src={photoPreview} alt="Preview" style={{ width: "100%", maxHeight: "200px", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", top: "8px", right: "8px", display: "flex", gap: "6px" }}>
                <button onClick={() => galleryRef.current?.click()} style={{ background: "rgba(0,0,0,0.75)", border: "1px solid #4a3a20", color: "#f0e6d3", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>Replace</button>
                <button onClick={removePhoto} style={{ background: "rgba(80,20,20,0.85)", border: "1px solid #6b2a2a", color: "#d97474", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>Remove</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "10px" }}>
              <div onClick={() => cameraRef.current?.click()} style={{ flex: 1, border: `1.5px dashed ${t.border}`, borderRadius: "8px", padding: "20px 12px", textAlign: "center", cursor: "pointer", color: t.textMuted }} onMouseEnter={e => e.currentTarget.style.borderColor = t.accent} onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
                <div style={{ fontSize: "26px", marginBottom: "6px" }}>📷</div>
                <div style={{ fontSize: "12px" }}>Take Photo</div>
              </div>
              <div onClick={() => galleryRef.current?.click()} style={{ flex: 1, border: `1.5px dashed ${t.border}`, borderRadius: "8px", padding: "20px 12px", textAlign: "center", cursor: "pointer", color: t.textMuted }} onMouseEnter={e => e.currentTarget.style.borderColor = t.accent} onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
                <div style={{ fontSize: "26px", marginBottom: "6px" }}>🖼️</div>
                <div style={{ fontSize: "12px" }}>Photo Library</div>
              </div>
            </div>
          )}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: "none" }} />
          <input ref={galleryRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
        </div>

        {[["name", "Item Name *", "e.g. Gala swag bags"], ["location", "Where Is It? *", "e.g. Kitchette, Downstairs, Closet, Back Room, Attic"]].map(([field, label, placeholder]) => (
          <div key={field} style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", color: t.textSub, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", fontFamily: "monospace" }}>{label}</label>
            <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} style={inputStyle} />
          </div>
        ))}

        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", color: t.textSub, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", fontFamily: "monospace" }}>Your Name *</label>
          <input value={form.updatedBy} onChange={e => setForm(f => ({ ...f, updatedBy: e.target.value }))} placeholder="e.g. Ivan (he knows where everything is anyway)" style={inputStyle} />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", color: t.textSub, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", fontFamily: "monospace" }}>Category</label>
          {showNewCat ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <input autoFocus value={newCatInput} onChange={e => setNewCatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddCategory()} placeholder="New category name..." style={{ ...inputStyle, border: `1px solid ${t.accent}` }} />
              <button onClick={handleAddCategory} style={{ background: t.accent, border: "none", color: "#fff", padding: "12px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Add</button>
              <button onClick={() => { setShowNewCat(false); setNewCatInput(""); }} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.textSub, padding: "12px 14px", borderRadius: "6px", cursor: "pointer" }}>✕</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, flex: 1 }}>
                {allCategories.map(c => <option key={c}>{c}</option>)}
              </select>
              <button onClick={() => setShowNewCat(true)} style={{ background: t.surfaceAlt, border: `1px solid ${t.border}`, color: t.accent, padding: "12px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "18px", flexShrink: 0 }}>+</button>
            </div>
          )}
          <div style={{ color: t.textMuted, fontSize: "11px", marginTop: "5px" }}>Tap + to create a custom category</div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", color: t.textSub, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", fontFamily: "monospace" }}>Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Quantity, condition, color, anything that helps someone find it fast..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        <div onClick={() => setForm(f => ({ ...f, uncertain: !f.uncertain }))} style={{ display: "flex", alignItems: "center", gap: "12px", background: form.uncertain ? "#fff8e8" : t.surfaceAlt, border: `1px solid ${form.uncertain ? "#f0c040" : t.border}`, borderRadius: "8px", padding: "12px 14px", cursor: "pointer", marginBottom: "24px" }}>
          <div style={{ width: "20px", height: "20px", borderRadius: "4px", border: `2px solid ${form.uncertain ? "#f0c040" : t.border}`, background: form.uncertain ? "#f0c040" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {form.uncertain && <span style={{ color: "#fff", fontSize: "13px", fontWeight: 700 }}>✓</span>}
          </div>
          <div>
            <div style={{ color: form.uncertain ? "#a06000" : t.textSub, fontSize: "14px", fontWeight: 500 }}>Flag as "Not Sure Where This Is"</div>
            <div style={{ color: t.textMuted, fontSize: "12px", marginTop: "2px" }}>Marks it so the team knows to double-check</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button onClick={handleSave} disabled={!valid || saving} style={{ width: "100%", background: valid ? t.accent : t.surfaceAlt, border: "none", color: valid ? "#fff" : t.textMuted, padding: "14px", borderRadius: "8px", cursor: valid ? "pointer" : "default", fontSize: "16px", fontWeight: 600 }}>
            {saving ? "Saving..." : isNew ? "Add to Inventory" : "Save Changes"}
          </button>
          {!isNew && (
            confirmDelete ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, background: "transparent", border: `1px solid ${t.border}`, color: t.textSub, padding: "11px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
                <button onClick={() => onDelete(item.id)} style={{ flex: 1, background: "#6b2a2a", border: "1px solid #8b3a3a", color: "#ffaaaa", padding: "11px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Yes, Delete</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.textMuted, padding: "11px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>Remove Item</button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// Grid card
function GridCard({ item, onClick, t }) {
  return (
    <div onClick={onClick} style={{ borderRadius: "12px", overflow: "hidden", cursor: "pointer", border: `1px solid ${t.border}`, background: t.surface, boxShadow: t.cardShadow, transition: "transform 0.15s, box-shadow 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 4px 16px rgba(107,30,46,0.15)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = t.cardShadow; }}
    >
      {/* Square photo */}
      <div style={{ position: "relative", paddingTop: "100%", background: t.surfaceAlt, overflow: "hidden" }}>
        {item.photoThumb ? (
          <img src={item.photoThumb} alt={item.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: t.textMuted, fontSize: "32px" }}>📦</div>
        )}
        {/* Overlay with name and location */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.85) 100%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px" }}>
          <div style={{ color: "#ffffff", fontSize: "13px", fontWeight: 700, lineHeight: 1.2, marginBottom: "3px", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>{item.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "10px" }}>📍</span>
            <span style={{ color: "#ffcccc", fontSize: "11px", fontWeight: 600, textShadow: "0 1px 4px rgba(0,0,0,0.8)", lineHeight: 1.2 }}>{item.location}</span>
          </div>
        </div>
        {item.uncertain && (
          <div style={{ position: "absolute", top: "8px", right: "8px", background: "#f0c040", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>⚠️</div>
        )}
      </div>
    </div>
  );
}

// List card
function ListCard({ item, onClick, t }) {
  return (
    <div onClick={onClick} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "10px", overflow: "hidden", cursor: "pointer", boxShadow: t.cardShadow, display: "flex", alignItems: "stretch" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = t.accent}
      onMouseLeave={e => e.currentTarget.style.borderColor = t.border}
    >
      {/* Thumbnail */}
      {item.photoThumb ? (
        <div style={{ width: "80px", flexShrink: 0, overflow: "hidden" }}>
          <img src={item.photoThumb} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      ) : (
        <div style={{ width: "80px", flexShrink: 0, background: t.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", color: t.textMuted, fontSize: "24px" }}>📦</div>
      )}
      {/* Content */}
      <div style={{ flex: 1, padding: "12px 14px", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, fontSize: "14px", color: t.text }}>{item.name}</span>
              {item.uncertain && <span style={{ fontSize: "12px" }}>⚠️</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
              <span style={{ fontSize: "11px" }}>📍</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: t.accent }}>{item.location}</span>
            </div>
            {item.notes && <div style={{ color: t.textMuted, fontSize: "12px", lineHeight: 1.4, marginTop: "2px" }}>{item.notes}</div>}
          </div>
          <div style={{ color: t.textMuted, fontSize: "11px", textAlign: "right", flexShrink: 0, lineHeight: 1.6 }}>
            <div>{item.updatedBy}</div>
            <div>{timeAgo(item.updatedAt)}</div>
          </div>
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
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [darkMode, setDarkMode] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [photoView, setPhotoView] = useState(null);
  const [toast, setToast] = useState({ message: "", error: false });

  const t = darkMode ? THEMES.dark : THEMES.light;

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
    } catch (e) { setLoadError(true); }
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

      const body = { fields };
      if (photoFile) {
        body.photoFile = await fileToBase64(photoFile);
      }

      const res = await fetch("/api/items", {
        method: existingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(existingId ? { id: existingId, ...body } : body),
      });
      const data = await res.json();

      if (data.id) {
        await loadItems();
        setEditItem(null);
        setViewItem(null);
        showToast(existingId ? "Item updated." : "Item added to inventory.");
      } else {
        showToast("Something went wrong. Try again.", true);
      }
    } catch (e) { showToast("Error saving item.", true); }
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
    } catch (e) { showToast("Error deleting item.", true); }
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
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: t.text, transition: "background 0.2s, color 0.2s" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: t.headerBg, borderBottom: `1px solid ${t.border}`, padding: "16px 16px 0", position: "sticky", top: 0, zIndex: 50, boxShadow: darkMode ? "none" : "0 1px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>

          {/* Top row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: "10px", color: t.accent, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>UrbanTheater Company</div>
              <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 900, color: t.text, margin: 0, lineHeight: 1.1 }}>Where Is It?</h1>
              <div style={{ color: t.textMuted, fontSize: "12px", marginTop: "4px", display: "flex", gap: "10px" }}>
                {loaded && <><span>{items.length} items</span>{uncertainCount > 0 && <span style={{ color: "#a06000" }}>⚠️ {uncertainCount} unconfirmed</span>}</>}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
              {/* Dark mode toggle */}
              <button onClick={() => setDarkMode(d => !d)} title={darkMode ? "Light mode" : "Dark mode"} style={{ background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "8px 10px", cursor: "pointer", fontSize: "16px", color: t.text }}>
                {darkMode ? "☀️" : "🌙"}
              </button>
              <button onClick={() => setEditItem("new")} style={{ background: t.accent, border: "none", color: "#fff", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 700, flexShrink: 0 }}>
                + Add
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: "10px" }}>
            <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", fontSize: "14px" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items, locations, notes..."
              style={{ width: "100%", background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: "8px", padding: "11px 36px", color: t.text, fontSize: "15px", fontFamily: "inherit", boxSizing: "border-box" }} />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: t.textMuted, cursor: "pointer", fontSize: "20px" }}>×</button>}
          </div>

          {/* Controls row */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "10px", alignItems: "center" }}>
            {/* Sort */}
            {[["name", "A–Z"], ["recent", "Recent"], ["uncertain", "Flagged"]].map(([val, label]) => (
              <button key={val} onClick={() => setSortBy(val)} style={{ background: sortBy === val ? t.accent : "transparent", border: `1px solid ${sortBy === val ? t.accent : t.border}`, color: sortBy === val ? "#fff" : t.textMuted, padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: sortBy === val ? 600 : 400 }}>{label}</button>
            ))}
            <div style={{ flex: 1 }} />
            {/* View toggle */}
            <button onClick={() => setViewMode("grid")} style={{ background: viewMode === "grid" ? t.accent : "transparent", border: `1px solid ${viewMode === "grid" ? t.accent : t.border}`, color: viewMode === "grid" ? "#fff" : t.textMuted, padding: "5px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>⊞</button>
            <button onClick={() => setViewMode("list")} style={{ background: viewMode === "list" ? t.accent : "transparent", border: `1px solid ${viewMode === "list" ? t.accent : t.border}`, color: viewMode === "list" ? "#fff" : t.textMuted, padding: "5px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>☰</button>
          </div>

          {/* Category filters */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px" }}>
            {allCats.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{ background: activeCategory === cat ? t.accent : t.surfaceAlt, border: `1px solid ${activeCategory === cat ? t.accent : t.border}`, color: activeCategory === cat ? "#fff" : t.textSub, padding: "5px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: "5px" }}>
                {cat}
                <span style={{ background: activeCategory === cat ? "rgba(255,255,255,0.25)" : t.border, borderRadius: "10px", padding: "1px 6px", fontSize: "10px", color: activeCategory === cat ? "#fff" : t.textMuted }}>{countFor(cat)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "16px 16px 110px" }}>
        {!loaded ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: t.textMuted }}><div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div><div>Loading inventory...</div></div>
        ) : loadError ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#8a4a38" }}><div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div><div>Could not connect to Airtable.</div></div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: t.textMuted }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>📦</div>
            <div>Nothing found{search ? ` for "${search}"` : ""}.</div>
            {search && <div onClick={() => setSearch("")} style={{ color: t.accent, fontSize: "13px", marginTop: "8px", cursor: "pointer" }}>Clear search</div>}
            {!search && items.length === 0 && <div style={{ fontSize: "13px", marginTop: "8px" }}>Add your first item to get started.</div>}
          </div>
        ) : viewMode === "grid" ? (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {sorted.map(item => <GridCard key={item.id} item={item} onClick={() => setViewItem(item)} t={t} />)}
            </div>
            <div style={{ textAlign: "center", color: t.textMuted, fontSize: "12px", marginTop: "12px" }}>Showing {sorted.length} of {items.length} items</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {sorted.map(item => <ListCard key={item.id} item={item} onClick={() => setViewItem(item)} t={t} />)}
            <div style={{ textAlign: "center", color: t.textMuted, fontSize: "12px", marginTop: "6px" }}>Showing {sorted.length} of {items.length} items</div>
          </div>
        )}
      </div>

      {/* Floating add button */}
      <div style={{ position: "fixed", bottom: "28px", right: "20px", zIndex: 100 }}>
        <button onClick={() => setEditItem("new")} style={{ background: t.accent, border: "none", color: "#fff", width: "56px", height: "56px", borderRadius: "50%", fontSize: "28px", cursor: "pointer", boxShadow: `0 4px 24px rgba(107,30,46,0.4)`, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
      </div>

      <Toast message={toast.message} error={toast.error} />
      {photoView && <PhotoViewer src={photoView} onClose={() => setPhotoView(null)} />}

      {viewItem && !editItem && (
        <ViewModal item={viewItem} onClose={() => setViewItem(null)} onEdit={() => setEditItem(viewItem)} t={t} onPhotoView={setPhotoView} />
      )}

      {editItem && (
        <EditModal
          item={editItem === "new" ? null : editItem}
          onClose={() => setEditItem(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          allCategories={categories}
          onAddCategory={handleAddCategory}
          t={t}
        />
      )}
    </div>
  );
}
