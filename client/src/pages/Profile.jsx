import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Award, Flame, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

const Profile = () => {
  const { user } = useContext(AuthContext);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">My Profile</h2>
        <p className="text-gray-400">Manage your identity and accountability stats.</p>
      </div>

      <div className="glass-panel rounded-2xl p-8 flex items-center space-x-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary blur-[100px] opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10 w-32 h-32 rounded-full bg-linear-to-tr from-brand-primary to-brand-secondary p-1">
          <div className="w-full h-full rounded-full bg-dark-bg flex items-center justify-center text-5xl font-bold text-white uppercase">
            {user.username.charAt(0)}
          </div>
        </div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-2">{user.username}</h1>
          <p className="text-gray-400 flex items-center mb-1"><User size={16} className="mr-2" /> {user.email}</p>
          {user.createdAt && <p className="text-gray-500 text-sm flex items-center"><CalendarDays size={16} className="mr-2" /> Joined {format(new Date(user.createdAt), 'MMMM yyyy')}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-8 text-center flex flex-col items-center">
          <Award size={48} className="text-brand-accent mb-4" />
          <h3 className="text-gray-400 uppercase tracking-widest text-sm mb-1">Total Flawless Weeks</h3>
          <p className="text-5xl font-black text-white">{user.totalCompletedWeeks || 0}</p>
          <p className="text-xs text-gray-500 mt-4">Weeks where all objectives were crushed.</p>
        </div>
        
        <div className="glass-panel rounded-2xl p-8 text-center flex flex-col items-center">
          <Flame size={48} className="text-orange-500 mb-4" />
          <h3 className="text-gray-400 uppercase tracking-widest text-sm mb-1">Current Streak</h3>
          <p className="text-5xl font-black text-white">{user.currentStreak || 0}</p>
          <p className="text-xs text-gray-500 mt-4">Days in a row you completed at least one task for every active goal.</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
