import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastViewport } from "@/components/ui/ToastViewport";
import "./globals.css";

const fontSans = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontDisplay = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NexusDine POS",
  description: "Mobile-first, offline-resilient restaurant SaaS POS",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FF6B35",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-secondary-900">
        <AuthProvider>
          {children}
          <ToastViewport />
        </AuthProvider>
      </body>
    </html>
  );
}
