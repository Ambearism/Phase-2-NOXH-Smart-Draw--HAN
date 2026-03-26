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
  onTriggerDemoLive
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
    <div className="flex-1 flex flex-col h-full animate-fade-in relative">
      {/* Top Profile Section */}
      <div className="bg-[#00468E] text-white p-8 pb-12 rounded-b-[2.5rem] shadow-xl relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/20 flex gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest">
              {isApplicationCompleted ? "THÀNH VIÊN" : "TÀI KHOẢN MỚI"}
            </p>
          </div>
          <button onClick={onLogout} className="text-[10px] font-bold text-white/60 hover:text-white uppercase">Đăng xuất</button>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white p-1 border-2 border-white/20 overflow-hidden">
            <img src={currentUser.photo || ''} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">{currentUser.name}</h2>
            <p className="text-xs font-medium opacity-80">{currentUser.id}</p>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="px-6 -mt-8 relative z-20 space-y-4 pb-10 overflow-y-auto">
        
        <div className="grid grid-cols-2 gap-4">
          {/* MODULE 1: PROFILE INFO */}
          <div className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-36 relative overflow-hidden group transition-all text-left ring-2 ring-green-100`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 bg-green-100 text-green-600`}>
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Trạng thái</p>
              <p className={`text-sm font-bold text-green-600`}>ĐÃ ĐĂNG NHẬP</p>
            </div>
          </div>

          {/* MODULE 2: RULES */}
          <button onClick={() => onNavigate(11)} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-36 active:scale-95 transition-all text-left">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Thông tin</p>
              <p className="text-sm font-bold text-slate-800">Thể lệ & Hướng dẫn</p>
            </div>
          </button>
        </div>

        {/* =========================================
            MODE A: APPLICATION SUBMISSION PHASE
            ========================================= */}
        {!isApplicationCompleted ? (
          <>
            <button 
              onClick={handleStartSubmission}
              className="w-full p-6 rounded-[2rem] shadow-lg text-white relative overflow-hidden group active:scale-95 transition-all text-left bg-gradient-to-r from-[#00468E] to-blue-500 shadow-blue-200"
            >
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-blue-200">GIAI ĐOẠN 1: TIẾP NHẬN</p>
                  <h3 className="text-2xl font-black uppercase tracking-tighter leading-tight">
                    NỘP HỒ SƠ<br/>TRỰC TUYẾN
                  </h3>
                  <p className="text-[10px] mt-2 font-bold opacity-90">Bắt buộc đối chiếu 100% hồ sơ gốc</p>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm text-white border border-white/30">
                  <FileBadge size={24} />
                </div>
              </div>
            </button>

            {/* Application Tracking View */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <h4 className="font-black text-[#00468E] mb-3 text-sm flex items-center gap-2">
                <FileText size={16} /> Trạng thái hồ sơ của bạn
              </h4>
              
              {!currentUser.applicationState || currentUser.applicationState === 'nhap' ? (
                <div className="text-center py-4 text-slate-500 text-xs font-medium">
                  Chưa có hồ sơ trực tuyến nào được nộp. Vui lòng bấm "Nộp hồ sơ trực tuyến".
                </div>
              ) : (
                <div className="space-y-3">
                  {/* STATUS PROGRESSION BAR */}
                  <div className="flex items-center gap-1 mb-4">
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
                        <React.Fragment key={step.key}>
                          <div className={`flex-1 h-1.5 rounded-full ${isActive ? 'bg-[#00468E]' : 'bg-slate-200'}`} />
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase -mt-2 mb-2 px-0.5">
                    <span>Đã nhận</span><span>Xử lý</span><span>Bản cứng</span><span>Hoàn thành</span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Trạng thái hiện tại</p>
                      <p className="text-sm font-bold text-slate-800 uppercase mt-0.5">
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
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-xs text-red-700 font-medium space-y-2">
                      <p className="font-black uppercase text-[10px]">Hồ sơ bị trả lại</p>
                      <p><strong>Lý do kiểm soát viên:</strong> {currentUser.returnReason}</p>
                      <button onClick={handleStartSubmission} className="w-full py-2.5 bg-red-600 text-white rounded-lg font-bold uppercase text-[10px] hover:bg-red-700 transition-all mt-1">
                        Bổ sung / Nộp lại hồ sơ
                      </button>
                    </div>
                  )}

                  {['cho_ban_cung', 'qua_han_ban_cung'].includes(currentUser.applicationState || '') && (
                    <div className={`p-4 rounded-lg text-xs font-medium border ${currentUser.applicationState === 'qua_han_ban_cung' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                      <div className="flex justify-between items-center">
                        <strong>Hạn nộp bản cứng:</strong>
                        <span className="font-black">{new Date(currentUser.hardCopyDueDate || '').toLocaleDateString('vi-VN')}</span>
                      </div>
                      {currentUser.hardCopyDueDate && (() => {
                        const daysLeft = Math.ceil((new Date(currentUser.hardCopyDueDate).getTime() - Date.now()) / 86400000);
                        return <p className={`mt-1 font-bold ${daysLeft <= 0 ? 'text-red-700 animate-pulse' : ''}`}>
                          {daysLeft > 0 ? `Còn ${daysLeft} ngày để nộp bản cứng` : 'ĐÃ QUÁ HẠN NỘP BẢN CỨNG!'}
                        </p>;
                      })()}
                      <p className="mt-1 text-[10px] opacity-80">Vui lòng nộp trực tiếp tại ban quản lý dự án trước thời hạn.</p>
                    </div>
                  )}
                  
                  <button onClick={onViewApplicationStatus} className="w-full py-2 bg-slate-100 text-[#00468E] rounded-lg text-xs font-bold uppercase hover:bg-slate-200 transition-colors">
                    Chi tiết xử lý <ChevronRight size={14} className="inline" />
                  </button>
                </div>
              )}
            </div>
          </>
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
