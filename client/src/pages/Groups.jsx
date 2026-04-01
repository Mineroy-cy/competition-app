import React, { useState, useEffect, useMemo, useContext } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Users, UserPlus, Trophy, Info, X, Activity, Copy } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, isAfter, isToday } from 'date-fns';
import { AuthContext } from '../context/AuthContext';

const Groups = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [freezeLoading, setFreezeLoading] = useState(false);

  // Forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');

  // Member Detail View Modal
  const [selectedMemberStats, setSelectedMemberStats] = useState(null);
  const [memberLoading, setMemberLoading] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await axiosInstance.get('/groups');
      setGroups(res.data);
      if (res.data.length > 0 && !selectedGroup) {
        handleSelectGroup(res.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchGroups();
      if (selectedGroup?.group?._id) {
        handleSelectGroup(selectedGroup.group._id);
      }
    }, 20000);

    return () => clearInterval(intervalId);
  }, [selectedGroup?.group?._id]);

  const handleSelectGroup = async (id) => {
    try {
      const res = await axiosInstance.get(`/groups/${id}`);
      setSelectedGroup(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post('/groups', createForm);
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '' });
      await fetchGroups();
      if (res.data._id || res.data.group?._id) {
        handleSelectGroup(res.data._id || res.data.group._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating group');
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post('/groups/join', { inviteCode: joinCode });
      setShowJoinModal(false);
      setJoinCode('');
      await fetchGroups();
      if (res.data._id || res.data.group?._id) {
        handleSelectGroup(res.data._id || res.data.group._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error joining group');
    }
  };

  const handleMemberClick = async (memberId) => {
    if (!selectedGroup) return;
    setMemberLoading(true);
    try {
      const res = await axiosInstance.get(`/groups/${selectedGroup.group._id}/members/${memberId}`);
      setSelectedMemberStats(res.data);
    } catch (err) {
      console.error(err);
      alert('Could not fetch member details');
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRequestFreeze = async () => {
    if (!selectedGroup?.group?._id) return;
    setFreezeLoading(true);
    try {
      await axiosInstance.post(`/groups/${selectedGroup.group._id}/streak-freeze/request`);
      await handleSelectGroup(selectedGroup.group._id);
      await refreshUser?.();
      alert('Streak freeze requested for yesterday. Waiting for group votes.');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not request streak freeze');
    } finally {
      setFreezeLoading(false);
    }
  };

  const handleVoteFreeze = async (freezeId, vote) => {
    if (!selectedGroup?.group?._id) return;
    setFreezeLoading(true);
    try {
      await axiosInstance.post(`/groups/${selectedGroup.group._id}/streak-freeze/${freezeId}/vote`, { vote });
      await handleSelectGroup(selectedGroup.group._id);
      await refreshUser?.();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not submit vote');
    } finally {
      setFreezeLoading(false);
    }
  };

  // Calculate Daily Activity Timeline data for Member (matches Dashboard logic)
  const timelineData = useMemo(() => {
    if (!selectedMemberStats || !selectedMemberStats.goals) return [];
    
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    const today = new Date();
    
    // Flatten all tasks
    const allTasks = selectedMemberStats.goals.flatMap(g => g.tasks || []);
    const totalWeeklyTasks = allTasks.length;

    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(weekStart, i);
      const dayTasks = allTasks.filter(t => t.status === 'completed' && t.completionDate && isSameDay(new Date(t.completionDate), date));
      
      let state = 'upcoming'; 
      if (isAfter(today, date) || isToday(date)) {
        state = dayTasks.length > 0 ? 'active' : 'inactive'; 
      }

      const dailyVolumePercent = totalWeeklyTasks > 0 ? Math.round((dayTasks.length / totalWeeklyTasks) * 100) : 0;

      return {
        date,
        shortDay: format(date, 'EEE'),
        state,
        taskCount: dayTasks.length,
        dailyVolumePercent,
      };
    });
  }, [selectedMemberStats]);


  if (loading) return <div>Loading groups...</div>;

  return (
    <div className="flex flex-col xl:flex-row gap-6 min-h-[calc(100vh-7rem)] md:min-h-[calc(100vh-4rem)]">
      {/* Sidebar / Group List */}
      <div className="w-full xl:w-80 shrink-0 flex flex-col space-y-4">
        <h2 className="text-2xl font-bold text-white mb-2">Your Groups</h2>
        
        <div className="flex space-x-2">
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex-1 py-2 px-3 text-sm flex items-center justify-center space-x-2">
            <Users size={16} /> <span>Create</span>
          </button>
          <button onClick={() => setShowJoinModal(true)} className="btn-secondary flex-1 py-2 px-3 text-sm flex items-center justify-center space-x-2 border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10">
            <UserPlus size={16} /> <span>Join</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mt-4 pr-2 custom-scrollbar">
          {groups.length === 0 ? (
            <p className="text-gray-500 text-sm italic text-center py-4">You haven't joined any groups yet.</p>
          ) : (
             groups.map(group => (
               <div 
                 key={group._id} 
                 onClick={() => handleSelectGroup(group._id)}
                 className={`p-4 rounded-xl cursor-pointer transition-all ${selectedGroup?.group?._id === group._id ? 'border border-brand-primary bg-brand-primary/10' : 'glass-panel hover:bg-white/5'}`}
               >
                 <h4 className="font-bold text-white">{group.name}</h4>
                 <p className="text-xs text-gray-400 mt-1 flex justify-between">
                   <span>{group.members.length} members</span>
                 </p>
               </div>
             ))
          )}
        </div>
      </div>

      {/* Main Group View */}
      <div className="flex-1 glass-panel rounded-2xl p-4 md:p-8 overflow-y-auto relative custom-scrollbar min-h-105">
        {!selectedGroup ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Trophy size={64} className="text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-400">Select or Join a Group</h3>
            <p className="text-gray-500 mt-2">Compete with friends and stay accountable together.</p>
          </div>
        ) : (
          <div>
            <div className="border-b border-dark-border pb-6 mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{selectedGroup.group.name}</h2>
                <p className="text-gray-400">{selectedGroup.group.description}</p>
              </div>
              <div className="bg-dark-bg px-4 py-2 rounded-lg border border-dark-border flex items-center space-x-3">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Invite Code</span>
                <span className="text-xl font-mono text-brand-secondary font-bold tracking-widest">{selectedGroup.group.inviteCode}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(selectedGroup.group.inviteCode);
                    alert('Invite code copied to clipboard!');
                  }} 
                  className="ml-2 text-gray-500 hover:text-white transition-colors p-1"
                  title="Copy Invite Code"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div className="mb-8 p-5 rounded-xl border border-dark-border bg-dark-bg/40">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Streak Freeze</h3>
                  <p className="text-xs text-gray-400">A freeze is approved only when all other members vote yes.</p>
                </div>
                <button
                  onClick={handleRequestFreeze}
                  disabled={freezeLoading}
                  className="btn-secondary text-sm border-brand-secondary/40 text-brand-secondary"
                >
                  Request Freeze For Yesterday
                </button>
              </div>

              {selectedGroup.streakFreezes && selectedGroup.streakFreezes.length > 0 ? (
                <div className="space-y-3">
                  {selectedGroup.streakFreezes
                    .slice()
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 5)
                    .map((freeze) => {
                      const isTargetUser = freeze.targetUser === user?._id;
                      const hasUserVoted = (freeze.votes || []).some((v) => v.user === user?._id);
                      const canVote = freeze.status === 'pending' && !isTargetUser && !hasUserVoted;

                      return (
                        <div key={freeze._id} className="p-3 rounded-lg border border-dark-border bg-dark-bg/60">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm text-gray-300">
                              <span className="font-semibold text-white">{freeze.targetUsername}</span>
                              {' '}requested freeze for{' '}
                              <span className="text-brand-secondary">{format(new Date(freeze.date), 'MMM d')}</span>
                            </p>
                            <span className={`text-xs px-2 py-1 rounded border ${freeze.status === 'approved' ? 'text-brand-accent border-brand-accent/40' : freeze.status === 'rejected' ? 'text-red-400 border-red-400/40' : 'text-yellow-300 border-yellow-300/40'}`}>
                              {freeze.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Votes: {freeze.yesVotes} yes / {freeze.totalEligibleVoters} required
                          </p>

                          {canVote && (
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => handleVoteFreeze(freeze._id, 'yes')}
                                disabled={freezeLoading}
                                className="btn-secondary text-xs border-brand-accent/40 text-brand-accent"
                              >
                                Vote Yes
                              </button>
                              <button
                                onClick={() => handleVoteFreeze(freeze._id, 'no')}
                                disabled={freezeLoading}
                                className="btn-secondary text-xs border-red-400/40 text-red-400"
                              >
                                Vote No
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No streak freeze requests yet.</p>
              )}
            </div>

            <div className="flex items-center space-x-2 text-brand-primary mb-6">
              <Trophy size={20} />
              <h3 className="text-xl font-bold text-white">Leaderboard</h3>
            </div>
            
            <div className="bg-dark-bg/50 rounded-xl border border-dark-border overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-dark-bg border-b border-dark-border text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Member</th>
                    <th className="px-6 py-4 text-center text-brand-accent">Weeks Won</th>
                    <th className="px-6 py-4 text-center text-orange-400">Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {selectedGroup.leaderboard.map((member, idx) => (
                    <tr 
                      key={member._id} 
                      onClick={() => handleMemberClick(member._id)}
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-bold text-gray-400">
                        {idx === 0 ? <span className="text-yellow-400">🥇 1</span> : idx === 1 ? <span className="text-gray-300">🥈 2</span> : idx === 2 ? <span className="text-orange-300">🥉 3</span> : idx + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold">
                            {member.username.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{member.username}</span>
                            <span className="text-[10px] text-brand-secondary uppercase tracking-wider">View Details</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-300">{member.totalCompletedWeeks}</td>
                      <td className="px-6 py-4 text-center font-bold text-gray-300">{member.currentStreak} 🔥</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel p-6 md:p-8 rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Create Arena</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <input type="text" placeholder="Group Name" required value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} className="input-field" />
              <textarea placeholder="Description" value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} className="input-field min-h-24" />
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel p-6 md:p-8 rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Join Arena</h3>
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <input type="text" placeholder="Invite Code (e.g. A1B2C3)" required value={joinCode} onChange={e => setJoinCode(e.target.value)} className="input-field text-center font-mono tracking-widest text-xl uppercase" />
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowJoinModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Join</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEMBER DETAIL VIEW MODAL */}
      {selectedMemberStats && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="glass-panel p-8 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar relative">
            <button 
              onClick={() => setSelectedMemberStats(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
              <div className="w-16 h-16 shrink-0 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-2xl border-2 border-brand-primary/50">
                {selectedMemberStats.user.username.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedMemberStats.user.username}'s Intel</h3>
                <p className="text-sm text-gray-400">Streak: {selectedMemberStats.user.currentStreak} 🔥 • Won Weeks: {selectedMemberStats.user.totalCompletedWeeks}</p>
              </div>
            </div>

            {/* Daily Activity Graph */}
            <div className="bg-dark-bg/50 border border-dark-border p-4 md:p-6 rounded-2xl mb-8 overflow-x-auto">
              <h4 className="text-white font-bold mb-6 flex items-center"><Activity size={18} className="mr-2 text-brand-secondary" /> Daily Activity Graph</h4>
               <div className="flex justify-between items-end relative min-w-160 md:min-w-0">
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-dark-border -translate-y-6 z-0 rounded-full"></div>
                  {timelineData.map((day, idx) => {
                    let nodeColor = "bg-gray-600 border-gray-500 text-gray-400"; 
                    if (day.state === 'active') nodeColor = "bg-brand-accent border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] text-white"; 
                    else if (day.state === 'inactive') nodeColor = "bg-dark-border border-gray-600 text-gray-500"; 
                    else if (day.state === 'upcoming') nodeColor = "bg-blue-900/40 border-blue-500 text-blue-300"; 
                    
                    return (
                      <div key={idx} className="relative z-10 flex flex-col items-center">
                        <div className="h-16 w-6 flex items-end justify-center mb-2 rounded-t-lg overflow-hidden bg-dark-bg/50 border border-dark-border">
                          <div className="w-full bg-brand-secondary" style={{ height: `${day.dailyVolumePercent}%` }}></div>
                        </div>
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-xs ${nodeColor}`}>
                          {day.taskCount > 0 ? day.taskCount : '-'}
                        </div>
                        <p className="mt-2 text-xs font-medium text-gray-400">{day.shortDay}</p>
                      </div>
                    );
                  })}
               </div>
            </div>

            {/* Goals */}
            <h4 className="text-white font-bold mb-4 flex items-center"><Trophy size={18} className="mr-2 text-brand-primary" /> Goal Progress</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedMemberStats.goals.length === 0 ? (
                <p className="text-gray-500 italic col-span-2">This user has no active goals for the week.</p>
              ) : (
                selectedMemberStats.goals.map((goal) => (
                  <div key={goal._id} className="bg-dark-bg/30 border border-dark-border p-4 md:p-5 rounded-xl">
                     <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white">{goal.name}</h4>
                        <span className="text-xs font-bold text-brand-primary border border-dark-border px-2 py-1 rounded bg-dark-bg">{goal.taskCount} Tasks</span>
                     </div>
                     <div className="flex justify-between items-end mb-2 mt-4">
                       <span className="text-xs font-medium text-gray-500">Completed: {goal.completedTaskCount}</span>
                       <span className="text-xl font-bold text-brand-secondary">{goal.progress}%</span>
                     </div>
                     <div className="w-full bg-dark-border rounded-full h-1.5 overflow-hidden">
                       <div 
                         className={`h-1.5 rounded-full ${goal.progress === 100 ? 'bg-brand-accent' : 'bg-brand-secondary'}`}
                         style={{ width: `${goal.progress}%` }}
                       ></div>
                     </div>
                  </div>
                ))
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
