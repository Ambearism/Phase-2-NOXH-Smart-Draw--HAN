import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import {
  Activity,
  Users,
  Home,
  CheckCircle2,
  Clock,
  Trophy,
  Terminal,
  Zap,
  UserCheck,
  ChevronRight,
  Play,
  SkipForward,
  PartyPopper,
  Frown,
  Timer,
  X,
  Loader2
} from 'lucide-react';
import { Participant, Apartment, Round } from '../types';

interface ManHinhMonitorProps {
  participants: Participant[];
  apartments: Apartment[];
  logs: string[];
  rounds: Round[];
  onUpdateRounds?: (rounds: Round[]) => void;
  onUpdateParticipant?: (id: string, updates: Partial<Participant>) => void;
  onNextRound?: () => void;
  onSupervisorDraw?: (roundId: number) => void;
}

type GiaiDoanManHinh = 'cho' | 'dang_quay' | 'ket_qua';

const LABEL_LOAI = (loai: Round['participantType']) =>
  loai === 'ut1_4' ? 'Ưu Tiên 1→4' : loai === 'ut5' ? 'Ưu Tiên 5' : 'Thông Thường';

const AN_CCCD = (cccd: string) => {
  if (!cccd) return '';
  return cccd.substring(0, 3) + '***' + cccd.substring(cccd.length - 3);
};

// --- KẾT QUẢ GIẢ LẬP CHO DEMO ---
const TAO_KET_QUA_DEMO = (participants: Participant[], round: Round | null, apartments: Apartment[]) => {
  if (!round) return [];
  const mauHoSo = participants.slice(0, 6);
  return mauHoSo.map((p, i) => ({
    ...p,
    ketQua: (round.participantType === 'ut1_4' || i < Math.ceil(mauHoSo.length * 0.4))
      ? 'trung' as const
      : 'truot' as const,
    canTrung: round.participantType === 'ut1_4' || i < Math.ceil(mauHoSo.length * 0.4)
      ? apartments.find(a => a.status === 'trong')?.id || `C010${i + 1}01`
      : undefined
  }));
};

