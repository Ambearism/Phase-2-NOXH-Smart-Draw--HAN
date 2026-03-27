import React, { useState } from 'react';
import {
   X,
   FileText,
   Download,
   ExternalLink,
   Upload,
   CheckCircle2,
   AlertCircle,
   Save,
   Trash2
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { Participant } from '../types';

interface ProfileDetailsModalProps {
   isOpen: boolean;
   onClose: () => void;
   participant: Participant;
   onUpdate: (id: string, updates: Partial<Participant>) => void;
}

export const ProfileDetailsModal: React.FC<ProfileDetailsModalProps> = ({
   isOpen,
   onClose,
   participant,
   onUpdate
}) => {
   const [isEditing, setIsEditing] = useState(false);

   if (!isOpen) return null;

   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         // In a real app, upload to server here
         const url = URL.createObjectURL(file);
         onUpdate(participant.id, {
            documentUrl: url,
            profileStatus: 'hoan_thanh'
         });
      }
   };

   const handleDeleteScan = () => {
      if (confirm("Bạn có chắc chắn muốn xóa file scan này?")) {
         onUpdate(participant.id, {
            documentUrl: null,
            profileStatus: 'chua_hoan_thanh'
         });
      }
   };

   const handleToggleStatus = () => {
      const newStatus = participant.profileStatus === 'hoan_thanh' ? 'chua_hoan_thanh' : 'hoan_thanh';
      onUpdate(participant.id, { profileStatus: newStatus });
   };

   return createPortal(
      <div className="fixed inset-0 z-[100] flex justify-end">
         <div className="absolute inset-0 bg-black/50 backdrop-blur-md transition-opacity" onClick={onClose} />

         <div className="relative w-full max-w-5xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div>
                  <div className="flex items-center gap-3">
                     <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Bộ hồ sơ – {participant.id}</h2>
                     <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${participant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {participant.status}
                     </span>
                  </div>
                  <p className="text-sm font-bold text-slate-400 mt-1">{participant.name} • {participant.cccd}</p>
               </div>
               <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all shadow-sm border border-slate-100">
                  <X size={20} />
               </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
               {/* Left Sidebar: Info */}
               <div className="w-80 bg-slate-50 border-r border-slate-100 p-6 overflow-y-auto space-y-6">
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Thông tin cá nhân</p>
                     <div className="space-y-4">
                        <div>
                           <label className="text-xs font-bold text-slate-500">Họ và tên</label>
                           <p className="font-bold text-slate-800">{participant.name}</p>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-500">Số CCCD</label>
                           <p className="font-mono text-sm text-slate-700">{participant.cccd}</p>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-500">Số điện thoại</label>
                           <p className="font-mono text-sm text-slate-700">{participant.phone}</p>
                        </div>
                     </div>
                  </div>

                  <div className="h-px bg-slate-200" />

                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Thông tin đăng ký</p>
                     <div className="space-y-4">
                        <div>
                           <label className="text-xs font-bold text-slate-500">Quyền đăng ký</label>
                           <div className="mt-1">
                              {isEditing ? (
                                 <select
                                    value={participant.right}
                                    onChange={(e) => onUpdate(participant.id, { right: e.target.value as any })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-[#00468E]"
                                 >
                                    <option value="buy">Mua</option>
                                    <option value="rent">Thuê</option>
                                    <option value="rent_buy">Thuê - Mua</option>
                                 </select>
                              ) : (
                                 <div className="flex items-center justify-between group">
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase inline-block ${participant.right === 'buy' ? 'bg-blue-100 text-blue-700' :
                                          participant.right === 'rent' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'
                                       }`}>
                                       {participant.right === 'buy' ? 'Mua' : participant.right === 'rent' ? 'Thuê' : 'Thuê - Mua'}
                                    </span>
                                    <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold text-blue-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                                       (Sửa)
                                    </button>
                                 </div>
                              )}
                           </div>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-500">Trạng thái hồ sơ</label>
                           <div className="mt-1 flex items-center gap-2">
                              {participant.profileStatus === 'hoan_thanh' ? (
                                 <span className="text-green-600 font-bold text-sm flex items-center gap-1"><CheckCircle2 size={14} /> Hoàn thành</span>
                              ) : (
                                 <span className="text-amber-500 font-bold text-sm flex items-center gap-1"><AlertCircle size={14} /> Chưa hoàn thành</span>
                              )}
                              <button onClick={handleToggleStatus} className="text-[10px] font-bold text-blue-600 hover:underline ml-2">
                                 (Thay đổi)
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Right: PDF Viewer */}
               <div className="flex-1 bg-slate-200/50 flex flex-col relative">
                  {participant.documentUrl ? (
                     <div className="flex-1 flex flex-col h-full">
                        <div className="bg-white border-b border-slate-200 px-4 py-2 flex justify-between items-center shadow-sm z-10">
                           <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                              <FileText size={16} /> Document.pdf
                           </div>
                           <div className="flex gap-2">
                              <a href={participant.documentUrl} download className="p-2 hover:bg-slate-100 rounded-lg text-slate-600" title="Tải xuống">
                                 <Download size={18} />
                              </a>
                              <a href={participant.documentUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-slate-100 rounded-lg text-slate-600" title="Mở tab mới">
                                 <ExternalLink size={18} />
                              </a>
                           </div>
                        </div>
                        <div className="flex-1 bg-slate-100 p-8 overflow-y-auto flex justify-center">
                           {/* PDF Embed Mockup */}
                           <div className="w-full max-w-3xl bg-white shadow-lg min-h-[800px] flex items-center justify-center text-slate-300 flex-col gap-4">
                              <FileText size={64} />
                              <p className="font-bold">PDF Preview Placeholder</p>
                              <iframe src={participant.documentUrl} className="w-full h-full" title="PDF Preview" />
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
                           <FileText size={48} />
                        </div>
                        <h3 className="text-xl font-black text-slate-700 uppercase">Chưa có hồ sơ scan</h3>
                        <p className="text-slate-500 mt-2 max-w-xs mx-auto">Vui lòng upload file PDF scan của bộ hồ sơ này để hoàn thiện dữ liệu.</p>

                        <label className="mt-8 px-8 py-3 bg-[#00468E] text-white rounded-xl font-black uppercase text-sm shadow-xl shadow-blue-900/20 hover:bg-[#003366] transition-all flex items-center gap-2 cursor-pointer">
                           <Upload size={18} /> Upload PDF
                           <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                        </label>
                     </div>
                  )}

                  {/* Footer Actions */}
                  <div className="bg-white border-t border-slate-200 p-4 flex justify-between items-center">
                     <div className="flex gap-2">
                        {participant.documentUrl && (
                           <div className="flex gap-2">
                              <label className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-50 cursor-pointer flex items-center gap-2">
                                 <Upload size={14} /> Thay file PDF
                                 <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                              </label>
                              <button onClick={handleDeleteScan} className="px-4 py-2 bg-white border border-red-100 text-red-500 rounded-lg font-bold text-xs hover:bg-red-50 flex items-center gap-2 transition-colors">
                                 <Trash2 size={14} /> Xóa file scan
                              </button>
                           </div>
                        )}
                     </div>
                     <div className="flex gap-2">
                        <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-50">
                           Đóng
                        </button>
                        <button onClick={onClose} className="px-6 py-2 bg-[#00468E] text-white rounded-lg font-bold text-xs hover:bg-[#003366]">
                           <Save size={14} className="inline mr-2" /> Lưu thay đổi
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   , document.body);
};
