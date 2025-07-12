import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react"
import Providers from "./providers"

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage-grotesque",
  display: 'swap', // Optimize font loading
  preload: true,
});

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "MotorMinds",
  description: "AI-Powered Auto Repair Shop Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${bricolageGrotesque.variable} antialiased`}>
        <Providers>
              {children}
        </Providers>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
