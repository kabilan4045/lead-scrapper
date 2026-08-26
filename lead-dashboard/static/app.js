(() => {
  const tbody = document.getElementById("leads-tbody");
  const summaryEl = document.getElementById("summary");
  const emptyState = document.getElementById("empty-state");
  const statusLine = document.getElementById("status-line");
  const toast = document.getElementById("toast");

  const searchInput = document.getElementById("search");
  const statusFilter = document.getElementById("filter-status");
  const assignedFilter = document.getElementById("filter-assigned");
  const cityFilter = document.getElementById("filter-city");
  const refreshBtn = document.getElementById("refresh-btn");

  let leads = [];
  let sortField = "business_name";
  let sortDir = 1;

  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toast.hidden = true; }, 5000);
  }

  async function loadLeads() {
    statusLine.textContent = "Loading…";
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load leads");
      leads = data;
      populateCityFilter();
      renderAll();
      statusLine.textContent = `Loaded ${leads.length} lead(s) — ${new Date().toLocaleTimeString()}`;
    } catch (err) {
      statusLine.textContent = "Failed to load leads.";
      showToast(err.message);
    }
  }

  function populateCityFilter() {
    const current = cityFilter.value;
    const cities = Array.from(new Set(leads.map(l => l.city_area).filter(Boolean))).sort();
    cityFilter.innerHTML = '<option value="">All</option>' + cities.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    if (cities.includes(current)) cityFilter.value = current;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function getFiltered() {
    const q = searchInput.value.trim().toLowerCase();
    const status = statusFilter.value;
    const assigned = assignedFilter.value;
    const city = cityFilter.value;

    return leads.filter(l => {
      if (status && l.status !== status) return false;
      if (assigned && l.assigned_to !== assigned) return false;
      if (city && l.city_area !== city) return false;
      if (q) {
        const name = (l.business_name || "").toLowerCase();
        const phone = (l.phone || "").toLowerCase();
        if (!name.includes(q) && !phone.includes(q)) return false;
      }
      return true;
    });
  }

  function sortRows(rows) {
    const sorted = [...rows];
    sorted.sort((a, b) => {
      let av = a[sortField];
      let bv = b[sortField];
      if (sortField === "deal_value") {
        av = av == null ? -Infinity : av;
        bv = bv == null ? -Infinity : bv;
      } else {
        av = (av ?? "").toString().toLowerCase();
        bv = (bv ?? "").toString().toLowerCase();
      }
      if (av < bv) return -1 * sortDir;
      if (av > bv) return 1 * sortDir;
      return 0;
    });
    return sorted;
  }

  function renderSummary() {
    const total = leads.length;
    const statusCounts = {};
    window.STATUS_OPTIONS.forEach(s => { statusCounts[s] = 0; });
    let totalDealValue = 0;
    leads.forEach(l => {
      if (l.status && statusCounts.hasOwnProperty(l.status)) statusCounts[l.status] += 1;
      if (typeof l.deal_value === "number") totalDealValue += l.deal_value;
    });
    const closedWon = statusCounts["Closed-Won"] || 0;
    const conversionRate = total ? ((closedWon / total) * 100).toFixed(1) : "0.0";

    const cards = [
      { label: "Total Leads", value: total },
      ...window.STATUS_OPTIONS.map(s => ({ label: s, value: statusCounts[s] })),
      { label: "Conversion Rate", value: `${conversionRate}%` },
      { label: "Total Deal Value", value: money.format(totalDealValue) },
    ];

    summaryEl.innerHTML = cards.map(c => `
      <div class="summary-card">
        <div class="value">${c.value}</div>
        <div class="label">${escapeHtml(c.label)}</div>
      </div>
    `).join("");
  }

  function statusOptionsHtml(selected) {
    return window.STATUS_OPTIONS.map(s =>
      `<option value="${s}" ${s === selected ? "selected" : ""}>${s}</option>`
    ).join("");
  }

  function assignedOptionsHtml(selected) {
    const opts = ['<option value="">Unassigned</option>']
      .concat(window.ASSIGNED_TO_OPTIONS.map(a => `<option value="${a}" ${a === selected ? "selected" : ""}>${a}</option>`));
    return opts.join("");
  }

  function renderTable() {
    const rows = sortRows(getFiltered());
    emptyState.hidden = rows.length !== 0;

    tbody.innerHTML = rows.map(l => {
      const websiteCell = l.website
        ? `<a href="${escapeHtml(l.website)}" target="_blank" rel="noopener">${escapeHtml(l.website.replace(/^https?:\/\//, ""))}</a>`
        : '<span class="no-website">No website</span>';
      const dealValue = typeof l.deal_value === "number" ? money.format(l.deal_value) : "—";

      return `
        <tr data-lead-id="${escapeHtml(l.lead_id)}">
          <td>${escapeHtml(l.business_name || "")}</td>
          <td>${escapeHtml(l.phone || "")}</td>
          <td>${escapeHtml(l.city_area || "")}</td>
          <td>${escapeHtml(l.category || "")}</td>
          <td>
            <select data-field="assigned_to">${assignedOptionsHtml(l.assigned_to)}</select>
          </td>
          <td>
            <select data-field="status" class="status-${l.status || ""}">${statusOptionsHtml(l.status)}</select>
          </td>
          <td>
            <input type="date" data-field="follow_up_date" value="${l.follow_up_date || ""}">
          </td>
          <td>${dealValue}</td>
          <td class="website-cell">${websiteCell}</td>
          <td class="notes-cell">
            <input type="text" data-field="notes" value="${escapeHtml(l.notes || "")}">
          </td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll("select[data-field], input[data-field]").forEach(el => {
      const eventName = el.tagName === "INPUT" && el.type === "text" ? "blur" : "change";
      el.addEventListener(eventName, onFieldEdit);
    });
  }

  function renderAll() {
    renderSummary();
    renderTable();
    updateSortIndicators();
  }

  function updateSortIndicators() {
    document.querySelectorAll("th[data-sort]").forEach(th => {
      th.classList.toggle("sorted", th.dataset.sort === sortField);
      th.dataset.arrow = th.dataset.sort === sortField ? (sortDir === 1 ? "▲" : "▼") : "";
    });
  }

  async function onFieldEdit(e) {
    const el = e.target;
    const tr = el.closest("tr");
    const leadId = tr.dataset.leadId;
    const field = el.dataset.field;
    const value = el.value;

    const lead = leads.find(l => String(l.lead_id) === String(leadId));
    const previousValue = lead ? lead[field] ?? "" : "";
    if (String(previousValue) === String(value)) return; // no real change

    el.disabled = true;
    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      Object.assign(lead, data);
      renderSummary();
      if (field === "status" || field === "assigned_to") {
        el.className = field === "status" ? `status-${data.status || ""}` : "";
      }
      statusLine.textContent = `Saved ${lead.business_name} — ${new Date().toLocaleTimeString()}`;
    } catch (err) {
      showToast(`Could not save: ${err.message}`);
      renderTable(); // revert the cell to last-known-good value
    } finally {
      el.disabled = false;
    }
  }

  document.querySelectorAll("th[data-sort]").forEach(th => {
    th.addEventListener("click", () => {
      const field = th.dataset.sort;
      if (sortField === field) {
        sortDir *= -1;
      } else {
        sortField = field;
        sortDir = 1;
      }
      renderTable();
      updateSortIndicators();
    });
  });

  [searchInput, statusFilter, assignedFilter, cityFilter].forEach(el => {
    el.addEventListener("input", renderTable);
    el.addEventListener("change", renderTable);
  });

  refreshBtn.addEventListener("click", loadLeads);

  loadLeads();
})();
