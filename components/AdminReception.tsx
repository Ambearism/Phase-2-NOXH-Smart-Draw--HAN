import React, { useState, useMemo } from 'react';
import { Search, FileText, Inbox, Calendar, Filter } from 'lucide-react';
import { Participant } from '../types';
import { ProfileReviewModal } from './ProfileReviewModal';
import { OFFICERS } from '../constants';

interface AdminReceptionProps {
  participants: Participant[];
  updateParticipants: (participants: Participant[]) => void;
  onNavigate: (tab: any) => void;
}

const getStatusInfo = (p: Participant) => {
  if (p.applicationState === 'cho_ban_cung' && p.hardCopyDueDate && new Date(p.hardCopyDueDate) < new Date()) {
    return { label: 'Trễ Hẹn', color: 'bg-red-100 text-red-700' };
  }
  if (p.applicationState === 'dang_xu_ly' && p.processingDeadline && new Date(p.processingDeadline) < new Date()) {
    return { label: 'Trễ Hẹn', color: 'bg-red-100 text-red-700' };
  }
  switch (p.applicationState) {
    case 'da_nhan': return { label: 'Chờ Tiếp Nhận', color: 'bg-orange-100 text-orange-700' };
    case 'dang_xu_ly': return { label: 'Đang Xử Lý', color: 'bg-blue-100 text-blue-700' };
    case 'cho_ban_cung': return { label: 'Chờ Bản Cứng', color: 'bg-purple-100 text-purple-700' };
    case 'hoan_thanh': return { label: 'Hoàn Thành', color: 'bg-green-100 text-green-700' };
    case 'tra_ho_so': return { label: 'Trả Hồ Sơ', color: 'bg-red-100 text-red-700' };
    default: return { label: 'Nháp', color: 'bg-slate-100 text-slate-500' };
  }
};

const getTypeLabel = (type?: string) => {
  switch(type) {
    case 'ut1': return 'U1';
    case 'ut2': return 'U2';
    case 'ut3': return 'U3';
    case 'ut4': return 'U4';
    case 'ut5': return 'U5';
    case 'thuong': return 'Thường';
    default: return '—';
  }
};

