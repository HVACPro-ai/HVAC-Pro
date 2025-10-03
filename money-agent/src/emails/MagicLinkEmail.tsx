import * as React from "react";

export function MagicLinkEmail({ url }: { url: string }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <h2>Sign in to Money Agent</h2>
      <p>Click the link below to sign in:</p>
      <p>
        <a href={url} target="_blank" rel="noreferrer">
          Sign in
        </a>
      </p>
      <p style={{ color: "#6b7280" }}>
        If you did not request this, you can ignore this email.
      </p>
    </div>
  );
}
