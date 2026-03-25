import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Download, Calendar, Activity } from 'lucide-react';
import { format } from 'date-fns';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axiosInstance.get('/weeks');
        setHistory(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleDownload = async (id, weekNumber) => {
    try {
      const res = await axiosInstance.get(`/weeks/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Week_${weekNumber}_Report.csv`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  if (loading) return <div>Loading history...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Architectural Archive</h2>
        <p className="text-gray-400">Review your past performance and consistency.</p>
      </div>

      <div className="space-y-6">
        {history.length === 0 ? (
          <div className="glass-panel p-10 text-center rounded-2xl">
            <Activity className="text-gray-500 mx-auto mb-4" size={48} />
            <h3 className="text-xl text-white font-medium mb-2">No history yet</h3>
            <p className="text-gray-400">Complete your first week to see your archival data here.</p>
          </div>
        ) : (
          history.map((record) => (
            <div key={record._id} className="glass-panel rounded-2xl overflow-hidden glass-panel-hover group">
              <div className="bg-brand-primary/10 border-b border-dark-border p-6 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 drop-shadow-[0_0_15px_rgba(139,92,246,1)]">
                   <h1 className="text-8xl font-black italic">W{record.weekNumber}</h1>
                </div>
                <div className="relative z-10 flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-primary/20 flex items-center justify-center text-brand-primary">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Week {record.weekNumber}</h3>
                    <p className="text-sm text-brand-primary">
                      {format(new Date(record.startDate), 'MMM d, yyyy')} - {format(new Date(record.endDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="relative z-10 hidden group-hover:block">
                  <button 
                    onClick={() => handleDownload(record._id, record.weekNumber)} 
                    className="btn-secondary flex items-center space-x-2 border-brand-primary/30 text-brand-primary hover:bg-brand-primary hover:text-white"
                  >
                    <Download size={16} /> <span>CSV Report</span>
                  </button>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-dark-bg rounded-xl">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Goal Completion</p>
                  <p className="text-2xl font-bold text-white">{record.totalGoals > 0 ? Math.round((record.completedGoals/record.totalGoals)*100) : 0}%</p>
                </div>
                <div className="text-center p-4 bg-dark-bg rounded-xl">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Task Completion</p>
                  <p className="text-2xl font-bold text-white">{record.totalTasks > 0 ? Math.round((record.completedTasks/record.totalTasks)*100) : 0}%</p>
                </div>
                <div className="text-center p-4 bg-dark-bg rounded-xl">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Goals Finished</p>
                  <p className="text-2xl font-bold text-brand-accent">{record.completedGoals} <span className="text-sm text-gray-500">/ {record.totalGoals}</span></p>
                </div>
                <div className="text-center p-4 bg-dark-bg rounded-xl">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Tasks Finished</p>
                  <p className="text-2xl font-bold text-brand-secondary">{record.completedTasks} <span className="text-sm text-gray-500">/ {record.totalTasks}</span></p>
                </div>
              </div>
              
              <div className="px-6 pb-6 pt-0">
                <button 
                  onClick={() => setExpandedWeek(expandedWeek === record._id ? null : record._id)}
                  className="w-full py-2 bg-dark-bg border border-dark-border text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
                >
                  {expandedWeek === record._id ? 'Hide Details' : 'View Logged Tasks & Proofs'}
                </button>
              </div>

              {expandedWeek === record._id && record.snapshot && (
                <div className="p-6 pt-0 border-t border-dark-border/50 bg-dark-bg/50 animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-lg font-bold text-white mb-4">Week {record.weekNumber} Execution Details</h4>
                  {record.snapshot.length === 0 ? (
                    <p className="text-gray-500 italic text-sm">No goals were recorded in this snapshot.</p>
                  ) : (
                    <div className="space-y-6">
                      {record.snapshot.map((goal, gIdx) => (
                        <div key={goal._id || gIdx} className="bg-dark-card border border-dark-border rounded-xl p-5">
                           <h5 className="font-bold text-brand-primary mb-3 text-lg border-b border-dark-border pb-2 inline-block">{goal.name}</h5>
                           {goal.tasks && goal.tasks.length > 0 ? (
                             <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {goal.tasks.map((task, tIdx) => (
                                 <li key={task._id || tIdx} className={`p-4 rounded-lg border ${task.status === 'completed' ? 'bg-brand-accent/5 border-brand-accent/20' : 'bg-dark-bg border-dark-border'}`}>
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <p className={`font-medium ${task.status === 'completed' ? 'text-white' : 'text-gray-400'}`}>{task.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">Status: <span className={task.status === 'completed' ? 'text-brand-accent' : 'text-gray-500'}>{task.status.toUpperCase()}</span></p>
                                      </div>
                                    </div>
                                    
                                    {task.status === 'completed' && (
                                      <div className="mt-3 pt-3 border-t border-dark-border/50 text-xs space-y-2">
                                        {task.proofSummary && <p className="text-gray-300"><span className="text-gray-500 mr-1">Summary:</span> {task.proofSummary}</p>}
                                        {task.obstacles && <p className="text-orange-300/80"><span className="text-orange-500/50 mr-1">Obstacles:</span> {task.obstacles}</p>}
                                        {task.whatNotDone && <p className="text-red-300/80"><span className="text-red-500/50 mr-1">Missed:</span> {task.whatNotDone}</p>}
                                        {task.completionSatisfaction && <p className="text-brand-secondary"><span className="text-gray-500 mr-1">Rating:</span> {'★'.repeat(task.completionSatisfaction)}{'☆'.repeat(5 - task.completionSatisfaction)}</p>}
                                        
                                        {task.proofImages && task.proofImages.length > 0 && (
                                          <div className="flex gap-2 mt-2 pt-2">
                                            {task.proofImages.map((img, i) => (
                                              <a key={i} href={img} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-md h-12 w-16 border border-dark-border hover:border-brand-primary transition-colors">
                                                <img src={img} alt="Proof" className="object-cover w-full h-full opacity-80 group-hover:opacity-100" />
                                              </a>
                                            ))}
                                          </div>
                                        )}
                                        {(!task.proofImages || task.proofImages.length === 0) && !task.proofSummary && !task.obstacles && !task.whatNotDone && !task.completionSatisfaction && (
                                          <p className="text-gray-500 italic">No feedback or proof images provided.</p>
                                        )}
                                      </div>
                                    )}
                                 </li>
                               ))}
                             </ul>
                           ) : (
                             <p className="text-gray-500 text-sm italic">No tasks created for this goal.</p>
                           )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;
