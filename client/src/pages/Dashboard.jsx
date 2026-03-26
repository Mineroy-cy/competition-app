import React, { useState, useEffect, useContext, useMemo } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Target, CheckCircle, Flame, Calendar as CalendarIcon, Activity } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { format, getDay, isAfter, isToday, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedGoalForDay, setSelectedGoalForDay] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.token) {
        setLoading(false);
        navigate('/login', { replace: true });
        return;
      }

      try {
        const res = await axiosInstance.get('/goals');
        setStats(res.data.stats);
        setGoals(res.data.goals);
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user, logout, navigate]);

  // Calculate Daily Activity Timeline data (Monday - Sunday)
  const timelineData = useMemo(() => {
    if (!goals) return [];
    
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    const today = new Date();
    
    // Flatten all tasks
    const allTasks = goals.flatMap(g => g.tasks || []);
    const totalWeeklyTasks = allTasks.length;

    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(weekStart, i);
      const dayTasks = allTasks.filter(t => t.status === 'completed' && t.completionDate && isSameDay(new Date(t.completionDate), date));
      
      let state = 'upcoming'; // blue
      if (isAfter(today, date) || isToday(date)) {
        state = dayTasks.length > 0 ? 'active' : 'inactive'; // green vs grey
      }

      // 4.4 Daily Work Volume Tracking
      const dailyVolumePercent = totalWeeklyTasks > 0 ? Math.round((dayTasks.length / totalWeeklyTasks) * 100) : 0;

      // Group tasks by goal for the detail view
      const goalsWorkedOn = goals.map(g => {
        const tCompletedToday = (g.tasks || []).filter(t => t.status === 'completed' && t.completionDate && isSameDay(new Date(t.completionDate), date));
        if (tCompletedToday.length > 0) return { ...g, completedToday: tCompletedToday };
        return null;
      }).filter(Boolean);

      return {
        date,
        dayName: format(date, 'EEEE'),
        shortDay: format(date, 'EEE'),
        state,
        taskCount: dayTasks.length,
        dailyVolumePercent,
        goalsWorkedOn
      };
    });
  }, [goals]);

  if (loading) return <div className="animate-pulse">Loading dashboard...</div>;

  const handleSelectDay = (day) => {
    if (selectedDay?.date === day.date) {
      setSelectedDay(null);
      setSelectedGoalForDay(null);
    } else {
      setSelectedDay(day);
      setSelectedGoalForDay(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.username}</h2>
          <p className="text-gray-400">Here's your productivity overview for this week.</p>
        </div>
        <div className="glass-panel px-6 py-3 rounded-xl flex items-center space-x-3">
          <Flame size={24} className="text-orange-500" />
          <div>
            <p className="text-xs text-gray-400">Current Streak</p>
            <p className="text-xl font-bold text-white">{user?.currentStreak || 0} Weeks</p>
          </div>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="glass-panel p-6 rounded-2xl glass-panel-hover">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-300">Weekly Progress</h3>
            <Target className="text-brand-primary" size={24} />
          </div>
          <p className="text-4xl font-bold text-white mb-2">{stats?.taskProgress || 0}%</p>
          <div className="w-full bg-dark-border rounded-full h-2">
            <div className="bg-brand-primary h-2 rounded-full" style={{ width: `${stats?.taskProgress || 0}%` }}></div>
          </div>
          <p className="text-sm text-gray-400 mt-3">Tasks Completed: {stats?.completedTasks} / {stats?.totalTasks}</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl glass-panel-hover overflow-hidden relative md:col-span-2">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-brand-accent blur-[60px] opacity-20"></div>
          <div className="flex justify-between items-center mb-4 relative z-10">
            <h3 className="text-lg font-medium text-gray-300">Goal Achievement</h3>
            <CheckCircle className="text-brand-accent" size={24} />
          </div>
          <div className="flex items-center space-x-6 relative z-10">
            <div>
               <p className="text-4xl font-bold text-white mb-2">{stats?.goalProgress || 0}%</p>
               <p className="text-sm text-gray-400">Completed: {stats?.completedGoals} / {stats?.totalGoals}</p>
            </div>
            <div className="flex-1">
              <div className="w-full bg-dark-border rounded-full h-3">
                <div className="bg-brand-accent h-3 rounded-full" style={{ width: `${stats?.goalProgress || 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4.3 Weekly Activity Timeline & 4.4 Daily Work Volume */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center space-x-2 mb-6">
          <CalendarIcon className="text-brand-primary" size={20} />
          <h3 className="text-xl font-bold text-white">Weekly Activity Timeline</h3>
        </div>
        
        <div className="flex justify-between items-end mb-8 relative">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-dark-border -translate-y-6 z-0 rounded-full"></div>
          
          {timelineData.map((day, idx) => {
            const isSelected = selectedDay && selectedDay.date === day.date;
            
            // Color states based on 4.3 requirements
            let nodeColor = "bg-gray-600 border-gray-500 text-gray-400"; // Default upcoming
            if (day.state === 'active') nodeColor = "bg-brand-accent border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] text-white"; // Green
            else if (day.state === 'inactive') nodeColor = "bg-dark-border border-gray-600 text-gray-500"; // Grey
            else if (day.state === 'upcoming') nodeColor = "bg-blue-900/40 border-blue-500 text-blue-300"; // Blue
            
            return (
              <div key={idx} className="relative z-10 flex flex-col items-center group cursor-pointer" onClick={() => handleSelectDay(day)}>
                {/* 4.4 Volume Graph Hint */}
                <div className="h-20 w-8 flex items-end justify-center mb-2 rounded-t-lg overflow-hidden bg-dark-bg/50 border border-dark-border">
                  <div 
                    className="w-full bg-gradient-to-t from-brand-primary to-brand-secondary transition-all duration-500" 
                    style={{ height: `${day.dailyVolumePercent}%` }}
                    title={`Volume: ${day.dailyVolumePercent}%`}
                  ></div>
                </div>
                
                {/* Node */}
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-300 ${nodeColor} ${isSelected ? 'ring-4 ring-white/20 scale-110' : 'hover:scale-110'}`}>
                  {day.taskCount > 0 ? day.taskCount : '-'}
                </div>
                <p className={`mt-3 text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>{day.shortDay}</p>
                <p className="text-xs text-gray-600">{day.dailyVolumePercent}% vol</p>
              </div>
            );
          })}
        </div>
        
        {/* Interaction Flow: Click Day -> Click Goal -> Show Tasks */}
        {selectedDay && (
          <div className="mt-8 bg-dark-bg rounded-xl p-6 border border-dark-border animate-in fade-in slide-in-from-top-4">
            <h4 className="text-lg font-bold text-white mb-4 flex items-center">
              <Activity size={18} className="mr-2 text-brand-secondary" /> 
              {selectedDay.dayName} Activity
            </h4>
            
            {selectedDay.goalsWorkedOn.length === 0 ? (
              <p className="text-gray-500 italic">No tasks were completed on this day.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Goals Worked On</h5>
                  {selectedDay.goalsWorkedOn.map(goal => (
                    <button 
                      key={goal._id} 
                      onClick={() => setSelectedGoalForDay(selectedGoalForDay?._id === goal._id ? null : goal)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${selectedGoalForDay?._id === goal._id ? 'bg-brand-primary/20 border-brand-primary text-white' : 'bg-white/5 border-transparent text-gray-300 hover:bg-white/10'}`}
                    >
                      <div className="font-bold mb-1">{goal.name}</div>
                      <div className="text-xs text-brand-primary font-medium">{goal.completedToday.length} Tasks Completed</div>
                    </button>
                  ))}
                </div>
                
                <div className="bg-dark-card rounded-lg p-5 border border-dark-border">
                  {!selectedGoalForDay ? (
                    <div className="h-full flex items-center justify-center text-gray-500 italic text-sm text-center">
                      Select a goal on the left to view the specific tasks completed on {selectedDay.dayName}.
                    </div>
                  ) : (
                    <div>
                      <h5 className="text-sm font-medium text-brand-secondary uppercase tracking-wider mb-4 border-b border-dark-border pb-2">
                         {selectedGoalForDay.name} &rarr; Completed Tasks
                      </h5>
                      <ul className="space-y-3">
                        {selectedGoalForDay.completedToday.map(task => (
                          <li key={task._id} className="flex flex-col text-sm bg-dark-bg p-3 rounded-lg border border-dark-border">
                            <div className="flex items-start space-x-3 w-full">
                              <CheckCircle size={16} className="text-brand-accent mt-0.5 shrink-0" />
                              <span className="text-gray-200 font-medium">{task.name}</span>
                            </div>
                            
                            {/* Render Proof Details if Available */}
                            <div className="ml-7 mt-2 space-y-2 text-xs">
                              {task.proofSummary && (
                                <p className="text-gray-400"><span className="text-gray-500 mr-1">Summary:</span> {task.proofSummary}</p>
                              )}
                              {task.obstacles && (
                                <p className="text-orange-400/80"><span className="text-gray-500 mr-1">Obstacles:</span> {task.obstacles}</p>
                              )}
                              {task.whatNotDone && (
                                <p className="text-red-400/80"><span className="text-gray-500 mr-1">Missed:</span> {task.whatNotDone}</p>
                              )}
                              {task.completionSatisfaction && (
                                <p className="text-brand-secondary"><span className="text-gray-500 mr-1">Satisfaction:</span> {'★'.repeat(task.completionSatisfaction)}{'☆'.repeat(5 - task.completionSatisfaction)}</p>
                              )}
                              
                              {task.proofImages && task.proofImages.length > 0 && (
                                <div className="flex gap-2 mt-2 pt-2 border-t border-dark-border/50">
                                  {task.proofImages.map((img, i) => (
                                    <a key={i} href={img} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-md h-12 w-12 border border-dark-border hover:border-brand-primary transition-colors">
                                      <img src={img} alt="Proof" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Goal Progress Cards (4.2) */}
      <h3 className="text-xl font-bold text-white mt-8 mb-4">Goal Progress Cards</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => (
           <div key={goal._id} className="glass-panel p-5 rounded-2xl glass-panel-hover">
             <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg text-white">{goal.name}</h4>
                <div className="bg-dark-bg px-2 py-1 rounded text-xs font-bold text-brand-primary border border-dark-border">
                   {goal.taskCount} Tasks
                </div>
             </div>
             <p className="text-sm text-gray-400 mb-6 h-10 overflow-hidden">{goal.description || 'No description'}</p>
             
             <div className="flex justify-between items-end mb-2">
               <span className="text-sm font-medium text-gray-300">Completed: {goal.completedTaskCount}</span>
               <span className="text-2xl font-bold text-brand-secondary">{goal.progress}%</span>
             </div>
             <div className="w-full bg-dark-border rounded-full h-2">
               <div 
                 className={`h-2 rounded-full ${goal.progress === 100 ? 'bg-brand-accent' : 'bg-gradient-to-r from-brand-primary to-brand-secondary'}`}
                 style={{ width: `${goal.progress}%` }}
               ></div>
             </div>
           </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
