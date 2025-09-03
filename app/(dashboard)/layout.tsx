"use client"
import "../globals.css";
 
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuthInitializer } from "@/hooks/useAuthInitializer";
import { Toaster } from "@/components/ui/toaster";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar";
import { DashboardHeader } from "../../components/dashboard-header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useAuthInitializer();
 
  return (
    <html lang="en">
      <body className="font-avenir bg-blue-50/30">
        <ThemeProvider>
          <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <SidebarInset> 
              <DashboardHeader />
              
              <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-h-0 overflow-hidden">
                <div className="h-full overflow-auto bg-background">
                  {children}
                </div>
                <Toaster />      
              </div>
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
