const ADMIN_TOKEN_KEY = "iegh-admin-token";

const loginForm = document.querySelector("#admin-login-form");
const loginStatus = document.querySelector("#admin-login-status");
const adminShell = document.querySelector(".admin-shell");
const adminSessionLabel = document.querySelector("#admin-session-label");
const logoutButton = document.querySelector("#admin-logout");
const tabs = document.querySelectorAll("[data-admin-tab]");
const panels = document.querySelectorAll("[data-admin-panel]");
const inboxList = document.querySelector("#admin-inbox-list");
const refreshInboxButton = document.querySelector("#refresh-inbox");
const inboxCount = document.querySelector("#inbox-count");
const mediaCount = document.querySelector("#media-count");
const contentUpdated = document.querySelector("#content-updated");
const contentEditor = document.querySelector("#content-editor");
const contentStatus = document.querySelector("#content-status");
const loadContentButton = document.querySelector("#load-content");
const saveContentButton = document.querySelector("#save-content");
const mediaForm = document.querySelector("#admin-media-form");
const mediaStatus = document.querySelector("#admin-media-status");
const mediaList = document.querySelector("#admin-media-list");
const helperForm = document.querySelector("#helper-form");
const helperStatus = document.querySelector("#helper-status");
const helperLog = document.querySelector("#helper-log");

function setStatus(element, message, type = "info") {
  if (!element) return;
  element.textContent = message;
  element.dataset.status = type;
}

function getToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

function setToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function adminFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = "admin.html";
    throw new Error("Admin session expired.");
  }

  return response;
}

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(loginStatus, "Checking credentials...", "info");

  const data = new FormData(loginForm);
  const submitButton = loginForm.querySelector("button[type='submit']");
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Checking...";
  }

  try {
    const response = await fetch("/api/admin-auth", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: data.get("email"),
        password: data.get("password"),
      }),
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(result.error || "Unable to log in.");
    }

    setToken(result.token);
    window.location.href = "admin-dashboard.html";
  } catch (error) {
    const message = error.name === "AbortError"
      ? "Login request timed out. Check Vercel env vars and deployment logs."
      : error.message || "Unable to log in.";
    setStatus(loginStatus, message, "error");
  } finally {
    window.clearTimeout(timeout);
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Enter Admin Dashboard";
    }
  }
});

async function verifySession() {
  if (!adminShell) return;

  if (!getToken()) {
    window.location.href = "admin.html";
    return;
  }

  const response = await adminFetch("/api/admin-auth");
  const result = await response.json();

  if (adminSessionLabel) {
    adminSessionLabel.textContent = result.admin?.email || "Admin session active";
  }
}

function activateTab(name) {
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.adminTab === name));
  panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.adminPanel === name));
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.adminTab));
});

logoutButton?.addEventListener("click", () => {
  clearToken();
  window.location.href = "admin.html";
});

function renderPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  return Object.entries(payload)
    .filter(([, value]) => value !== "" && value !== null && value !== undefined)
    .map(([key, value]) => {
      const printable = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
      return `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(printable)}</dd>`;
    })
    .join("");
}

async function loadInbox() {
  if (!inboxList) return;

  inboxList.innerHTML = "<p>Loading inbox...</p>";
  const response = await adminFetch("/api/admin-inbox");
  const { records = [] } = await response.json();

  if (inboxCount) {
    inboxCount.textContent = String(records.length);
  }

  if (!records.length) {
    inboxList.innerHTML = "<p>No inbox records yet.</p>";
    return;
  }

  inboxList.innerHTML = records
    .map((record) => `
      <article class="admin-record">
        <span>${escapeHtml(record.type || "record")}</span>
        <strong>${escapeHtml(record.payload?.name || record.payload?.caseId || record.id)}</strong>
        <time>${escapeHtml(record.receivedAt || "")}</time>
        <dl>${renderPayload(record.payload)}</dl>
      </article>
    `)
    .join("");
}

refreshInboxButton?.addEventListener("click", loadInbox);

async function loadContent() {
  if (!contentEditor) return;

  setStatus(contentStatus, "Loading content...", "info");
  const response = await adminFetch("/api/admin-content");
  const content = await response.json();

  contentEditor.value = JSON.stringify(content, null, 2);

  if (contentUpdated) {
    contentUpdated.textContent = content.updatedAt ? new Date(content.updatedAt).toLocaleString() : "Not saved";
  }

  setStatus(contentStatus, "Content loaded.", "success");
}

async function saveContent() {
  if (!contentEditor) return;

  try {
    const content = JSON.parse(contentEditor.value || "{}");
    setStatus(contentStatus, "Saving content overrides...", "info");

    const response = await adminFetch("/api/admin-content", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to save content.");
    }

    contentEditor.value = JSON.stringify(result, null, 2);
    if (contentUpdated) {
      contentUpdated.textContent = result.updatedAt ? new Date(result.updatedAt).toLocaleString() : "Just now";
    }
    setStatus(contentStatus, "Content overrides saved.", "success");
  } catch (error) {
    setStatus(contentStatus, error.message || "Content JSON is invalid.", "error");
  }
}

loadContentButton?.addEventListener("click", loadContent);
saveContentButton?.addEventListener("click", saveContent);

async function loadMedia() {
  if (!mediaList) return;

  const response = await adminFetch("/api/admin-media");
  const { media = [] } = await response.json();

  if (mediaCount) {
    mediaCount.textContent = String(media.length);
  }

  if (!media.length) {
    mediaList.innerHTML = "<p>No media uploaded yet.</p>";
    return;
  }

  mediaList.innerHTML = media
    .map((item) => `
      <article class="admin-media-item">
        <strong>${escapeHtml(item.pathname?.split("/").pop() || "Media file")}</strong>
        <a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.url)}</a>
      </article>
    `)
    .join("");
}

mediaForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(mediaStatus, "Uploading media...", "info");

  try {
    const response = await adminFetch("/api/admin-media", {
      method: "POST",
      body: new FormData(mediaForm),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to upload media.");
    }

    mediaForm.reset();
    setStatus(mediaStatus, `Uploaded: ${result.media.url}`, "success");
    await loadMedia();
  } catch (error) {
    setStatus(mediaStatus, error.message || "Unable to upload media.", "error");
  }
});

helperForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const prompt = new FormData(helperForm).get("prompt") || "";
  setStatus(helperStatus, "Contacting website helper...", "info");

  try {
    const response = await adminFetch("/api/admin-helper", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Website helper is unavailable.");
    }

    helperLog.innerHTML += `
      <article>
        <strong>You</strong>
        <p>${escapeHtml(prompt)}</p>
        <strong>Website Helper</strong>
        <pre>${escapeHtml(JSON.stringify(result, null, 2))}</pre>
      </article>
    `;
    helperForm.reset();
    setStatus(helperStatus, "Website helper responded.", "success");
  } catch (error) {
    setStatus(helperStatus, error.message || "Website helper is unavailable.", "error");
  }
});

if (adminShell) {
  verifySession()
    .then(() => Promise.all([loadInbox(), loadContent(), loadMedia()]))
    .catch((error) => {
      console.error(error);
    });
}
