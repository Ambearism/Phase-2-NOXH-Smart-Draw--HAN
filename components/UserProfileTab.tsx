import React from 'react';
import { User, ShieldCheck, Mail, Phone, FileText, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { Participant } from '../types';

interface UserProfileTabProps {
  currentUser: Participant;
  isDesktop?: boolean;
}

export const UserProfileTab: React.FC<UserProfileTabProps> = ({ currentUser, isDesktop = false }) => {
  return (
    <div className={`flex-1 flex flex-col h-full bg-slate-50 animate-fade-in overflow-y-auto ${isDesktop ? 'pb-10' : 'pb-24'}`}>
      <div className={`${isDesktop ? 'bg-gradient-to-r from-[#00468E] to-blue-800 p-12 rounded-b-[3rem]' : 'bg-[#00468E] p-8 rounded-b-[2.5rem]'} text-white shadow-xl relative z-10`}>
        <h2 className={`${isDesktop ? 'text-4xl' : 'text-2xl'} font-black uppercase tracking-tighter mb-1`}>Hồ Sơ Của Tôi</h2>
        <p className={`${isDesktop ? 'text-sm' : 'text-xs'} font-bold text-blue-200`}>Thông tin đăng ký & Dữ liệu biểu mẫu 02</p>
      </div>

      <div className={`${isDesktop ? 'px-12 grid grid-cols-12 gap-8' : 'px-6 space-y-6'} -mt-8 relative z-20 pb-12`}>
        {/* LEFT COLUMN: Core Info (Desktop: 4 cols) */}
        <div className={`${isDesktop ? 'col-span-4' : ''} space-y-6`}>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-50">
              <div className="w-24 h-24 rounded-[2rem] bg-slate-100 p-1 mb-4 shadow-inner">
                <img src={currentUser.photo || `https://i.pravatar.cc/150?u=${currentUser.id}`} className="w-full h-full object-cover rounded-[1.8rem]" alt="avatar" />
              </div>
              <p className="text-xl font-black text-slate-800 uppercase leading-tight mb-1">{currentUser.name}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentUser.id}</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00468E] flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">CCCD (12 số)</p>
                  <p className="text-sm font-black text-slate-700 font-mono">{currentUser.cccd || currentUser.form02Data?.idNumber12 || '—'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00468E] flex items-center justify-center shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Số điện thoại</p>
                  <p className="text-sm font-black text-slate-700">{currentUser.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00468E] flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Email</p>
                  <p className="text-sm font-black text-slate-700">{currentUser.email || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Log Snapshot */}
          {currentUser.actionLog && currentUser.actionLog.length > 0 && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-black text-slate-800 uppercase text-xs mb-4 flex items-center gap-2 tracking-widest">
                  <Clock size={16} /> Nhật ký hồ sơ
              </h3>
              <div className="space-y-4">
                  {currentUser.actionLog.slice(-5).reverse().map((log, i) => (
                      <div key={i} className="flex gap-3 items-start">
                          <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#00468E] mt-1.5" />
                          <div>
                              <p className="text-[11px] font-bold text-slate-700 leading-tight">{log.action}</p>
                              <p className="text-[9px] text-slate-400 font-black uppercase mt-0.5 tracking-tighter">{new Date(log.time).toLocaleString('vi-VN')}</p>
                          </div>
                      </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Biểu mẫu 02 Data (Desktop: 8 cols) */}
        <div className={`${isDesktop ? 'col-span-8' : ''}`}>
          {currentUser.form02Data ? (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <h3 className="font-black text-[#00468E] uppercase text-sm flex items-center gap-2">
                  <FileText size={20} /> Chi tiết Biểu mẫu 02
                </h3>
                <div className="flex gap-2">
                  <span className="text-[10px] font-black text-[#00468E] bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest border border-blue-100">
                    {currentUser.form02Data.registrationRight}
                  </span>
                  <span className="text-[10px] font-black text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-100">
                    {currentUser.form02Data.registrationType}
                  </span>
                </div>
              </div>
              
              <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'} gap-8`}>
                <div className="space-y-6">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Thông tin định danh</p>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1 opacity-50">Họ tên chủ hồ sơ</p>
                         <p className="text-xs font-black text-slate-800">{currentUser.form02Data.ownerName || currentUser.name}</p>
                       </div>
                       <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1 opacity-50">Ngày sinh</p>
                         <p className="text-xs font-black text-slate-800">{currentUser.form02Data.dob || '—'}</p>
                       </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Giấy tờ tùy thân</p>
                    <div className="grid grid-cols-2 gap-3">
                       {currentUser.form02Data.idNumber12 && (
                         <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-1 opacity-50">CCCD (12 số)</p>
                           <p className="text-xs font-black text-slate-800 font-mono">{currentUser.form02Data.idNumber12}</p>
                         </div>
                       )}
                       {currentUser.form02Data.idNumber09 && (
                         <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-1 opacity-50">CMND (9 số)</p>
                           <p className="text-xs font-black text-slate-800 font-mono">{currentUser.form02Data.idNumber09}</p>
                         </div>
                       )}
                       {currentUser.form02Data.militaryIdNumber && (
                         <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-1 opacity-50">Số hiệu quân nhân</p>
                           <p className="text-xs font-black text-slate-800 font-mono">{currentUser.form02Data.militaryIdNumber}</p>
                         </div>
                       )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Địa chỉ & Cư trú</p>
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1 opacity-50">Nơi ở hiện tại</p>
                        <p className="text-xs font-bold text-slate-700 leading-relaxed">{currentUser.form02Data.currentAddress}</p>
                      </div>
                      {currentUser.form02Data.temporaryAddress && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1 opacity-50">Tạm trú</p>
                          <p className="text-xs font-bold text-slate-700 leading-relaxed">{currentUser.form02Data.temporaryAddress}</p>
                        </div>
                      )}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1 opacity-50">Hộ khẩu thường trú</p>
                        <p className="text-xs font-bold text-slate-700 leading-relaxed">{currentUser.form02Data.permanentAddress}</p>
                      </div>
                    </div>
                  </div>

                  {currentUser.form02Data.registrationType === 'chuyen_nhuong' && (
                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                       <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-3 leading-none">Thông tin chuyển nhượng</p>
                       <div className="grid grid-cols-1 gap-3">
                         <div className="flex justify-between items-center py-1 border-b border-orange-200/50">
                            <span className="text-[10px] text-orange-800 font-bold uppercase">Chủ cũ</span>
                            <span className="text-[11px] font-black text-orange-900 uppercase">{currentUser.form02Data.oldOwnerName || '—'}</span>
                         </div>
                         <div className="flex justify-between items-center py-1 border-b border-orange-200/50">
                            <span className="text-[10px] text-orange-800 font-bold uppercase">Số CCCD chủ cũ</span>
                            <span className="text-[11px] font-black text-orange-900 font-mono">{currentUser.form02Data.oldOwnerId || '—'}</span>
                         </div>
                         <div className="flex justify-between items-center py-1">
                            <span className="text-[10px] text-orange-800 font-bold uppercase">Ngày ký hợp đồng</span>
                            <span className="text-[11px] font-black text-orange-900 leading-none">{currentUser.form02Data.transferContractDate || '—'}</span>
                         </div>
                       </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Cấp giấy tờ</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1 opacity-50">Ngày cấp</p>
                        <p className="text-sm font-black text-[#00468E]">{currentUser.form02Data.idIssuanceDate}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1 opacity-50">Nơi cấp</p>
                        <p className="text-sm font-black text-[#00468E] truncate">{currentUser.form02Data.idIssuancePlace}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Thành viên ({currentUser.form02Data.familyMembers?.length || 0})</p>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {currentUser.form02Data.familyMembers?.map((m, i) => (
                        <div key={i} className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-sm transition-all duration-200">
                          <div className="flex gap-3 items-center">
                             <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 font-black text-[10px]">{i+1}</div>
                             <div>
                               <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{m.name}</p>
                               <p className="text-[9px] font-black text-slate-400 uppercase leading-none">{m.relationship}</p>
                             </div>
                          </div>
                          <p className="text-[10px] font-black text-slate-500 font-mono italic shrink-0">{m.cccd12 || m.cccd09}</p>
                        </div>
                      ))}
                      {(!currentUser.form02Data.familyMembers || currentUser.form02Data.familyMembers.length === 0) && (
                        <p className="text-[10px] text-slate-400 italic font-medium">Không có thành viên đi kèm</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Tình trạng nhà ở hiện tại</p>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.form02Data.housingStatus?.noHome && <span className="bg-green-50 text-green-700 text-[10px] font-black px-3 py-2 rounded-xl border border-green-100 shadow-sm">CHƯA CÓ NHÀ Ở</span>}
                      {currentUser.form02Data.housingStatus?.lowArea && <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-3 py-2 rounded-xl border border-blue-100 shadow-sm">DIỆN TÍCH HẸP (&lt;15m2)</span>}
                      {currentUser.form02Data.housingStatus?.farAway && <span className="bg-orange-50 text-orange-700 text-[10px] font-black px-3 py-2 rounded-xl border border-orange-100 shadow-sm">XA NƠI LÀM VIỆC</span>}
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Phân loại đối tượng (Điều 76)</p>
                    <div className="space-y-2">
                      {Object.entries(currentUser.form02Data.subjectCategory || {}).map(([key, value]) => {
                        if (!value) return null;
                        const labels: Record<string, string> = {
                          nguoiCoCong: 'Người có công với cách mạng',
                          ngheoNongThon: 'Hộ nghèo, cận nghèo nông thôn',
                          ngheoThienTai: 'Hộ nghèo vùng thiên tai',
                          ngheoDoThi: 'Hộ nghèo, cận nghèo đô thị',
                          thuNhapThap: 'Người thu nhập thấp đô thị',
                          congNhan: 'Công nhân, người lao động',
                          lucLuongVuTrang: 'Lực lượng vũ trang nhân dân',
                          canBoCongChuc: 'Cán bộ, công chức, viên chức',
                          traNhaCongVu: 'Người đã trả nhà công vụ',
                          thuHoiDat: 'Đối tượng bị thu hồi đất',
                          hocSinhSinhVien: 'Học sinh, sinh viên',
                          doanhNghiep: 'Doanh nghiệp trong KCN'
                        };
                        return (
                          <div key={key} className="text-[11px] font-black text-[#00468E] border-l-4 border-[#00468E] pl-4 py-3 bg-blue-50/20 rounded-r-2xl shadow-sm uppercase tracking-tight">
                            {labels[key]}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center space-y-4">
              <div className="w-20 h-20 bg-orange-50 text-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={40} />
              </div>
              <h4 className="text-xl font-black text-slate-800 uppercase">Chưa có dữ liệu biểu mẫu</h4>
              <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto">Vui lòng hoàn thành nộp hồ sơ trực tuyển để hệ thống cập nhật thông tin chi tiết của bạn.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
