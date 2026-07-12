import { readFileSync, writeFileSync } from "fs";
let src = readFileSync("./src/App.tsx", "utf8");

// Add sendToStripe function after deleteInvoice
src = src.replace(
  `  function updateInvoiceStatus(id: string, status: Invoice['status']) {`,
  `  async function sendToStripeCheckout(inv: Invoice) {
    const amount = parseFloat(inv.totalCost.replace('€','')) || 0;
    if (amount <= 0) { notify('Invoice total must be greater than 0','error'); return; }
    try {
      const res = await axios.post(\`\${API}/ai/payments/create-checkout\`, {
        amount,
        currency: 'eur',
        customer_name: inv.customerName,
        customer_email: inv.customerEmail,
        invoice_id: inv.id,
        description: inv.fault || 'Electronics repair service'
      });
      if (res.data.checkout_url) {
        window.open(res.data.checkout_url, '_blank');
        notify('Stripe checkout opened!', 'success');
      }
    } catch(e: any) {
      notify(e?.response?.data?.detail ?? 'Stripe checkout failed','error');
    }
  }

  function updateInvoiceStatus(id: string, status: Invoice['status']) {`
);

// Add Stripe button to invoice table actions
src = src.replace(
  `                            {inv.status==='Draft'&&<button className='btn-sm' onClick={()=>updateInvoiceStatus(inv.id,'Sent')}>Send</button>}
                            <button className='btn-sm gray' onClick={()=>downloadInvoicePDF(inv)}>PDF</button>`,
  `                            {inv.status==='Draft'&&<button className='btn-sm' onClick={()=>updateInvoiceStatus(inv.id,'Sent')}>Send</button>}
                            {inv.status!=='Paid'&&<button className='btn-sm' style={{background:'#6366f1',color:'#fff'}} onClick={()=>sendToStripeCheckout(inv)}>💳 Pay</button>}
                            <button className='btn-sm gray' onClick={()=>downloadInvoicePDF(inv)}>PDF</button>`
);

writeFileSync("./src/App.tsx", src, "utf8");
console.log("Stripe checkout button added OK");
