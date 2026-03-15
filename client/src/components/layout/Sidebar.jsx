import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, MessageSquare, Users, UserCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Sidebar = ({ className }) => {
  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/chat', icon: MessageSquare, label: 'Chat' },
    { to: '/friends', icon: Users, label: 'Friends' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  return (
    <aside className={cn("bg-white border-r border-surface-200 flex flex-col", className)}>
      <div className="h-16 flex items-center px-6 border-b border-surface-200">
        <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
          ProjectConnect
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-primary-50 text-primary-700" 
                : "text-surface-600 hover:bg-surface-100 hover:text-surface-900"
            )}
          >
            <link.icon className="w-5 h-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
