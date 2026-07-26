import { useState, type FormEvent } from "react";
import { isValidEmail } from "./identity";

interface EmailGateProps {
  onSubmit: (email: string) => void;
}

export function EmailGate({ onSubmit }: EmailGateProps) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const valid = isValidEmail(email);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    onSubmit(email);
  }

  return (
    <div className="email-gate">
      <div className="empty-dot" />
      <h1 className="empty-heading">Welcome to Recall</h1>
      <p className="empty-subtext">
        Enter your email to find your cards. No password, no sign-up — just how we tell your deck
        apart from everyone else's.
      </p>
      <form className="email-gate-form" onSubmit={handleSubmit}>
        <input
          type="email"
          autoFocus
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
        />
        {touched && !valid && <span className="error">Enter a valid email address.</span>}
        <button type="submit" className="primary" disabled={!email}>
          Continue
        </button>
      </form>
    </div>
  );
}
