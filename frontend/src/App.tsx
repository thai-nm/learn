import { useEffect, useState } from "react";
import { CardForm } from "./CardForm";
import { EmailGate } from "./EmailGate";
import { clearStoredEmail, getStoredEmail, setStoredEmail } from "./identity";
import { Progress } from "./Progress";
import { ReviewSession } from "./ReviewSession";
import "./App.css";

type View = "review" | "add" | "progress";

const VIEWS: { view: View; label: string }[] = [
  { view: "review", label: "Review" },
  { view: "add", label: "Add Card" },
  { view: "progress", label: "Progress" },
];

function prefersDark(): boolean {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function App() {
  const [email, setEmail] = useState(getStoredEmail);
  const [view, setView] = useState<View>("review");
  const [dark, setDark] = useState(prefersDark);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  if (!email) {
    return (
      <div className="app">
        <main className="app-main center">
          <EmailGate
            onSubmit={(newEmail) => {
              setStoredEmail(newEmail);
              setEmail(getStoredEmail());
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">Recall</div>
        <nav className="app-nav">
          {VIEWS.map(({ view: v, label }) => (
            <button
              key={v}
              type="button"
              className={v === view ? "active" : ""}
              onClick={() => setView(v)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="app-identity">
          <button
            type="button"
            className="switch-email"
            onClick={() => {
              clearStoredEmail();
              setEmail(null);
            }}
          >
            {email}
          </button>
          <button
            type="button"
            className="theme-toggle"
            aria-label="Toggle theme"
            onClick={() => setDark((d) => !d)}
          >
            <span className="theme-toggle-dot" />
          </button>
        </div>
      </header>
      <main className={`app-main${view === "review" ? " center" : ""}`}>
        {view === "review" && <ReviewSession />}
        {view === "add" && <CardForm />}
        {view === "progress" && <Progress />}
      </main>
    </div>
  );
}

export default App;
