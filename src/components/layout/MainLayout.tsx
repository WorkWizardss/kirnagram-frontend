import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { RightSidebar } from "./RightSidebar";
import { BottomNav } from "./BottomNav";

interface MainLayoutProps {
  children: React.ReactNode;
  showRightSidebar?: boolean;
}

export function MainLayout({ children, showRightSidebar = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Subtle pattern overlay */}
      <div className="fixed inset-0 opacity-5 pointer-events-none bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
      
      <div className="flex w-full overflow-x-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-screen w-full lg:ml-64 overflow-x-hidden">
          <Header />
          
          <div className="flex-1 flex gap-6 p-4 lg:p-6 pb-20 lg:pb-6 overflow-x-hidden">
            <main className="flex-1 min-w-0 animate-fade-in w-full overflow-x-hidden">
              {children}
            </main>
            
            {showRightSidebar && (
              <div className="hidden xl:block w-80 shrink-0">
                <div className="sticky top-24">
                  <RightSidebar />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
