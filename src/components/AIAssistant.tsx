import { useState, useEffect, useRef, FormEvent } from 'react';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { AIInteraction } from '../types';
import { 
  Send, 
  Bot, 
  User as UserIcon, 
  Sparkles, 
  Loader2,
  BrainCircuit,
  Zap,
  Lightbulb,
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn } from '../lib/utils';
import { aiService } from '../services/aiService';
import { useVoice } from '../hooks/useVoice';

export function AIAssistant() {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { speak } = useVoice();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Get context from recent tasks/projects (simplified for now)
      const context = "Người dùng đang quản lý các dự án công ty trên hệ thống Nexus AI.";
      const aiResponse = await aiService.getAIAdvice(userMessage, context);
      
      const responseText = aiResponse || 'Xin lỗi, tôi không thể xử lý yêu cầu này lúc này.';
      setMessages(prev => [...prev, { role: 'ai', text: responseText }]);
      
      if (voiceEnabled) {
        speak(responseText);
      }
      
      // Log to Firestore
      await addDoc(collection(db, 'ai_logs'), {
        userId: auth.currentUser?.uid,
        prompt: userMessage,
        response: aiResponse,
        type: 'suggestion',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'ai', text: 'Đã có lỗi xảy ra khi kết nối với trí tuệ nhân tạo.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    { icon: BrainCircuit, text: "Lập kế hoạch dự án mới", prompt: "Hãy giúp tôi lập kế hoạch cho một dự án phát triển ứng dụng di động." },
    { icon: Zap, text: "Tối ưu hóa quy trình", prompt: "Làm thế nào để tăng hiệu suất làm việc của nhóm?" },
    { icon: Lightbulb, text: "Gợi ý công việc", prompt: "Dựa trên các dự án hiện tại, tôi nên làm gì tiếp theo?" },
  ];

  return (
    <div className="h-full flex flex-col space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-army-dark tracking-tighter uppercase leading-none mb-2">Trợ lý <span className="text-army-primary">Nexus AI</span></h1>
          <p className="text-zinc-500 font-bold text-lg uppercase tracking-widest">Hệ thống điều hành trí tuệ nhân tạo quân sự.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={cn(
              "p-3 rounded-2xl border-2 transition-all shadow-md flex items-center gap-2",
              voiceEnabled ? "bg-army-primary text-white border-army-dark" : "bg-white text-zinc-400 border-zinc-100"
            )}
            title={voiceEnabled ? "Tắt giọng nói" : "Bật giọng nói"}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            <span className="text-[10px] font-black uppercase tracking-widest">{voiceEnabled ? "Voice ON" : "Voice OFF"}</span>
          </button>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border-2 border-[#bcd0ae] shadow-md">
            <div className="w-2 h-2 bg-army-gold rounded-full animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-army-dark">AI Core Online</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-10 min-h-0">
        {/* Chat Interface */}
        <div className="flex-1 flex flex-col army-card !p-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,95,39,0.03),transparent)] pointer-events-none" />
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar relative z-10 bg-zinc-50/50">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-12">
                <div className="w-24 h-24 bg-army-primary/10 rounded-[2.5rem] flex items-center justify-center border-2 border-army-primary/20 animate-float">
                  <Bot className="w-12 h-12 text-army-primary" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-army-dark uppercase tracking-tight">Hệ thống sẵn sàng</h3>
                  <p className="text-sm text-zinc-500 font-medium max-w-sm mx-auto">Chào đồng chí, tôi là Nexus AI. Hãy bắt đầu bằng một câu hỏi hoặc chọn gợi ý bên dưới.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl px-4">
                  {suggestions.map((s, i) => (
                    <button 
                      key={i}
                      onClick={() => { setInput(s.prompt); }}
                      className="p-6 bg-white border-2 border-zinc-100 rounded-[2rem] hover:border-army-primary hover:bg-zinc-50 transition-all text-left group shadow-sm"
                    >
                      <s.icon className="w-6 h-6 text-zinc-400 group-hover:text-army-primary mb-4 transition-colors" />
                      <p className="text-sm font-bold text-zinc-500 group-hover:text-army-dark transition-colors">{s.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={cn(
                "flex gap-6 animate-in slide-in-from-bottom-2 duration-300",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center border-2 border-white shadow-md",
                  msg.role === 'user' 
                    ? "bg-army-gold text-army-dark" 
                    : "bg-army-primary text-white"
                )}>
                  {msg.role === 'user' ? <UserIcon className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                </div>
                <div className={cn(
                  "max-w-[80%] p-6 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm border",
                  msg.role === 'user' 
                    ? "bg-white border-zinc-100 text-army-dark rounded-tr-none" 
                    : "bg-army-primary text-white border-army-dark rounded-tl-none"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-6 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-army-primary border-2 border-white flex items-center justify-center shadow-md">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="bg-white p-6 rounded-[2rem] rounded-tl-none border border-zinc-100 shadow-sm">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-army-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-army-primary rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-army-primary rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-8 border-t-2 border-zinc-100 bg-white relative z-10">
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập lệnh điều khiển hoặc báo cáo..."
                className="w-full pl-8 pr-20 py-5 bg-zinc-50 border-2 border-zinc-100 rounded-[2rem] text-lg font-bold focus:ring-2 focus:ring-army-primary focus:bg-white transition-all outline-none text-army-dark placeholder:text-zinc-300"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-army-primary text-white rounded-2xl hover:bg-army-dark hover:text-army-gold transition-all disabled:opacity-50 active:scale-95 shadow-lg"
              >
                <Send className="w-6 h-6" />
              </button>
            </form>
            <p className="text-[10px] text-center text-zinc-400 mt-6 uppercase tracking-[0.3em] font-black">
              Nexus Army Intelligent Systems • AI Core v4.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
