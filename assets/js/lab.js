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
  lastUpdatedExact: document.querySelector("[data-container-summary-exact]"),
};
const containersSummary = document.querySelector("[data-containers-summary]");
const containersBody = document.querySelector("[data-containers-body]");
const containersTable = document.querySelector("[data-containers-table]");
const containersLoading = document.querySelector("[data-containers-loading]");
const containersError = document.querySelector("[data-containers-error]");
const containersWarning = document.querySelector("[data-containers-warning]");
const containersEmpty = document.querySelector("[data-containers-empty]");
const containersRefreshButton = document.querySelector("[data-containers-refresh]");
const containersRetryButton = document.querySelector("[data-containers-retry]");
let isFetchingContainers = false;
let hasContainerData = false;
let containerLastUpdatedAt = null;

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

function getRelativeTime(value) {
  if (!value) {
    return "Updated unknown";
  }

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - value.getTime()) / 1000));

  if (elapsedSeconds < 5) {
    return "Updated just now";
  }

  if (elapsedSeconds < 60) {
    return `Updated ${elapsedSeconds} seconds ago`;
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  if (elapsedMinutes < 60) {
    return `Updated ${elapsedMinutes} ${elapsedMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  return `Updated ${elapsedHours} ${elapsedHours === 1 ? "hour" : "hours"} ago`;
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

  containerLastUpdatedAt = data.lastUpdated ? new Date(data.lastUpdated) : new Date();

  if (Number.isNaN(containerLastUpdatedAt.getTime())) {
    containerLastUpdatedAt = new Date();
  }

  updateContainerRelativeTime();

  if (containerSummaryElements.lastUpdatedExact) {
    containerSummaryElements.lastUpdatedExact.textContent = formatLocalDateTime(containerLastUpdatedAt);
  }
}

function updateContainerRelativeTime() {
  if (!containerSummaryElements.lastUpdated || !containerLastUpdatedAt) {
    return;
  }

  const exactTime = formatLocalDateTime(containerLastUpdatedAt);

  containerSummaryElements.lastUpdated.textContent = getRelativeTime(containerLastUpdatedAt);
  containerSummaryElements.lastUpdated.setAttribute("title", exactTime);
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
    return [];
  }

  return [...new Set(ports
    .split(",")
    .map((port) => port.trim())
    .filter(Boolean)
    .map((port) => port
      .replace(/0\.0\.0\.0:/g, "")
      .replace(/(?:\d{1,3}\.){3}\d{1,3}:/g, "")
      .replace(/\[::\]:/g, "")
      .replace(/\/tcp|\/udp/g, "")
      .replace("->", " \u2192 "))
    .map((port) => port.trim())
    .filter(Boolean))];
}

function splitImageName(value) {
  const image = String(value || "").trim();

  if (!image) {
    return {
      repository: "Unknown image",
      tag: "",
    };
  }

  const lastSlash = image.lastIndexOf("/");
  const lastColon = image.lastIndexOf(":");

  if (lastColon > lastSlash) {
    return {
      repository: image.slice(0, lastColon),
      tag: image.slice(lastColon + 1),
    };
  }

  return {
    repository: image,
    tag: "",
  };
}

function createTextCell(label, value, className = "") {
  const cell = document.createElement("td");
  const text = document.createElement("span");

  cell.dataset.label = label;
  text.className = className;
  text.textContent = value || "None";
  cell.append(text);

  return cell;
}

function createStatusCell(container) {
  const cell = document.createElement("td");
  const status = document.createElement("span");
  const state = getContainerState(container);

  cell.dataset.label = "Status";
  status.className = state.className;
  status.textContent = state.label;
  cell.append(status);

  return cell;
}

function createServiceCell(container) {
  const cell = document.createElement("td");
  const wrap = document.createElement("span");
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const box = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  const name = document.createElement("strong");

  cell.dataset.label = "Service";
  wrap.className = "docker-service";
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  box.setAttribute("x", "4");
  box.setAttribute("y", "6");
  box.setAttribute("width", "16");
  box.setAttribute("height", "12");
  box.setAttribute("rx", "2");
  icon.append(box);
  name.textContent = container.name || "Unnamed container";
  wrap.append(icon, name);
  cell.append(wrap);

  return cell;
}

function createImageCell(value) {
  const cell = document.createElement("td");
  const image = splitImageName(value);
  const wrap = document.createElement("span");
  const repository = document.createElement("code");

  cell.dataset.label = "Image";
  wrap.className = "docker-image";
  repository.textContent = image.repository;
  wrap.append(repository);

  if (image.tag) {
    const tag = document.createElement("small");

    tag.textContent = image.tag;
    wrap.append(tag);
  }

  cell.append(wrap);

  return cell;
}

function createPortsCell(value) {
  const cell = document.createElement("td");
  const wrap = document.createElement("span");
  const ports = simplifyPorts(value);

  cell.dataset.label = "Ports";
  wrap.className = "docker-ports";

  if (ports.length === 0) {
    const empty = document.createElement("span");

    empty.className = "docker-no-ports";
    empty.textContent = "No exposed ports";
    wrap.append(empty);
  } else {
    ports.forEach((port) => {
      const badge = document.createElement("code");

      badge.className = "docker-port-badge";
      badge.textContent = port;
      wrap.append(badge);
    });
  }

  cell.append(wrap);

  return cell;
}

function renderContainers(containers) {
  if (!containersBody) {
    return;
  }

  const rows = document.createDocumentFragment();

  containers.forEach((container) => {
    const row = document.createElement("tr");

    row.append(
      createStatusCell(container),
      createServiceCell(container),
      createImageCell(container.image),
      createTextCell("Uptime", container.status, "docker-uptime"),
      createPortsCell(container.ports),
    );
    rows.append(row);
  });

  containersBody.replaceChildren(rows);
}

function setContainerLoading(isLoading, showMessage = isLoading) {
  if (containersLoading) {
    containersLoading.hidden = !showMessage;
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

function setContainerWarning(isWarning) {
  if (containersWarning) {
    containersWarning.hidden = !isWarning;
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

function setContainerSummaryVisible(isVisible) {
  if (containersSummary) {
    containersSummary.hidden = !isVisible;
  }
}

async function fetchContainers() {
  if (isFetchingContainers) {
    return;
  }

  isFetchingContainers = true;
  setContainerLoading(true, !hasContainerData);
  setContainerWarning(false);

  try {
    const data = await fetchJson(LAB_CONTAINERS_API_URL);
    const containers = Array.isArray(data.containers) ? data.containers : [];

    setContainerError(false);
    setContainerWarning(false);
    setContainerSummary(data);
    renderContainers(containers);
    hasContainerData = true;
    setContainerSummaryVisible(true);
    setContainerEmpty(containers.length === 0);
    setContainerTable(containers.length > 0);
  } catch (error) {
    if (hasContainerData) {
      setContainerWarning(true);
      setContainerError(false);
    } else {
      setContainerError(true);
      setContainerSummaryVisible(false);
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
const relativeTimeInterval = window.setInterval(updateContainerRelativeTime, 1000);

if (containersRefreshButton) {
  containersRefreshButton.addEventListener("click", fetchContainers);
}

if (containersRetryButton) {
  containersRetryButton.addEventListener("click", fetchContainers);
}

window.addEventListener("pagehide", () => {
  window.clearInterval(metricsInterval);
  window.clearInterval(containersInterval);
  window.clearInterval(relativeTimeInterval);
});