export const AdminReception: React.FC<AdminReceptionProps> = ({ participants, updateParticipants, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterStatus, setFilterStatus] = useState("da_nhan");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Participant | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assigningOfficerId, setAssigningOfficerId] = useState("");
  const [filterOfficer, setFilterOfficer] = useState("all");


  const allPhase2 = participants.filter(p => p.applicationState && p.applicationState !== 'nhap');

  const filteredData = useMemo(() => {
    return allPhase2.filter(p => {
      const s = searchTerm.toLowerCase();
      const matchSearch = !s || (p.name?.toLowerCase() || '').includes(s) || (p.cccd || '').includes(s) || (p.id?.toLowerCase() || '').includes(s) || (p.phone || '').includes(s) || (p.email || '').includes(s);
      const matchGroup = filterGroup === 'all' || p.groupK === filterGroup;
      
      let matchStatus = true;
      if (filterStatus !== 'all') {
        const isOverdue = (p.applicationState === 'cho_ban_cung' && p.hardCopyDueDate && new Date(p.hardCopyDueDate) < new Date()) || 
                          (p.applicationState === 'dang_xu_ly' && p.processingDeadline && new Date(p.processingDeadline) < new Date());
        if (filterStatus === 'tre_hen') {
          matchStatus = !!isOverdue;
        } else {
          matchStatus = p.applicationState === filterStatus && !isOverdue;
        }
      }

      let matchDate = true;
      if (dateFrom && p.submitTime) matchDate = new Date(p.submitTime) >= new Date(dateFrom);
      if (dateTo && p.submitTime && matchDate) matchDate = new Date(p.submitTime) <= new Date(dateTo + 'T23:59:59');
      
      const matchOfficer = filterOfficer === 'all' || p.assignedOfficerId === filterOfficer;

      return matchSearch && matchGroup && matchStatus && matchDate && matchOfficer;
    });
  }, [allPhase2, searchTerm, filterGroup, filterStatus, dateFrom, dateTo, filterOfficer]);

  const stats = {
    total: allPhase2.length,
    processing: allPhase2.filter(p => p.applicationState !== 'da_nhan').length,
    remaining: allPhase2.filter(p => p.applicationState === 'da_nhan').length
  };

  const handleApprove = (profileId: string, priorityType: string, docStatuses: any, docComments: any) => {
    const now = new Date().toISOString();
    const updated = participants.map(p => {
      if (p.id !== profileId) return p;
      const newLog = [...(p.actionLog || []), { 
        time: now, 
        actor: 'Bộ phận tiếp nhận', 
        action: 'Duyệt hồ sơ tiếp nhận', 
        comment: priorityType ? `Gán đối tượng: ${priorityType}` : undefined 
      }];
      return { 
        ...p, 
        applicationState: 'dang_xu_ly' as const, 
        type: (priorityType || p.type) as any, 
        documentStatuses: docStatuses,
        documentComments: docComments,
        actionLog: newLog 
      };
    });
    updateParticipants(updated);
    setSelectedProfile(null);
  };

  const handleReturn = (profileId: string, comment: string, docStatuses: any, docComments: any) => {
    const now = new Date().toISOString();
    const updated = participants.map(p => {
      if (p.id !== profileId) return p;
      const newLog = [...(p.actionLog || []), { 
        time: now, 
        actor: 'Bộ phận tiếp nhận', 
        action: 'Trả hồ sơ', 
        comment 
      }];
      return { 
        ...p, 
        applicationState: 'tra_ho_so' as const, 
        returnReason: comment, 
        documentStatuses: docStatuses,
        documentComments: docComments,
        actionLog: newLog 
      };
    });
    updateParticipants(updated);
    setSelectedProfile(null);
  };
  const handleBulkAssign = () => {
    if (!assigningOfficerId) {
        alert("Vui lòng chọn cán bộ để gán");
        return;
    }
    if (selectedIds.length === 0) {
        alert("Vui lòng chọn ít nhất một hồ sơ");
        return;
    }
    const officerName = OFFICERS.find(o => o.id === assigningOfficerId)?.name;
    const now = new Date().toISOString();
    const updated = participants.map(p => {
        if (!selectedIds.includes(p.id)) return p;
        return {
            ...p,
            assignedOfficerId: assigningOfficerId,
            actionLog: [...(p.actionLog || []), { time: now, actor: 'Hệ thống', action: `Phân công xử lý: ${officerName}` }]
        };
    });
    updateParticipants(updated);
    setSelectedIds([]);
    setAssigningOfficerId("");
    alert(`Đã gán ${selectedIds.length} hồ sơ cho cán bộ ${officerName}`);
  };

  const handleSingleAssign = (profileId: string, officerId: string) => {
    const officerName = OFFICERS.find(o => o.id === officerId)?.name;
    const now = new Date().toISOString();
    const updated = participants.map(p => {
        if (p.id !== profileId) return p;
        return {
            ...p,
            assignedOfficerId: officerId,
            actionLog: [...(p.actionLog || []), { time: now, actor: 'Hệ thống', action: `Phân công xử lý: ${officerName}` }]
        };
    });
    updateParticipants(updated);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredData.length) setSelectedIds([]);
    else setSelectedIds(filteredData.map(p => p.id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-black text-[#00468E] uppercase tracking-tighter">Tiếp Nhận Hồ Sơ</h2>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tổng HS đã nộp</p>
          <p className="text-3xl font-black text-[#00468E] mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Đang được xử lý</p>
          <p className="text-3xl font-black text-green-600 mt-1">{stats.processing}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Còn lại (chờ tiếp nhận)</p>
          <p className="text-3xl font-black text-orange-600 mt-1">{stats.remaining}</p>
        </div>
        <div className="bg-[#00468E] p-5 rounded-2xl shadow-xl shadow-blue-100 flex flex-col justify-between">
            <p className="text-[10px] font-black uppercase text-blue-200 tracking-wider">Phân công hàng loạt ({selectedIds.length} HS)</p>
            <div className="flex gap-2 mt-2">
                <select 
                    value={assigningOfficerId} 
                    onChange={e => setAssigningOfficerId(e.target.value)}
                    className="flex-1 bg-white/10 text-white border-none rounded-lg text-xs font-bold outline-none px-2 py-1 placeholder:text-blue-300"
                >
                    <option value="" className="text-slate-800">Chọn cán bộ...</option>
                    {OFFICERS.map(o => <option key={o.id} value={o.id} className="text-slate-800">{o.name}</option>)}
                </select>
                <button 
                    onClick={handleBulkAssign}
                    disabled={selectedIds.length === 0 || !assigningOfficerId}
                    className="bg-white text-[#00468E] p-2 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-all"
                >
                    <Filter size={16} />
                </button>
            </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-sm">
        <div className="p-4 border-b border-slate-50 flex flex-wrap gap-3 items-center">
          <div className="relative flex-[2] min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Tìm kiếm..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-all text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm font-medium outline-none">
            <option value="all">Tất cả Trạng thái</option>
            <option value="da_nhan">Chờ Tiếp Nhận</option>
            <option value="dang_xu_ly">Đang Xử Lý</option>
            <option value="cho_ban_cung">Chờ Bản Cứng</option>
            <option value="tre_hen">Trễ Hẹn</option>
            <option value="hoan_thanh">Hoàn Thành</option>
            <option value="tra_ho_so">Trả Hồ Sơ</option>
          </select>
          <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm font-medium outline-none">
            <option value="all">Tất cả Nhóm</option>
            {['K1','K2','K3','K4','K5','K6','K7','K8','K9','K10','K11'].map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <Calendar size={14} />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-transparent outline-none w-24" />
            <span>-</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-transparent outline-none w-24" />
          </div>
          <select value={filterOfficer} onChange={e => setFilterOfficer(e.target.value)} className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg bg-[#00468E]/5 text-[#00468E] text-sm font-black outline-none">
            <option value="all">Tất cả Cán bộ</option>
            {OFFICERS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                    <input type="checkbox" checked={selectedIds.length === filteredData.length && filteredData.length > 0} onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className="px-4 py-3 w-12 text-center">STT</th>
                <th className="px-4 py-3">Mã HS</th>
                <th className="px-4 py-3">Họ Tên</th>
                <th className="px-4 py-3">CCCD</th>
                <th className="px-4 py-3">Liên hệ</th>
                <th className="px-4 py-3 text-center">Nhóm</th>
                <th className="px-4 py-3 text-center">Đối Tượng</th>
                <th className="px-4 py-3">Trạng Thái</th>
                <th className="px-4 py-3">Cán bộ phụ trách</th>
                <th className="px-4 py-3">Ngày Nộp</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-600 text-sm">
              {filteredData.length > 0 ? filteredData.map((p, idx) => {
                const status = getStatusInfo(p);
                return (
                  <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(p.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-4 py-3 text-center">
                        <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-bold text-center">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-[#00468E] text-xs">{p.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.cccd}</td>
                    <td className="px-4 py-3 text-xs">
                      <div>{p.phone}</div>
                      <div className="text-slate-400 text-[10px]">{p.email}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-black text-[10px] uppercase text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">{p.groupK}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-black text-[10px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{getTypeLabel(p.type)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase inline-flex items-center justify-center ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        value={p.assignedOfficerId || ""} 
                        onChange={(e) => handleSingleAssign(p.id, e.target.value)}
                        className="text-[10px] font-bold text-slate-600 bg-slate-100 border-none rounded px-2 py-1 outline-none w-32"
                      >
                        <option value="">Chưa phân công</option>
                        {OFFICERS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs">{p.submitTime ? new Date(p.submitTime).toLocaleDateString('vi-VN') : '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setSelectedProfile(p)} className="bg-[#00468E] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase hover:bg-blue-800 transition-all shadow-sm">
                        Xem
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Inbox size={48} className="mx-auto text-slate-200 mb-3" />
                    <p>Không tìm thấy hồ sơ phù hợp.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {selectedProfile && (
        <ProfileReviewModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onApprove={handleApprove}
          onReturn={handleReturn}
          mode="reception"
        />
      )}
    </div>
  );
};
