"use client";

import { useState } from "react";

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      {label ? (
        <div
          style={{
            fontSize: 12,
            color: "#6c6c78",
            fontFamily: "ui-monospace, monospace",
            marginBottom: 6,
          }}
        >
          {label}
        </div>
      ) : null}
      <button
        onClick={copy}
        aria-label="Copy to clipboard"
        style={{
          position: "absolute",
          top: label ? 30 : 8,
          right: 8,
          background: copied ? "#1f6f43" : "#26262f",
          color: copied ? "#d7f5e3" : "#c9c9d2",
          border: "1px solid #333341",
          borderRadius: 6,
          padding: "3px 10px",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre
        style={{
          background: "#15151c",
          border: "1px solid #26262f",
          borderRadius: 12,
          padding: "16px 18px",
          overflowX: "auto",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 13,
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        {code}
      </pre>
    </div>
  );
}
