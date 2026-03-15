import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const AppShell = () => {
  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      {/* Fixed Sidebar */}
      <Sidebar className="w-64 flex-shrink-0 hidden md:flex" />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar className="h-16 flex-shrink-0" />
        
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
