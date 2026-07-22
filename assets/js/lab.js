const LAB_STATUS_API_URL = "https://api.daniel-schumacher.net/api/status";
const LAB_CONTAINERS_API_URL = "https://api.daniel-schumacher.net/api/containers";
const LAB_REFRESH_INTERVAL_MS = 5000;
const CONTAINERS_REFRESH_INTERVAL_MS = 10000;
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
const containerSummaryElements = {
  total: document.querySelector('[data-container-summary="total"]'),
  running: document.querySelector('[data-container-summary="running"]'),
  stopped: document.querySelector('[data-container-summary="stopped"]'),
  lastUpdated: document.querySelector('[data-container-summary="lastUpdated"]'),
};
const containersBody = document.querySelector("[data-containers-body]");
const containersTable = document.querySelector("[data-containers-table]");
const containersLoading = document.querySelector("[data-containers-loading]");
const containersError = document.querySelector("[data-containers-error]");
const containersEmpty = document.querySelector("[data-containers-empty]");
const containersRefreshButton = document.querySelector("[data-containers-refresh]");
const containersRetryButton = document.querySelector("[data-containers-retry]");
let isFetchingContainers = false;
let hasContainerData = false;

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

function formatLocalDateTime(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), LAB_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
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

function setContainerSummary(data) {
  if (containerSummaryElements.total) {
    containerSummaryElements.total.textContent = String(data.total ?? 0);
  }

  if (containerSummaryElements.running) {
    containerSummaryElements.running.textContent = String(data.running ?? 0);
  }

  if (containerSummaryElements.stopped) {
    containerSummaryElements.stopped.textContent = String(data.stopped ?? 0);
  }

  if (containerSummaryElements.lastUpdated) {
    containerSummaryElements.lastUpdated.textContent = formatLocalDateTime(data.lastUpdated);
  }
}

function getContainerState(container) {
  const state = String(container.state || "").toLowerCase();

  if (container.running || state === "running") {
    return {
      label: "Running",
      className: "docker-state docker-state-running",
    };
  }

  if (state === "exited" || state === "stopped" || state === "dead") {
    return {
      label: "Stopped",
      className: "docker-state docker-state-stopped",
    };
  }

  return {
    label: state ? state.charAt(0).toUpperCase() + state.slice(1) : "Unknown",
    className: "docker-state docker-state-other",
  };
}

function simplifyPorts(value) {
  const ports = String(value || "").trim();

  if (!ports || ports === "None") {
    return "None";
  }

  return ports
    .split(",")
    .map((port) => port.trim())
    .filter(Boolean)
    .map((port) => port.replace(/0\.0\.0\.0:/g, "").replace(/\[::\]:/g, ""))
    .join(", ");
}

function createContainerMeta(label, value, useCode = false) {
  const item = document.createElement("div");
  const labelElement = document.createElement("span");
  const valueElement = useCode ? document.createElement("code") : document.createElement("strong");

  item.className = "docker-container-meta-item";
  labelElement.textContent = label;
  valueElement.textContent = value || "None";
  item.append(labelElement, valueElement);

  return item;
}

function renderContainers(containers) {
  if (!containersBody) {
    return;
  }

  const cards = document.createDocumentFragment();

  containers.forEach((container) => {
    const card = document.createElement("article");
    const header = document.createElement("div");
    const titleWrap = document.createElement("div");
    const name = document.createElement("h3");
    const image = document.createElement("code");
    const status = document.createElement("span");
    const state = getContainerState(container);
    const meta = document.createElement("div");

    card.className = "docker-container-card";
    header.className = "docker-container-card-header";
    titleWrap.className = "docker-container-title";
    name.textContent = container.name || "Unnamed container";
    image.textContent = container.image || "Unknown image";
    status.className = state.className;
    status.textContent = state.label;
    titleWrap.append(name, image);
    header.append(titleWrap, status);
    meta.className = "docker-container-meta";
    meta.append(
      createContainerMeta("Docker status", container.status),
      createContainerMeta("Ports", simplifyPorts(container.ports), true),
    );
    card.append(header, meta);
    cards.append(card);
  });

  containersBody.replaceChildren(cards);
}

function setContainerLoading(isLoading) {
  if (containersLoading) {
    containersLoading.hidden = !isLoading;
  }

  if (containersRefreshButton) {
    containersRefreshButton.disabled = isLoading;
    containersRefreshButton.textContent = isLoading ? "Refreshing" : "Refresh";
  }
}

function setContainerError(isError) {
  if (containersError) {
    containersError.hidden = !isError;
  }
}

function setContainerEmpty(isEmpty) {
  if (containersEmpty) {
    containersEmpty.hidden = !isEmpty;
  }
}

function setContainerTable(isVisible) {
  if (containersTable) {
    containersTable.hidden = !isVisible;
  }
}

async function fetchContainers() {
  if (isFetchingContainers) {
    return;
  }

  isFetchingContainers = true;
  setContainerLoading(!hasContainerData);
  setContainerError(false);

  try {
    const data = await fetchJson(LAB_CONTAINERS_API_URL);
    const containers = Array.isArray(data.containers) ? data.containers : [];

    setContainerSummary(data);
    renderContainers(containers);
    hasContainerData = true;
    setContainerEmpty(containers.length === 0);
    setContainerTable(containers.length > 0);
  } catch (error) {
    setContainerError(true);

    if (!hasContainerData) {
      setContainerTable(false);
      setContainerEmpty(false);
    }
  } finally {
    isFetchingContainers = false;
    setContainerLoading(false);
  }
}

fetchMetrics();
fetchContainers();

const metricsInterval = window.setInterval(fetchMetrics, LAB_REFRESH_INTERVAL_MS);
const containersInterval = window.setInterval(fetchContainers, CONTAINERS_REFRESH_INTERVAL_MS);

if (containersRefreshButton) {
  containersRefreshButton.addEventListener("click", fetchContainers);
}

if (containersRetryButton) {
  containersRetryButton.addEventListener("click", fetchContainers);
}

window.addEventListener("pagehide", () => {
  window.clearInterval(metricsInterval);
  window.clearInterval(containersInterval);
});
