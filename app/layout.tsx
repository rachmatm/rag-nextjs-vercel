import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "RAG Next.js + Vercel — MCP Server",
  description:
    "Model Context Protocol server exposing a curated RAG knowledge base of Next.js + Vercel issues, fixes and patterns.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          margin: 0,
          background: "#0b0b0f",
          color: "#e7e7ea",
        }}
      >
        {children}
      </body>
    </html>
  );
}
