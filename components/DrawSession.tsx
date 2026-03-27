import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Trophy,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Clock,
  Users,
  Building,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  FileText,
  Pencil,
  Shield,
  Star,
  UserCheck
} from 'lucide-react';
import { Participant, Apartment, Round } from '../types';

interface ThietLapVongQuayProps {
  participants: Participant[];
  apartments: Apartment[];
  rounds: Round[];
  onUpdateRounds: (rounds: Round[]) => void;
  onUpdateParticipant: (id: string, updates: Partial<Participant>) => void;
  onUpdateApartment: (id: string, updates: Partial<Apartment>) => void;
  onLog?: (msg: string) => void;
}

const nhanLoaiVong = (loai: Round['participantType'], roundType?: Round['roundType']) => {
  if (roundType === 'uu_tien_trung') return { label: 'Ưu Tiên 1', color: 'bg-purple-100 text-purple-700' };
  if (roundType === 'uu_tien_trung_truot') return { label: 'Ưu Tiên 2', color: 'bg-blue-100 text-blue-700' };
  if (roundType === 'thong_thuong') return { label: 'Thông Thường', color: 'bg-slate-100 text-slate-600' };
  
  if (loai === 'ut1_4') return { label: 'Ưu Tiên 1', color: 'bg-purple-100 text-purple-700' };
  if (loai === 'ut5') return { label: 'Ưu Tiên 2', color: 'bg-blue-100 text-blue-700' };
  return { label: 'Thông Thường', color: 'bg-slate-100 text-slate-600' };
};

const nhanQuyen = (quyen: Round['right']) => {
  if (quyen === 'mua') return { label: 'Mua', color: 'bg-blue-50 text-blue-700' };
  if (quyen === 'thue') return { label: 'Thuê', color: 'bg-orange-50 text-orange-700' };
  return { label: 'Thuê - Mua', color: 'bg-teal-50 text-teal-700' };
};

const nhanTrangThaiVong = (status: Round['status']) => {
  if (status === 'dang_dien_ra') return { label: 'Đang Quay', color: 'bg-red-100 text-red-700' };
  if (status === 'hoan_thanh') return { label: 'Hoàn Thành', color: 'bg-green-100 text-green-700' };
  return { label: 'Chờ', color: 'bg-slate-100 text-slate-500' };
};

