const LAB_STATUS_API_URL = "https://api.daniel-schumacher.net/api/status";
const LAB_REFRESH_INTERVAL_MS = 5000;
const LAB_REQUEST_TIMEOUT_MS = 8000;

const metricElements = {
  cpu: {
    value: document.querySelector('[data-metric-value="cpu"]'),
    bar: document.querySelector('[data-metric-bar="cpu"]'),
    card: document.querySelector('[data-api-target="metrics.cpu"]'),
    format: (value) => `${value}%`,
  },
  ram: {
    value: document.querySelector('[data-metric-value="ram"]'),
    bar: document.querySelector('[data-metric-bar="ram"]'),
    card: document.querySelector('[data-api-target="metrics.ram"]'),
    format: (value) => `${value}%`,
  },
  storage: {
    value: document.querySelector('[data-metric-value="storage"]'),
    bar: document.querySelector('[data-metric-bar="storage"]'),
    card: document.querySelector('[data-api-target="metrics.storage"]'),
    format: (value) => `${value}%`,
  },
  containers: {
    value: document.querySelector('[data-metric-value="containers"]'),
    state: document.querySelector('[data-metric-state="containers"]'),
    card: document.querySelector('[data-api-target="metrics.containers"]'),
    stateText: "Healthy",
    format: (value) => `${value} running`,
  },
  uptime: {
    value: document.querySelector('[data-metric-value="uptime"]'),
    state: document.querySelector('[data-metric-state="uptime"]'),
    card: document.querySelector('[data-api-target="metrics.uptime"]'),
    stateText: "Stable",
    format: (value) => value,
  },
  ssl: {
    value: document.querySelector('[data-metric-value="ssl"]'),
    state: document.querySelector('[data-metric-state="ssl"]'),
    card: document.querySelector('[data-api-target="metrics.ssl"]'),
    stateText: "HTTPS",
    format: (value) => value,
  },
};

const lastUpdatedElement = document.querySelector("[data-last-updated]");

function clampPercentage(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, Math.min(number, 100));
}

function setLastUpdated(value, isError = false) {
  if (!lastUpdatedElement) {
    return;
  }

  lastUpdatedElement.classList.toggle("metric-updated-error", isError);

  if (isError || !value) {
    lastUpdatedElement.textContent = "Last updated: Offline";
    return;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    lastUpdatedElement.textContent = "Last updated: Unknown";
    return;
  }

  lastUpdatedElement.textContent = `Last updated: ${date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  })}`;
}

function setMetricsOffline() {
  Object.values(metricElements).forEach((metric) => {
    if (!metric?.card) {
      return;
    }

    metric.card.classList.add("metric-card-offline");

    if (metric.state) {
      metric.state.textContent = "Offline";
    }
  });
}

function setMetricsOnline() {
  Object.values(metricElements).forEach((metric) => {
    if (!metric?.card) {
      return;
    }

    metric.card.classList.remove("metric-card-offline");

    if (metric.state) {
      metric.state.textContent = metric.stateText;
    }
  });
}

function updateMetric(metric, value) {
  if (!metric?.value) {
    return;
  }

  metric.value.textContent = metric.format(value);

  if (metric.bar) {
    metric.bar.style.width = `${clampPercentage(value)}%`;
  }
}

async function fetchStatusJson() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), LAB_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(LAB_STATUS_API_URL, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Portfolio API returned ${response.status}`);
    }

    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchMetrics() {
  try {
    const data = await fetchStatusJson();

    Object.entries(metricElements).forEach(([key, metric]) => {
      if (data[key] === undefined || data[key] === null || data[key] === "") {
        return;
      }

      updateMetric(metric, data[key]);
    });

    setMetricsOnline();
    setLastUpdated(data.lastUpdated);
  } catch (error) {
    setMetricsOffline();
    setLastUpdated(null, true);
  }
}

fetchMetrics();
window.setInterval(fetchMetrics, LAB_REFRESH_INTERVAL_MS);
