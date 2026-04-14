import React, { useState, useEffect } from 'react';
import { procedureApi, reportApi } from '../lib/api';
import { FileText, Plus, Search, Trash2, Edit, FileSpreadsheet, FileCode, Presentation, FileDown, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function Procedures() {
  const [procedures, setProcedures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProcedure, setCurrentProcedure] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'Hành chính' });

  useEffect(() => {
    fetchProcedures();
  }, []);

  const fetchProcedures = async () => {
    try {
      setLoading(true);
      const res = await procedureApi.getAll();
      setProcedures(res.data);
    } catch (error) {
      console.error('Lỗi khi tải thủ tục:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentProcedure) {
        await procedureApi.update(currentProcedure.id, formData);
      } else {
        await procedureApi.create(formData);
      }
      setIsModalOpen(false);
      fetchProcedures();
      setFormData({ title: '', description: '', category: 'Hành chính' });
      setCurrentProcedure(null);
    } catch (error) {
      alert('Lỗi khi lưu thủ tục');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thủ tục này?')) {
      try {
        await procedureApi.delete(id);
        fetchProcedures();
      } catch (error) {
        alert('Bạn không có quyền xóa hoặc có lỗi xảy ra');
      }
    }
  };

  const handleExport = async (type: 'excel' | 'word' | 'ppt' | 'pdf') => {
    try {
      let res;
      let filename = `bao_cao.${type === 'excel' ? 'xlsx' : type === 'word' ? 'docx' : type === 'ppt' ? 'pptx' : 'pdf'}`;
      
      switch (type) {
        case 'excel': res = await reportApi.exportExcel(); break;
        case 'word': res = await reportApi.exportWord(); break;
        case 'ppt': res = await reportApi.exportPPT(); break;
        case 'pdf': res = await reportApi.exportPDF(); break;
      }

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Lỗi khi xuất báo cáo');
    }
  };

  const filteredProcedures = procedures.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-army-dark uppercase tracking-tight">Quản lý thủ tục</h1>
          <p className="text-zinc-500 font-medium">Danh sách các quy trình và thủ tục hành chính quân sự</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-all shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button 
            onClick={() => handleExport('word')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all shadow-md"
          >
            <FileText className="w-4 h-4" /> Word
          </button>
          <button 
            onClick={() => handleExport('ppt')}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700 transition-all shadow-md"
          >
            <Presentation className="w-4 h-4" /> PPT
          </button>
          <button 
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-all shadow-md"
          >
            <FileDown className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="army-card p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Tìm kiếm tiêu đề, danh mục..."
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:border-army-primary outline-none transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => {
              setCurrentProcedure(null);
              setFormData({ title: '', description: '', category: 'Hành chính' });
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-army-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-army-dark transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5" /> Thêm thủ tục mới
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="text-zinc-400 text-xs font-black uppercase tracking-[0.2em]">
                  <th className="px-6 py-2">ID</th>
                  <th className="px-6 py-2">Tiêu đề thủ tục</th>
                  <th className="px-6 py-2">Danh mục</th>
                  <th className="px-6 py-2">Người tạo</th>
                  <th className="px-6 py-2">Ngày tạo</th>
                  <th className="px-6 py-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredProcedures.map((p) => (
                  <tr key={p.id} className="bg-white hover:bg-zinc-50 transition-colors shadow-sm group">
                    <td className="px-6 py-4 rounded-l-xl font-bold text-zinc-400">#{p.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-army-dark">{p.title}</div>
                      <div className="text-xs text-zinc-500 truncate max-w-xs">{p.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-army-bg text-army-primary rounded-full text-xs font-bold border border-army-primary/20">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-600">{p.author || 'Hệ thống'}</td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">
                      {new Date(p.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 rounded-r-xl text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setCurrentProcedure(currentProcedure);
                            setFormData({ title: p.title, description: p.description, category: p.category });
                            setCurrentProcedure(p);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProcedures.length === 0 && (
              <div className="text-center py-12 text-zinc-400 font-bold uppercase tracking-widest text-sm">
                Không tìm thấy dữ liệu phù hợp
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-army-dark/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-army-primary p-6 flex items-center justify-between">
              <h3 className="text-white font-black uppercase tracking-tight text-xl">
                {currentProcedure ? 'Cập nhật thủ tục' : 'Thêm thủ tục mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Tiêu đề thủ tục</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:border-army-primary outline-none transition-all font-bold"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Danh mục</label>
                <select 
                  className="w-full px-4 py-3 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:border-army-primary outline-none transition-all font-bold"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Hành chính">Hành chính</option>
                  <option value="Tác chiến">Tác chiến</option>
                  <option value="Hậu cần">Hậu cần</option>
                  <option value="Kỹ thuật">Kỹ thuật</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Mô tả chi tiết</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-3 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:border-army-primary outline-none transition-all font-medium"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 border-2 border-zinc-100 rounded-xl font-bold text-zinc-400 hover:bg-zinc-50 transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-army-primary text-white rounded-xl font-bold hover:bg-army-dark transition-all shadow-lg shadow-army-primary/20"
                >
                  {currentProcedure ? 'Cập nhật' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
