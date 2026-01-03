const MODE = "DEMO";
const API_BASE = "";

const form = document.getElementById("downloadForm");
const urlInput = document.getElementById("videoUrl");
const pasteButton = document.getElementById("pasteButton");

const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const resultState = document.getElementById("resultState");
const errorMessage = document.getElementById("errorMessage");
const resultTitle = document.getElementById("resultTitle");
const formatList = document.getElementById("formatList");

const showState = (state) => {
  emptyState.hidden = state !== "empty";
  loadingState.hidden = state !== "loading";
  errorState.hidden = state !== "error";
  resultState.hidden = state !== "result";
};

const isFacebookUrl = (value) => {
  try {
    const url = new URL(value);
    const host = url.hostname.replace("www.", "");
    const allowedHosts = ["facebook.com", "fb.watch"];
    const hostAllowed = allowedHosts.some((allowed) => host.endsWith(allowed));
    if (!hostAllowed) {
      return false;
    }
    const path = url.pathname.toLowerCase();
    return (
      path.includes("/watch") ||
      path.includes("/reel") ||
      path.includes("/reels") ||
      path.includes("/video") ||
      path.includes("/videos") ||
      path.length > 1
    );
  } catch (error) {
    return false;
  }
};

const renderFormats = (formats) => {
  formatList.innerHTML = "";
  formats.forEach((format) => {
    const row = document.createElement("div");
    row.className = "format-row";

    const meta = document.createElement("div");
    meta.className = "format-row__meta";

    const title = document.createElement("strong");
    title.textContent = format.quality;

    const detail = document.createElement("span");
    detail.textContent = format.note || "MP4";

    meta.appendChild(title);
    meta.appendChild(detail);

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Download";
    button.addEventListener("click", () => {
      window.open(format.url, "_blank", "noopener");
    });

    row.appendChild(meta);
    row.appendChild(button);
    formatList.appendChild(row);
  });
};

const resolveFacebookVideo = async (url) => {
  if (MODE === "DEMO") {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          title: "Contoh Video Facebook",
          formats: [
            { quality: "360p", note: "MP4 · 12 MB", url: "#" },
            { quality: "720p", note: "HD · 28 MB", url: "#" },
            { quality: "1080p", note: "Full HD · 52 MB", url: "#" },
            { quality: "2K", note: "QHD · 140 MB", url: "#" },
            { quality: "4K", note: "UHD · 210 MB", url: "#" }
          ]
        });
      }, 900);
    });
  }

  if (!API_BASE) {
    throw new Error("API base belum diisi. Tambahkan endpoint resolver dulu.");
  }

  const response = await fetch(
    `${API_BASE.replace(/\/$/, "")}/resolve?url=${encodeURIComponent(url)}`
  );

  if (!response.ok) {
    throw new Error("Gagal mengambil data video dari server.");
  }

  return response.json();
};

const handlePaste = async () => {
  if (navigator.clipboard && navigator.clipboard.readText) {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlInput.value = text.trim();
        urlInput.focus();
      }
      return;
    } catch (error) {
      // Fallback below
    }
  }

  const manual = window.prompt("Tempel URL Facebook di sini:");
  if (manual) {
    urlInput.value = manual.trim();
    urlInput.focus();
  }
};

pasteButton.addEventListener("click", handlePaste);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = urlInput.value.trim();

  if (!isFacebookUrl(url)) {
    errorMessage.textContent =
      "URL tidak valid. Gunakan link Facebook atau fb.watch.";
    showState("error");
    return;
  }

  showState("loading");

  try {
    const result = await resolveFacebookVideo(url);
    resultTitle.textContent = result.title || "Video Facebook";
    renderFormats(result.formats || []);
    showState("result");
  } catch (error) {
    errorMessage.textContent = error.message ||
      "Terjadi kesalahan saat mengambil data.";
    showState("error");
  }
});

showState("empty");
