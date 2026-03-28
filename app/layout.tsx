import Navbar from "@/components/Navbar";
import "./globals.css";
import ClientProvider from "@/components/ClientProvider";
import { Suspense } from "react";
import Loading from "@/components/Loading";
import { RoleProvider } from "@/context/provider";

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
              <Navbar/>
              <div className="h-screen w-screen bg-tertiary grid place-items-center">
                {children}
              </div>
            </RoleProvider>
          </Suspense>
        </ClientProvider>
      </body>
    </html>
  );
}
