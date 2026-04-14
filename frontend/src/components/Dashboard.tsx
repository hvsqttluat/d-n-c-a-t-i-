import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Task, Project } from '../types';
import { 
  Users, 
  Shield, 
  CheckCircle, 
  Folder,
  ArrowUpRight,
  Plus,
  Briefcase,
  Volume2,
  Power,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useVoice } from '../hooks/useVoice';
import { systemApi } from '../lib/api';

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSystemActive, setIsSystemActive] = useState(false);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const { speak } = useVoice();

  const activateSystem = useCallback(() => {
    setIsSystemActive(true);
    speak("Xin chào thủ trưởng, chúc thủ trưởng ngày mới tốt lành. Khi cần hãy gọi tôi, tôi luôn ở đây chờ để nhận lệnh!");
  }, [speak]);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await systemApi.getHealth();
        setSystemHealth(res.data);
      } catch (error) {
        console.error('Lỗi tải sức khỏe hệ thống:', error);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Cập nhật mỗi 30s

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const tasksQuery = query(collection(db, 'tasks'), limit(10));
    const projectsQuery = query(collection(db, 'projects'), where('ownerId', '==', userId));

    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
      setLoading(false);
    }, (error) => {
      console.error("Dashboard tasks listener error:", error);
      setLoading(false);
    });

    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    }, (error) => {
      console.error("Dashboard projects listener error:", error);
    });

    return () => {
      unsubTasks();
      unsubProjects();
      clearInterval(interval);
    };
  }, []);

  const stats = [
    { label: 'Quân số đơn vị', value: '128', icon: Users, color: 'bg-army-primary' },
    { label: 'Lệnh đã xử lý', value: systemHealth?.totalCommandsProcessed || '0', icon: Activity, color: 'bg-army-gold' },
    { label: 'Nhiệm vụ xong', value: tasks.filter(t => t.status === 'done').length, icon: CheckCircle, color: 'bg-army-light' },
    { label: 'Dự án mở', value: projects.length, icon: Folder, color: 'bg-army-dark' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-army-dark tracking-tighter uppercase leading-none mb-2">Tổng quan <span className="text-army-primary">Hệ thống</span></h1>
          <p className="text-zinc-500 font-bold text-lg uppercase tracking-widest">Báo cáo tình hình quân số & công việc</p>
        </div>
        <div className="flex items-center gap-4">
          {!isSystemActive ? (
            <button 
              onClick={activateSystem}
              className="flex items-center gap-3 bg-army-gold px-6 py-3 rounded-2xl border-2 border-white shadow-lg text-army-dark font-black uppercase tracking-widest hover:bg-army-dark hover:text-army-gold transition-all animate-bounce"
            >
              <Power className="w-5 h-5" />
              Kích hoạt Hệ thống
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border-2 border-[#bcd0ae] shadow-md">
              <div className="w-3 h-3 bg-army-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(0,95,39,0.5)]" />
              <span className="text-sm font-black text-army-dark uppercase tracking-widest">Hệ thống: Sẵn sàng</span>
            </div>
          )}
          <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border-2 border-[#bcd0ae] shadow-md">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
            <span className="text-sm font-black text-army-dark uppercase tracking-widest">Trực ban: Đang kết nối</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="army-card group hover:scale-[1.02] transition-all cursor-default relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-army-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-army-primary/10 transition-colors" />
            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className={cn("p-4 rounded-2xl shadow-lg border-2 border-white text-white", stat.color)}>
                <stat.icon className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-black text-army-primary bg-army-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">Live</span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-4xl font-black text-army-dark tracking-tighter">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 army-card !p-0 overflow-hidden">
          <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-army-primary rounded-xl flex items-center justify-center shadow-lg">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-black text-army-dark uppercase tracking-widest text-sm">Tiến độ công việc</h2>
            </div>
            <button className="text-[10px] font-bold text-army-primary hover:text-army-dark flex items-center gap-2 uppercase tracking-widest transition-colors">
              Xem chi tiết <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-zinc-100">
            {tasks.length > 0 ? tasks.map((task) => (
              <div key={task.id} className="p-6 hover:bg-zinc-50 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]",
                    task.priority === 'high' ? "bg-red-600 shadow-red-200" : 
                    task.priority === 'medium' ? "bg-army-gold shadow-yellow-200" : 
                    "bg-army-primary shadow-green-200"
                  )} />
                  <div>
                    <p className="font-bold text-army-dark text-lg group-hover:text-army-primary transition-colors">{task.title}</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Trạng thái: {task.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-1">Thời hạn</p>
                  <p className="text-sm font-mono text-zinc-500">{task.dueDate ? task.dueDate.split('T')[0] : '---'}</p>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-zinc-400 font-bold uppercase tracking-widest">Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        {/* Projects List */}
        <div className="army-card !p-0 overflow-hidden">
          <div className="p-8 border-b border-zinc-100 bg-zinc-50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-army-gold rounded-xl flex items-center justify-center shadow-lg">
                <Folder className="w-5 h-5 text-army-dark" />
              </div>
              <h2 className="font-black text-army-dark uppercase tracking-widest text-sm">Dự án trọng điểm</h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {projects.length > 0 ? projects.map((project) => (
              <div key={project.id} className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 hover:border-army-primary hover:bg-white transition-all cursor-pointer group shadow-sm">
                <h3 className="font-black text-army-dark text-xl mb-2 group-hover:text-army-primary transition-colors">{project.name}</h3>
                <p className="text-sm text-zinc-500 font-medium line-clamp-2 mb-6 leading-relaxed">{project.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-xl border-2 border-white bg-zinc-200" />
                    ))}
                  </div>
                  <div className="text-right">
                    <div className="w-24 h-1.5 bg-zinc-200 rounded-full overflow-hidden mb-2">
                      <div className="w-4/5 h-full bg-army-primary shadow-[0_0_10px_rgba(0,95,39,0.3)]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-army-primary">Tiến độ: 80%</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-zinc-400 font-bold uppercase tracking-widest">Chưa có dự án</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