export const ThietLapVongQuay: React.FC<ThietLapVongQuayProps> = ({
  participants,
  apartments,
  rounds,
  onUpdateRounds,
  onLog
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<Round | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const tinhCountdown = (round: Round) => {
    const dateStr = round.date || now.toLocaleDateString('en-CA');
    const start = new Date(`${dateStr}T${round.startTime}:00`);
    const diff = start.getTime() - now.getTime();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const xoaVong = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa vòng bốc thăm này?')) {
      onUpdateRounds(rounds.filter(r => r.id !== id));
      onLog?.(`Đã xóa vòng bốc thăm ID: ${id}`);
    }
  };


  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col animate-fade-in pb-20 space-y-6">
      {/* TIÊU ĐỀ */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-2">Thiết Lập Vòng Bốc Thăm</h1>
          <p className="text-slate-500 font-medium italic">Quản lý danh sách các vòng bốc thăm, thời gian và đối tượng tham gia.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-[#00468E] text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-900/20 hover:bg-[#003366] transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Thêm Vòng Mới
        </button>
      </div>

      {/* BẢNG VÒNG BỐC THĂM */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Mã Vòng</th>
                <th className="px-6 py-4">Tên Vòng</th>
                <th className="px-6 py-4">Loại Vòng</th>
                <th className="px-6 py-4">Quyền</th>
                <th className="px-6 py-4">Thời Gian Quay</th>
                <th className="px-6 py-4">Điểm Danh</th>
                <th className="px-6 py-4 text-center">Số Lượng Hồ Sơ</th>
                <th className="px-6 py-4 text-center">Quỹ Căn</th>
                <th className="px-6 py-4 text-center">Trạng Thái</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rounds.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center text-slate-400 italic">
                    Chưa có vòng bốc thăm nào được thiết lập.
                  </td>
                </tr>
              ) : (
                rounds.map((round) => {
                  const nhanLoai = nhanLoaiVong(round.participantType, round.roundType);
                  const nhanQ = nhanQuyen(round.right);
                  const nhanTS = nhanTrangThaiVong(round.status);
                  const countdown = round.status === 'cho' ? tinhCountdown(round) : null;
                  return (
                    <tr key={round.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 align-middle font-black text-slate-400">{round.code || `#${round.id}`}</td>
                      <td className="px-6 py-5 align-middle font-bold text-[#00468E]">{round.label}</td>
                      <td className="px-6 py-5 align-middle">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase whitespace-nowrap ${nhanLoai.color}`}>
                          {nhanLoai.label}
                        </span>
                        {round.isAutoGenerated && (
                          <span className="ml-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-amber-100 text-amber-700">Tự sinh</span>
                        )}
                      </td>
                      <td className="px-6 py-5 align-middle">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${nhanQ.color}`}>{nhanQ.label}</span>
                      </td>
                      <td className="px-6 py-5 align-middle">
                        <div className="flex flex-col gap-1 text-xs font-mono text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            {round.date.split('-').reverse().join('/')}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400" />
                            {round.startTime} - {round.endTime}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-middle">
                        <div className="flex flex-col gap-1 text-xs font-mono text-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-400 uppercase text-[10px] w-8">Mở</span>
                            {round.checkInOpenTime}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-400 uppercase text-[10px] w-8">Đóng</span>
                            {round.checkInCloseTime}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-middle text-center">
                        <span className="px-3 py-1 bg-blue-50 text-[#00468E] rounded-lg text-xs font-black">
                          {(round.displayParticipantCount !== undefined ? round.displayParticipantCount : round.participantIds?.length || 0).toLocaleString('vi-VN')}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-middle text-center">
                        <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-black">
                          {(round.inventoryCount !== undefined ? round.inventoryCount : round.inventoryIds?.length || 0).toLocaleString('vi-VN')}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-middle text-center">
                        {countdown ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Bắt đầu sau</span>
                            <span className="text-xs font-mono font-black text-[#00468E]">{countdown}</span>
                          </div>
                        ) : (
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${nhanTS.color} ${round.displayStatus ? '' : ''}`}>
                            {round.displayStatus || nhanTS.label}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingRound(round);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sửa vòng bốc thăm"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => xoaVong(round.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa vòng bốc thăm"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM/SỬA VÒNG */}
      {isModalOpen && (
        <ModalThemVong
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingRound(null);
          }}
          onConfirm={(roundData) => {
            if (editingRound) {
              onUpdateRounds(rounds.map(r => r.id === roundData.id ? roundData : r));
              onLog?.(`Đã cập nhật vòng bốc thăm: ${roundData.label}`);
            } else {
              onUpdateRounds([...rounds, roundData]);
              onLog?.(`Đã thêm vòng mới: ${roundData.label}`);
            }
            setIsModalOpen(false);
            setEditingRound(null);
          }}
          participants={participants}
          apartments={apartments}
          nextId={rounds.length > 0 ? Math.max(...rounds.map(r => r.id)) + 1 : 1}
          initialData={editingRound}
        />
      )}
    </div>
  );
};

// Export as both names for backward compatibility
export const DrawSession = ThietLapVongQuay;

// --- MODAL THÊM/SỬA VÒNG BỐC THĂM ---
interface ModalThemVongProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (round: Round) => void;
  participants: Participant[];
  apartments: Apartment[];
  nextId: number;
  initialData?: Round | null;
}

const ModalThemVong: React.FC<ModalThemVongProps> = ({
  isOpen, onClose, onConfirm, participants, apartments, nextId, initialData
}) => {
  const [buoc, setBuoc] = useState(0); // 0 = thiết lập, 1 = xem trước, 2 = xác nhận

  // Loại vòng bốc thăm
  const [loaiVong, setLoaiVong] = useState<'ut1_4' | 'ut5' | 'thuong'>(
    initialData?.participantType || 'ut1_4'
  );

  const [roundType, setRoundType] = useState<Round['roundType']>(
    initialData?.roundType || 'uu_tien_trung'
  );

  // Bước 1: Thông tin chung
  const [tenVong, setTenVong] = useState(initialData?.label || '');
  const [ngayToChuc, setNgayToChuc] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [quyen, setQuyen] = useState<'mua' | 'thue' | 'thue_mua'>(initialData?.right || 'mua');
  const [quyenCanHo, setQuyenCanHo] = useState<'mua' | 'thue' | 'thue_mua' | 'tat_ca'>(initialData?.apartmentRightFilter || 'mua');
  const [loaiCanHo, setLoaiCanHo] = useState<'uu_tien' | 'thuong' | 'tat_ca'>(initialData?.apartmentTypeFilter || 'tat_ca');
  const [soLuongCan, setSoLuongCan] = useState(initialData?.inventoryCount || 0);

  // Thời gian điểm danh
  const [gioDiemDanhMo, setGioDiemDanhMo] = useState(initialData?.checkInOpenTime || '08:00');
  const [gioDiemDanhDong, setGioDiemDanhDong] = useState(initialData?.checkInCloseTime || '08:45');

  // Thời gian quay
  const [gioBatDau, setGioBatDau] = useState(initialData?.startTime || '09:00');
  const [gioKetThuc, setGioKetThuc] = useState(initialData?.endTime || '10:00');

  // Thời gian đặc biệt theo loại vòng
  const [gioGSV, setGioGSV] = useState(initialData?.supervisorDeadlineTime || '09:30');
  const [gioVongThuong, setGioVongThuong] = useState(initialData?.regularRoundStartTime || '10:30');
  const [phutTraKetQua, setPhutTraKetQua] = useState(initialData?.resultReleaseMinutes || 5);

  // Preview pagination
  const [trangHoSo, setTrangHoSo] = useState(1);
  const [trangCanHo, setTrangCanHo] = useState(1);
  const SO_LUONG_MOI_TRANG = 20;

  // Tên vòng tự động theo loại
  useEffect(() => {
    if (!initialData) {
      const lblQuyen = quyen === 'mua' ? 'Mua' : 'Thuê/Mua';
      const tenMac = loaiVong === 'ut1_4'
        ? `Vòng Ưu Tiên 1 - ${lblQuyen}`
        : roundType === 'uu_tien_trung_truot'
          ? `Vòng Ưu Tiên 2 - ${lblQuyen}`
          : `Vòng Thông Thường - ${lblQuyen}`;
      setTenVong(tenMac);
    }
  }, [loaiVong, quyen]);

  // Lọc hồ sơ theo loại vòng và quyền
  const hoSoHopLe = useMemo(() => {
    return participants.filter(p => {
      const matchQuyen = p.right === quyen;
      const matchLoai = loaiVong === 'ut1_4'
        ? ['ut1', 'ut2', 'ut3', 'ut4'].includes(p.type)
        : loaiVong === 'ut5'
          ? p.type === 'ut5'
          : p.type === 'thuong';
      const matchStatus = p.status === 'hoat_dong';
      const chuaThang = !p.hasWon;
      return matchQuyen && matchLoai && matchStatus && chuaThang;
    });
  }, [participants, quyen, loaiVong]);

  const canHoKhaDung = useMemo(() => {
    return apartments.filter(a =>
      a.status === 'trong' &&
      (quyenCanHo === 'tat_ca' || a.right === quyenCanHo) &&
      (loaiCanHo === 'tat_ca' || a.type === loaiCanHo)
    );
  }, [apartments, quyenCanHo, loaiCanHo]);

  useEffect(() => {
    if (canHoKhaDung.length > 0 && soLuongCan === 0) {
      setSoLuongCan(canHoKhaDung.length);
    }
  }, [canHoKhaDung]);

  const soCanHo = soLuongCan;
  const canHoHopLe = soCanHo > 0 && soCanHo <= canHoKhaDung.length;

  const xacNhanTao = () => {
    const vongMoi: Round = {
      id: initialData?.id || nextId,
      code: initialData?.code || `VQ${String(nextId).padStart(2, '0')}`,
      label: tenVong,
      date: ngayToChuc,
      startTime: gioBatDau,
      endTime: gioKetThuc,
      checkInOpenTime: gioDiemDanhMo,
      checkInCloseTime: gioDiemDanhDong,
      status: initialData?.status || 'cho',
      participantIds: hoSoHopLe.map(p => p.id),
      inventoryIds: canHoKhaDung.slice(0, soLuongCan).map(a => a.id),
      inventoryMode: 'so_luong',
      inventoryCount: soLuongCan,
      apartmentRightFilter: quyenCanHo,
      apartmentTypeFilter: loaiCanHo,
      winners: initialData?.winners || [],
      right: quyen,
      participantType: loaiVong,
      roundType: roundType,
      regularRoundStartTime: loaiVong === 'ut5' ? gioVongThuong : undefined,
    };
    onConfirm(vongMoi);
  };

  if (!isOpen) return null;

  const loaiVongOptions = [
    {
      key: 'ut1_4' as const,
      icon: '',
      title: 'Ưu Tiên 1',
      desc: 'Quay chọn Mã căn.',
      color: 'border-purple-400 bg-purple-50',
      selectedColor: 'ring-2 ring-purple-500 border-purple-500 bg-purple-50'
    },
    {
      key: 'ut5' as const,
      icon: '',
      title: 'Ưu Tiên 2',
      desc: 'HS Trượt đẩy sang Thông Thường.',
      color: 'border-blue-400 bg-blue-50',
      selectedColor: 'ring-2 ring-blue-500 border-blue-500 bg-blue-50'
    },
    {
      key: 'thuong' as const,
      icon: '',
      title: 'Thông Thường',
      desc: 'Vòng bốc thăm tiêu chuẩn.',
      color: 'border-slate-400 bg-slate-50',
      selectedColor: 'ring-2 ring-slate-500 border-slate-500 bg-slate-50'
    }
  ];

  const tenBuoc = buoc === 0 ? 'Thiết Lập Chi Tiết' : buoc === 1 ? 'Xem Trước Danh Sách' : 'Xác Nhận';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        {/* Tiêu đề */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              {initialData ? 'Cập Nhật Vòng Bốc Thăm' : 'Thêm Vòng Bốc Thăm Mới'}
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">
              Bước {buoc + 1}/3: {tenBuoc}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Nội dung */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">


          {/* BƯỚC 0: THIẾT LẬP CHI TIẾT */}
          {buoc === 0 && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-6">
                {/* Cột trái: Thông tin chung */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                      <FileText size={16} className="text-blue-500" /> Thông Tin Chung
                    </h3>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-3">Loại Vòng Bốc Thăm</label>
                      <div className="space-y-2">
                        {loaiVongOptions.map(opt => (
                          <button
                            key={opt.key}
                            onClick={() => {
                              setLoaiVong(opt.key);
                              setRoundType(opt.key === 'ut1_4' ? 'uu_tien_trung' : opt.key === 'ut5' ? 'uu_tien_trung_truot' : 'thong_thuong');
                            }}
                            className={`w-full px-4 py-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${loaiVong === opt.key ? 'border-[#00468E] bg-blue-50/50 ring-1 ring-[#00468E]' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${loaiVong === opt.key ? 'border-[#00468E]' : 'border-slate-300'}`}>
                              {loaiVong === opt.key && <div className="w-2.5 h-2.5 rounded-full bg-[#00468E]"></div>}
                            </div>
                            <div>
                              <p className="font-black text-slate-800 text-xs uppercase leading-tight">{opt.title}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{opt.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">Tên Vòng Bốc Thăm</label>
                      <input
                        value={tenVong}
                        onChange={(e) => setTenVong(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#00468E]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">Ngày Tổ Chức</label>
                      <input
                        type="date"
                        value={ngayToChuc}
                        onChange={(e) => setNgayToChuc(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#00468E]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">Quyền Đăng Ký</label>
                      <select
                        value={quyen}
                        onChange={(e) => setQuyen(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#00468E]"
                      >
                        <option value="mua">Mua</option>
                        <option value="thue">Thuê</option>
                        <option value="thue_mua">Thuê - Mua</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                      <Building size={16} className="text-orange-500" /> Thiết Lập Quỹ Căn
                    </h3>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">Loại Căn (Mua/Thuê)</label>
                      <select
                        value={quyenCanHo}
                        onChange={(e) => setQuyenCanHo(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#00468E]"
                      >
                        <option value="mua">Mua</option>
                        <option value="thue">Thuê</option>
                        <option value="thue_mua">Thuê - Mua</option>
                        <option value="tat_ca">Tất cả</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">Quyền (Ưu Tiên/Thông Thường)</label>
                      <select
                        value={loaiCanHo}
                        onChange={(e) => setLoaiCanHo(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#00468E]"
                      >
                        <option value="uu_tien">Ưu tiên</option>
                        <option value="thuong">Thông thường</option>
                        <option value="tat_ca">Tất cả</option>
                      </select>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-orange-800 uppercase">Tổng số căn phù hợp</span>
                        <span className="text-xl font-black text-orange-600">{canHoKhaDung.length.toLocaleString('vi-VN')}</span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-orange-800 uppercase mb-1">Số lượng căn bốc thăm</label>
                        <input
                          type="number"
                          min={0}
                          max={canHoKhaDung.length}
                          value={soLuongCan}
                          onChange={(e) => setSoLuongCan(Number(e.target.value))}
                          className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-orange-500"
                        />
                      </div>
                      {soLuongCan > canHoKhaDung.length && (
                        <p className="text-[10px] font-bold text-red-500 italic">Số lượng vượt quá quỹ căn hiện có ({canHoKhaDung.length})</p>
                      )}
                      {soLuongCan === 0 && canHoKhaDung.length > 0 && (
                        <p className="text-[10px] font-bold text-amber-600 italic">Vui lòng chọn số lượng căn bốc thăm</p>
                      )}
                      {!canHoHopLe && canHoKhaDung.length === 0 && (
                        <p className="text-xs font-bold text-red-500 mt-2 italic">Không có căn hộ nào phù hợp với điều kiện lọc</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cột phải: Thời gian */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                      <Clock size={16} className="text-purple-500" /> Thiết Lập Thời Gian
                    </h3>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-[#00468E] uppercase mb-3 flex items-center gap-2">
                        <CheckCircle2 size={14} /> Thời Gian Điểm Danh
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Mở cổng</label>
                          <input type="time" value={gioDiemDanhMo} onChange={(e) => setGioDiemDanhMo(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-700" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Đóng cổng</label>
                          <input type="time" value={gioDiemDanhDong} onChange={(e) => setGioDiemDanhDong(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-700" />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-orange-600 uppercase mb-3 flex items-center gap-2">
                        <Trophy size={14} /> Thời Gian Quay
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Bắt đầu</label>
                          <input type="time" value={gioBatDau} onChange={(e) => setGioBatDau(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-700" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Kết thúc</label>
                          <input type="time" value={gioKetThuc} onChange={(e) => setGioKetThuc(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-700" />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BƯỚC 1: XEM TRƯỚC */}
          {buoc === 1 && (
            <div className="flex flex-col gap-6 animate-fade-in pb-8 h-full overflow-hidden">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase">Điều kiện lọc</p>
                  <div className="flex gap-4 mt-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold uppercase">
                      Quyền: {quyen === 'mua' ? 'Mua' : quyen === 'thue' ? 'Thuê' : 'Thuê - Mua'}
                    </span>
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold uppercase">
                      Loại: {loaiVong === 'ut1_4' ? 'Ưu Tiên 1' : loaiVong === 'ut5' ? 'Ưu Tiên 2' : 'Thông Thường'}
                    </span>
                  </div>
                </div>
                <div className="text-right flex gap-8">
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase">Số lượng hồ sơ</p>
                    <p className="text-3xl font-black text-[#00468E]">{hoSoHopLe.length.toLocaleString('vi-VN')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase">Số lượng căn hộ</p>
                    <p className="text-3xl font-black text-orange-600">{soCanHo.toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
                {/* Cột trái: Danh sách căn hộ */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                  <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 font-black text-xs text-slate-500 uppercase flex justify-between items-center">
                    <span>Danh sách căn hộ ({canHoKhaDung.length})</span>
                    <Building size={14} className="text-orange-500" />
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-2 border-b border-slate-100 font-bold text-slate-400">Mã Căn</th>
                          <th className="px-4 py-2 border-b border-slate-100 font-bold text-slate-400">Vị Trí</th>
                          <th className="px-4 py-2 border-b border-slate-100 font-bold text-slate-400">Diện Tích</th>
                          <th className="px-4 py-2 border-b border-slate-100 font-bold text-slate-400">Hướng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {canHoKhaDung.slice((trangCanHo - 1) * SO_LUONG_MOI_TRANG, trangCanHo * SO_LUONG_MOI_TRANG).map(a => (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2 font-bold text-orange-600">{a.id}</td>
                            <td className="px-4 py-2 text-slate-600">B{a.block}-T{a.floor}-P{a.unit}</td>
                            <td className="px-4 py-2 text-slate-600">{a.area}m²</td>
                            <td className="px-4 py-2 text-slate-600">{a.orientation}</td>
                          </tr>
                        ))}
                        {canHoKhaDung.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">Không có căn nào phù hợp.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {canHoKhaDung.length > SO_LUONG_MOI_TRANG && (
                    <div className="px-4 py-2 border-t border-slate-100 flex justify-between items-center bg-white shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Trang {trangCanHo} / {Math.ceil(canHoKhaDung.length / SO_LUONG_MOI_TRANG)}</span>
                      <div className="flex gap-1">
                        <button onClick={() => setTrangCanHo(p => Math.max(1, p - 1))} disabled={trangCanHo === 1} className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50">
                          <ChevronLeft size={12} />
                        </button>
                        <button onClick={() => setTrangCanHo(p => Math.min(Math.ceil(canHoKhaDung.length / SO_LUONG_MOI_TRANG), p + 1))} disabled={trangCanHo * SO_LUONG_MOI_TRANG >= canHoKhaDung.length} className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50">
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cột phải: Danh sách hồ sơ */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                  <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 font-black text-xs text-slate-500 uppercase flex justify-between items-center">
                    <span>Danh sách hồ sơ ({hoSoHopLe.length})</span>
                    <Users size={14} className="text-blue-500" />
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-2 border-b border-slate-100 font-bold text-slate-400">Mã HS</th>
                          <th className="px-4 py-2 border-b border-slate-100 font-bold text-slate-400">Họ Tên</th>
                          <th className="px-4 py-2 border-b border-slate-100 font-bold text-slate-400">Số CCCD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {hoSoHopLe.slice((trangHoSo - 1) * SO_LUONG_MOI_TRANG, trangHoSo * SO_LUONG_MOI_TRANG).map(p => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2 font-bold text-[#00468E]">{p.id}</td>
                            <td className="px-4 py-2 font-medium text-slate-700">{p.name}</td>
                            <td className="px-4 py-2 font-mono text-slate-500">{p.cccd}</td>
                          </tr>
                        ))}
                        {hoSoHopLe.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">Không có hồ sơ nào phù hợp.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {hoSoHopLe.length > SO_LUONG_MOI_TRANG && (
                    <div className="px-4 py-2 border-t border-slate-100 flex justify-between items-center bg-white shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Trang {trangHoSo} / {Math.ceil(hoSoHopLe.length / SO_LUONG_MOI_TRANG)}</span>
                      <div className="flex gap-1">
                        <button onClick={() => setTrangHoSo(p => Math.max(1, p - 1))} disabled={trangHoSo === 1} className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50">
                          <ChevronLeft size={12} />
                        </button>
                        <button onClick={() => setTrangHoSo(p => Math.min(Math.ceil(hoSoHopLe.length / SO_LUONG_MOI_TRANG), p + 1))} disabled={trangHoSo * SO_LUONG_MOI_TRANG >= hoSoHopLe.length} className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50">
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* BƯỚC 2: XÁC NHẬN */}
          {buoc === 2 && (
            <div className="max-w-xl mx-auto h-full flex flex-col justify-center gap-8 text-center animate-fade-in">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase">
                  {initialData ? 'Xác nhận cập nhật' : 'Xác nhận tạo vòng bốc thăm'}
                </h3>
                <p className="text-slate-500 mt-2">Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-left space-y-4 shadow-sm">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Tên vòng</span>
                  <span className="text-sm font-black text-slate-800">{tenVong}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Loại vòng</span>
                  <span className="text-sm font-black text-slate-800">
                    {loaiVong === 'ut1_4' ? 'Ưu Tiên 1' : loaiVong === 'ut5' ? 'Ưu Tiên 2' : 'Thông Thường'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Quyền</span>
                  <span className="text-sm font-black text-slate-800">
                    {quyen === 'mua' ? 'Mua' : quyen === 'thue' ? 'Thuê' : 'Thuê - Mua'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Thời gian quay</span>
                  <span className="text-sm font-black text-slate-800">{gioBatDau} - {gioKetThuc}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Số lượng hồ sơ</span>
                  <span className="text-sm font-black text-[#00468E]">{hoSoHopLe.length.toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Số lượng căn hộ</span>
                  <span className="text-sm font-black text-orange-600">{soCanHo.toLocaleString('vi-VN')} căn</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chân trang */}
        <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-between items-center">
          {buoc > 0 ? (
            <button onClick={() => setBuoc(buoc - 1)} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 flex items-center gap-2">
              <ChevronLeft size={18} /> Quay lại
            </button>
          ) : <div />}

          <div className="flex gap-4">
            {buoc < 2 ? (
              <button
                onClick={() => setBuoc(buoc + 1)}
                disabled={buoc === 0 && (!canHoHopLe || !tenVong)}
                className={`px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all ${buoc === 0 && (!canHoHopLe || !tenVong) ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-[#00468E] text-white shadow-blue-900/20 hover:bg-[#003366]'}`}
              >
                Tiếp tục <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={xacNhanTao}
                className="px-8 py-3 rounded-xl bg-green-600 text-white font-bold shadow-lg shadow-green-900/20 hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle2 size={18} /> {initialData ? 'Lưu Thay Đổi' : 'Xác Nhận Tạo'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
