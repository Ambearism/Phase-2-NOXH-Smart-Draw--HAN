import React from 'react';
import { X, CheckCircle2, Clock, AlertCircle, Briefcase, Calendar, FileText } from 'lucide-react';
import { Participant } from '../types';

interface ApplicationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant;
  isDesktop?: boolean;
}

export function ApplicationStatusModal({ isOpen, onClose, participant, isDesktop = false }: ApplicationStatusModalProps) {
  if (!isOpen) return null;

  const states = [
    { id: 'nhap', label: 'Tạo hồ sơ' },
    { id: 'da_nhan', label: 'Tiếp nhận' },
    { id: 'dang_xu_ly', label: 'Kiểm soát' },
    { id: 'cho_ban_cung', label: 'Chờ bản cứng' },
    { id: 'hoan_thanh', label: 'Hoàn thành' }
  ];

  // Map current state to progress index
  let currentIndex = 0;
  if (participant.applicationState === 'nhap') currentIndex = 0;
  if (participant.applicationState === 'da_nhan') currentIndex = 1;
  if (participant.applicationState === 'dang_xu_ly') currentIndex = 2;
  if (participant.applicationState === 'tra_ho_so') currentIndex = 1; // Returned from reception/control
  if (['cho_ban_cung', 'qua_han_ban_cung'].includes(participant.applicationState || '')) currentIndex = 3;
  if (participant.applicationState === 'hoan_thanh') currentIndex = 4;

  return (
    <div className={`fixed inset-0 z-[100] flex ${isDesktop ? 'items-center' : 'items-end'} justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4`}>
      <div 
        className={`w-full ${isDesktop ? 'max-w-4xl rounded-[3rem]' : 'rounded-t-[2.5rem]'} bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between ${isDesktop ? 'p-10' : 'p-6'} border-b border-slate-100 bg-slate-50`}>
          <div>
            <h3 className={`font-black text-[#00468E] ${isDesktop ? 'text-2xl' : 'text-lg'} uppercase tracking-tighter`}>Chi tiết tiến độ hồ sơ</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Mã Định Danh: {participant.id}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className={`${isDesktop ? 'p-10 grid grid-cols-12 gap-10' : 'p-6 space-y-6'} overflow-y-auto bg-slate-50`}>
          
          {/* Status Timeline (Desktop: 5 cols) */}
          <div className={`${isDesktop ? 'col-span-5' : ''} bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden h-fit`}>
            <h4 className="font-black text-slate-800 text-[10px] mb-6 uppercase tracking-widest border-b border-slate-50 pb-2">Lộ trình phê duyệt</h4>
            
            <div className="relative pl-3 space-y-0">
              <div className="absolute left-[17px] top-2 bottom-2 w-1 bg-slate-100/50 z-0 rounded-full"></div>
              
              {states.map((state, index) => {
                const isCompleted = index <= currentIndex;
                const isCurrent = index === currentIndex;
                const isReturned = index === 1 && participant.applicationState === 'tra_ho_so';
                const isOverdue = index === 3 && participant.applicationState === 'qua_han_ban_cung';
                
                let icon = <CheckCircle2 size={12} />;
                let dotBg = isCompleted ? 'bg-green-500' : 'bg-slate-200';
                let textCol = isCompleted ? 'text-green-700' : 'text-slate-400';
                
                if (isCurrent && !isCompleted && !isReturned && !isOverdue) {
                  dotBg = 'bg-[#00468E] border-[#00468E] shadow-[0_0_15px_rgba(0,70,142,0.3)]';
                  textCol = 'text-[#00468E] font-black';
                  icon = <Clock size={12} className="animate-spin" />
                }
                
                return (
                  <div key={state.id} className="relative z-10 flex gap-5 pb-8 last:pb-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-md ${dotBg} border-2 border-white transition-all`}>
                      {icon}
                    </div>
                    <div className="pt-1">
                      <p className={`text-[11px] font-black uppercase tracking-widest ${textCol}`}>
                        {state.label}
                      </p>
                      {isCurrent && <p className="text-[10px] text-slate-400 font-medium italic">Bắt đầu từ: {new Date(participant.submitTime || Date.now()).toLocaleDateString('vi-VN')}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Details & Files (Desktop: 7 cols) */}
          <div className={`${isDesktop ? 'col-span-7' : ''} space-y-6`}>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <h4 className="font-black text-slate-800 text-[10px] mb-4 uppercase tracking-widest border-b border-slate-50 pb-2">Dữ liệu hồ sơ</h4>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#00468E] shadow-sm group-hover:scale-110 transition-transform">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-tighter">Nhóm K</p>
                    <p className="text-sm font-black text-slate-800">Nhóm {participant.groupK || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm group-hover:scale-110 transition-transform">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-tighter">Ngày nộp</p>
                    <p className="text-sm font-black text-slate-800">
                      {participant.submitTime ? new Date(participant.submitTime).toLocaleDateString('vi-VN') : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {participant.files && participant.files.length > 0 && (
               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h4 className="font-black text-slate-800 text-[10px] mb-4 uppercase tracking-widest border-b border-slate-50 pb-2">Minh chứng đính kèm ({participant.files.length})</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {participant.files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 truncate">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[#00468E]">
                            <FileText size={16} />
                          </div>
                          <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight truncate">{file.category}</span>
                        </div>
                        <a href={file.url} target="_blank" className="text-[10px] bg-[#00468E] text-white px-4 py-1.5 rounded-full font-black uppercase tracking-wider shadow-lg shadow-blue-100/50">
                          Xem
                        </a>
                      </div>
                    ))}
                  </div>
               </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
