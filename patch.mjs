import { readFileSync, writeFileSync } from "fs";
let src = readFileSync("./src/App.tsx", "utf8");

const oldFn = `  function submitInvoice() {
    if (!invoiceForm.customerName.trim()) { notify('Customer name is required.', 'error'); return; }
    const labor = parseFloat(invoiceForm.laborCost) || 0;
    const parts = parseFloat(invoiceForm.partsCost) || 0;
    const total = (labor + parts).toFixed(2);
    const now = new Date().toLocaleString();
    if (editingInvoiceId) {`;

const newFn = `  function submitInvoice() {
    if (!invoiceForm.customerName.trim()) { notify('Customer name is required.', 'error'); return; }
    const labor = parseFloat(invoiceForm.laborCost) || 0;
    const parts = parseFloat(invoiceForm.partsCost) || 0;
    const total = (labor + parts).toFixed(2);
    const now = new Date().toLocaleString();
    const payload = { ticket_id: invoiceForm.ticketId, customer_name: invoiceForm.customerName, customer_email: invoiceForm.customerEmail, customer_phone: invoiceForm.customerPhone, device: invoiceForm.device+' '+invoiceForm.model, fault: invoiceForm.fault, labour_cost: labor, parts_cost: parts, total: parseFloat(total), status: invoiceForm.status, due_date: invoiceForm.dueDate, notes: invoiceForm.notes };
    if (editingInvoiceId) {`;

if (src.includes(oldFn)) {
  src = src.replace(oldFn, newFn);
  // Add backend sync after setEditingInvoiceId(null)
  src = src.replace(
    "setEditingInvoiceId(null); notify('Invoice updated.');",
    "const numId = parseInt(editingInvoiceId.replace('INV-','')) || 0;\n      if (backendOnline) axios.put(`${API}/ai/invoices/${numId}`, payload).catch(()=>{});\n      setEditingInvoiceId(null); notify('Invoice updated.');"
  );
  src = src.replace(
    "notify('Invoice created.');",
    "if (backendOnline) axios.post(`${API}/ai/invoices`, payload).catch(()=>{});\n      notify('Invoice created.');"
  );
  writeFileSync("./src/App.tsx", src, "utf8");
  console.log("PATCHED OK");
} else {
  console.log("NOT FOUND - no match");
}
