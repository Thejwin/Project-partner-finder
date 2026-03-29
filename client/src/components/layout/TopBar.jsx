import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';

export const TopBar = ({ className }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <header className={`bg-white border-b border-surface-200 flex items-center justify-between px-6 ${className || ''}`}>
      <div className="flex items-center gap-4">
        {/* Placeholder for Mobile menu button or breadcrumbs */}
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/notifications')}
          className="relative p-2 text-surface-500 hover:text-surface-900 hover:bg-surface-100 rounded-full transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>

        <div className="h-8 w-px bg-surface-200 mx-2" />

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-surface-900">{user?.username}</span>
            <span className="text-xs text-surface-500 capitalize">{user?.role}</span>
          </div>
          
          <button 
            onClick={logout}
            className="p-2 text-surface-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors ml-2"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
