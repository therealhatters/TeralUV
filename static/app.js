const $ = (selector) => document.querySelector(selector);

const form = $("#proxy-form");
const input = $("#proxy-input");
const openButton = $("#open-button");
const statusEl = $("#status");
const quickLinks = Array.from(document.querySelectorAll("[data-url]"));
const launchTopButton = $("#launch-top");
const resetButton = $("#reset-app");
const proxyFrame = $("#proxy-frame");
const placeholder = $("#viewer-placeholder");

let connectionReady = false;
let lastTarget = "";

function setStatus(message, type = "info") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.state = type;
}

function normalizeInput(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";

  try {
    return new URL(trimmed).toString();
  } catch (_) {}

  const looksLikeDomain =
    /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed) && !trimmed.includes(" ");

  if (looksLikeDomain) {
    return `https://${trimmed}`;
  }

  return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
}

async function ensureTransport() {
  if (connectionReady) return true;

  setStatus("Loading UV transport...", "loading");

  try {
    const [{ BareMuxConnection }] = await Promise.all([
      import("/baremux/index.mjs"),
      loadScript("/uv/uv.bundle.js"),
      loadScript("/uv/uv.config.js"),
    ]);

    const conn = new BareMuxConnection("/baremux/worker.js");
    const wispUrl = getWispUrl();

    await conn.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
    connectionReady = true;
    setStatus(`Transport ready (${wispUrl})`, "ok");
    return true;
  } catch (error) {
    console.error(error);
    setStatus(
      `Failed to initialize transport: ${error instanceof Error ? error.message : String(error)}`,
      "error",
    );
    return false;
  }
}

function getWispUrl() {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const configuredPort =
    window.__PYTHON_UV_CONFIG__ && window.__PYTHON_UV_CONFIG__.wispPort
      ? String(window.__PYTHON_UV_CONFIG__.wispPort)
      : "4000";

  const configuredHost =
    window.__PYTHON_UV_CONFIG__ && window.__PYTHON_UV_CONFIG__.wispHost
      ? String(window.__PYTHON_UV_CONFIG__.wispHost)
      : location.hostname;

  return `${protocol}//${configuredHost}:${configuredPort}/`;
}

function buildUvUrl(targetUrl) {
  if (
    typeof window.__uv$config === "undefined" ||
    typeof window.__uv$config.encodeUrl !== "function"
  ) {
    throw new Error("UV config is not loaded.");
  }

  return `${window.__uv$config.prefix}${window.__uv$config.encodeUrl(targetUrl)}`;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    setStatus("Your browser does not support service workers.", "error");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    await navigator.serviceWorker.ready;

    if (registration.active || registration.waiting || registration.installing) {
      setStatus("Service worker ready.", "ok");
    }

    return true;
  } catch (error) {
    console.error(error);
    setStatus(
      `Service worker registration failed: ${error instanceof Error ? error.message : String(error)}`,
      "error",
    );
    return false;
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-src="${src}"]`);
    if (existing) {
      resolve(existing);
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.src = src;
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function openTarget(rawValue) {
  const target = normalizeInput(rawValue);
  if (!target) {
    setStatus("Enter a URL or search term first.", "error");
    input?.focus();
    return;
  }

  const swReady = await registerServiceWorker();
  if (!swReady) return;

  const transportReady = await ensureTransport();
  if (!transportReady) return;

  try {
    const proxied = buildUvUrl(target);
    lastTarget = proxied;

    if (proxyFrame) {
      proxyFrame.src = proxied;
      proxyFrame.classList.remove("hidden");
    }

    if (placeholder) {
      placeholder.classList.add("hidden");
    }

    if (input) {
      input.value = target;
    }

    try {
      localStorage.setItem("python-uv:last-url", target);
    } catch (_) {}

    setStatus(`Opening ${target}`, "ok");
  } catch (error) {
    console.error(error);
    setStatus(
      `Failed to open target: ${error instanceof Error ? error.message : String(error)}`,
      "error",
    );
  }
}

function restoreLastUrl() {
  try {
    const last = localStorage.getItem("python-uv:last-url");
    if (last && input && !input.value.trim()) {
      input.value = last;
    }
  } catch (_) {}
}

function resetApp() {
  lastTarget = "";
  connectionReady = false;

  try {
    localStorage.removeItem("python-uv:last-url");
  } catch (_) {}

  if (proxyFrame) {
    proxyFrame.src = "about:blank";
    proxyFrame.classList.add("hidden");
  }

  if (placeholder) {
    placeholder.classList.remove("hidden");
  }

  if (input) {
    input.value = "";
    input.focus();
  }

  setStatus("Reset complete.", "info");
}

async function boot() {
  restoreLastUrl();
  setStatus("Preparing UV frontend...", "loading");

  await Promise.allSettled([
    loadScript("/uv/uv.bundle.js"),
    loadScript("/uv/uv.config.js"),
  ]);

  await registerServiceWorker();
  setStatus("Ready.", "ok");
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await openTarget(input?.value || "");
  });
}

if (openButton) {
  openButton.addEventListener("click", async (event) => {
    event.preventDefault();
    await openTarget(input?.value || "");
  });
}

for (const link of quickLinks) {
  link.addEventListener("click", async (event) => {
    event.preventDefault();
    const url = link.dataset.url || "";
    await openTarget(url);
  });
}

if (launchTopButton) {
  launchTopButton.addEventListener("click", () => {
    if (!lastTarget) {
      setStatus("Open a site first.", "error");
      return;
    }
    window.open(lastTarget, "_blank", "noopener,noreferrer");
  });
}

if (resetButton) {
  resetButton.addEventListener("click", resetApp);
}

if (proxyFrame) {
  proxyFrame.addEventListener("load", () => {
    if (proxyFrame.src && proxyFrame.src !== "about:blank") {
      setStatus("Page loaded.", "ok");
    }
  });

  proxyFrame.addEventListener("error", () => {
    setStatus("The proxied frame failed to load.", "error");
  });
}

window.addEventListener("keydown", (event) => {
  const active = document.activeElement;
  const typing =
    active &&
    (active.tagName === "INPUT" ||
      active.tagName === "TEXTAREA" ||
      active.isContentEditable);

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
    event.preventDefault();
    input?.focus();
    input?.select();
    return;
  }

  if (!typing && event.key === "/") {
    event.preventDefault();
    input?.focus();
  }
});

boot();
