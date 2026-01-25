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
    <div className="min-h-screen bg-background">
      {/* Subtle pattern overlay */}
      <div className="fixed inset-0 opacity-5 pointer-events-none bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
      
      <div className="flex w-full relative">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
          <Header />
          
          <div className="flex-1 flex gap-6 p-4 lg:p-6 pb-24 lg:pb-6">
            <main className="flex-1 min-w-0 animate-fade-in">
              {children}
            </main>
            
            {showRightSidebar && <RightSidebar />}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
