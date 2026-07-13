import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import VerificationBanner from "@/components/auth/VerificationBanner";
import GlobalRouteGuard from "@/components/auth/GlobalRouteGuard";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Portrait",
  description: "A premium platform for portrait artists.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <GlobalRouteGuard />
          <VerificationBanner />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
