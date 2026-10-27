// Sample data — replace with your API response later
const ACTIVITY = [
  { who: "Priya Raman", what: "completed the EPI assessment", when: "12 min ago", tone: "ok" },
  { who: "Meena Lakshmi", what: "was flagged as high risk", when: "1 hr ago", tone: "alert" },
  { who: "Dr. Anitha", what: "added notes to ATH-1038", when: "2 hr ago", tone: "info" },
  { who: "Karthik Subramanian", what: "started the assessment", when: "3 hr ago", tone: "info" },
  { who: "Admin", what: "updated question 4 wording", when: "Yesterday, 5:40 pm", tone: "info" },
  { who: "Arun Prasath", what: "registered a new account", when: "Yesterday, 11:02 am", tone: "ok" },
  { who: "Suresh Kumar", what: "was flagged as high risk", when: "21 Oct, 4:15 pm", tone: "alert" },
];

export default function ActivityPage() {
  return (
    <section className="ad-panel">
      <div className="ad-feed" style={{ padding: "12px 22px" }}>
        <ul className="ad-tl">
          {ACTIVITY.map((a, i) => (
            <li key={i}>
              <span className={`ad-tl-dot ${a.tone}`} />
              <div>
                <div className="ad-tl-text"><strong>{a.who}</strong> {a.what}</div>
                <div className="ad-tl-when">{a.when}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}