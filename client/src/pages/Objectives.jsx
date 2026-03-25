import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Plus, Check, Image as ImageIcon, Briefcase, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const Objectives = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState({ show: false, goalId: null });
  const [showCompleteModal, setShowCompleteModal] = useState({ show: false, taskId: null });
  const [showProofModal, setShowProofModal] = useState({ show: false, task: null });
  
  // Form states
  const [goalForm, setGoalForm] = useState({ name: '', description: '' });
  const [taskForm, setTaskForm] = useState({ name: '', description: '' });
  const [proofImage, setProofImage] = useState(null);
  const [suggestion, setSuggestion] = useState('');
  const [fetchingSuggestion, setFetchingSuggestion] = useState(false);
  const [proofForm, setProofForm] = useState({
    proofSummary: '',
    completionSatisfaction: '3',
    obstacles: '',
    whatNotDone: ''
  });

  const fetchGoals = async () => {
    try {
      const res = await axiosInstance.get('/goals');
      setGoals(res.data.goals);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/goals', goalForm);
      setGoalForm({ name: '', description: '' });
      setShowGoalModal(false);
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSuggestion = async (goalId) => {
    setFetchingSuggestion(true);
    setSuggestion('');
    try {
      const res = await axiosInstance.get(`/tasks/suggestions/${goalId}`);
      if (res.data.suggestion) {
        setSuggestion(res.data.suggestion);
      }
    } catch (err) {
      console.error("Failed to fetch suggestion", err);
    } finally {
      setFetchingSuggestion(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/tasks', { ...taskForm, goalId: showTaskModal.goalId });
      setTaskForm({ name: '', description: '' });
      setShowTaskModal({ show: false, goalId: null });
      setSuggestion('');
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteTask = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (proofImage) formData.append('proof', proofImage);
    else formData.append('mockImages', 'https://placehold.co/300x300?text=Mock+Upload'); // Failsafe mockup
    
    formData.append('proofSummary', proofForm.proofSummary);
    formData.append('completionSatisfaction', proofForm.completionSatisfaction);
    formData.append('obstacles', proofForm.obstacles);
    formData.append('whatNotDone', proofForm.whatNotDone);

    try {
      await axiosInstance.put(`/tasks/${showCompleteModal.taskId}/complete`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setShowCompleteModal({ show: false, taskId: null });
      setProofImage(null);
      setProofForm({ proofSummary: '', completionSatisfaction: '3', obstacles: '', whatNotDone: '' });
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualCompleteWeek = async () => {
    if (window.confirm("Completing the week will lock all goals and tasks. You will not be able to modify anything. Continue?")) {
      try {
        await axiosInstance.post('/weeks/complete');
        fetchGoals(); // Should be empty now
        alert("Week archived successfully.");
      } catch (err) {
        alert(err.response?.data?.message || 'Error archiving week');
      }
    }
  };

  if (loading) return <div>Loading objectives...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Weekly Objectives</h2>
          <p className="text-gray-400">Plan your week and execute intensely.</p>
        </div>
        <div className="flex space-x-4">
          <button onClick={() => setShowGoalModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus size={18} /> <span>New Goal</span>
          </button>
          <button onClick={handleManualCompleteWeek} className="btn-secondary flex items-center space-x-2 text-brand-secondary border-brand-secondary/50">
            <Briefcase size={18} /> <span>Complete Week</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {goals.map(goal => (
          <div key={goal._id} className="glass-panel p-6 rounded-2xl">
            <div className="flex justify-between items-start mb-6 border-b border-dark-border pb-4">
              <div>
                <h3 className="text-2xl font-bold text-white">{goal.name}</h3>
                <p className="text-gray-400 mt-1">{goal.description}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-brand-secondary">{goal.progress}%</span>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Completed</p>
              </div>
            </div>

            <div className="space-y-3">
              {goal.tasks && goal.tasks.length > 0 ? (
                goal.tasks.map(task => (
                  <div key={task._id} className={`p-4 rounded-xl flex items-center justify-between border ${task.status === 'completed' ? 'bg-brand-accent/5 border-brand-accent/20' : 'bg-white/5 border-transparent'}`}>
                    <div>
                      <h4 className={`font-medium ${task.status === 'completed' ? 'text-gray-300 line-through' : 'text-white'}`}>{task.name}</h4>
                      {task.status === 'completed' && <p className="text-xs text-brand-accent mt-1">Completed {format(new Date(task.completionDate), 'MMM d, p')}</p>}
                    </div>
                    {task.status === 'pending' ? (
                      <button 
                        onClick={() => setShowCompleteModal({ show: true, taskId: task._id })}
                        className="btn-secondary py-1.5 px-3 text-sm flex items-center space-x-1"
                      >
                        <Check size={16} /> <span>Submit Proof</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => setShowProofModal({ show: true, task })}
                        className="flex items-center space-x-2 text-brand-accent hover:text-white transition-colors"
                      >
                        <CheckCircle size={20} />
                        <span className="text-sm font-medium">Verified</span>
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic text-sm py-2">No tasks created yet.</p>
              )}
            </div>
            
            <button 
              onClick={() => {
                setShowTaskModal({ show: true, goalId: goal._id });
                fetchSuggestion(goal._id);
              }}
              className="mt-4 text-brand-primary text-sm font-medium flex items-center space-x-1 hover:text-white transition-colors"
            >
              <Plus size={16} /> <span>Add Task</span>
            </button>
          </div>
        ))}
        {goals.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-dark-border rounded-2xl">
            <p className="text-gray-400 mb-4">You haven't planned any goals for this week.</p>
            <button onClick={() => setShowGoalModal(true)} className="btn-primary">Create Your First Goal</button>
          </div>
        )}
      </div>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel p-8 rounded-2xl w-full max-w-md">
            <h3 className="text-2xl font-bold text-white mb-6">Create Goal</h3>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <input type="text" placeholder="Goal Name" required value={goalForm.name} onChange={e => setGoalForm({...goalForm, name: e.target.value})} className="input-field" />
              <textarea placeholder="Description" value={goalForm.description} onChange={e => setGoalForm({...goalForm, description: e.target.value})} className="input-field min-h-24" />
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowGoalModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel p-8 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col">
            <h3 className="text-2xl font-bold text-white mb-6 shrink-0">Add Task</h3>
            
            <div className="overflow-y-auto pr-2 flex-1 custom-scrollbar">
              {fetchingSuggestion && <p className="text-brand-secondary text-sm mb-4 animate-pulse">Generating AI suggestions based on past obstacles...</p>}
              {suggestion && !fetchingSuggestion && (
                <div className="mb-6 p-4 bg-brand-secondary/10 border border-brand-secondary/30 rounded-xl relative">
                  <h4 className="text-brand-secondary font-medium text-sm flex items-center gap-2 mb-2">
                    <span className="text-lg">✨</span> AI Smart Suggestion
                  </h4>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{suggestion}</p>
                  <button 
                    type="button"
                    onClick={() => setTaskForm({...taskForm, description: (taskForm.description ? taskForm.description + '\n\n' : '') + 'AI Insight: ' + suggestion})}
                    className="mt-3 text-xs text-brand-secondary hover:text-white transition-colors inline-block"
                  >
                    + Append insight to description
                  </button>
                </div>
              )}

              <form onSubmit={handleAddTask} className="space-y-4">
                <input type="text" placeholder="Task Name" required value={taskForm.name} onChange={e => setTaskForm({...taskForm, name: e.target.value})} className="input-field" />
                <textarea placeholder="Description" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} className="input-field min-h-24" />
                <div className="flex justify-end space-x-3 pt-4 border-t border-dark-border mt-6">
                  <button type="button" onClick={() => { setShowTaskModal({ show: false, goalId: null }); setSuggestion(''); }} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Add Task</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      {showCompleteModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel p-8 rounded-2xl w-full max-w-md">
            <h3 className="text-2xl font-bold text-white mb-2">Submit Proof</h3>
            <p className="text-sm text-gray-400 mb-6">Upload visual proof to verify task completion.</p>
            <form onSubmit={handleCompleteTask} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
               <div className="border-2 border-dashed border-dark-border rounded-xl p-8 text-center bg-dark-bg cursor-pointer hover:border-brand-primary transition-colors">
                 <input 
                   type="file" 
                   onChange={(e) => setProofImage(e.target.files[0])} 
                   className="hidden" 
                   id="proof-upload"
                   accept="image/*"
                 />
                 <label htmlFor="proof-upload" className="cursor-pointer flex flex-col items-center">
                   <ImageIcon size={32} className="text-gray-400 mb-3" />
                   <span className="text-white font-medium">{proofImage ? proofImage.name : 'Click to select image'}</span>
                   {!proofImage && <span className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</span>}
                 </label>
               </div>
               
               <textarea 
                  placeholder="Summary of what was achieved (Optional)" 
                  value={proofForm.proofSummary} 
                  onChange={e => setProofForm({...proofForm, proofSummary: e.target.value})} 
                  className="input-field min-h-20" 
               />
               <textarea 
                  placeholder="What obstacles did you face? (Optional)" 
                  value={proofForm.obstacles} 
                  onChange={e => setProofForm({...proofForm, obstacles: e.target.value})} 
                  className="input-field min-h-20" 
               />
               <textarea 
                  placeholder="What wasn't done? (Optional)" 
                  value={proofForm.whatNotDone} 
                  onChange={e => setProofForm({...proofForm, whatNotDone: e.target.value})} 
                  className="input-field min-h-20" 
               />
               
               <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">Completion Satisfaction (1-5)</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    value={proofForm.completionSatisfaction}
                    onChange={e => setProofForm({...proofForm, completionSatisfaction: e.target.value})}
                    className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                    <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                  </div>
               </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-dark-border mt-6">
                <button type="button" onClick={() => setShowCompleteModal({ show: false, taskId: null })} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary flex items-center space-x-2">
                   <Check size={16} /> <span>Submit & Complete</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Proof Viewer Modal */}
      {showProofModal.show && showProofModal.task && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel p-8 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
               <h3 className="text-2xl font-bold text-white">Task Proof</h3>
               <div className="flex items-center space-x-2 text-brand-accent">
                 <CheckCircle size={20} />
                 <span className="text-sm font-medium">Verified</span>
               </div>
            </div>
            
            <div className="overflow-y-auto pr-2 flex-1 custom-scrollbar space-y-4">
               <div>
                 <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-1">Task</h4>
                 <p className="text-white font-medium text-lg">{showProofModal.task.name}</p>
                 {showProofModal.task.completionDate && (
                    <p className="text-xs text-brand-secondary mt-1 border border-brand-secondary/30 bg-brand-secondary/10 inline-block px-2 py-1 rounded">
                      Completed {format(new Date(showProofModal.task.completionDate), 'PPP')}
                    </p>
                 )}
               </div>

               {showProofModal.task.proofImages && showProofModal.task.proofImages.length > 0 && (
                 <div>
                   <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Attached Evidence</h4>
                   <div className="grid grid-cols-2 gap-2">
                     {showProofModal.task.proofImages.map((img, i) => (
                       <a key={i} href={img} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg border border-dark-border hover:border-brand-primary transition-colors aspect-video">
                         <img src={img} alt="Proof" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-duration-300 group-hover:scale-105" />
                       </a>
                     ))}
                   </div>
                 </div>
               )}

               {(showProofModal.task.proofSummary || showProofModal.task.obstacles || showProofModal.task.whatNotDone || showProofModal.task.completionSatisfaction) && (
                 <div className="bg-dark-bg p-4 rounded-xl border border-dark-border space-y-3">
                    <h4 className="text-brand-primary font-medium text-sm border-b border-dark-border pb-2">Feedback Summary</h4>
                    
                    {showProofModal.task.completionSatisfaction && (
                       <p className="text-sm"><span className="text-gray-500 mr-2">Satisfaction:</span> <span className="text-brand-secondary tracking-widest text-base">{'★'.repeat(showProofModal.task.completionSatisfaction)}{'☆'.repeat(5 - showProofModal.task.completionSatisfaction)}</span></p>
                    )}
                    {showProofModal.task.proofSummary && (
                       <p className="text-sm text-gray-300"><span className="text-gray-500 block mb-0.5 text-xs">Summary:</span> {showProofModal.task.proofSummary}</p>
                    )}
                    {showProofModal.task.obstacles && (
                       <p className="text-sm text-orange-200/90"><span className="text-orange-500/50 block mb-0.5 text-xs">Obstacles:</span> {showProofModal.task.obstacles}</p>
                    )}
                    {showProofModal.task.whatNotDone && (
                       <p className="text-sm text-red-200/90"><span className="text-red-500/50 block mb-0.5 text-xs">Missed:</span> {showProofModal.task.whatNotDone}</p>
                    )}
                 </div>
               )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-dark-border mt-6 shrink-0">
               <button onClick={() => setShowProofModal({ show: false, task: null })} className="btn-secondary w-full">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Objectives;
