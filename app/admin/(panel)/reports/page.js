// Sample data — replace with your API response later
const REPORTS = [
  { name: "Monthly assessment summary", period: "October 2026", format: "PDF", size: "1.2 MB", ready: true },
  { name: "High-risk patient follow-ups", period: "Last 7 days", format: "PDF", size: "640 KB", ready: true },
  { name: "Question response analysis", period: "Q3 2026", format: "XLSX", size: "2.4 MB", ready: true },
  { name: "Counsellor workload", period: "October 2026", format: "XLSX", size: "380 KB", ready: false },
];

const DownloadIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 4v11" />
    <path d="M7 11l5 5 5-5" />
    <path d="M5 20h14" />
  </svg>
);

export default function ReportsPage() {
  return (
    <div className="ad-reports">
      {REPORTS.map((r) => (
        <section className="ad-panel ad-report" key={r.name}>
          <div className="ad-file">{r.format}</div>
          <div className="ad-report-info">
            <div className="ad-report-name">{r.name}</div>
            <div className="ad-report-meta">{r.period}, {r.ready ? r.size : "Preparing"}</div>
          </div>
          <button type="button" className="ad-btn" disabled={!r.ready}>
            {DownloadIcon}
            Download
          </button>
        </section>
      ))}
    </div>
  );
}