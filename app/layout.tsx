import type { Metadata } from "next";
import "./globals.css";
import SimplifiedHeader from "@/components/simplified-header";
import WiseOwlChat from "@/components/WiseOwlChat";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";

const inter = Inter({ subsets: ["latin"] });

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "ShieldNest | Coreum Portfolio Tracker",
  description: "Track your Coreum portfolio, connect multiple wallets, and monitor your assets across the entire ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SimplifiedHeader />
          {children}
          <WiseOwlChat />
        </ThemeProvider>
      </body>
    </html>
  );
}
