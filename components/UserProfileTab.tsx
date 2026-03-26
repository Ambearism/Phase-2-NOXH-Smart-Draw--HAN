import React from 'react';
import { User, ShieldCheck, Mail, Phone, FileText, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { Participant } from '../types';

interface UserProfileTabProps {
  currentUser: Participant;
}

export const UserProfileTab: React.FC<UserProfileTabProps> = ({ currentUser }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 animate-fade-in overflow-y-auto pb-24">
      <div className="bg-[#00468E] text-white p-8 pb-12 rounded-b-[2.5rem] shadow-xl relative z-10">
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">Hồ Sơ Của Tôi</h2>
        <p className="text-xs font-bold text-blue-200">Thông tin đăng ký & Dữ liệu biểu mẫu 02</p>
      </div>

      <div className="px-6 -mt-8 relative z-20 space-y-6">
        {/* Core Info */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 p-1">
              <img src={currentUser.photo || `https://i.pravatar.cc/150?u=${currentUser.id}`} className="w-full h-full object-cover rounded-2xl" alt="avatar" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 uppercase leading-none mb-1">{currentUser.name}</p>
              <p className="text-xs font-bold text-slate-400">{currentUser.id}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#00468E] flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Số CCCD (12 số)</p>
                  <p className="text-sm font-bold text-slate-700 font-mono italic">{currentUser.cccd || currentUser.form02Data?.idNumber12 || '—'}</p>
                </div>
              </div>
              
              {currentUser.form02Data?.idNumber09 && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Số CMND (9 số)</p>
                    <p className="text-sm font-bold text-slate-600 font-mono italic">{currentUser.form02Data.idNumber09}</p>
                  </div>
                </div>
              )}

              {currentUser.form02Data?.militaryIdNumber && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Số CMT CBCS Quân đội/Công an</p>
                    <p className="text-sm font-bold text-orange-900 font-mono italic">{currentUser.form02Data.militaryIdNumber}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#00468E] flex items-center justify-center">
                <Phone size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Số điện thoại</p>
                <p className="text-sm font-bold text-slate-700">{currentUser.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Biểu mẫu 02 Data */}
        {currentUser.form02Data ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-black text-[#00468E] uppercase text-sm mb-4 flex items-center gap-2 border-b border-slate-50 pb-2">
                <FileText size={16} /> Thông tin Biểu mẫu 02
              </h3>
              
              <div className="space-y-6">
                {/* 0. Cơ bản */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Địa chỉ nơi ở hiện nay</p>
                    <p className="text-sm font-bold text-slate-800 bg-slate-50 p-2 rounded-lg">{currentUser.form02Data.currentAddress}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Hộ khẩu thường trú</p>
                    <p className="text-sm font-bold text-slate-800 bg-slate-50 p-2 rounded-lg">{currentUser.form02Data.permanentAddress}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Ngày cấp CCCD</p>
                    <p className="text-sm font-bold text-slate-800">{currentUser.form02Data.idIssuanceDate}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Nơi cấp</p>
                    <p className="text-sm font-bold text-slate-800">{currentUser.form02Data.idIssuancePlace}</p>
                  </div>
                </div>

                {/* 1. Hình thức */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Quyền nộp & Hình thức</p>
                  <div className="flex gap-2">
                    <p className="text-sm font-bold text-[#00468E] bg-blue-50 px-3 py-1.5 rounded-lg capitalize">
                      {currentUser.form02Data.registrationRight === 'mua' ? 'Mua' : 
                       currentUser.form02Data.registrationRight === 'thue' ? 'Thuê' : 'Thuê mua'}
                    </p>
                    <p className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                      {currentUser.form02Data.registrationType === 'moi' ? 'Đăng ký mới' : 'Nhận chuyển nhượng'}
                    </p>
                  </div>
                </div>

                {/* 2. Thành viên */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Thành viên gia đình ({currentUser.form02Data.familyMembers?.length || 0})</p>
                  <div className="space-y-2">
                    {currentUser.form02Data.familyMembers?.map((m, i) => (
                      <div key={i} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-black text-[#00468E]">{m.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{m.relationship}</p>
                        </div>
                        <div className="text-right">
                          {m.cccd12 && <p className="text-[10px] font-mono font-bold text-slate-600">{m.cccd12}</p>}
                          {m.cccd09 && <p className="text-[9px] font-mono text-slate-400 italic">ID cũ: {m.cccd09}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Nhà ở */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Tình trạng nhà ở hiện tại</p>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.form02Data.housingStatus?.noHome && <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1.5 rounded-lg border border-green-100">Chưa có nhà ở</span>}
                    {currentUser.form02Data.housingStatus?.lowArea && <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1.5 rounded-lg border border-blue-100">Diện tích hẹp (&lt;15m2)</span>}
                    {currentUser.form02Data.housingStatus?.farAway && <span className="bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-1.5 rounded-lg border border-orange-100">Xa nơi làm việc</span>}
                    {currentUser.form02Data.housingStatus?.other && <span className="bg-slate-50 text-slate-500 text-[10px] font-bold px-2 py-1.5 rounded-lg border border-slate-200">Khác</span>}
                  </div>
                </div>

                {/* 4. Đối tượng */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Phân loại đối tượng (Điều 76)</p>
                  <div className="flex flex-col gap-2">
                    {Object.entries(currentUser.form02Data.subjectCategory || {}).map(([key, value]) => {
                      if (!value) return null;
                      const labels: Record<string, string> = {
                        nguoiCoCong: '1. Người có công với cách mạng, thân nhân liệt sĩ...',
                        ngheoNongThon: '2. Hộ gia đình nghèo, cận nghèo nông thôn',
                        ngheoThienTai: '3. Hộ nghèo vùng thiên tai, biến đổi khí hậu',
                        ngheoDoThi: '4. Hộ nghèo, cận nghèo đô thị',
                        thuNhapThap: '5. Người thu nhập thấp đô thị',
                        congNhan: '6. Công nhân, người lao động doanh nghiệp/KCN',
                        lucLuongVuTrang: '7. Lực lượng vũ trang nhân dân / Cơ yếu',
                        canBoCongChuc: '8. Cán bộ, công chức, viên chức',
                        traNhaCongVu: '9. Người đã trả lại nhà ở công vụ',
                        thuHoiDat: '10. Đối tượng bị thu hồi đất / giải tỏa nhà ở',
                        hocSinhSinhVien: '11. Học sinh, sinh viên các hệ đào tạo',
                        doanhNghiep: '12. Doanh nghiệp, HTX trong KCN'
                      };
                      return (
                        <div key={key} className="text-[11px] font-bold text-slate-700 border-l-4 border-[#00468E] pl-3 py-1.5 bg-blue-50/30 rounded-r-lg">
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
          <div className="bg-orange-50 p-6 rounded-3xl border border-orange-200 text-center">
            <p className="text-xs font-bold text-orange-700 italic">Bạn chưa hoàn thành kê khai Biểu mẫu 02.</p>
            <p className="text-[10px] text-orange-600 mt-1 uppercase font-black">Vui lòng nộp hồ sơ trực tuyến</p>
          </div>
        )}

        {/* Action Log Snapshot */}
        {currentUser.actionLog && currentUser.actionLog.length > 0 && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 uppercase text-sm mb-4 flex items-center gap-2">
                <Clock size={16} /> Nhật ký hồ sơ
            </h3>
            <div className="space-y-4">
                {currentUser.actionLog.slice(-3).reverse().map((log, i) => (
                    <div key={i} className="flex gap-3">
                        <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#00468E] mt-1.5" />
                        <div>
                            <p className="text-xs font-bold text-slate-700">{log.action}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(log.time).toLocaleString('vi-VN')}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
