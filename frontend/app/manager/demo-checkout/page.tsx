"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function CheckoutPreview() {
  const params = useSearchParams();
  const booking = params.get("booking") ?? "Unknown booking";
  const amount = Number(params.get("amount"));
  return <section className="demo-checkout-card"><span className="section-label">MINDSUPPORT · PAYMENT PREVIEW</span><h1>Payment link preview</h1><p>This is a demonstration checkout for one booking. No payment can be made on this page.</p><dl><div><dt>Booking</dt><dd>{booking}</dd></div><div><dt>Amount</dt><dd>{Number.isFinite(amount) && amount > 0 ? amount.toLocaleString("en-NG", { style: "currency", currency: "NGN" }) : "Not set"}</dd></div></dl><p className="manager-footnote">A live checkout needs a server-created Paystack transaction, signed webhook verification, and an authenticated manager account.</p><Link className="button button-primary" href="/manager">Return to dashboard</Link></section>;
}

export default function DemoCheckoutPage() {
  return <main className="demo-checkout-page"><Suspense fallback={<section className="demo-checkout-card"><p>Loading payment preview…</p></section>}><CheckoutPreview/></Suspense></main>;
}
