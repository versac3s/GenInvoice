document.addEventListener("DOMContentLoaded", () => {
  setInvoiceDate();
  generateInvoiceNumber();
});
const currencySelector = document.getElementById("currencySelector");

currencySelector.addEventListener("change", () => {
  const selectedCurrency = currencySelector.value;

  // Update all elements with class 'currency-symbol'
  document.querySelectorAll(".currency-symbol").forEach((el) => {
    el.innerText = selectedCurrency;
  });
});

function setInvoiceDate() {
  const dateField = document.getElementById("invoiceDate");
  if (dateField) {
    const today = new Date().toISOString().split("T")[0];
    dateField.value = today;
  }
}

function generateInvoiceNumber() {
  const invoiceField = document.getElementById("invoiceNumber");
  if (invoiceField) {
    const uniqueId = Date.now(); // Or use UUID or server-provided number
    invoiceField.value = `INV-${uniqueId}`;
  }
}

function syncInput(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (input && preview) {
    input.addEventListener("input", () => {
      preview.innerText =
        input.value || `[${previewId.replace("preview", "")}]`;
    });
  }
}

// Sync Company Info
[
  ["companyName", "previewCompanyName"],
  ["companyAddress", "previewCompanyAddress"],
  ["companyCity", "previewCompanyCityZip"],
  ["companyPhone", "previewCompanyPhone"],
  ["companyEmail", "previewCompanyEmail"],
  ["companyName", "bottomCompanyName"],
  ["companyPhone", "bottomContactPhone"],
  ["companyEmail", "bottomContactEmail"],
].forEach(([inputId, previewId]) => syncInput(inputId, previewId));

// Sync Client Info
[
  ["clientName", "previewClientName"],
  ["clientCompany", "previewClientCompany"],
  ["clientAddress", "previewClientAddress"],
  ["clientCity", "previewClientCityZip"],
  ["clientPhone", "previewClientPhone"],
  ["clientEmail", "previewClientEmail"],
  ["bankName", "previewBankName"],
  ["accountNumber", "previewAccountNumber"],
  ["ifscCode", "previewIFSC"],
  ["accountHolder", "previewAccountHolder"],
].forEach(([inputId, previewId]) => syncInput(inputId, previewId));

[["invoiceComment", "previewComment"]].forEach(([inputId, previewId]) =>
  syncInput(inputId, previewId)
);
function invoiceCalculations(row) {
  const priceInput = row.querySelector(".unitPrice");
  const qtyInput = row.querySelector(".qty");
  const totalInput = row.querySelector(".total");

  function calculateTotal() {
    const price = parseFloat(priceInput.value);
    const qty = parseFloat(qtyInput.value);
    const total = !isNaN(price) && !isNaN(qty) ? price * qty : 0;
    totalInput.value = total ? `${total.toFixed(2)}` : "";
    updateItems();
  }

  priceInput.addEventListener("input", calculateTotal);
  qtyInput.addEventListener("input", calculateTotal);
}

function bindRowEvents(row) {
  row.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", updateItems);
  });

  invoiceCalculations(row);

  const deleteBtn = row.querySelector(".delete-btn");
  const addBtn = row.querySelector(".add-btn");

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => deleteRow(deleteBtn));
  }

  if (addBtn) {
    addBtn.addEventListener("click", addNewRow);
  }
}

function addNewRow() {
  const table = document.querySelector(".item-table tbody");
  const lastRow = document.querySelector(".item-row");
  const newRow = lastRow.cloneNode(true);

  newRow.querySelectorAll("input").forEach((input) => (input.value = ""));
  table.appendChild(newRow);
  bindRowEvents(newRow);
}

function deleteRow(button) {
  const row = button.closest(".item-row");
  const totalRows = document.querySelectorAll(".item-row").length;
  if (totalRows > 1) {
    row.remove();
    updateItems();
  }
}

function updatePreview() {
  const previewBody = document.getElementById("itemsPreviewBody");
  const rows = document.querySelectorAll(".item-table tr");
  const selectedCurrency = document.getElementById("currencySelector").value;
  previewBody.innerHTML = ""; // clear previous preview

  let subtotal = 0;

  rows.forEach((row, index) => {
    if (index === 0) return;

    const inputs = row.querySelectorAll("input");
    if (inputs.length < 3) return;

    const description = inputs[0].value.trim();
    const unitPrice = parseFloat(inputs[1].value) || 0;
    const quantity = parseInt(inputs[2].value) || 0;
    const total = unitPrice * quantity;

    if (!isNaN(total)) inputs[3].value = `${total.toFixed(2)}`;

    if (description !== "" || unitPrice > 0 || quantity > 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${description || "-"}</td>
        <td>${selectedCurrency}${unitPrice.toFixed(2)}</td>
        <td>${quantity}</td>
        <td>${selectedCurrency}${total.toFixed(2)}</td>
      `;
      previewBody.appendChild(tr);
      subtotal += total;
    }
  });

  const taxRateInput = document.getElementById("taxRate");
  const taxRate = taxRateInput ? parseFloat(taxRateInput.value) / 100 : 0.1;
  document.getElementById("taxRate").addEventListener("input", updatePreview);

  const tax = subtotal * taxRate;

  const totalDue = subtotal + tax;

  document.getElementById("subtotal").textContent = `${subtotal.toFixed(2)}`;
  document.getElementById("tax").textContent = `${tax.toFixed(2)}`;
  document.getElementById("totalDue").textContent = `${totalDue.toFixed(2)}`;

  // Update currency symbols in totals section
  document.querySelectorAll(".currency-symbol").forEach((el) => {
    el.textContent = selectedCurrency;
  });
}

// Add input listeners
document.addEventListener("input", function (e) {
  if (e.target.closest(".item-table")) {
    updatePreview();
  }
});

// Handle add row button
document.getElementById("add-row-btn").addEventListener("click", function () {
  const template = document.getElementById("invoice-row-template");
  const clone = template.content.cloneNode(true);
  document.querySelector(".item-table").appendChild(clone);
  updatePreview();
});

// Handle delete row button
document.addEventListener("click", function (e) {
  if (e.target.closest(".delete-btn")) {
    const row = e.target.closest("tr");
    row.remove();
    updatePreview();
  }
});

//Handle download PDF button
document
  .getElementById("downloadPDF")
  .addEventListener("click", async function () {
    updatePreview();

    const loader = document.getElementById("pdfLoader");
    loader.style.display = "flex"; // Show loader

    try {
      const invoiceBox = document.getElementById("invoiceBox");

      const opt = {
        margin: 0.5,
        filename: "invoice.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opt).from(invoiceBox).save();
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Something went wrong while generating the PDF");
    } finally {
      loader.style.display = "none";
    }
  });
