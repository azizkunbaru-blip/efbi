const MODE = "DEMO"; // "DEMO" | "REAL"
const API_BASE = ""; // e.g. "https://your-domain.com/api"

const form = document.getElementById("downloadForm");
const urlInput = document.getElementById("videoUrl");
const pasteBtn = document.getElementById("pasteBtn");
const statusEl = document.getElementById("status");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const resultsCard = document.getElementById("resultsCard");
const formatsList = document.getElementById("formatsList");
const videoTitle = document.getElementById("videoTitle");

const DEMO_FORMATS = [
  { quality: "360p", note: "SD · 12 MB", url: "#" },
  { quality: "720p", note: "HD · 28 MB", url: "#" },
  { quality: "1080p", note: "Full HD · 45 MB", url: "#" },
  { quality: "2K", note: "2K · 80 MB", url: "#" },
  { quality: "4K", note: "Ultra HD · 130 MB", url: "#" },
];

function setStatus({ loading = false, error = "", showResults = false } = {}) {
  loadingEl.classList.toggle("hidden", !loading);
  errorEl.classList.toggle("hidden", !error);
  errorEl.textContent = error;
  resultsCard.classList.toggle("hidden", !showResults);
  statusEl.classList.toggle("hidden", loading || error || showResults);
}

function isFacebookUrl(rawUrl) {
  if (!rawUrl) return false;
  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch (err) {
    return false;
  }

  const host = parsed.hostname.replace("www.", "").toLowerCase();
  const allowedHosts = ["facebook.com", "fb.watch", "m.facebook.com"];
  if (!allowedHosts.some((allowed) => host.endsWith(allowed))) {
    return false;
  }

  const path = parsed.pathname.toLowerCase();
  return (
    path.includes("/watch") ||
    path.includes("/reel") ||
    path.includes("/reels") ||
    path.includes("/videos") ||
    host === "fb.watch"
  );
}

async function handlePaste() {
  if (navigator.clipboard?.readText) {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlInput.value = text.trim();
        urlInput.focus();
      }
      return;
    } catch (err) {
      // fall back
    }
  }

  const manual = window.prompt("Paste URL Facebook di sini:");
  if (manual) {
    urlInput.value = manual.trim();
    urlInput.focus();
  }
}

function renderFormats(formats = [], title = "") {
  formatsList.innerHTML = "";
  videoTitle.textContent = title ? `Title: ${title}` : "";

  formats.forEach((format) => {
    const item = document.createElement("div");
    item.className = "format-item";

    const info = document.createElement("div");
    info.className = "format-info";
    info.innerHTML = `<h3>${format.quality}</h3><span>${format.note}</span>`;

    const download = document.createElement("a");
    download.className = "download-btn";
    download.href = format.url;
    download.target = "_blank";
    download.rel = "noopener";
    download.textContent = "Download";

    item.appendChild(info);
    item.appendChild(download);
    formatsList.appendChild(item);
  });
}

async function resolveFacebookVideo(url) {
  if (MODE === "REAL") {
    if (!API_BASE) {
      throw new Error("API_BASE belum diisi. Update konfigurasi di app.js.");
    }
    const response = await fetch(
      `${API_BASE.replace(/\/$/, "")}/resolve?url=${encodeURIComponent(url)}`
    );
    if (!response.ok) {
      throw new Error("Gagal mengambil data dari resolver backend.");
    }
    const data = await response.json();
    if (!data?.formats?.length) {
      throw new Error("Format video tidak ditemukan.");
    }
    return data;
  }

  await new Promise((resolve) => setTimeout(resolve, 900));
  return {
    title: "Demo Video Facebook",
    formats: DEMO_FORMATS,
  };
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = urlInput.value.trim();

  if (!isFacebookUrl(url)) {
    setStatus({ error: "Masukkan URL Facebook yang valid." });
    return;
  }

  setStatus({ loading: true });

  try {
    const data = await resolveFacebookVideo(url);
    renderFormats(data.formats, data.title);
    setStatus({ showResults: true });
  } catch (err) {
    setStatus({ error: err.message || "Terjadi kesalahan." });
  }
});
