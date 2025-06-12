  
"use client"
import "../globals.css";
 import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuthInitializer } from "@/hooks/useAuthInitializer";
 

const inter = Inter({ subsets: ['latin'] });

 

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useAuthInitializer();
 
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
 
              <div className="flex-1 bg-background">
              {children} 
              </div>
 
        </ThemeProvider>
      </body>
    </html>
  );
}
