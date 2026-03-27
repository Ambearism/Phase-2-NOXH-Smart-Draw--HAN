import React from 'react';
import { Home, FileText, UserCheck, PlayCircle, Trophy, PartyPopper, ChevronRight, Download, FileBadge } from 'lucide-react';
import { Participant } from '../types';

interface UserDashboardProps {
  currentUser: Participant;
  sessionStatus: 'waiting' | 'live' | 'completed';
  lobbyCountdown: number;
  formatTime: (seconds: number) => string;
  onLogout: () => void;
  onNavigate: (step: number) => void;
  onStartSubmission: () => void;
  onViewApplicationStatus: () => void;
  onTriggerDemoLive: () => void; // for the demo button
  isDesktop?: boolean;
}

export function UserDashboard({ 
  currentUser, 
  sessionStatus, 
  lobbyCountdown, 
  formatTime,
  onLogout,
  onNavigate,
  onStartSubmission,
  onViewApplicationStatus,
  onTriggerDemoLive,
  isDesktop = false
}: UserDashboardProps) {
  // Mode A: Not completed
  // Mode B: Completed
  const isApplicationCompleted = currentUser.applicationState === 'hoan_thanh';

  const checkOfficeHours = () => {
    const now = new Date();
    const day = now.getDay();
    const timeInMinutes = now.getHours() * 60 + now.getMinutes();
    
    // 08:00 (480) - 17:30 (1050), Mon-Fri (1-5)
    const isWorkingHours = (day >= 1 && day <= 5) && (timeInMinutes >= 480 && timeInMinutes <= 1050);
    
    if (!isWorkingHours) {
        return window.confirm("Hệ thống chỉ tiếp nhận hồ sơ trong giờ hành chính (08:00 - 17:30, Thứ 2 - Thứ 6).\n\n[DEMO DIALOG]: Hiện đang ngoài giờ. Bạn có muốn bỏ qua giới hạn để xem Demo không?");
    }
    return true;
  };

  const handleStartSubmission = () => {
      if (checkOfficeHours()) {
          onStartSubmission();
      }
  };

  return (
    <div className={`flex-1 flex flex-col h-full animate-fade-in relative ${isDesktop ? 'px-10 py-8 bg-slate-50' : ''}`}>
      {/* Top Profile Section */}
      <div className={`${isDesktop ? 'rounded-3xl px-10 py-6 mb-8 flex items-center justify-between' : 'p-8 pb-14 rounded-b-[3.5rem] mt-[-1px] mx-[-1px]'} bg-[#00468E] text-white shadow-xl relative z-10`}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`${isDesktop ? 'w-14 h-14' : 'w-14 h-14'} rounded-full bg-white p-1 border-2 border-white/20 overflow-hidden shadow-lg shrink-0`}>
            <img src={currentUser.photo || ''} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className={`flex ${isDesktop ? 'items-center gap-3' : 'flex-col gap-1'} mb-0.5`}>
              <h2 className={`${isDesktop ? 'text-xl' : 'text-lg'} font-black uppercase tracking-tighter leading-none truncate`}>
                {currentUser.name}
              </h2>
              <div className="inline-flex w-fit bg-white/10 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-sm">
                {isApplicationCompleted ? "THÀNH VIÊN" : "TÀI KHOẢN MỚI"}
              </div>
            </div>
            <p className={`${isDesktop ? 'text-[10px]' : 'text-[9px]'} font-bold opacity-50 tracking-widest`}>{currentUser.id}</p>
          </div>
        </div>

        {isDesktop && (
          <div className="flex gap-6 items-center">
              <div className="text-right border-r border-white/10 pr-6">
                  <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-0.5">Thời gian phiên</p>
                  <p className="text-sm font-mono font-bold tracking-tighter">14:55:02</p>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Hệ thống Live</span>
              </div>
          </div>
        )}
      </div>

      {/* Modules Grid */}
      <div className={`${isDesktop ? 'px-0 grid grid-cols-6 gap-4' : 'px-4 -mt-10 grid grid-cols-2 gap-3'} relative z-20 pb-10 overflow-y-auto`}>
        {/* MODULE 1: PROFILE INFO */}
        <div className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between ${isDesktop ? 'h-32' : 'h-24'} relative overflow-hidden group transition-all text-left ring-2 ring-green-50`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-green-100 text-green-600`}>
            <UserCheck size={16} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Trạng thái</p>
            <p className={`text-xs font-black text-green-600 uppercase`}>Đã đăng nhập</p>
          </div>
        </div>

        {/* MODULE 2: RULES */}
        <button onClick={() => onNavigate(11)} className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between ${isDesktop ? 'h-32' : 'h-24'} active:scale-95 transition-all text-left`}>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
            <FileText size={16} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Thông tin</p>
            <p className="text-xs font-black text-slate-800 uppercase">Thể lệ dự án</p>
          </div>
        </button>


        {/* =========================================
            MODE A: APPLICATION SUBMISSION PHASE
            ========================================= */}
        {!isApplicationCompleted ? (
          <React.Fragment>
            <button 
              onClick={handleStartSubmission}
              className={`rounded-2xl shadow-lg text-white relative overflow-hidden group active:scale-95 transition-all text-left bg-gradient-to-br from-[#00468E] to-blue-600 shadow-blue-200 ${isDesktop ? 'col-span-3 h-32 p-6' : 'col-span-2 p-6 h-40'}`}
            >
              <div className="relative z-10 flex items-center justify-between h-full">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-blue-200 opacity-80">GIAI ĐOẠN 1</p>
                  <h3 className={`${isDesktop ? 'text-xl' : 'text-2xl'} font-black uppercase tracking-tighter leading-tight`}>
                    Nộp hồ sơ{isDesktop ? "" : <br/>} trực tuyến
                  </h3>
                  {isDesktop && <p className="text-[9px] mt-2 font-bold opacity-60">Thủ tục nhanh gọn, minh bạch</p>}
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm text-white border border-white/30">
                  <FileBadge size={20} />
                </div>
              </div>
            </button>

            {/* Application Tracking View */}
            <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden ${isDesktop ? 'col-span-6 mt-4' : 'col-span-2'}`}>
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-[#00468E] text-base flex items-center gap-2">
                    <FileText size={18} /> Theo dõi hồ sơ của bạn
                </h4>
                {isDesktop && (
                    <button onClick={onViewApplicationStatus} className="px-4 py-2 bg-slate-50 text-[#00468E] rounded-xl text-[10px] font-black uppercase hover:bg-slate-100 transition-colors border border-slate-100">
                        Xem chi tiết lịch sử xử lý
                    </button>
                )}
              </div>
              
              {!currentUser.applicationState || currentUser.applicationState === 'nhap' ? (
                <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  Chưa có dữ liệu hồ sơ được nộp
                </div>
              ) : (
                <div className="space-y-6">
                  {/* STATUS PROGRESSION BAR */}
                  <div className="flex items-center gap-2">
                    {[
                      { key: 'da_nhan', label: 'Đã nhận' },
                      { key: 'dang_xu_ly', label: 'Đang xử lý' },
                      { key: 'cho_ban_cung', label: 'Chờ bản cứng' },
                      { key: 'hoan_thanh', label: 'Hoàn thành' }
                    ].map((step, i) => {
                      const stateOrder = ['da_nhan', 'dang_xu_ly', 'cho_ban_cung', 'hoan_thanh'];
                      const currentIdx = stateOrder.indexOf(currentUser.applicationState === 'tra_ho_so' ? 'da_nhan' : (currentUser.applicationState === 'qua_han_ban_cung' ? 'cho_ban_cung' : (currentUser.applicationState || '')));
                      const isActive = i <= currentIdx;
                      
                      return (
                        <div key={step.key} className="flex-1 flex flex-col gap-2">
                            <div className={`h-1.5 rounded-full ${isActive ? 'bg-[#00468E]' : 'bg-slate-100'}`} />
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-[#00468E]' : 'text-slate-300'}`}>{step.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className={`grid ${isDesktop ? 'grid-cols-2 gap-6' : 'grid-cols-1 gap-4'}`}>
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Trạng thái hiện tại</p>
                        <p className="text-sm font-black text-slate-800 uppercase mt-1">
                            {
                            currentUser.applicationState === 'da_nhan' ? 'Đã Nhận Hồ Sơ' :
                            currentUser.applicationState === 'dang_xu_ly' ? 'Đang Xử Lý' :
                            currentUser.applicationState === 'tra_ho_so' ? 'Trả Hồ Sơ' :
                            currentUser.applicationState === 'cho_ban_cung' ? 'Chờ Nộp Bản Cứng' :
                            currentUser.applicationState === 'qua_han_ban_cung' ? 'Quá Hạn Bản Cứng' : 'Hoàn Thành'
                            }
                        </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${['tra_ho_so', 'qua_han_ban_cung'].includes(currentUser.applicationState || '') ? 'bg-red-500 animate-pulse' : currentUser.applicationState === 'hoan_thanh' ? 'bg-green-500' : 'bg-blue-500'}`} />
                    </div>

                    {currentUser.applicationState === 'tra_ho_so' && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-xs text-red-700 font-medium flex items-center justify-between gap-4">
                            <div>
                                <p className="font-black uppercase text-[9px] tracking-widest mb-1">Cảnh báo: Hồ sơ bị trả lại</p>
                                <p className="text-[10px]"><strong>Lý do:</strong> {currentUser.returnReason}</p>
                            </div>
                            <button onClick={handleStartSubmission} className="shrink-0 px-4 py-2 bg-red-600 text-white rounded-lg font-black uppercase text-[9px] hover:bg-red-700 transition-all">
                                Bổ sung ngay
                            </button>
                        </div>
                    )}

                    {['cho_ban_cung', 'qua_han_ban_cung'].includes(currentUser.applicationState || '') && (
                        <div className={`p-4 rounded-xl text-xs font-medium border flex items-center justify-between ${currentUser.applicationState === 'qua_han_ban_cung' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                            <div>
                                <p className="font-black uppercase text-[9px] tracking-widest mb-1">Lịch hẹn nộp bản cứng</p>
                                <p className="text-sm font-black tracking-tight">{new Date(currentUser.hardCopyDueDate || '').toLocaleDateString('vi-VN')}</p>
                            </div>
                            {currentUser.hardCopyDueDate && (() => {
                                const daysLeft = Math.ceil((new Date(currentUser.hardCopyDueDate).getTime() - Date.now()) / 86400000);
                                return <div className={`shrink-0 px-3 py-1 rounded-full text-[9px] font-black uppercase ${daysLeft <= 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-orange-100 text-orange-700'}`}>
                                    {daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Quá hạn'}
                                </div>;
                            })()}
                        </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </React.Fragment>
        ) : (
          /* =========================================
             MODE B: LOTTERY WAITING PHASE
             ========================================= */
          <>
            {sessionStatus === 'live' ? (
              <button 
                onClick={() => {
                  if (!currentUser.checkInStatus) {
                    alert("Vui lòng hoàn thành Đăng nhập trước khi tham gia.");
                    return;
                  }
                  onNavigate(7);
                }} 
                className="w-full p-6 rounded-[2rem] shadow-lg text-white relative overflow-hidden group active:scale-95 transition-all text-left bg-gradient-to-r from-red-600 to-orange-600 shadow-orange-200 animate-pulse ring-4 ring-orange-300 ring-opacity-50"
              >
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-yellow-200">SỰ KIỆN TRỰC TIẾP</p>
                    <h3 className="text-2xl font-black uppercase tracking-tighter leading-tight">VÀO BỐC THĂM NGAY</h3>
                    <p className="text-xs font-medium mt-2 flex items-center gap-2 text-white">
                      <span className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full border border-white/30"><span className="w-2 h-2 bg-green-400 rounded-full animate-ping"></span> ĐANG DIỄN RA</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm bg-white text-red-600">
                    <PlayCircle size={24} />
                  </div>
                </div>
                <Trophy size={100} className="absolute -bottom-4 -right-4 text-white/10" />
              </button>
            ) : (
              <div className="w-full p-6 rounded-[2rem] bg-white border border-slate-200 shadow-sm text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">SỰ KIỆN BỐC THĂM SẮP DIỄN RA</p>
                <div className="text-4xl font-black text-slate-800 tracking-tighter font-mono mb-2">
                  {formatTime(lobbyCountdown)}
                </div>
                <p className="text-xs font-bold text-slate-500">Hồ sơ chờ vòng quay</p>
                <button 
                  onClick={onTriggerDemoLive}
                  className="mt-4 px-4 py-2 bg-slate-100 text-slate-400 rounded-full text-[10px] font-bold uppercase hover:bg-slate-200 hover:text-slate-600"
                >
                  Kích hoạt (Demo)
                </button>
              </div>
            )}

            {/* MODULE: RESULT / APP STATUS (Mode B) */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentUser.drawStatus === 'trung' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'}`}>
                    <PartyPopper size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Trạng thái bốc thăm</p>
                    <p className="text-sm font-bold text-slate-800">
                      {currentUser.drawStatus === 'cho' ? 'Chưa bốc thăm' : (currentUser.drawStatus === 'trung' ? `TRÚNG QUYỀN ${currentUser.right === 'mua' ? 'MUA' : currentUser.right === 'thue' ? 'THUÊ' : 'THUÊ-MUA'}` : 'KHÔNG TRÚNG')}
                    </p>
                  </div>
                </div>
                {currentUser.drawStatus === 'trung' && (
                  <button onClick={() => { onNavigate(7); }} className="text-[10px] font-bold text-[#00468E] uppercase underline">Xem</button>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <FileBadge size={16} className="text-[#00468E]" />
                  <p className="text-xs font-bold text-slate-700">Hồ sơ hợp lệ đã hoàn thành</p>
                </div>
                <button onClick={onViewApplicationStatus} className="text-[10px] font-bold text-[#00468E] uppercase underline">Chi tiết hồ sơ</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
