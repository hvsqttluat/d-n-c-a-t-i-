import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Briefcase, 
  MessageSquare, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Dashboard } from './Dashboard';
import { TaskBoard } from './TaskBoard';
import { Projects } from './Projects';
import { AIAssistant } from './AIAssistant';
import { FloatingAIAssistant } from './FloatingAIAssistant';

interface LayoutProps {
  user: User;
  profile: UserProfile | null;
  onLogout: () => void;
  children?: React.ReactNode;
}

export function Layout({ user, profile, onLogout }: LayoutProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'tasks', label: 'Công việc', icon: CheckSquare },
    { id: 'projects', label: 'Dự án', icon: Briefcase },
    { id: 'ai', label: 'Trợ lý AI', icon: MessageSquare },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'tasks': return <TaskBoard />;
      case 'projects': return <Projects />;
      case 'ai': return <AIAssistant />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="h-screen w-full flex bg-army-bg text-zinc-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r-2 border-[#bcd0ae] transition-all duration-300 flex flex-col relative z-20 shadow-xl",
        isSidebarOpen ? "w-72" : "w-24"
      )}>
        <div className="p-6 flex items-center gap-4 bg-army-primary border-b-4 border-army-gold">
          <div className="w-10 h-10 bg-army-gold rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-army-dark" />
          </div>
          {isSidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="font-black text-white text-xl tracking-tight uppercase leading-none">Nexus</h1>
              <p className="text-[10px] font-bold text-army-gold uppercase tracking-widest mt-1">Army System</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative",
                activeTab === item.id 
                  ? "bg-army-primary text-white shadow-md" 
                  : "text-army-dark hover:bg-[#e3efda] hover:text-army-primary"
              )}
            >
              {activeTab === item.id && (
                <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-army-gold rounded-r-full" />
              )}
              <item.icon className={cn(
                "w-6 h-6 flex-shrink-0 transition-transform",
                activeTab === item.id ? "text-white" : "text-army-primary"
              )} />
              {isSidebarOpen && <span className="font-bold tracking-tight text-md">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <button
            onClick={onLogout}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-all"
            )}
          >
            <LogOut className="w-6 h-6 flex-shrink-0" />
            {isSidebarOpen && <span className="font-bold tracking-tight text-md">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-army-gradient text-white px-8 flex items-center justify-between sticky top-0 z-10 border-b-4 border-army-gold shadow-lg">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="hidden lg:flex flex-col">
              <h2 className="font-black text-xl uppercase tracking-tight leading-none">Hệ thống báo ban</h2>
              <p className="text-[10px] font-bold text-army-gold uppercase tracking-[0.2em] mt-1">Bộ Chỉ huy Quân sự tỉnh</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input 
                type="text" 
                placeholder="Tìm kiếm dữ liệu..." 
                className="pl-12 pr-6 py-2.5 bg-white/10 border border-white/10 rounded-full text-sm w-64 focus:ring-2 focus:ring-army-gold focus:bg-white/20 transition-all outline-none placeholder:text-white/30"
              />
            </div>
            
            <button className="p-2.5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all relative group">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-red-500 rounded-full border-2 border-army-primary group-hover:scale-125 transition-transform" />
            </button>
            
            <div className="flex items-center gap-4 pl-6 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black uppercase tracking-tight">{profile?.displayName}</p>
                <span className="badge-army mt-1 inline-block">{profile?.role}</span>
              </div>
              <div className="relative">
                <div className="absolute -inset-1 bg-army-gold rounded-2xl blur-sm opacity-30" />
                <img 
                  src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-2xl border-2 border-army-gold relative z-10"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-0">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>

        {/* Floating AI Assistant Robot */}
        <FloatingAIAssistant />
      </main>
    </div>
  );
}
