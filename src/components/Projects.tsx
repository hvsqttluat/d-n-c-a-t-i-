import { useState, useEffect, FormEvent } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Project } from '../types';
import { 
  Plus, 
  Folder, 
  Users, 
  MoreVertical, 
  Search,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  ExternalLink,
  Calendar,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(collection(db, 'projects'), where('ownerId', '==', userId));
    const unsub = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    }, (error) => {
      console.error("Projects listener error:", error);
    });

    return () => unsub();
  }, []);

  const handleAddProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;

    await addDoc(collection(db, 'projects'), {
      ...newProject,
      ownerId: auth.currentUser?.uid,
      members: [],
      createdAt: serverTimestamp(),
    });

    setNewProject({ name: '', description: '' });
    setIsAdding(false);
  };

  const deleteProject = async (id: string) => {
    if (confirm('Xóa dự án này sẽ xóa tất cả dữ liệu liên quan. Bạn chắc chắn chứ?')) {
      await deleteDoc(doc(db, 'projects', id));
    }
  };

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-army-dark tracking-tighter uppercase leading-none mb-2">Dự án <span className="text-army-primary">Trọng điểm</span></h1>
          <p className="text-zinc-500 font-bold text-lg uppercase tracking-widest">Quản lý danh mục nhiệm vụ chiến lược.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white p-1.5 rounded-2xl border-2 border-[#bcd0ae] shadow-md">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-2.5 rounded-xl transition-all", viewMode === 'grid' ? "bg-army-primary text-white shadow-lg" : "text-zinc-400 hover:text-army-primary")}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-2.5 rounded-xl transition-all", viewMode === 'list' ? "bg-army-primary text-white shadow-lg" : "text-zinc-400 hover:text-army-primary")}
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="army-button army-button-primary flex items-center gap-2 group shadow-lg"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Khởi tạo dự án
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {projects.map((project) => (
            <div key={project.id} className="army-card group relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button 
                  onClick={() => deleteProject(project.id)}
                  className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-8 border-2 border-zinc-100 group-hover:border-army-primary/30 transition-colors shadow-sm">
                <Folder className="w-8 h-8 text-army-primary transition-colors" />
              </div>
              
              <h3 className="text-2xl font-black text-army-dark mb-3 group-hover:text-army-primary transition-colors leading-tight">{project.name}</h3>
              <p className="text-zinc-500 font-medium text-sm line-clamp-3 mb-8 leading-relaxed flex-1">{project.description || 'Chưa có mô tả cho dự án này.'}</p>
              
              <div className="space-y-6 pt-6 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tiến độ nhiệm vụ</span>
                  <span className="text-[10px] font-black text-army-primary uppercase tracking-widest">75%</span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden shadow-inner">
                  <div className="w-3/4 h-full bg-army-primary shadow-[0_0_10px_rgba(0,95,39,0.3)]" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-xl border-2 border-white bg-zinc-200 shadow-sm" />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Q2 2026</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {projects.length === 0 && (
            <div className="col-span-full py-24 text-center border-4 border-dashed border-[#cbdcc0] rounded-[3rem]">
              <div className="w-20 h-20 bg-zinc-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Folder className="w-10 h-10 text-zinc-300" />
              </div>
              <p className="text-xl font-black text-zinc-400 uppercase tracking-[0.2em]">Chưa có dữ liệu dự án</p>
            </div>
          )}
        </div>
      ) : (
        <div className="army-card !p-0 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b-2 border-zinc-100">
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Dự án</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Mô tả</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tiến độ</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center border-2 border-zinc-100 group-hover:border-army-primary/30 transition-colors shadow-sm">
                        <Folder className="w-5 h-5 text-army-primary" />
                      </div>
                      <span className="font-bold text-army-dark group-hover:text-army-primary transition-colors">{project.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm text-zinc-500 font-medium line-clamp-1 max-w-xs">{project.description}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden max-w-[120px] shadow-inner">
                        <div className="w-2/3 h-full bg-army-primary shadow-[0_0_10px_rgba(0,95,39,0.2)]" />
                      </div>
                      <span className="text-[10px] font-black text-army-primary uppercase tracking-widest">66%</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => deleteProject(project.id)}
                      className="p-3 hover:bg-red-50 text-zinc-300 hover:text-red-600 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Project Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-army-dark/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="army-card w-full max-w-xl !p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-10 bg-army-gradient text-white flex items-center justify-between border-b-4 border-army-gold">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Khởi tạo dự án</h2>
                <p className="text-[10px] font-bold text-army-gold uppercase tracking-[0.2em] mt-2">Hệ thống điều hành Nexus Army</p>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddProject} className="p-10 space-y-8 bg-white">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Tên dự án chiến lược</label>
                <input 
                  required
                  type="text" 
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  placeholder="VD: Hiện đại hóa hạ tầng mạng..."
                  className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-5 py-4 text-lg font-bold focus:ring-2 focus:ring-army-primary transition-all outline-none text-army-dark placeholder:text-zinc-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Mô tả mục tiêu</label>
                <textarea 
                  required
                  rows={4}
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  placeholder="Xác định tầm nhìn và phạm vi dự án..."
                  className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-army-primary transition-all outline-none text-army-dark placeholder:text-zinc-300 resize-none"
                />
              </div>
              <div className="pt-6 flex gap-6">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
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
