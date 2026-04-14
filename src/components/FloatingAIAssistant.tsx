import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User as UserIcon, 
  Loader2,
  Volume2,
  VolumeX,
  X,
  Maximize2,
  Minimize2,
  GripHorizontal
} from 'lucide-react';
import { cn } from '../lib/utils';
import { aiService } from '../services/aiService';
import { useVoice } from '../hooks/useVoice';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
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
  }, [messages, isOpen]);

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const context = "Người dùng đang tương tác với trợ lý ảo Nexus AI trên hệ thống điều hành quân sự.";
      const aiResponse = await aiService.getAIAdvice(userMessage, context);
      
      const responseText = aiResponse || 'Xin lỗi, tôi không thể xử lý yêu cầu này lúc này.';
      setMessages(prev => [...prev, { role: 'ai', text: responseText }]);
      
      if (voiceEnabled) {
        speak(responseText);
      }
      
      await addDoc(collection(db, 'ai_logs'), {
        userId: auth.currentUser?.uid,
        prompt: userMessage,
        response: aiResponse,
        type: 'floating_assistant',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'ai', text: 'Đã có lỗi xảy ra khi kết nối với trí tuệ nhân tạo.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? '80px' : '600px',
              width: '400px'
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            drag
            dragMomentum={false}
            className="bg-white rounded-[2.5rem] shadow-2xl border-4 border-army-primary overflow-hidden flex flex-col mb-6 pointer-events-auto"
          >
            {/* Header */}
            <div className="p-4 bg-army-primary flex items-center justify-between cursor-move">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-black uppercase tracking-widest text-xs">Nexus AI Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Chat Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50 custom-scrollbar">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <div className="w-16 h-16 bg-army-primary/10 rounded-3xl flex items-center justify-center mb-4 border-2 border-army-primary/20">
                        <Bot className="w-8 h-8 text-army-primary" />
                      </div>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                        Hệ thống sẵn sàng.<br/>Đang chờ lệnh từ thủ trưởng.
                      </p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={cn(
                      "flex gap-3",
                      msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}>
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center border-2 border-white shadow-sm",
                        msg.role === 'user' ? "bg-army-gold text-army-dark" : "bg-army-primary text-white"
                      )}>
                        {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={cn(
                        "max-w-[85%] p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm border",
                        msg.role === 'user' 
                          ? "bg-white border-zinc-100 text-army-dark rounded-tr-none" 
                          : "bg-army-primary text-white border-army-dark rounded-tl-none"
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-xl bg-army-primary border-2 border-white flex items-center justify-center shadow-sm">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-zinc-100 shadow-sm flex gap-1">
                        <div className="w-1.5 h-1.5 bg-army-primary rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-army-primary rounded-full animate-bounce delay-100" />
                        <div className="w-1.5 h-1.5 bg-army-primary rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-zinc-100">
                  <form onSubmit={handleSend} className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Nhập lệnh..."
                      className="w-full pl-4 pr-12 py-3 bg-zinc-50 border-2 border-zinc-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-army-primary focus:bg-white transition-all outline-none text-army-dark"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-army-primary text-white rounded-xl hover:bg-army-dark transition-all disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Robot Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto group relative"
      >
        <div className="absolute -inset-4 bg-army-primary/20 rounded-full blur-xl group-hover:bg-army-primary/30 transition-all animate-pulse" />
        <div className="w-20 h-20 bg-army-primary rounded-[2rem] border-4 border-white shadow-2xl flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-army-primary to-army-dark" />
          
          {/* Robot Face Visual */}
          <div className="relative z-10 flex flex-col items-center gap-1">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-army-gold rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)] animate-pulse" />
              <div className="w-3 h-3 bg-army-gold rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)] animate-pulse" />
            </div>
            <div className="w-8 h-1 bg-army-gold/30 rounded-full overflow-hidden">
              <motion.div 
                animate={{ x: [-20, 20] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-4 h-full bg-army-gold"
              />
            </div>
          </div>

          {/* Scanning Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-army-gold/10 to-transparent h-1/2 w-full animate-scan pointer-events-none" />
        </div>
        
        {/* Label */}
        <div className="absolute right-24 top-1/2 -translate-y-1/2 bg-army-dark text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 whitespace-nowrap border border-army-primary/50 shadow-xl">
          Gọi Trợ lý Nexus AI
        </div>
      </motion.button>
    </div>
  );
}
