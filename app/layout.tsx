import type { Metadata } from "next";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";
import { DirectionProvider } from "@/components/foundations/direction/direction";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  axes: ["opsz"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-source",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cookbook",
  description: "A private recipe collection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-US"
      dir="ltr"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        {/* Applies the stored theme before first paint so dark-mode visitors never see a flash. */}
        <Script id="boardui-theme" strategy="beforeInteractive">
          {`(function(){try{var dark=localStorage.getItem("boardui:theme")==="dark";document.documentElement.classList.toggle("dark",dark)}catch(e){document.documentElement.classList.remove("dark")}})();`}
        </Script>
        <DirectionProvider locale="en-US">{children}</DirectionProvider>
      </body>
    </html>
  );
}
