import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, FileText, CheckCircle2, AlertCircle, Clock, ChevronRight, User, Calendar, MapPin, Phone, Mail, FileDown, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Participant } from '../types';
import { GROUP_K_CONFIGS } from '../constants';

interface ProfileReviewModalProps {
  profile: Participant;
  onClose: () => void;
  onApprove: (profileId: string, priorityType: string, docStatuses: Record<string, any>, docComments: Record<string, string>) => void;
  onReturn: (profileId: string, comment: string, docStatuses: Record<string, any>, docComments: Record<string, string>) => void;
  onReceiveHardCopy?: (profileId: string) => void;
  mode: 'reception' | 'control' | 'storage';
}

export function ProfileReviewModal({ profile, onClose, onApprove, onReturn, onReceiveHardCopy, mode }: ProfileReviewModalProps) {
  const [activeTab, setActiveTab] = useState<'review' | 'log' | 'form02'>('review');
  const [returnComment, setReturnComment] = useState('');
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(profile.type || 'thuong');
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [docStatuses, setDocStatuses] = useState<Record<string, 'approved' | 'rejected' | 'pending'>>(profile.documentStatuses || {});
  const [docComments, setDocComments] = useState<Record<string, string>>(profile.documentComments || {});
  const [activeDocComment, setActiveDocComment] = useState('');

  const groupConfig = GROUP_K_CONFIGS.find(g => g.id === profile.groupK);
  const docs = groupConfig?.requiredDocs || [];

  // Simulate which docs are "submitted"
  const submittedDocIds = docs.filter((_, i) => i < docs.length - (profile.applicationState === 'da_nhan' ? 1 : 0)).map(d => d.id);

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleApprove = () => {
    // Before approving, check if any docs are rejected and need comments
    onApprove(profile.id, selectedPriority, docStatuses, docComments);
  };

  const handleReturn = () => {
    if (!returnComment.trim()) {
      alert('Vui lòng nhập lý do trả hồ sơ tổng thể.');
      return;
    }
    onReturn(profile.id, returnComment.trim(), docStatuses, docComments);
    setShowReturnForm(false);
    setReturnComment('');
  };

  const setDocStatus = (docId: string, status: 'approved' | 'rejected') => {
    setDocStatuses(prev => ({ ...prev, [docId]: status }));
    if (status === 'approved') {
        const newComments = { ...docComments };
        delete newComments[docId];
        setDocComments(newComments);
    }
  };

  const handleDocCommentSave = (docId: string) => {
    if (!activeDocComment.trim()) {
        alert("Vui lòng nhập lý do từ chối tài liệu");
        return;
    }
    setDocComments(prev => ({ ...prev, [docId]: activeDocComment }));
    setDocStatus(docId, 'rejected');
    setActiveDocComment('');
  };

    const handleExportForm02 = () => {
        const form02 = profile.form02Data;
        if (!form02) {
            alert("Không có dữ liệu Biểu mẫu 02");
            return;
        }

        // Map data to 76 columns based on Phụ lục 2 - BXD
        const data = [
            {
                'STT': 1,
                'Họ và tên': profile.name,
                'Ngày tháng năm sinh': form02.dob || '',
                'Số CCCD (12 số)': form02.idNumber12 || profile.cccd,
                'Số CMND (9 số)': form02.idNumber09 || '',
                'Số CMT Quân đội/Công an': form02.militaryIdNumber || '',
                'Ngày cấp': form02.idIssuanceDate || '',
                'Nơi cấp': form02.idIssuancePlace || '',
                'Hộ khẩu thường trú': form02.permanentAddress || '',
                'Tạm trú': form02.temporaryAddress || '',
                'Địa chỉ hiện nay': form02.currentAddress || '',
                'Số điện thoại': form02.contactPhone || profile.phone,
                'Hình thức đăng ký': form02.registrationRight === 'mua' ? 'Mua' : form02.registrationRight === 'thue' ? 'Thuê' : 'Thuê mua',
                'Tình trạng đăng ký': form02.registrationType === 'moi' ? 'Mới' : 'Chuyển nhượng',
                'Người cũ (nếu có)': form02.oldOwnerName || '',
                'Số ID người cũ': form02.oldOwnerId || '',
                'Ngày hợp đồng chuyển nhượng': form02.transferContractDate || '',
                'Số lượng thành viên hộ khẩu': form02.householdMemberCount || 1,
                'Căn hộ đăng ký': profile.assignedUnit || '',
                'Ghi chú': 'Dữ liệu Biểu mẫu 02 chi tiết'
            }
        ];
        
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "BieuMau02");
        XLSX.writeFile(wb, `Bieu_Mau_02_${profile.id}.xlsx`);
    };

    const modalContent = (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-[1100px] h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* HEADER */}
                <div className="bg-[#00468E] text-white px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-lg uppercase tracking-tight">{profile.name}</h3>
                            <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">{profile.id} • {profile.cccd}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleExportForm02}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg shadow-green-900/20"
                        >
                            <FileDown size={14} /> Tải Biểu Mẫu 02
                        </button>
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                            <X size={18} />
                        </button>
                    </div>
                </div>

        {/* TABS */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={() => setActiveTab('review')}
            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'review' ? 'border-[#00468E] text-[#00468E] bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Duyệt Hồ Sơ
          </button>
          <button
            onClick={() => setActiveTab('form02')}
            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'form02' ? 'border-[#00468E] text-[#00468E] bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Biểu mẫu 02
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'log' ? 'border-[#00468E] text-[#00468E] bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Nhật Ký
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'review' && (
            <div className="flex h-full">
              {/* LEFT: Document Checklist */}
              <div className="w-[340px] border-r border-slate-200 bg-slate-50 p-4 overflow-y-auto shrink-0">
                <h4 className="font-black text-[10px] uppercase text-slate-400 tracking-wider mb-3">Danh Sách Hồ Sơ Yêu Cầu</h4>
                <div className="space-y-2">
                  {docs.map((doc) => {
                    const status = docStatuses[doc.id] || 'pending';
                    const isSubmitted = profile.files?.some(f => f.id === doc.id || f.category === doc.name);
                    const isSelected = selectedDoc === doc.id;

                    return (
                      <div key={doc.id} className="relative group">
                          <button
                            onClick={() => setSelectedDoc(doc.id)}
                            className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected ? 'border-[#00468E] bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200'}`}
                          >
                            <div className="flex items-start gap-2">
                              {status === 'approved' ? (
                                <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                              ) : status === 'rejected' ? (
                                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                              ) : (
                                <Clock size={16} className="text-slate-300 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-700 truncate">{doc.name}</p>
                                <p className={`text-[10px] font-black uppercase mt-0.5 ${status === 'approved' ? 'text-green-600' : status === 'rejected' ? 'text-red-500' : 'text-slate-400'}`}>
                                  {status === 'approved' ? 'Đã Duyệt' : status === 'rejected' ? 'Từ chối' : (isSubmitted ? 'Chờ duyệt' : 'Chưa nộp')}
                                </p>
                              </div>
                              <ChevronRight size={14} className="text-slate-300 shrink-0 mt-0.5" />
                            </div>
                          </button>
                      </div>
                    );
                  })}
                </div>

                {/* Priority Assignment (Reception + Control) */}
                {(mode === 'reception' || mode === 'control') && (
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <h4 className="font-black text-[10px] uppercase text-slate-400 tracking-wider mb-2">Gán Đối Tượng Ưu Tiên</h4>
                    <select
                      value={selectedPriority}
                      onChange={e => setSelectedPriority(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-bold bg-white outline-none focus:border-[#00468E]"
                    >
                      <option value="ut1">Ưu Tiên 1</option>
                      <option value="ut2">Ưu Tiên 2</option>
                      <option value="ut3">Ưu Tiên 3</option>
                      <option value="ut4">Ưu Tiên 4</option>
                      <option value="ut5">Ưu Tiên 5</option>
                      <option value="thuong">Thông Thường</option>
                    </select>
                  </div>
                )}
              </div>

              {/* RIGHT: Document Viewer */}
              <div className="flex-1 flex flex-col">
                <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-50/50 overflow-y-auto">
                  {selectedDoc ? (
                    <div className="w-full h-full flex flex-col">
                        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center p-8 mb-4">
                          <FileText size={64} className="text-slate-200 mb-4" />
                          <p className="font-bold text-slate-500 text-sm">Xem trước tài liệu</p>
                          <p className="text-xs text-slate-400 mt-1">{docs.find(d => d.id === selectedDoc)?.name}</p>
                          <div className="mt-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg p-6 w-full max-w-md text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">[DEMO] Khu vực xem trước file PDF/Ảnh</p>
                            <p className="text-xs text-slate-500 mt-2">Tài liệu: <strong>{profile.id}_{selectedDoc}.pdf</strong></p>
                          </div>
                        </div>

                        {/* Granular Review Actions for selectedDoc */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-black text-slate-400 uppercase">Duyệt nhanh:</span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setDocStatus(selectedDoc, 'approved')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${docStatuses[selectedDoc] === 'approved' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'}`}
                                    >
                                        <CheckCircle2 size={14} /> Chấp nhận
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (docStatuses[selectedDoc] === 'rejected') {
                                                const news = {...docStatuses};
                                                delete news[selectedDoc];
                                                setDocStatuses(news);
                                            } else {
                                                setDocStatus(selectedDoc, 'rejected')
                                            }
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${docStatuses[selectedDoc] === 'rejected' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'}`}
                                    >
                                        <AlertCircle size={14} /> Từ chối
                                    </button>
                                </div>
                            </div>
                            
                            {docStatuses[selectedDoc] === 'rejected' && (
                                <div className="flex-1 ml-4 flex gap-2">
                                    <input 
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] px-3 py-1.5 outline-none focus:border-red-300"
                                        placeholder="Nhập lý do từ chối..."
                                        value={activeDocComment || docComments[selectedDoc] || ''}
                                        onChange={e => setActiveDocComment(e.target.value)}
                                        onBlur={() => {
                                            if (activeDocComment.trim()) handleDocCommentSave(selectedDoc);
                                        }}
                                    />
                                    {activeDocComment.trim() && (
                                        <button onClick={() => handleDocCommentSave(selectedDoc)} className="bg-red-600 text-white px-3 py-1 rounded text-[10px] font-bold">Lưu</button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <FileText size={64} className="text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 text-sm font-medium">Chọn một tài liệu bên trái để xem trước và duyệt</p>
                    </div>
                  )}
                </div>

                {/* ACTION BAR */}
                <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                  {showReturnForm ? (
                    <div className="space-y-3">
                      <textarea
                        value={returnComment}
                        onChange={e => setReturnComment(e.target.value)}
                        placeholder="Nhập lý do trả hồ sơ (bắt buộc)..."
                        className="w-full p-3 border border-red-200 rounded-lg text-sm outline-none focus:border-red-400 bg-red-50/50 min-h-[80px]"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setShowReturnForm(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold">Hủy</button>
                        <button onClick={handleReturn} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors">Xác nhận Trả Hồ Sơ</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 justify-end items-center">
                      <div className="mr-auto text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 italic">
                        * Tác vụ: Duyệt / Trả toàn bộ hồ sơ dựa trên kết quả kiểm tra từng tài liệu.
                      </div>
                      {mode === 'storage' && onReceiveHardCopy ? (
                        <button onClick={() => onReceiveHardCopy(profile.id)} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-all shadow-sm flex items-center gap-2">
                          <CheckCircle2 size={16} /> Đã Nhận Bản Cứng
                        </button>
                      ) : (
                        <>
                          <button onClick={() => setShowReturnForm(true)} className="px-8 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-sm hover:bg-red-700 transition-all shadow-xl shadow-red-200">
                            TRẢ HỒ SƠ
                          </button>
                          <button onClick={handleApprove} className="px-8 py-3 bg-[#00468E] text-white rounded-xl font-black uppercase text-sm hover:bg-blue-800 transition-all shadow-xl shadow-blue-200 flex items-center gap-2">
                            <CheckCircle2 size={18} /> DUYỆT HỒ SƠ
                          </button>
                        </>
                      )}
                      {mode === 'storage' && (
                        <div className="flex flex-1 gap-2">
                          <button onClick={handlePrintReceipt} className="flex-1 bg-white border border-[#00468E] text-[#00468E] px-4 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                              <Printer size={14} /> Biên Bản Nhận
                          </button>
                          <button onClick={() => alert("Đang tạo Phiếu thu hồ sơ...")} className="flex-1 bg-white border border-[#00468E] text-[#00468E] px-4 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                              <FileDown size={14} /> Phiếu Thu
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'form02' && (
            <div className="p-8 space-y-8 animate-fade-in max-w-4xl mx-auto">
              <div className="border-b-4 border-[#00468E] pb-4 flex justify-between items-end">
                <div>
                    <h4 className="font-black text-2xl text-[#00468E] uppercase tracking-tighter">Biểu Mẫu Số 02</h4>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Hồ sơ đăng ký mua/thuê/thuê mua nhà ở xã hội</p>
                </div>
                {mode === 'storage' && (
                    <button 
                        onClick={() => alert("Đang tạo Biên bản nhận hồ sơ (PDF)...")}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                    >
                        <FileText size={16} /> In Biên bản nhận hồ sơ
                    </button>
                )}
              </div>

              {/* SECTION 1: PERSONAL INFO */}
              <section className="space-y-4">
                <h5 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#00468E] text-white flex items-center justify-center text-[10px]">1</span>
                    Thông tin cá nhân & Đăng ký
                </h5>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Hình thức đăng ký</p>
                            <p className="text-xl font-black text-[#00468E] uppercase">
                                {profile.form02Data?.registrationRight === 'mua' ? 'Đăng ký Mua' : 
                                 profile.form02Data?.registrationRight === 'thue' ? 'Đăng ký Thuê' : 
                                 profile.form02Data?.registrationRight === 'thue_mua' ? 'Đăng ký Thuê Mua' : 'Chưa chọn'}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Tình trạng đăng ký</p>
                            <p className="text-sm font-bold text-slate-700">
                                {profile.form02Data?.registrationType === 'moi' ? 'Đăng ký lần đầu (Mới)' : 'Đăng ký chuyển nhượng'}
                            </p>
                            {profile.form02Data?.registrationType === 'chuyen_nhuong' && (
                                <div className="mt-2 text-[10px] font-bold text-[#00468E] bg-blue-50 p-2 rounded-lg border border-blue-100">
                                    <p>Người cũ: {profile.form02Data.oldOwnerName}</p>
                                    <p>ID: {profile.form02Data.oldOwnerId}</p>
                                    <p>Hợp đồng: {profile.form02Data.transferContractDate}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-100">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Số CCCD (12 số)</p>
                            <p className="text-sm font-mono font-bold text-slate-800">{profile.form02Data?.idNumber12 || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Số CMND (9 số)</p>
                            <p className="text-sm font-mono font-bold text-slate-800">{profile.form02Data?.idNumber09 || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Ngày cấp</p>
                            <p className="text-sm font-bold text-slate-800">{profile.form02Data?.idIssuanceDate || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Nơi cấp</p>
                            <p className="text-sm font-bold text-slate-800">{profile.form02Data?.idIssuancePlace || '—'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Số CMT CBCS Quân đội/Công an</p>
                            <p className="text-sm font-bold text-slate-800">{profile.form02Data?.militaryIdNumber || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Số điện thoại liên lạc</p>
                            <p className="text-sm font-bold text-slate-800">{profile.form02Data?.contactPhone || '—'}</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Hộ khẩu thường trú</p>
                                <p className="text-sm font-medium text-slate-700">{profile.form02Data?.permanentAddress || '—'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Tạm trú</p>
                                <p className="text-sm font-medium text-slate-700">{profile.form02Data?.temporaryAddress || '—'}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Địa chỉ hiện nay (Đăng ký)</p>
                            <p className="text-sm font-medium text-slate-700">{profile.form02Data?.currentAddress || '—'}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase text-slate-400">Số lượng người trong sổ hộ khẩu</p>
                            <p className="text-lg font-black text-[#00468E]">{profile.form02Data?.householdMemberCount || '—'} người</p>
                        </div>
                    </div>
                </div>
              </section>

              {/* SECTION 2: FAMILY MEMBERS */}
              <section className="space-y-3">
                <h5 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">2</span>
                    Thành viên trong gia đình
                </h5>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-3">Họ và tên</th>
                                <th className="px-4 py-3">Quan hệ</th>
                                <th className="px-4 py-3">Số CMTND (9 số)</th>
                                <th className="px-4 py-3">SỐ ĐỊNH DANH (12 SỐ)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(profile.form02Data?.familyMembers && profile.form02Data.familyMembers.length > 0) ? (
                                profile.form02Data.familyMembers.map((m: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50/50 text-[11px]">
                                        <td className="px-4 py-3 font-bold text-slate-800">{m.name}</td>
                                        <td className="px-4 py-3 text-slate-500 font-medium">{m.relationship}</td>
                                        <td className="px-4 py-3 font-mono text-slate-600 font-bold">{m.cccd09 || '—'}</td>
                                        <td className="px-4 py-3 font-mono font-bold text-[#00468E]">{m.cccd12 || '—'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400 italic">Không có thông tin thành viên</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
              </section>

              {/* SECTION 3: HOUSING STATUS */}
              <section className="space-y-3">
                <h5 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">3</span>
                    Tình trạng nhà ở khi nộp hồ sơ (Chọn 1 trong 4)
                </h5>
                <div className="grid grid-cols-1 gap-3">
                    <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${profile.form02Data?.housingStatus?.noHome ? 'bg-blue-50 border-[#00468E]' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${profile.form02Data?.housingStatus?.noHome ? 'bg-[#00468E] border-[#00468E]' : 'border-slate-300'}`}>
                            {profile.form02Data?.housingStatus?.noHome && <CheckCircle2 size={12} className="text-white" />}
                        </div>
                        <span className="text-xs font-bold text-slate-700 leading-relaxed">Chưa có nhà ở thuộc sở hữu của mình, chưa được mua, thuê hoặc thuê mua nhà ở xã hội, chưa được hưởng chính sách hỗ trợ nhà ở, đất ở dưới mọi hình thức tại nơi sinh sống, học tập</span>
                    </div>
                    <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${profile.form02Data?.housingStatus?.lowArea ? 'bg-blue-50 border-[#00468E]' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${profile.form02Data?.housingStatus?.lowArea ? 'bg-[#00468E] border-[#00468E]' : 'border-slate-300'}`}>
                            {profile.form02Data?.housingStatus?.lowArea && <CheckCircle2 size={12} className="text-white" />}
                        </div>
                        <span className="text-xs font-bold text-slate-700 leading-relaxed">Có nhà ở thuộc sở hữu của mình nhưng diện tích nhà ở bình quân đầu người trong hộ gia đình dưới 15m²/người</span>
                    </div>
                    <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${profile.form02Data?.housingStatus?.farAway ? 'bg-blue-50 border-[#00468E]' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${profile.form02Data?.housingStatus?.farAway ? 'bg-[#00468E] border-[#00468E]' : 'border-slate-300'}`}>
                            {profile.form02Data?.housingStatus?.farAway && <CheckCircle2 size={12} className="text-white" />}
                        </div>
                        <span className="text-xs font-bold text-slate-700 leading-relaxed">Có nhà ở nhưng cách xa địa điểm làm việc (theo Nghị quyết 201/2025)</span>
                    </div>
                    <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${profile.form02Data?.housingStatus?.other ? 'bg-blue-50 border-[#00468E]' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${profile.form02Data?.housingStatus?.other ? 'bg-[#00468E] border-[#00468E]' : 'border-slate-300'}`}>
                            {profile.form02Data?.housingStatus?.other && <CheckCircle2 size={12} className="text-white" />}
                        </div>
                        <span className="text-xs font-bold text-slate-700 leading-relaxed">Loại khác</span>
                    </div>
                </div>
              </section>

              {/* SECTION 4: CLASSIFICATION */}
              <section className="space-y-3">
                <h5 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">4</span>
                    Phân loại đối tượng (Chọn 1 trong 12 loại)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { key: 'nguoiCoCong', label: '1. Người có công với cách mạng, thân nhân liệt sĩ thuộc trường hợp được hỗ trợ cải thiện nhà ở theo quy định của Pháp lệnh Ưu đãi người có công với cách mạng' },
                        { key: 'ngheoNongThon', label: '2. Hộ gia đình nghèo, cận nghèo tại khu vực nông thôn' },
                        { key: 'ngheoThienTai', label: '3. Hộ gia đình nghèo, cận nghèo tại khu vực nông thôn thuộc vùng thường xuyên bị ảnh hưởng bởi thiên tai, biến đổi khí hậu' },
                        { key: 'ngheoDoThi', label: '4. Hộ gia đình nghèo, cận nghèo tại khu vực đô thị' },
                        { key: 'thuNhapThap', label: '5. Người thu nhập thấp tại khu vực đô thị' },
                        { key: 'congNhan', label: '6. Công nhân, người lao động đang làm việc tại doanh nghiệp, hợp tác xã, liên hiệp hợp tác xã trong và ngoài khu công nghiệp' },
                        { key: 'lucLuongVuTrang', label: '7. Sĩ quan, quân nhân chuyên nghiệp, hạ sĩ quan thuộc lực lượng vũ trang nhân dân, công nhân công an, công chức, công nhân và viên chức quốc phòng đang phục vụ tại ngũ; người làm công tác cơ yếu, người làm công tác khác trong tổ chức cơ yếu hưởng lương từ ngân sách nhà nước đang công tác' },
                        { key: 'canBoCongChuc', label: '8. Cán bộ, công chức, viên chức theo quy định của pháp luật về cán bộ, công chức, viên chức' },
                        { key: 'traNhaCongVu', label: '9. Đối tượng đã trả lại nhà ở công vụ theo quy định tại khoản 4 Điều 125 của Luật này, trừ trường hợp bị thu hồi nhà ở công vụ do vi phạm quy định của Luật này.' },
                        { key: 'thuHoiDat', label: '10. Hộ gia đình, cá nhân thuộc trường hợp bị thu hồi đất và phải giải tỏa, phá dỡ nhà ở theo quy định của pháp luật mà chưa được Nhà nước bồi thường bằng nhà ở, đất ở' },
                        { key: 'hocSinhSinhVien', label: '11. Học sinh, sinh viên đại học, học viện, trường đại học, cao đẳng, dạy nghề, trường chuyên biệt theo quy định của pháp luật; học sinh trường dân tộc nội trú công lập.' },
                        { key: 'doanhNghiep', label: '12. Doanh nghiệp, hợp tác xã, liên hiệp hợp tác xã trong khu công nghiệp' }
                    ].map((item) => {
                        const isSelected = (profile.form02Data?.subjectCategory as any)?.[item.key];
                        return (
                            <div key={item.key} className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                    {isSelected && <CheckCircle2 size={10} className="text-white" />}
                                </div>
                                <span className={`text-[10px] font-bold leading-tight ${isSelected ? 'text-indigo-900' : 'text-slate-500'}`}>{item.label}</span>
                            </div>
                        );
                    })}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'log' && (
            <div className="p-6">
              <h4 className="font-black text-[#00468E] text-sm uppercase mb-4">Nhật Ký Thao Tác</h4>
              {(profile.actionLog && profile.actionLog.length > 0) ? (
                <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                  {[...profile.actionLog].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).map((log, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-[#00468E] border-2 border-white shadow-sm" />
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-bold text-[#00468E]">{log.actor}</span>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock size={10} /> {new Date(log.time).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-700">{log.action}</p>
                        {log.comment && (
                          <div className="mt-2 bg-orange-50 border border-orange-100 p-2 rounded-lg text-xs text-orange-700 font-medium">
                            <strong>Ghi chú:</strong> {log.comment}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Clock size={48} className="mx-auto text-slate-200 mb-3" />
                  <p className="font-medium">Chưa có nhật ký thao tác.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
