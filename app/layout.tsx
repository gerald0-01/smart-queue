import Navbar from "@/components/Navbar";
import "./globals.css";
import ClientProvider from "@/components/ClientProvider";
import { Suspense } from "react";
import Loading from "@/components/Loading";
import { RoleProvider } from "@/context/provider";

export const metadata = {
  title: "Smart Queue — MSU-IIT Document Request",
  description: "Request documents digitally and track your queue status in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientProvider>
          <Suspense fallback={<Loading/>}>
            <RoleProvider>
              {children}
            </RoleProvider>
          </Suspense>
        </ClientProvider>
      </body>
    </html>
  );
}
