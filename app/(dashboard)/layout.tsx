"use client"
import "../globals.css";
 
import { DM_Sans } from 'next/font/google';
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuthInitializer } from "@/hooks/useAuthInitializer";
import { Toaster } from "@/components/ui/toaster";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar";
 
 

const inter = DM_Sans({ subsets: ['latin'] });

 

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
          <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset> 
                      
        
             
              <div className="flex-1 bg-sidebar p-8">
 
  
                {children}
                <Toaster />      
 

              
 
            </div>
            </SidebarInset>
          </SidebarProvider>
 
        </ThemeProvider>
      </body>
    </html>
  );
}

// function StoreInitializer() {
//   useStoreInit()
//   return null
// }