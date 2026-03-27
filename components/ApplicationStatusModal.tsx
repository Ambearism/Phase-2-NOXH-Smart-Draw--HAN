import React from 'react';
import { X, CheckCircle2, Clock, AlertCircle, Briefcase, Calendar, FileText } from 'lucide-react';
import { Participant } from '../types';

interface ApplicationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant;
}

export function ApplicationStatusModal({ isOpen, onClose, participant }: ApplicationStatusModalProps) {
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
    <div className="absolute inset-0 z-[100] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4">
      <div 
        className="w-full bg-white rounded-t-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="font-black text-[#00468E] text-lg uppercase tracking-tight">Chi tiết hồ sơ</h3>
            <p className="text-xs font-bold text-slate-400">Mã HS: {participant.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50">
          
          {/* Status Timeline */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <h4 className="font-black text-slate-800 text-sm mb-4 uppercase">Tiến độ xử lý</h4>
            
            <div className="relative pl-3 space-y-0">
              <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-slate-100 z-0"></div>
              
              {states.map((state, index) => {
                const isCompleted = index <= currentIndex;
                const isCurrent = index === currentIndex;
                const isReturned = index === 1 && participant.applicationState === 'tra_ho_so';
                const isOverdue = index === 3 && participant.applicationState === 'qua_han_ban_cung';
                
                let icon = <CheckCircle2 size={12} />;
                let dotBg = isCompleted ? 'bg-green-500' : 'bg-slate-200';
                let textCol = isCompleted ? 'text-green-700' : 'text-slate-400';
                
                if (isCurrent && !isCompleted && !isReturned && !isOverdue) {
                  dotBg = 'bg-blue-500 animate-pulse';
                  textCol = 'text-blue-700 pt-1';
                  icon = <Clock size={12} />
                }
                
                if (isReturned) {
                  dotBg = 'bg-red-500';
                  textCol = 'text-red-700';
                  icon = <AlertCircle size={12} />
                }
                
                if (isOverdue) {
                  dotBg = 'bg-red-500';
                  textCol = 'text-red-700';
                  icon = <AlertCircle size={12} />
                }

                return (
                  <div key={state.id} className="relative z-10 flex gap-4 pb-6 last:pb-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm ${dotBg} border-2 border-white`}>
                      {icon}
                    </div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider ${textCol}`}>
                        {state.label}
                      </p>
                      {isReturned && (
                        <div className="mt-2 bg-red-50 p-2 rounded border border-red-100 text-[10px] text-red-600 font-medium">
                          <strong>Lý do trả:</strong> {participant.returnReason}
                        </div>
                      )}
                      {isOverdue && (
                        <div className="mt-2 bg-red-50 p-2 rounded border border-red-100 text-[10px] text-red-600 font-medium">
                          <strong>Quá hạn:</strong> Yêu cầu bổ sung nộp bản cứng gấp.
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-black text-slate-800 text-sm mb-3 uppercase">Thông tin đã nộp</h4>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#00468E]">
                <Briefcase size={16} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-slate-400">Nhóm đối tượng K</p>
                <p className="text-sm font-bold text-slate-800">Nhóm {participant.groupK || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-slate-400">Thời gian nộp điện tử</p>
                <p className="text-sm font-bold text-slate-800">
                  {participant.submitTime ? new Date(participant.submitTime).toLocaleString('vi-VN') : '—'}
                </p>
              </div>
            </div>
            
            {participant.hardCopyDueDate && (
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                  <AlertCircle size={16} />
                 </div>
                 <div>
                   <p className="text-[10px] uppercase font-black text-slate-400">Hạn nộp bản cứng</p>
                   <p className="text-sm font-bold text-slate-800">
                     {new Date(participant.hardCopyDueDate).toLocaleDateString('vi-VN')}
                   </p>
                 </div>
              </div>
            )}
          </div>

          {/* Files List */}
          {participant.files && participant.files.length > 0 && (
             <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-black text-slate-800 text-sm mb-3 uppercase">Danh mục tài liệu</h4>
                <div className="space-y-2">
                  {participant.files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2 truncate">
                        <FileText size={14} className="text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-700 truncate">{file.category}</span>
                      </div>
                      <a href={file.url} target="_blank" className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded font-bold text-[#00468E] whitespace-nowrap">
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
  );
}
