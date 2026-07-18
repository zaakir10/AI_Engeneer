import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "AI SDK Exercise",
  description: "Database chat, movie lookup, and dad jokes tools",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