export const ManHinhMonitor: React.FC<ManHinhMonitorProps> = ({
  participants,
  apartments,
  logs,
  rounds,
  onUpdateRounds,
  onUpdateParticipant,
  onNextRound,
  onSupervisorDraw
}) => {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [thoiGianHienTai, setThoiGianHienTai] = useState(new Date());
  const [gaiDoan, setGiaiDoan] = useState<GiaiDoanManHinh>('cho');
  const [ketQuaDemo, setKetQuaDemo] = useState<any[]>([]);
  const [gocQuay, setGocQuay] = useState(0);
  const [danhSachNhatKy, setDanhSachNhatKy] = useState<string[]>([]);
  const [isSupervisorDrawing, setIsSupervisorDrawing] = useState(false);
  const [absentResults, setAbsentResults] = useState<Participant[]>([]);

  // Sync logs
  useEffect(() => {
    setDanhSachNhatKy(prev => [...logs, ...prev].slice(0, 100));
  }, [logs]);

  // Cập nhật thời gian mỗi giây
  useEffect(() => {
    const timer = setInterval(() => setThoiGianHienTai(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Animation quay
  useEffect(() => {
    if (gaiDoan !== 'dang_quay') return;
    const anim = setInterval(() => {
      setGocQuay(prev => (prev + 15) % 360);
    }, 30);
    return () => clearInterval(anim);
  }, [gaiDoan]);

  // Log giả lập hoạt động
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const maHoSo = `KC${Math.floor(Math.random() * 900) + 100}`;
        const hoatDong = [
          `Người dùng ${maHoSo} đang kết nối...`,
          `Người dùng ${maHoSo} đã bấm nút QUAY`,
          `Hệ thống đang xử lý kết quả cho ${maHoSo}...`,
          `Người dùng ${maHoSo} hoàn tất điểm danh`
        ];
        const ngauNhien = hoatDong[Math.floor(Math.random() * hoatDong.length)];
        setDanhSachNhatKy(prev => [`[${new Date().toLocaleTimeString()}] ${ngauNhien}`, ...prev]);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const thongKe = useMemo(() => {
    const tongCanHo = apartments.length;
    const daBan = apartments.filter(a => a.status === 'da_ban').length;
    const conLai = tongCanHo - daBan;
    const daDangNhap = participants.filter(p => p.checkInStatus).length;
    return { tongCanHo, daBan, conLai, daDangNhap };
  }, [participants, apartments]);

  const trangThaiSuKien = useMemo(() => {
    // 1. Seek the round explicitly marked as "dang_dien_ra"
    const vongHienTai = rounds.find(r => r.status === 'dang_dien_ra');

    // 2. Otherwise, find the first round waiting "cho"
    const vongTiepTheo = rounds.find(r => r.status === 'cho');

    const hom_nay = thoiGianHienTai.toLocaleDateString('en-CA');
    
    if (vongHienTai) {
      // Calculate remaining time against its end time if possible
      const thoiGianKet = new Date(`${vongHienTai.date || hom_nay}T${vongHienTai.endTime}:00`);
      const diff = thoiGianKet.getTime() - thoiGianHienTai.getTime();
      return {
        trangThai: 'dang_dien_ra' as const,
        vong: vongHienTai,
        tiemKiet: diff > 0 ? diff : 0,
        thongBao: `ĐANG DIỄN RA: ${vongHienTai.label}`,
        thuongTin: 'Thời gian còn lại'
      };
    } else if (vongTiepTheo) {
      const thoiGianBat = new Date(`${vongTiepTheo.date || hom_nay}T${vongTiepTheo.startTime}:00`);
      const diff = thoiGianBat.getTime() - thoiGianHienTai.getTime();
      return {
        trangThai: 'cho' as const,
        vong: vongTiepTheo,
        tiemKiet: diff > 0 ? diff : 0,
        thongBao: `Sắp diễn ra: ${vongTiepTheo.label}`,
        thuongTin: 'Bắt đầu sau'
      };
    } else {
      const vongDisplayed = rounds[0] || { label: 'Vòng Bốc Thăm Demo', endTime: '23:59', date: hom_nay };
      return {
        trangThai: 'hoan_thanh' as const,
        vong: vongDisplayed,
        tiemKiet: 3600000,
        thongBao: 'Tất cả các vòng đã hoàn tất',
        thuongTin: 'Trạng thái'
      };
    }
  }, [rounds, thoiGianHienTai]);

  const formatDemNguoc = (ms: number) => {
    const tong = Math.floor(ms / 1000);
    const h = Math.floor(tong / 3600);
    const m = Math.floor((tong % 3600) / 60);
    const s = tong % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Mô phỏng dữ liệu - danh sách đã điểm danh và trúng thưởng
  const danhSachGiaMao = useMemo(() => {
    const hoLot = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng'];
    const ten = ['An', 'Bình', 'Cường', 'Dũng', 'Giang', 'Hạnh', 'Khánh', 'Lan', 'Nam', 'Thảo'];
    const genTen = (i: number) => `${hoLot[i % hoLot.length]} Văn ${ten[(i * 3) % ten.length]}`;
    return Array.from({ length: 30 }).map((_, i) => ({
      id: `KC${(i + 2000).toString()}`,
      name: genTen(i),
      checkInTime: new Date(Date.now() - Math.random() * 7200000).toLocaleTimeString('vi-VN'),
      checkInStatus: true,
      hasWon: i < 15,
      assignedUnit: i < 15 ? `C${String(Math.floor(Math.random() * 5) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 25) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}` : undefined,
      cccd: `001${(190 + (i % 10)).toString()}0${(10000 + i).toString()}`,
      phone: `09${Math.floor(Math.random() * 90000000 + 10000000)}`,
      drawStatus: i < 15 ? 'trung' : 'cho',
      right: 'mua', type: 'thuong', status: 'hoat_dong', profileStatus: 'hoan_thanh', isDuplicate: false, photo: null
    } as Participant));
  }, []);

  const vongHienTai = trangThaiSuKien.vong as Round | null;

  const danhSachQuayTrung = useMemo(() => {
    if (!vongHienTai) return [];
    return participants.filter(p => p.drawStatus === 'trung' && p.checkInStatus && vongHienTai.participantIds.includes(p.id));
  }, [participants, vongHienTai]);

  const daDangNhapList = useMemo(() => {
    const thuc = participants.filter(p => p.checkInStatus);
    return [...thuc, ...danhSachGiaMao].sort((a, b) => (b.checkInTime || '').localeCompare(a.checkInTime || ''));
  }, [participants, danhSachGiaMao]);

  const daTrung = useMemo(() => {
    const round = trangThaiSuKien.vong;
    const roundPartIds = round?.participantIds || [];
    const hasIds = roundPartIds.length > 0;
    
    const thuc = participants.filter(p => {
      const isWinner = p.hasWon && p.assignedUnit;
      if (!isWinner) return false;
      // Only include participants who were checked in
      if (!p.checkInStatus) return false;
      if (hasIds) return roundPartIds.includes(p.id);
      
      // Fallback: match round criteria if explicit IDs are missing
      if (round) {
        if (round.right && p.right !== round.right) return false;
        if (round.participantType === 'ut1_4' && !['ut1', 'ut2', 'ut3', 'ut4'].includes(p.type)) return false;
        if (round.participantType === 'ut5' && p.type !== 'ut5') return false;
        if (round.participantType === 'thuong' && p.type !== 'thuong') return false;
      }
      return true;
    });
    
    // For demo/UI testing if no real round participants matching criteria
    if (thuc.length === 0 && !hasIds) {
      const giaMaoTrung = danhSachGiaMao.filter(p => p.drawStatus === 'trung');
      return [...thuc, ...giaMaoTrung].sort((a, b) => b.id.localeCompare(a.id));
    }
    
    return thuc.sort((a, b) => b.id.localeCompare(a.id));
  }, [participants, danhSachGiaMao, trangThaiSuKien.vong]);

  const daTruot = useMemo(() => {
    const round = trangThaiSuKien.vong;
    const roundPartIds = round?.participantIds || [];
    const hasIds = roundPartIds.length > 0;

    const thuc = participants.filter(p => {
      const isTruot = p.drawStatus === 'truot';
      if (!isTruot) return false;
      if (hasIds) return roundPartIds.includes(p.id);
      
      if (round) {
        if (round.right && p.right !== round.right) return false;
        if (round.participantType === 'ut1_4' && !['ut1', 'ut2', 'ut3', 'ut4'].includes(p.type)) return false;
        if (round.participantType === 'ut5' && p.type !== 'ut5') return false;
        if (round.participantType === 'thuong' && p.type !== 'thuong') return false;
      }
      return true;
    });
    
    if (thuc.length === 0 && !hasIds) {
      const giaMaoTruot = danhSachGiaMao.filter(p => p.drawStatus === 'truot' || (p.drawStatus !== 'trung' && p.checkInStatus));
      const filteredGiaMao = giaMaoTruot.filter(p => !p.hasWon);
      return [...thuc, ...filteredGiaMao].sort((a, b) => b.id.localeCompare(a.id));
    }
    
    return thuc.sort((a, b) => b.id.localeCompare(a.id));
  }, [participants, danhSachGiaMao, trangThaiSuKien.vong]);

  const batDauQuay = () => {
    setGiaiDoan('dang_quay');
    const ketQua = TAO_KET_QUA_DEMO(participants, trangThaiSuKien.vong as Round, apartments);
    setKetQuaDemo(ketQua);
    setDanhSachNhatKy(prev => [`[${new Date().toLocaleTimeString()}] VÒNG BỐC THĂM BẮT ĐẦU: ${trangThaiSuKien.vong?.label}`, ...prev]);
  };

  const nhayDenKetQua = () => {
    setGiaiDoan('ket_qua');
    setDanhSachNhatKy(prev => [`[${new Date().toLocaleTimeString()}] KẾT QUẢ ĐÃ ĐƯỢC CÔNG BỐ`, ...prev]);
  };

  const laVongUT14 = vongHienTai?.participantType === 'ut1_4';
  const laVongUuTienTrung = vongHienTai?.roundType === 'uu_tien_trung';

  // Absent participants (not checked in) - Filtered by current round
  const vắngMặtList = useMemo(() => {
    const round = trangThaiSuKien.vong as Round | null;
    if (!round) return [];
    
    const roundPartIds = round.participantIds || [];
    const hasIds = roundPartIds.length > 0;

    return participants.filter(p => {
      if (p.checkInStatus) return false;
      
      if (hasIds) return roundPartIds.includes(p.id);
      
      // Fallback criteria match
      if (round.right && p.right !== round.right) return false;
      if (round.participantType === 'ut1_4' && !['ut1', 'ut2', 'ut3', 'ut4'].includes(p.type)) return false;
      if (round.participantType === 'ut5' && p.type !== 'ut5') return false;
      if (round.participantType === 'thuong' && p.type !== 'thuong') return false;
      
      return true;
    }).sort((a, b) => a.id.localeCompare(b.id));
  }, [participants, trangThaiSuKien.vong]);

  const quayHoGSV = () => {
    if (!vongHienTai || !laVongUuTienTrung) return;
    
    setIsSupervisorDrawing(true);
    setDanhSachNhatKy(prev => [`[${new Date().toLocaleTimeString()}] GIÁM SÁT VIÊN bắt đầu bốc thăm hộ cho ${vắngMặtList.length} hồ sơ vắng mặt`, ...prev]);

    // After 5s
    setTimeout(() => {
      setIsSupervisorDrawing(false);
      
      // Generate dummy results for absent participants
      const results = vắngMặtList.map((p, i) => {
        const apt = apartments.find(a => a.status === 'trong' && !vắngMặtList.slice(0, i).some(prev => prev.assignedUnit === a.id));
        return {
          ...p,
          hasWon: true,
          drawStatus: 'trung' as const,
          assignedUnit: apt?.id || `C01${String(10 + i).padStart(2, '0')}01`
        } as Participant;
      });
      
      setAbsentResults(results);
      setDanhSachNhatKy(prev => [`[${new Date().toLocaleTimeString()}] GIÁM SÁT VIÊN đã hoàn tất bốc thăm hộ.`, ...prev]);
      
      // Notify parent to process bulk draw and assign apartments globally
      if (onSupervisorDraw && vongHienTai) {
        onSupervisorDraw(vongHienTai.id);
      }
    }, 3000);
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col gap-6 animate-fade-in">

      {/* THỐNG KÊ ĐẦU TRANG */}
      <div className="grid grid-cols-4 gap-6 shrink-0">
        {/* Trạng thái sự kiện */}
        <div className={`p-6 rounded-3xl shadow-lg flex items-center gap-4 text-white relative overflow-hidden ${trangThaiSuKien.trangThai === 'dang_dien_ra' ? 'bg-red-600 shadow-red-900/20' : trangThaiSuKien.trangThai === 'cho' ? 'bg-[#00468E] shadow-blue-900/20' : 'bg-slate-700 shadow-slate-900/20'}`}>
          <div className="p-3 bg-white/10 rounded-2xl relative z-10">
            <Activity size={24} className={trangThaiSuKien.trangThai === 'dang_dien_ra' ? 'animate-spin' : ''} />
          </div>
          <div className="relative z-10 min-w-0">
            <p className="text-[10px] font-black text-white/70 uppercase tracking-wider mb-1 truncate">
              {trangThaiSuKien.thongBao}
            </p>
            <span className="text-[10px] font-bold opacity-60 uppercase">{trangThaiSuKien.thuongTin}</span>
            <p className="text-2xl font-black font-mono tracking-tight leading-none">
              {formatDemNguoc(trangThaiSuKien.tiemKiet)}
            </p>
          </div>
          <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-[#00468E] rounded-2xl"><Users size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Đã Đăng Nhập</p>
            <p className="text-2xl font-black text-slate-800">{thongKe.daDangNhap.toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><Trophy size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Căn Đã Trúng</p>
            <p className="text-2xl font-black text-green-600">{thongKe.daBan.toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Home size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Căn Còn Lại</p>
            <p className="text-2xl font-black text-amber-600">{thongKe.conLai.toLocaleString('vi-VN')}</p>
          </div>
        </div>
      </div>

      {/* THÔNG TIN VÒNG BỐC THĂM (Thay cho Điều khiển) */}
      <div className="shrink-0 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-black text-slate-400 uppercase mb-1">Vòng bốc thăm hiện tại</p>
          <div className="flex items-center gap-3">
            <p className="text-xl font-black text-[#00468E]">{vongHienTai?.label || 'Chưa có vòng nào'}</p>
            {vongHienTai && (
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${laVongUuTienTrung ? 'bg-emerald-100 text-emerald-700' : vongHienTai?.participantType === 'ut5' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                {laVongUuTienTrung ? 'Ưu Tiên 1' : LABEL_LOAI(vongHienTai.participantType)}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-8 items-center border-l border-slate-100 pl-8">
          {/* Supervisor draw button moved to below the absent list for Priority Win rounds */}
          {!laVongUuTienTrung && (
             <button
              onClick={batDauQuay}
              disabled={trangThaiSuKien.trangThai !== 'dang_dien_ra'}
              className="px-6 py-3 bg-[#00468E] text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-900/20 hover:bg-[#003366] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Play size={18} /> Bắt đầu bốc thăm
            </button>
          )}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Thời gian</p>
            <p className="text-sm font-bold text-slate-700">{vongHienTai?.startTime} - {vongHienTai?.endTime}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Quyền</p>
            <p className="text-sm font-bold text-slate-700">
              {vongHienTai?.right === 'mua' ? 'Mua' : vongHienTai?.right === 'thue' ? 'Thuê' : 'Thuê - Mua'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Trạng thái</p>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${trangThaiSuKien.trangThai === 'dang_dien_ra' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
              {trangThaiSuKien.trangThai === 'dang_dien_ra' ? 'Đang diễn ra' : 'Chưa bắt đầu'}
            </span>
          </div>
        </div>
      </div>

      {/* MÀN HÌNH QUAY ANIMATION */}
      {gaiDoan === 'dang_quay' && (
        <div className="shrink-0 bg-gradient-to-r from-[#00468E] to-[#0066CC] rounded-[2rem] p-8 text-white flex items-center justify-between shadow-2xl shadow-blue-900/30">
          <div>
            <p className="text-sm font-bold text-white/60 uppercase mb-2">Đang xử lý bốc thăm</p>
            <p className="text-2xl font-black">{vongHienTai?.label}</p>
            <p className="text-white/70 text-sm mt-1">
              {(vongHienTai?.displayParticipantCount || 0).toLocaleString('vi-VN')} hồ sơ đang tham gia
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="relative w-24 h-24">
              <div
                className="w-24 h-24 rounded-full border-8 border-white/20 border-t-white"
                style={{ transform: `rotate(${gocQuay}deg)`, transition: 'transform 0.05s linear' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap size={32} className="text-yellow-400 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-white/60 uppercase mt-2">Đang Bốc Thăm...</p>
            </div>
          </div>
        </div>
      )}


      {/* HAI CỘT NỘI DUNG */}
      <div className="grid grid-cols-2 gap-6 flex-1 min-h-[300px]">

        {/* Cột 1: Danh Sách Bốc Trúng / Quay Căn Hộ */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden ring-4 ring-green-50">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-green-50/30">
            <h3 className="font-bold text-green-800 uppercase text-sm flex items-center gap-2">
              <Trophy size={18} className="text-green-600" /> {laVongUuTienTrung ? 'Danh Sách Bốc Thăm' : 'Danh Sách Bốc Trúng'}
            </h3>
            <span className="text-[10px] font-black text-green-600 uppercase bg-white px-2 py-1 rounded-lg border border-green-100">{daTrung.length} hồ sơ</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[500px] custom-scrollbar">
            {isSupervisorDrawing && (
              <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-200 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <Zap size={20} className="text-blue-600 animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-800">Đang bốc thăm hộ vắng mặt...</p>
                    <p className="text-[10px] text-blue-500 font-bold uppercase">Hệ thống đang xử lý</p>
                  </div>
                </div>
              </div>
            )}
            {daTrung.length === 0 && !isSupervisorDrawing ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                <Trophy size={48} className="opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Chưa có kết quả trúng</p>
              </div>
            ) : (
              daTrung.map(w => (
                <div key={w.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-green-300 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center font-black text-sm border border-green-100 group-hover:bg-green-600 group-hover:text-white transition-colors">
                      {w.id.slice(-3)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 tracking-tight">{w.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{w.id} • {w.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Căn hộ</p>
                    <p className="text-md font-black text-[#00468E] bg-blue-50 px-3 py-1 rounded-lg">{w.assignedUnit}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cột 2: Danh Sách Bốc Trượt / Danh sách chưa đăng nhập */}
        <div className={`bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden ring-4 ${laVongUuTienTrung ? 'ring-slate-50' : 'ring-red-50'}`}>
          <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center ${laVongUuTienTrung ? 'bg-slate-50/30' : 'bg-red-50/30'}`}>
            <h3 className={`font-bold uppercase text-sm flex items-center gap-2 ${laVongUuTienTrung ? 'text-slate-800' : 'text-red-800'}`}>
              {laVongUuTienTrung ? <Users size={18} className="text-slate-600" /> : <Frown size={18} className="text-red-600" />} 
              {laVongUuTienTrung ? (isSupervisorDrawing || vắngMặtList.some(p => p.drawStatus === 'trung') ? 'DANH SÁCH QUAY VẮNG MẶT' : 'Danh Sách Vắng Mặt') : 'Danh Sách Bốc Trượt'}
            </h3>
            <span className={`text-[10px] font-black uppercase bg-white px-2 py-1 rounded-lg border ${laVongUuTienTrung ? 'text-slate-600 border-slate-100' : 'text-red-600 border-red-100'}`}>
              {laVongUuTienTrung ? vắngMặtList.length : daTruot.length} hồ sơ vắng mặt
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[500px] custom-scrollbar">
            {laVongUuTienTrung ? (
              vắngMặtList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                  <UserCheck size={48} className="opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Tất cả đã đăng nhập</p>
                </div>
              ) : (
                vắngMặtList.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center font-black text-sm border border-slate-100 group-hover:bg-slate-600 group-hover:text-white transition-colors">
                        {p.id.slice(-3)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 tracking-tight">{p.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{p.id} • {p.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {isSupervisorDrawing && p.drawStatus !== 'trung' ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg">
                          <Loader2 size={12} className="animate-spin" />
                          <span className="text-[10px] font-black uppercase">Vắng mặt</span>
                        </div>
                      ) : p.drawStatus === 'trung' ? (
                        <span className="px-3 py-1 bg-blue-50 text-[#00468E] border border-blue-100 rounded-lg text-sm font-black uppercase">{p.assignedUnit}</span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase">Vắng mặt</span>
                      )}
                    </div>
                  </div>
                ))
              )
            ) : (
              daTruot.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                  <Activity size={48} className="opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Chưa có kết quả trượt</p>
                </div>
              ) : (
                daTruot.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-red-300 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-black text-sm border border-red-100 group-hover:bg-red-600 group-hover:text-white transition-colors">
                        {p.id.slice(-3)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 tracking-tight">{p.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{p.id} • {p.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-black uppercase">Không Trúng</span>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
          {laVongUuTienTrung && vắngMặtList.some(p => p.drawStatus !== 'trung') && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
               <button
                onClick={quayHoGSV}
                disabled={isSupervisorDrawing}
                className={`w-full py-3 bg-purple-600 text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-purple-900/20 hover:bg-purple-700 transition-all flex items-center justify-center gap-2 ${isSupervisorDrawing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Zap size={18} className={isSupervisorDrawing ? 'animate-pulse' : ''} /> Bấm Quay vắng mặt
              </button>
            </div>
          )}
        </div>
      </div>


      {/* BẢNG NHẬT KÝ HỆ THỐNG */}
      <div className="h-48 shrink-0 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-3 border-b border-slate-800 flex items-center gap-2 bg-slate-950/50">
          <Terminal size={14} className="text-green-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nhật Ký Hoạt Động Hệ Thống (Thời Gian Thực)</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1">
          {danhSachNhatKy.map((log, i) => (
            <div key={i} className="flex gap-3 text-slate-400 hover:text-white transition-colors">
              <span className="text-slate-600 shrink-0">[{log.match(/\[(.*?)\]/)?.[1] || new Date().toLocaleTimeString()}]</span>
              <span className={log.includes('TRÚNG') || log.includes('KẾT QUẢ') ? 'text-green-400 font-bold' : log.includes('GIÁM SÁT') ? 'text-purple-400' : ''}>
                {log.replace(/\[.*?\]\s/, '')}
              </span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
      {/* DEMO ACTIONS */}
      <div className="flex gap-4 shrink-0 justify-end">
        {onNextRound && (
          <button
            onClick={onNextRound}
            className="px-6 py-3 bg-slate-800/80 backdrop-blur text-white rounded-xl font-black uppercase text-xs shadow-xl hover:bg-slate-900 transition-all flex items-center gap-2 border border-slate-700"
          >
            <SkipForward size={16} /> Vòng kế tiếp
          </button>
        )}
      </div>
    </div>
  );
};

// Export cả hai tên để tương thích ngược
export const EventMonitor = ManHinhMonitor;
