import React, { useState } from 'react';
import { Search, Send, CheckCircle2, XCircle, Clock, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface SMSLog {
  id: string;
  phone: string;
  type: string;
  status: 'thanh_cong' | 'that_bai';
  retryStatus: 'thanh_cong' | 'that_bai' | 'chua_gui';
  sentTime: string;
  updateTime: string;
}

import { Participant } from '../types';

const SMS_TEMPLATES = [
  { id: 'SMS_00_NOTICE_DRAW_TIME', purpose: 'Thông báo ngày giờ bốc thăm', trigger: 'Gửi trước ngày diễn ra sự kiện theo lịch cấu hình', content: '[CT3KimChung] Thong bao: Buoi boc tham se dien ra luc 09:00 ngay 25/03/2026. Quy khach vui long dang nhap dung gio de tham gia.' },
  { id: 'SMS_01_OTP_LOGIN_FIRST', purpose: 'Gửi mã OTP đăng nhập lần đầu', trigger: 'Khi user nhập đúng mã hồ sơ + SĐT', content: '[CT3KimChung] Ma OTP dang nhap cua Quy khach la 483921. Vui long khong cung cap ma nay cho nguoi khac.' },
  { id: 'SMS_02_REMIND_LOGIN_DRAW', purpose: 'Nhắc người dùng đăng nhập', trigger: 'Gửi trước hoặc trong thời gian mở cổng', content: '[CT3KimChung] Nhac Quy khach dang nhap dung khung gio mo cong de tham gia boc tham.' },
  { id: 'SMS_03A_RESULT_WIN', purpose: 'Thông báo kết quả trúng', trigger: 'Sau khi có kết quả trúng', content: '[CT3KimChung] Ket qua boc tham: Quy khach DA TRUNG. Vui long dang nhap de xem chi tiet.' },
  { id: 'SMS_03B_RESULT_LOSE', purpose: 'Thông báo kết quả không trúng', trigger: 'Sau khi có kết quả trượt', content: '[CT3KimChung] Ket qua boc tham: Quy khach KHONG TRUNG trong dot nay.' },
  { id: 'SMS_03C_UT5_TO_NORMAL', purpose: 'Thông báo đối tượng UT5 chuyển vòng', trigger: 'Sau kết quả UT5', content: '[CT3KimChung] Ket qua: Quy khach khong trung UT5. Ho so duoc chuyen sang vong thong thuong.' },
  { id: 'SMS_04_TRIAL_LOGIN_RULE', purpose: 'Gửi link đăng nhập thử', trigger: 'Gửi trước ngày sự kiện 1 ngày', content: '[CT3KimChung] Quy khach dang nhap thu truoc tai abc.vn The le xem tai abc.vn/tl' },
  { id: 'SMS_05_EVENT_LOGIN_DRAW', purpose: 'Gửi link đăng nhập chính thức', trigger: 'Khi mở cổng chính thức', content: '[CT3KimChung] He thong da mo. Quy khach vui long dang nhap abc.vn de tham gia boc tham.' },
  { id: 'SMS_06_THANKS_RESULT_LOOKUP', purpose: 'Cảm ơn và hướng dẫn', trigger: 'Gửi sau khi kết thúc ngày bốc thăm', content: '[CT3KimChung] Cam on Quy khach da tham gia boc tham. Tra cuu ket qua tai abc.vn/kq' },
];

interface MonitorSMSProps {
  participants: Participant[];
}

export default function MonitorSMS({ participants }: MonitorSMSProps) {
  // Generate logs matching the participant count
  const [logs, setLogs] = useState<SMSLog[]>([]);

  React.useEffect(() => {
    const generated = participants.map((p, i) => {
      const types = ['SMS_00_NOTICE', 'SMS_01_OTP', 'SMS_02_REMIND', 'SMS_03A_WIN', 'SMS_03B_LOSE'];
      const isSuccess = Math.random() > 0.2; // 80% success
      const status: 'thanh_cong' | 'that_bai' = isSuccess ? 'thanh_cong' : 'that_bai';
      let retryStatus: 'thanh_cong' | 'that_bai' | 'chua_gui' = 'chua_gui';
      
      if (status === 'that_bai') {
         const retryRand = Math.random();
         if (retryRand > 0.6) retryStatus = 'thanh_cong';
         else if (retryRand > 0.3) retryStatus = 'that_bai';
      }

      return {
        id: p.id,
        phone: p.phone || `0988${String(i).padStart(6, '0')}`,
        type: types[i % types.length],
        status,
        retryStatus,
        sentTime: new Date(Date.now() - Math.random() * 86400000).toLocaleString('vi-VN'),
        updateTime: new Date().toLocaleString('vi-VN')
      };
    });
    setLogs(generated);
  }, [participants]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [retryFilter, setRetryFilter] = useState('ALL');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const handleResendFailed = () => {
    alert("Đang thao tác gửi lại các tin nhắn thất bại...");
    setLogs(logs.map(l => l.status === 'that_bai' ? { ...l, retryStatus: 'thanh_cong', updateTime: new Date().toLocaleString('vi-VN') } : l));
  };

  const handleResendSingle = (id: string) => {
    setLogs(logs.map(l => l.id === id ? { ...l, retryStatus: 'thanh_cong', updateTime: new Date().toLocaleString('vi-VN') } : l));
    alert(`Đã gửi lại tin nhắn cho hồ sơ ${id}`);
  };

  const filteredLogs = logs.filter(l => {
    const matchSearch = l.id.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search);
    const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const matchRetry = retryFilter === 'ALL' || l.retryStatus === retryFilter;
    return matchSearch && matchStatus && matchRetry;
  });

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalSent = logs.length;
  const totalSuccess = logs.filter(l => l.status === 'thanh_cong').length;
  const totalFail = logs.filter(l => l.status === 'that_bai').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#00468E] tracking-tight uppercase flex items-center gap-3">
            <Send size={28} /> Monitor SMS
          </h1>
          <p className="text-slate-500 font-medium mt-2">Theo dõi và quản lý tình trạng gửi tin nhắn SMS</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Send size={28} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng SMS Đã Gửi</p>
            <p className="text-3xl font-black text-slate-800">{totalSent}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl"><CheckCircle2 size={28} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gửi Thành Công</p>
            <p className="text-3xl font-black text-green-600">{totalSuccess}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl"><XCircle size={28} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gửi Thất Bại</p>
            <p className="text-3xl font-black text-red-600">{totalFail}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 uppercase flex items-center gap-2">
            Cấu Hình Nội Dung Tin Nhắn
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="p-4 font-black border-b border-slate-100">Mã tin nhắn</th>
                <th className="p-4 font-black border-b border-slate-100">Mục đích</th>
                <th className="p-4 font-black border-b border-slate-100">Trigger gửi</th>
                <th className="p-4 font-black border-b border-slate-100">Nội dung mẫu</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {SMS_TEMPLATES.map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="p-4 font-bold text-[#00468E] whitespace-nowrap">{t.id}</td>
                  <td className="p-4 text-slate-700 font-medium whitespace-nowrap">{t.purpose}</td>
                  <td className="p-4 text-slate-500 max-w-xs">{t.trigger}</td>
                  <td className="p-4 text-slate-600 italic">{t.content}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50">
          <div className="flex gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Tìm Mã HS, SĐT..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-[#00468E] outline-none"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none">
              <option value="ALL">Tất cả Tình Trạng</option>
              <option value="thanh_cong">Thành công</option>
              <option value="that_bai">Thất bại</option>
            </select>
            <select value={retryFilter} onChange={e => setRetryFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none">
              <option value="ALL">Tất cả Gửi Lại</option>
              <option value="chua_gui">Chưa gửi lại</option>
              <option value="thanh_cong">Gửi lại thành công</option>
              <option value="that_bai">Gửi lại thất bại</option>
            </select>
          </div>
          <button onClick={handleResendFailed} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-black uppercase flex items-center gap-2 transition-colors">
            <RefreshCw size={16} /> Gửi lại các tin thất bại
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="p-4 font-black border-b border-slate-100 whitespace-nowrap">Mã HS</th>
                <th className="p-4 font-black border-b border-slate-100 whitespace-nowrap">SĐT</th>
                <th className="p-4 font-black border-b border-slate-100">Loại Tin Nhắn</th>
                <th className="p-4 font-black border-b border-slate-100 text-center">Tình Trạng</th>
                <th className="p-4 font-black border-b border-slate-100 text-center">Gửi Lại</th>
                <th className="p-4 font-black border-b border-slate-100">Ngày Giờ Gửi</th>
                <th className="p-4 font-black border-b border-slate-100 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">Không tìm thấy dữ liệu phù hợp</td>
                </tr>
              ) : (
                paginatedLogs.map(l => (
                  <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{l.id}</td>
                    <td className="p-4 font-bold text-slate-600">{l.phone}</td>
                    <td className="p-4 text-slate-600 font-medium">{l.type}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${l.status === 'thanh_cong' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {l.status === 'thanh_cong' ? 'Thành công' : 'Thất bại'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${l.retryStatus === 'thanh_cong' ? 'bg-green-100 text-green-700' : l.retryStatus === 'that_bai' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                        {l.retryStatus === 'chua_gui' ? '-' : l.retryStatus === 'thanh_cong' ? 'Thành công' : 'Thất bại'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-medium">
                      <div><Clock size={12} className="inline mr-1" />{l.sentTime}</div>
                    </td>
                    <td className="p-4 text-center">
                      {(l.status === 'that_bai' && l.retryStatus !== 'thanh_cong') ? (
                        <button onClick={() => handleResendSingle(l.id)} className="text-blue-600 hover:text-blue-800 font-bold uppercase text-[10px] flex items-center gap-1 mx-auto">
                          <RefreshCw size={12} /> Gửi lại
                        </button>
                      ) : (
                        <button className="text-slate-400 hover:text-slate-600 font-bold uppercase text-[10px] flex items-center gap-1 mx-auto">
                          Chi tiết
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination UI */}
        {filteredLogs.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-white">
            <p className="text-sm font-bold text-slate-500">
              Hiển thị {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} trong {filteredLogs.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center px-4 font-bold text-slate-700 bg-slate-50 rounded-lg">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
