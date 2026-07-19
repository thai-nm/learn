import { useState } from "react";
import { CardForm } from "./CardForm";
import { Progress } from "./Progress";
import { ReviewSession } from "./ReviewSession";
import "./App.css";

type View = "review" | "add" | "progress";

const VIEWS: { view: View; label: string }[] = [
  { view: "review", label: "Review" },
  { view: "add", label: "Add Card" },
  { view: "progress", label: "Progress" },
];

function App() {
  const [view, setView] = useState<View>("review");

  return (
    <div className="app">
      <header>
        <h1>WAF &amp; Landing Zones Study</h1>
        <nav>
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
      </header>
      <main>
        {view === "review" && <ReviewSession />}
        {view === "add" && <CardForm />}
        {view === "progress" && <Progress />}
      </main>
    </div>
  );
}

export default App;
