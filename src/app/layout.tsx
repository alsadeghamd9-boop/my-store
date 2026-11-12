import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/alexandria";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "./globals.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ToastProvider from "@/components/ToastProvider";

// Every page shows the shopper's cart and account, so nothing is prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "سوق السودان — من بلدنا ليك",
    template: "%s | سوق السودان",
  },
  description:
    "سوق السودان: اختيارات متنوعة من المنتجات، مع توصيل لجميع ولايات السودان وطرق دفع تناسبك.",
};

export const viewport: Viewport = {
  themeColor: "#21473b",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans antialiased">
        <ToastProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
