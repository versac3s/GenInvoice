document.addEventListener("DOMContentLoaded", () => {
  setInvoiceDate();
  generateInvoiceNumber();
  // Applies the theme saved in local storage.
  applySavedTheme();
  initializeEventListeners();
});

function applySavedTheme() {
  // Retrieve the theme from local storage. Default is "light".
  const savedTheme = window.localStorage?.getItem("theme") || "light";
  const themeToggleBtn = document.getElementById("theme-toggle");
  const moonIcon = document.querySelector(".moon-icon");
  const sunIcon = document.querySelector(".sun-icon");

  if (!themeToggleBtn || !moonIcon || !sunIcon) return;

  // Apply "dark-theme" class to the body based on saved theme.
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
    moonIcon.style.display = "none";
    sunIcon.style.display = "block";
  } else {
    document.body.classList.remove("dark-theme");
    moonIcon.style.display = "block";
    sunIcon.style.display = "none";
  }
}

function initializeEventListeners() {
  const themeToggleBtn = document.getElementById("theme-toggle");
  const moonIcon = document.querySelector(".moon-icon");
  const sunIcon = document.querySelector(".sun-icon");

  // Attach click listener to the theme toggle button.
  if (themeToggleBtn && moonIcon && sunIcon) {
    themeToggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme");

      if (document.body.classList.contains("dark-theme")) {
        if (window.localStorage) {
          window.localStorage.setItem("theme", "dark");
        }
        moonIcon.style.display = "none";
        sunIcon.style.display = "block";
      } else {
        if (window.localStorage) {
          window.localStorage.setItem("theme", "light");
        }
        moonIcon.style.display = "block";
        sunIcon.style.display = "none";
      }
    });
  }

  const currencySelector = document.getElementById("currencySelector");
  if (currencySelector) {
    currencySelector.addEventListener("change", () => {
      const selectedCurrency = currencySelector.value;
      document.querySelectorAll(".currency-symbol").forEach((el) => {
        el.innerText = selectedCurrency;
      });
      updatePreview();
    });
  }

  const taxRateInput = document.getElementById("taxRate");
  if (taxRateInput) {
    taxRateInput.addEventListener("input", updatePreview);
  }

  const addRowBtn = document.getElementById("add-row-btn");
  if (addRowBtn) {
    addRowBtn.addEventListener("click", addNewRow);
  }

  const downloadBtn = document.getElementById("downloadPDF");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", downloadPDF);
  }

  document.addEventListener("input", function (e) {
    if (e.target.closest(".item-table") || e.target.closest(".form-group")) {
      updatePreview();
    }
  });

  document.addEventListener("click", function (e) {
    if (e.target.closest(".delete-btn")) {
      deleteRow(e.target.closest(".delete-btn"));
    }
  });

  bindInitialRows();
  setupFormSync();
  updatePreview();
}

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
    const uniqueId = Date.now();
    invoiceField.value = `INV-${uniqueId}`;
  }
}

function setupFormSync() {
  const syncMappings = [
    ["companyName", "previewCompanyName"],
    ["companyAddress", "previewCompanyAddress"],
    ["companyCity", "previewCompanyCityZip"],
    ["companyPhone", "previewCompanyPhone"],
    ["companyEmail", "previewCompanyEmail"],
    ["companyName", "bottomCompanyName"],
    ["companyPhone", "bottomContactPhone"],
    ["companyEmail", "bottomContactEmail"],
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
    ["invoiceComment", "previewComment"],
  ];

  syncMappings.forEach(([inputId, previewId]) => {
    syncInput(inputId, previewId);
  });
}

function syncInput(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (input && preview) {
    input.addEventListener("input", () => {
      const placeholder = `[${previewId.replace("preview", "").replace("bottom", "")}]`;
      preview.innerText = input.value || placeholder;
    });
  }
}

function bindInitialRows() {
  const initialRows = document.querySelectorAll(".item-table tbody tr");
  initialRows.forEach((row) => {
    bindRowEvents(row);
  });
}

function bindRowEvents(row) {
  const inputs = row.querySelectorAll("input");
  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      calculateRowTotal(row);
      updatePreview();
    });
  });

  const deleteBtn = row.querySelector(".delete-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => deleteRow(deleteBtn));
  }
}

function calculateRowTotal(row) {
  const priceInput = row.querySelector(".unitPrice");
  const qtyInput = row.querySelector(".qty");
  const totalInput = row.querySelector(".total");

  if (!priceInput || !qtyInput || !totalInput) return;

  const price = parseFloat(priceInput.value) || 0;
  const qty = parseFloat(qtyInput.value) || 0;
  const total = price * qty;

  totalInput.value = total > 0 ? total.toFixed(2) : "";
}

function addNewRow() {
  const tableBody = document.querySelector(".item-table tbody");
  const template = document.getElementById("invoice-row-template");

  if (!tableBody || !template) return;

  const clone = template.content.cloneNode(true);
  tableBody.appendChild(clone);

  const newRow = tableBody.lastElementChild;
  bindRowEvents(newRow);
  updatePreview();
}

function deleteRow(button) {
  const row = button.closest("tr");
  const tableBody = row.parentElement;
  const totalRows = tableBody.querySelectorAll("tr").length;

  if (totalRows > 1) {
    row.remove();
    updatePreview();
  }
}

function updatePreview() {
  const previewBody = document.getElementById("itemsPreviewBody");
  const currencySelector = document.getElementById("currencySelector");
  const taxRateInput = document.getElementById("taxRate");

  if (!previewBody || !currencySelector) return;

  const selectedCurrency = currencySelector.value;
  const rows = document.querySelectorAll(".item-table tbody tr");

  previewBody.innerHTML = "";
  let subtotal = 0;

  rows.forEach((row) => {
    const inputs = row.querySelectorAll("input");
    if (inputs.length < 3) return;

    const description = inputs[0].value.trim();
    const unitPrice = parseFloat(inputs[1].value) || 0;
    const quantity = parseInt(inputs[2].value) || 0;
    const total = unitPrice * quantity;

    if (inputs[3]) {
      inputs[3].value = total > 0 ? total.toFixed(2) : "";
    }

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

  const taxRate = taxRateInput ? parseFloat(taxRateInput.value) / 100 : 0.1;
  const tax = subtotal * taxRate;
  const totalDue = subtotal + tax;

  const subtotalEl = document.getElementById("subtotal");
  const taxEl = document.getElementById("tax");
  const totalDueEl = document.getElementById("totalDue");
  const taxLabelEl = document.getElementById("taxLabel");

  if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2);
  if (taxEl) taxEl.textContent = tax.toFixed(2);
  if (totalDueEl) totalDueEl.textContent = totalDue.toFixed(2);
  if (taxLabelEl && taxRateInput) {
    taxLabelEl.textContent = `Tax (${taxRateInput.value}%)`;
  }

  document.querySelectorAll(".currency-symbol").forEach((el) => {
    el.textContent = selectedCurrency;
  });
}

function downloadPDF() {
  updatePreview();

  requestAnimationFrame(() => {
    setTimeout(() => {
      const invoiceBox = document.getElementById("invoiceBox");

      if (!invoiceBox || typeof html2pdf === "undefined") {
        alert("PDF download functionality is not available");
        return;
      }

      const opt = {
        margin: 0.5,
        filename: "invoice.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
        },
        jsPDF: {
          unit: "in",
          format: "a4",
          orientation: "portrait",
        },
      };

      html2pdf().set(opt).from(invoiceBox).save();
    }, 300);
  });
}