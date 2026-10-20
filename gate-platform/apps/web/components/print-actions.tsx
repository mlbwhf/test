"use client";

export function PrintCertificate() {
  return (
    <button type="button" className="cert-btn cert-btn-primary" onClick={() => window.print()}>
      Download PDF
    </button>
  );
}
