const fileInput = document.getElementById("file-input");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const messagesEl = document.getElementById("messages");
const emptyState = document.getElementById("empty-state");
const tableContainer = document.getElementById("table-container");

function addMessage(text, type = "info") {
  const el = document.createElement("div");
  el.className = `message ${type}`;
  el.textContent = text;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function formatValue(value, format) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (format === "integer") {
    return Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  if (format === "percent") {
    return Number(value).toLocaleString("en-US", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }

  if (format === "currency") {
    return Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return String(value);
}

function renderUnitMixTable(unitMix) {
  const columns = unitMix.columns;
  const headerCells = columns.map((col) => `<th>${col.label}</th>`).join("");

  const dataRows = unitMix.rows
    .map((row) => {
      const cells = columns
        .map((col) => `<td>${formatValue(row[col.key], col.format)}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const totals = unitMix.totals;
  const totalsRow = `
    <tr class="totals-row">
      <td class="label-cell">${totals.label}</td>
      <td>${formatValue(totals.units, "integer")}</td>
      <td>${formatValue(totals.occupied, "integer")}</td>
      <td>${formatValue(totals.vacant, "integer")}</td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  `;

  const monthly = unitMix.monthly;
  const monthlyRow = `
    <tr class="summary-row">
      <td class="label-cell"></td>
      <td></td>
      <td></td>
      <td></td>
      <td class="label-cell">${monthly.label}</td>
      <td>${formatValue(monthly.gpr, "currency")}</td>
      <td>${formatValue(monthly.loss_to_lease, "currency")}</td>
      <td>${formatValue(monthly.in_place, "currency")}</td>
      <td>${formatValue(monthly.vacancy, "currency")}</td>
      <td>${formatValue(monthly.net, "currency")}</td>
    </tr>
  `;

  const annually = unitMix.annually;
  const annualRow = `
    <tr class="summary-row">
      <td class="label-cell"></td>
      <td></td>
      <td></td>
      <td></td>
      <td class="label-cell">${annually.label}</td>
      <td>${formatValue(annually.gpr, "currency")}</td>
      <td>${formatValue(annually.loss_to_lease, "currency")}</td>
      <td>${formatValue(annually.in_place, "currency")}</td>
      <td>${formatValue(annually.vacancy, "currency")}</td>
      <td>${formatValue(annually.net, "currency")}</td>
    </tr>
  `;

  tableContainer.innerHTML = `
    <h2 class="unit-mix-title">${unitMix.title}</h2>
    <table class="unit-mix-table">
      <thead>
        <tr>${headerCells}</tr>
      </thead>
      <tbody>
        ${dataRows}
        ${totalsRow}
        ${monthlyRow}
        ${annualRow}
      </tbody>
    </table>
  `;

  emptyState.classList.add("hidden");
  tableContainer.classList.remove("hidden");
}

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  if (!file.name.toLowerCase().endsWith(".xlsx") && !file.name.toLowerCase().endsWith(".xlsm")) {
    addMessage("Only .xlsx files are supported.", "error");
    fileInput.value = "";
    return;
  }

  try {
    addMessage(`Processing ${file.name}...`);
    const unitMix = await calculateUnitMixFromFile(file);
    renderUnitMixTable(unitMix);
    addMessage(`Parsed ${file.name}`, "success");
  } catch (error) {
    addMessage(error.message || "Could not read the Excel file.", "error");
  } finally {
    fileInput.value = "";
  }
});

function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) {
    return;
  }

  addMessage(`You: ${message}`);
  addMessage(`Received: ${message}`);
  chatInput.value = "";
}

sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});
