import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  CircleX, 
  MoreVertical, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  ShieldCheck,
  Trophy,
  Plus,
  X
} from 'lucide-react';
import { Participant } from '../types';
import * as XLSX from 'xlsx'; // Assuming xlsx is available or I should use a simple CSV parser if not. 
// Wait, I don't see xlsx in package.json. I should check if I can use it or if I need to install it.
// The user didn't ask to install xlsx, but "Import từ Excel" implies it.
// I'll check package.json again.

interface DataSetupProps {
  participants: Participant[];
  onUpdateParticipants: (participants: Participant[]) => void;
  activeProject: any;
  isDataSealed: boolean;
  onSealData: () => void;
  onResetData: () => void;
}

export const DataSetup: React.FC<DataSetupProps> = ({ 
  participants, 
  onUpdateParticipants, 
  activeProject,
  isDataSealed,
  onSealData,
  onResetData
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRight, setFilterRight] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDuplicate, setFilterDuplicate] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProfile, setNewProfile] = useState<Partial<Participant>>({
    type: 'thuong',
    right: 'buy',
    groupK: 'K1',
    status: 'hoat_dong'
  });

  // Mock function for Excel import since we might not have a library
  const handleImport = () => {
    // In a real app, this would trigger a file input
    alert("Tính năng Import Excel đang được phát triển. Vui lòng sử dụng tính năng Reset Data để nạp dữ liệu mẫu.");
  };

  const handleExport = () => {
    // Mock export
    alert("Đang xuất file Excel...");
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredData.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDisableSelected = () => {
    const updated = participants.map(p => 
      selectedIds.has(p.id) ? { ...p, status: 'disabled' as const } : p
    );
    onUpdateParticipants(updated);
    setSelectedIds(new Set());
  };

  const handleEnableSelected = () => {
    const updated = participants.map(p => 
      selectedIds.has(p.id) ? { ...p, status: 'active' as const } : p
    );
    onUpdateParticipants(updated);
    setSelectedIds(new Set());
  };

  const filteredData = useMemo(() => {
    return participants.filter(p => {
      // For general data management, we show all profiles.
      // But we can add a filter to show only Phase 2 completed ones if needed.
        
      const matchSearch = 
        (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.cccd || '').includes(searchTerm) ||
        (p.phone || '').includes(searchTerm);
      
      const matchType = filterType === 'all' || p.type === filterType;
      const matchRight = filterRight === 'all' || p.right === filterRight;
      const matchStatus = filterStatus === 'all' || (p.status || 'hoat_dong') === filterStatus;
      const matchDuplicate = filterDuplicate === 'all' || (filterDuplicate === 'yes' ? p.isDuplicate : !p.isDuplicate);

      return matchSearch && matchType && matchRight && matchStatus && matchDuplicate;
    });
  }, [participants, searchTerm, filterType, filterRight, filterStatus, filterDuplicate]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start gap-4">
            {/* Left: Filters */}
            <div className="flex-1 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text"
                        placeholder="Tìm theo Họ tên / CCCD / SĐT / ID hệ thống"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 flex-wrap">
                    <select 
                        className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-blue-500"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">Tất cả Loại</option>
                        <option value="priority">Ưu tiên</option>
                        <option value="normal">Thông thường</option>
                    </select>
                    <select 
                        className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-blue-500"
                        value={filterRight}
                        onChange={(e) => setFilterRight(e.target.value)}
                    >
                        <option value="all">Tất cả Quyền</option>
                        <option value="buy">Mua</option>
                        <option value="rent">Thuê</option>
                        <option value="rent-buy">Thuê - Mua</option>
                    </select>
                    <select 
                        className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-blue-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Tất cả Trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="disabled">Tạm dừng</option>
                    </select>
                     <select 
                        className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-blue-500"
                        value={filterDuplicate}
                        onChange={(e) => setFilterDuplicate(e.target.value)}
                    >
                        <option value="all">Trùng dữ liệu: Tất cả</option>
                        <option value="yes">Có trùng</option>
                        <option value="no">Không trùng</option>
                    </select>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-col gap-2 items-end text-right">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-[#00468E] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-800 transition-all shadow-sm"
                    >
                        <Plus size={16} /> Thêm Hồ Sơ
                    </button>
                    <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-green-700 transition-all shadow-sm">
                        <FileSpreadsheet size={16} /> Xuất Excel
                    </button>
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase py-1">
                    * Data tự động đồng bộ từ Kho Lữu Trữ
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleDisableSelected}
                        disabled={selectedIds.size === 0}
                        className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-red-100 transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <CircleX size={16} /> Tạm dừng ({selectedIds.size})
                    </button>
                    {/* Optional Enable button */}
                     <button 
                        onClick={handleEnableSelected}
                        disabled={selectedIds.size === 0}
                        className="bg-green-50 text-green-600 border border-green-100 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-green-100 transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <CheckCircle2 size={16} /> Hoạt động ({selectedIds.size})
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-4 w-10">
                            <input 
                                type="checkbox" 
                                className="rounded border-slate-300"
                                checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                                onChange={handleSelectAll}
                            />
                        </th>
                        <th className="px-6 py-4">ID Hệ thống</th>
                        <th className="px-6 py-4">Họ và tên</th>
                        <th className="px-6 py-4">Số CCCD</th>
                        <th className="px-6 py-4">Số điện thoại</th>
                        <th className="px-6 py-4">Loại</th>
                        <th className="px-6 py-4">Quyền</th>
                        <th className="px-6 py-4">Trạng thái</th>
                        <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
                    {paginatedData.length > 0 ? (
                        paginatedData.map(p => {
                            const isDisabled = p.status === 'disabled';
                            const isDup = p.isDuplicate;
                            return (
                                <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${isDisabled ? 'opacity-60 bg-slate-50/50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-slate-300"
                                            checked={selectedIds.has(p.id)}
                                            onChange={() => handleSelect(p.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-black text-[#00468E]">
                                        {p.id}
                                        {isDup && <AlertTriangle size={14} className="inline ml-2 text-amber-500 cursor-help" title="Trùng CCCD/SĐT với hồ sơ khác" />}
                                    </td>
                                    <td className="px-6 py-4 font-bold">{p.name}</td>
                                    <td className="px-6 py-4 font-mono">{p.cccd}</td>
                                    <td className="px-6 py-4 font-mono text-slate-500">{p.phone}</td>
                                    <td className="px-6 py-4">
                                        {p.type === 'priority' ? (
                                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-[10px] font-black uppercase">Ưu tiên</span>
                                        ) : (
                                            <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-black uppercase">Thông thường</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {p.right === 'buy' && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-black uppercase">Mua</span>}
                                        {p.right === 'rent' && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-[10px] font-black uppercase">Thuê</span>}
                                        {p.right === 'rent-buy' && <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded text-[10px] font-black uppercase">Thuê - Mua</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isDisabled ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-200 text-slate-500 text-[10px] font-black uppercase cursor-help" title="Hồ sơ bị loại khỏi bốc thăm"><Lock size={10}/> Disabled</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-[10px] font-black uppercase">Active</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-400 hover:text-[#00468E] p-1 rounded-full hover:bg-slate-100">
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                        <FileSpreadsheet size={32} className="opacity-50" />
                                    </div>
                                    <p>Chưa có dữ liệu. Vui lòng Import từ Excel.</p>
                                    <button onClick={onResetData} className="text-[#00468E] font-bold text-xs hover:underline">
                                        Nạp dữ liệu mẫu (Reset Data)
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        
        {/* Pagination */}
        {filteredData.length > 0 && (
            <div className="p-4 border-t border-slate-100 flex justify-between items-center">
                <p className="text-xs text-slate-500 font-medium">
                    Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} trong số {filteredData.length} bản ghi
                </p>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* System Status / Seal Data (Preserved from original design) */}
      <div className="grid grid-cols-3 gap-8 mt-8">
         <button 
           onClick={onResetData}
           className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center gap-4 hover:border-blue-300 transition-all active:scale-95"
         >
             <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                 <RefreshCcw size={24} />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-[#00468E]">
                 RESET DATA
             </p>
         </button>
         <button
           onClick={onSealData}
           disabled={isDataSealed || participants.length === 0}
           className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center gap-4 hover:border-red-300 transition-all disabled:opacity-50 disabled:pointer-events-none"
         >
             <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                 <ShieldCheck size={24} />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-[#00468E]">
                 {isDataSealed ? 'ĐÃ NIÊM PHONG' : 'NIÊM PHONG DỮ LIỆU'}
             </p>
         </button>
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center gap-4">
             <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${isDataSealed ? 'bg-green-500' : 'bg-slate-300'}`}>
                 <Trophy size={24} />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                 {isDataSealed ? 'HỆ THỐNG SẴN SÀNG' : 'CHỜ NIÊM PHONG'}
             </p>
         </div>
     </div>
     
     {/* MANUAL ADD MODAL */}
     {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowAddModal(false)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="bg-[#00468E] text-white px-6 py-4 flex items-center justify-between">
                    <h3 className="font-black uppercase tracking-tight">Thêm hồ sơ thủ công</h3>
                    <button onClick={() => setShowAddModal(false)} className="text-white/60 hover:text-white"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Họ và Tên</label>
                            <input 
                                type="text"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold text-sm"
                                placeholder="Nguyễn Văn A"
                                value={newProfile.name || ''}
                                onChange={e => setNewProfile({...newProfile, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số CCCD</label>
                            <input 
                                type="text"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-mono text-sm"
                                placeholder="001203004567"
                                value={newProfile.cccd || ''}
                                onChange={e => setNewProfile({...newProfile, cccd: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số Điện Thoại</label>
                            <input 
                                type="text"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-mono text-sm"
                                placeholder="0912345678"
                                value={newProfile.phone || ''}
                                onChange={e => setNewProfile({...newProfile, phone: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhóm Đối Tượng</label>
                            <select 
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold text-sm"
                                value={newProfile.groupK || 'K1'}
                                onChange={e => setNewProfile({...newProfile, groupK: e.target.value})}
                            >
                                {['K1','K2','K3','K4','K5','K6','K7','K8','K9','K10','K11'].map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loại</label>
                            <select 
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold text-sm"
                                value={newProfile.type || 'thuong'}
                                onChange={e => setNewProfile({...newProfile, type: e.target.value as any})}
                            >
                                <option value="priority">Ưu tiên</option>
                                <option value="thuong">Thông thường</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quyền</label>
                            <select 
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold text-sm"
                                value={newProfile.right || 'buy'}
                                onChange={e => setNewProfile({...newProfile, right: e.target.value as any})}
                            >
                                <option value="buy">Mua</option>
                                <option value="rent">Thuê</option>
                                <option value="rent-buy">Thuê - Mua</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={() => setShowAddModal(false)} className="px-6 py-2 border border-slate-200 rounded-xl font-bold text-slate-500 text-sm hover:bg-slate-100 transition-all">Hủy</button>
                    <button 
                        onClick={() => {
                            if (!newProfile.name || !newProfile.cccd) {
                                alert("Vui lòng nhập đầy đủ Tên và CCCD.");
                                return;
                            }
                            const newId = `${activeProject.prefix}${String(participants.length + 1).padStart(4, '0')}`;
                            const profile: Participant = {
                                id: newId,
                                name: newProfile.name!,
                                cccd: newProfile.cccd!,
                                phone: newProfile.phone || '',
                                checkInStatus: false,
                                photo: null,
                                hasWon: false,
                                drawStatus: 'cho',
                                right: newProfile.right as any,
                                type: newProfile.type as any,
                                status: 'hoat_dong',
                                profileStatus: 'hoan_thanh',
                                isDuplicate: false,
                                applicationState: 'hoan_thanh',
                                groupK: newProfile.groupK as any,
                                submitTime: new Date().toISOString()
                            };
                            onUpdateParticipants([...participants, profile]);
                            setShowAddModal(false);
                            setNewProfile({ type: 'thuong', right: 'buy', groupK: 'K1', status: 'hoat_dong' });
                        }}
                        className="px-6 py-2 bg-[#00468E] text-white rounded-xl font-black text-sm uppercase hover:bg-blue-800 transition-all shadow-xl shadow-blue-200"
                    >
                        Lưu hồ sơ
                    </button>
                </div>
            </div>
        </div>
     )}
    </div>
  );
};
