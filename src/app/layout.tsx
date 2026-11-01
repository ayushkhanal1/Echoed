import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Echoed — Discover Shared Human Coincidences",
  description:
    "A privacy-first platform where AI finds others who have lived through the exact same experience as you.",
  icons: {
    icon: "/logo-icon.jpg",
    shortcut: "/logo-icon.jpg",
    apple: "/logo-icon.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('echoed_theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen text-gray-900 dark:text-gray-100 antialiased flex flex-col selection:bg-brand-500 selection:text-white transition-colors duration-200">
        <Navbar />
        <div className="flex-1 pb-24 md:pb-0">{children}</div>
      </body>
    </html>
  );
}
