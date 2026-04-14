import { useState, useEffect, FormEvent } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Task, Project } from '../types';
import { 
  Plus, 
  MoreVertical, 
  Clock, 
  User as UserIcon,
  Calendar,
  AlertCircle,
  Sparkles,
  Search,
  Filter,
  Trash2,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { aiService } from '../services/aiService';

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', projectId: '', priority: 'medium' as const });
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Filter tasks by assignee or project (for now let's just allow all if authenticated, 
    // but ensure we handle the case where rules might be tighter)
    const tasksQuery = query(collection(db, 'tasks'));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (error) => {
      console.error("Tasks listener error:", error);
    });

    // Projects MUST be filtered to match security rules: (ownerId == uid OR uid in members)
    // Since Firestore doesn't support OR across different fields easily in simple queries without indexes,
    // and the rule is (ownerId == uid || uid in members), we should ideally query both or just owner for now if that's the primary use case.
    // However, the rule is quite specific. Let's try to query where ownerId == userId.
    const projectsQuery = query(collection(db, 'projects'), where('ownerId', '==', userId));
    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    }, (error) => {
      console.error("Projects listener error:", error);
    });

    return () => {
      unsubTasks();
      unsubProjects();
    };
  }, []);

  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.projectId) return;

    await addDoc(collection(db, 'tasks'), {
      ...newTask,
      status: 'todo',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      assigneeId: auth.currentUser?.uid,
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), // Default 3 days
    });

    setNewTask({ title: '', description: '', projectId: '', priority: 'medium' });
    setIsAddingTask(false);
  };

  const updateStatus = async (taskId: string, status: Task['status']) => {
    await updateDoc(doc(db, 'tasks', taskId), {
      status,
      updatedAt: serverTimestamp()
    });
  };

  const deleteTask = async (taskId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
      await deleteDoc(doc(db, 'tasks', taskId));
    }
  };

  const handleAISuggest = async () => {
    if (!newTask.projectId) {
      alert('Vui lòng chọn dự án trước khi sử dụng AI gợi ý.');
      return;
    }
    const project = projects.find(p => p.id === newTask.projectId);
    if (!project) return;

    setIsSuggesting(true);
    try {
      const suggestions = await aiService.suggestTasks(project.description || project.name);
      if (suggestions.length > 0) {
        setNewTask(prev => ({
          ...prev,
          title: suggestions[0].title,
          description: suggestions[0].description
        }));
      }
    } catch (error) {
      console.error('AI Suggestion failed:', error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const columns: { id: Task['status'], label: string, color: string, accent: string }[] = [
    { id: 'todo', label: 'Cần làm', color: 'bg-white/5', accent: 'border-zinc-500' },
    { id: 'in-progress', label: 'Đang làm', color: 'bg-cyber-blue/5', accent: 'border-cyber-blue' },
    { id: 'done', label: 'Hoàn thành', color: 'bg-cyber-lime/5', accent: 'border-cyber-lime' },
  ];

  return (
    <div className="h-full flex flex-col space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-army-dark tracking-tighter uppercase leading-none mb-2">Bảng <span className="text-army-primary">Tác chiến</span></h1>
          <p className="text-zinc-500 font-bold text-lg uppercase tracking-widest">Điều hành và phân phối nhiệm vụ</p>
        </div>
        <button 
          onClick={() => setIsAddingTask(true)}
          className="army-button army-button-primary flex items-center gap-2 group shadow-lg"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Giao nhiệm vụ mới
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-6 army-panel p-3 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Tìm kiếm nhiệm vụ..." className="w-full pl-12 pr-6 py-2.5 bg-zinc-50 border-none rounded-xl text-sm outline-none focus:bg-zinc-100 transition-all" />
        </div>
        <div className="h-8 w-px bg-zinc-100 hidden md:block" />
        <button className="hidden md:flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-army-primary px-4 py-2.5 rounded-xl hover:bg-zinc-50 transition-all uppercase tracking-widest">
          <Filter className="w-4 h-4" />
          Bộ lọc
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 min-h-0 overflow-x-auto pb-6">
        {columns.map((col) => (
          <div key={col.id} className={cn("flex flex-col rounded-[2.5rem] p-6 min-w-[320px] army-panel border-t-4", col.accent)}>
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-3">
                <h3 className="font-black text-army-dark uppercase tracking-widest text-sm">{col.label}</h3>
                <span className="bg-zinc-100 text-army-dark text-[10px] font-black px-3 py-1 rounded-full border border-zinc-200">
                  {tasks.filter(t => t.status === col.id).length}
                </span>
              </div>
              <button className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-400 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              {tasks.filter(t => t.status === col.id).map((task) => (
                <div 
                  key={task.id} 
                  className="army-card !p-6 group hover:border-army-primary transition-all cursor-grab active:cursor-grabbing relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full border",
                      task.priority === 'high' ? "bg-red-50 text-red-700 border-red-100" :
                      task.priority === 'medium' ? "bg-army-gold/10 text-army-dark border-army-gold/20" :
                      "bg-army-primary/10 text-army-primary border-army-primary/20"
                    )}>
                      {task.priority}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="p-2 hover:bg-red-50 text-zinc-400 hover:text-red-600 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-army-dark text-lg mb-2 group-hover:text-army-primary transition-colors">{task.title}</h4>
                  <p className="text-sm text-zinc-500 font-medium line-clamp-2 mb-6 leading-relaxed">{task.description}</p>
                  
                  <div className="flex items-center justify-between pt-5 border-t border-zinc-100">
                    <div className="flex items-center gap-4 text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">3D</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">You</span>
                      </div>
                    </div>
                    <select 
                      value={task.status}
                      onChange={(e) => updateStatus(task.id, e.target.value as Task['status'])}
                      className="text-[10px] font-black uppercase tracking-widest bg-zinc-50 border-none rounded-xl py-1.5 px-3 focus:ring-0 cursor-pointer hover:bg-zinc-100 transition-colors text-zinc-500"
                    >
                      <option value="todo">Cần làm</option>
                      <option value="in-progress">Đang làm</option>
                      <option value="done">Hoàn thành</option>
                    </select>
                  </div>
                </div>
              ))}
              
              {tasks.filter(t => t.status === col.id).length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-zinc-200 rounded-3xl">
                  <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em]">Trống</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 bg-army-dark/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="army-card w-full max-w-xl !p-0 overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl">
            <div className="p-10 bg-army-gradient text-white flex items-center justify-between border-b-4 border-army-gold">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Giao nhiệm vụ</h2>
                <p className="text-[10px] font-bold text-army-gold uppercase tracking-[0.2em] mt-2">Hệ thống điều hành Nexus Army</p>
              </div>
              <button onClick={() => setIsAddingTask(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="p-10 space-y-8 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Dự án mục tiêu</label>
                  <select 
                    required
                    value={newTask.projectId}
                    onChange={(e) => setNewTask({...newTask, projectId: e.target.value})}
                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-army-primary transition-all outline-none text-army-dark"
                  >
                    <option value="">Chọn dự án...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Độ ưu tiên</label>
                  <select 
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-army-primary transition-all outline-none text-army-dark"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tiêu đề nhiệm vụ</label>
                  <button 
                    type="button"
                    onClick={handleAISuggest}
                    disabled={isSuggesting}
                    className="text-[10px] font-black uppercase tracking-widest text-army-primary hover:text-army-dark flex items-center gap-2 bg-army-primary/10 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
                  >
                    <Sparkles className={cn("w-3.5 h-3.5", isSuggesting && "animate-spin")} />
                    {isSuggesting ? "AI Đang xử lý..." : "AI Gợi ý"}
                  </button>
                </div>
                <input 
                  required
                  type="text" 
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Xác định mục tiêu công việc..."
                  className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-5 py-4 text-lg font-bold focus:ring-2 focus:ring-army-primary transition-all outline-none text-army-dark placeholder:text-zinc-300"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Mô tả chi tiết</label>
                <textarea 
                  rows={4}
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Phân tích các bước thực hiện..."
                  className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-army-primary transition-all outline-none text-army-dark placeholder:text-zinc-300 resize-none"
                />
              </div>

              <div className="pt-6 flex gap-6">
                <button 
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="flex-1 px-6 py-4 border-2 border-zinc-100 rounded-2xl font-bold text-zinc-400 hover:bg-zinc-50 transition-all uppercase tracking-widest"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-4 bg-army-primary text-white rounded-2xl font-black uppercase tracking-widest hover:bg-army-dark hover:text-army-gold transition-all shadow-lg active:scale-95"
                >
                  Khởi tạo ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
