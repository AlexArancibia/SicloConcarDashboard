  
"use client"
import "../globals.css";
 import { Lato } from 'next/font/google';
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuthInitializer } from "@/hooks/useAuthInitializer";
 

const lato = Lato({ 
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
});

 

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useAuthInitializer();
 
  return (
    <html lang="en">
      <body className={lato.className}>
        <ThemeProvider>
 
              <div className="flex-1 bg-background">
              {children} 
              </div>
 
        </ThemeProvider>
      </body>
    </html>
  );
}
