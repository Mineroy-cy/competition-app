import React, { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Target, Clock, Users, User, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={20} /> },
    { name: 'Objectives', path: '/objectives', icon: <Target size={20} /> },
    { name: 'History', path: '/history', icon: <Clock size={20} /> },
    { name: 'Groups', path: '/groups', icon: <Users size={20} /> },
    { name: 'Profile', path: '/profile', icon: <User size={20} /> },
  ];

  return (
    <div className="w-64 border-r border-dark-border bg-dark-card flex flex-col h-screen fixed">
      <div className="p-6">
        <h1 className="text-2xl font-bold gradient-text pb-2 px-2">Competition</h1>
      </div>
      
      <div className="flex-1 px-4 space-y-2 mt-4">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-brand-primary/10 text-brand-primary'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {link.icon}
            <span className="font-medium">{link.name}</span>
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-dark-border">
        <div className="flex items-center space-x-3 p-3">
          <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold uppercase">
            {user?.username?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
            <p className="text-xs text-gray-500 truncate">Streak: {user?.currentStreak || 0} 🔥</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-dark-bg text-gray-100">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-x-hidden p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
