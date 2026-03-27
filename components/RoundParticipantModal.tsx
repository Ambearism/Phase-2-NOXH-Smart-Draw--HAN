import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Search, 
  Filter, 
  CheckCircle2, 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  Trash2, 
  Save,
  ArrowRight,
  Database,
  UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { createPortal } from 'react-dom';
import { Participant } from '../types';

interface RoundParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
  participants: Participant[];
  initialSelectedIds: string[];
  roundName: string;
}

export const RoundParticipantModal: React.FC<RoundParticipantModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  participants,
  initialSelectedIds,
  roundName
}) => {
  const [activeTab, setActiveTab] = useState<'select' | 'import'>('select');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  
  // Select Tab State
  const [search, setSearch] = useState("");
  const [filterRight, setFilterRight] = useState<'ALL' | 'BUY' | 'RENT' | 'RENT_BUY'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ACTIVE'); // Default to active only

  // Import Tab State
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [importStats, setImportStats] = useState({ valid: 0, invalid: 0, duplicate: 0 });

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(initialSelectedIds));
      setImportStep(1);
      setImportedData([]);
      setSearch("");
    }
  }, [isOpen, initialSelectedIds]);

  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      const matchSearch = (p.name?.toLowerCase() || '').includes(search.toLowerCase()) || 
                          (p.id?.toLowerCase() || '').includes(search.toLowerCase()) ||
                          (p.cccd || '').includes(search);
      
      const matchRight = filterRight === 'ALL' ||
                         (filterRight === 'BUY' && p.right === 'buy') ||
                         (filterRight === 'RENT' && p.right === 'rent') ||
                         (filterRight === 'RENT_BUY' && p.right === 'rent_buy');

      const matchStatus = filterStatus === 'ALL' ||
                          (filterStatus === 'ACTIVE' && p.status === 'active') ||
                          (filterStatus === 'DISABLED' && p.status === 'disabled');

      return matchSearch && matchRight && matchStatus;
    });
  }, [participants, search, filterRight, filterStatus]);

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    const newSet = new Set(selectedIds);
    const allSelected = filteredParticipants.every(p => newSet.has(p.id));
    
    if (allSelected) {
      filteredParticipants.forEach(p => newSet.delete(p.id));
    } else {
      filteredParticipants.forEach(p => {
        if (p.status === 'active') newSet.add(p.id);
      });
    }
    setSelectedIds(newSet);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      
      // Basic validation and mapping
      // Assume Col 0: ID, Col 1: Name, Col 2: CCCD
      const processed = data.slice(1).map(row => ({
        id: String(row[0] || '').trim(),
        name: row[1],
        cccd: row[2],
        isValid: false,
        error: ''
      })).filter(r => r.id);

      let valid = 0;
      let invalid = 0;
      let duplicate = 0;

      const validated = processed.map(row => {
        const sysProfile = participants.find(p => p.id === row.id);
        if (!sysProfile) {
          invalid++;
          return { ...row, isValid: false, error: 'Không tìm thấy ID trong hệ thống' };
        }
        if (sysProfile.status === 'disabled') {
          invalid++;
          return { ...row, isValid: false, error: 'Hồ sơ đang bị khóa' };
        }
        if (selectedIds.has(row.id)) {
          duplicate++;
          return { ...row, isValid: true, error: 'Đã có trong danh sách (Trùng)' };
        }
        valid++;
        return { ...row, isValid: true, error: '' };
      });

      setImportedData(validated);
      setImportStats({ valid, invalid, duplicate });
      setImportStep(2); // Move to mapping/validation view
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    const newSet = new Set(selectedIds);
    importedData.forEach(row => {
      if (row.isValid) {
        newSet.add(row.id);
      }
    });
    setSelectedIds(newSet);
    setActiveTab('select');
    setImportStep(1);
    setImportedData([]);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Thiết lập danh sách hồ sơ</h2>
            <p className="text-sm font-bold text-slate-400 mt-1">Vòng bốc thăm: <span className="text-[#00468E]">{roundName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all shadow-sm border border-slate-100">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 pt-6 pb-0 flex gap-6 border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('select')}
            className={`pb-4 text-sm font-black uppercase tracking-wide border-b-2 transition-all flex items-center gap-2 ${activeTab === 'select' ? 'border-[#00468E] text-[#00468E]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <Database size={16} /> Chọn từ Quỹ Hồ Sơ
          </button>
          <button 
            onClick={() => setActiveTab('import')}
            className={`pb-4 text-sm font-black uppercase tracking-wide border-b-2 transition-all flex items-center gap-2 ${activeTab === 'import' ? 'border-[#00468E] text-[#00468E]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <Upload size={16} /> Import Excel
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-slate-50/30 p-8">
          {activeTab === 'select' ? (
            <div className="h-full flex flex-col gap-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Tìm kiếm ID, Tên, CCCD..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#00468E]"
                    />
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <select 
                    value={filterRight}
                    onChange={(e) => setFilterRight(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-[#00468E]"
                  >
                    <option value="ALL">Quyền: Tất cả</option>
                    <option value="BUY">Mua</option>
                    <option value="RENT">Thuê</option>
                    <option value="RENT_BUY">Thuê - Mua</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-xs font-bold text-slate-500">Đã chọn: <span className="text-[#00468E] text-lg">{selectedIds.size}</span></span>
                   {selectedIds.size > 0 && (
                     <button onClick={() => setSelectedIds(new Set())} className="text-xs font-bold text-red-500 hover:underline">Bỏ chọn tất cả</button>
                   )}
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 w-12 text-center">
                          <input 
                            type="checkbox" 
                            checked={filteredParticipants.length > 0 && filteredParticipants.every(p => selectedIds.has(p.id))}
                            onChange={handleSelectAll}
                            className="rounded border-slate-300 text-[#00468E] focus:ring-[#00468E]"
                          />
                        </th>
                        <th className="px-6 py-3">ID Hệ thống</th>
                        <th className="px-6 py-3">Họ và Tên</th>
                        <th className="px-6 py-3">CCCD</th>
                        <th className="px-6 py-3">Quyền</th>
                        <th className="px-6 py-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {filteredParticipants.map(p => (
                        <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(p.id) ? 'bg-blue-50/30' : ''} ${p.status === 'disabled' ? 'opacity-50 bg-slate-100' : ''}`}>
                          <td className="px-6 py-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.has(p.id)}
                              onChange={() => p.status === 'active' && handleToggleSelect(p.id)}
                              disabled={p.status === 'disabled'}
                              className="rounded border-slate-300 text-[#00468E] focus:ring-[#00468E] disabled:opacity-50"
                            />
                          </td>
                          <td className="px-6 py-3 font-bold text-[#00468E]">{p.id}</td>
                          <td className="px-6 py-3 font-medium text-slate-700">{p.name}</td>
                          <td className="px-6 py-3 font-mono text-xs text-slate-500">{p.cccd}</td>
                          <td className="px-6 py-3">
                             <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                                p.right === 'buy' ? 'bg-blue-100 text-blue-700' : 
                                p.right === 'rent' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'
                             }`}>
                                {p.right}
                             </span>
                          </td>
                          <td className="px-6 py-3">
                             {p.status === 'active' ? (
                               <span className="text-green-600 font-bold text-xs">Active</span>
                             ) : (
                               <span className="text-slate-400 font-bold text-xs">Disabled</span>
                             )}
                          </td>
                        </tr>
                      ))}
                      {filteredParticipants.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 font-medium italic">Không tìm thấy hồ sơ phù hợp</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              {importStep === 1 && (
                <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-slate-300 flex flex-col items-center gap-6 text-center max-w-lg">
                  <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-[#00468E]">
                    <FileSpreadsheet size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase">Upload danh sách</h3>
                    <p className="text-sm text-slate-500 mt-2">Chọn file Excel (.xlsx) chứa danh sách ID hồ sơ cần thêm vào vòng bốc thăm này.</p>
                  </div>
                  <label className="cursor-pointer px-8 py-3 bg-[#00468E] text-white rounded-xl font-black uppercase text-sm shadow-xl shadow-blue-900/20 hover:bg-[#003366] transition-all flex items-center gap-2">
                    <Upload size={18} /> Chọn File
                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <p className="text-xs text-slate-400 font-medium">Mẫu file: Cột A là ID Hệ thống</p>
                </div>
              )}

              {importStep === 2 && (
                <div className="w-full h-full flex flex-col gap-6">
                   <div className="grid grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center">
                         <p className="text-xs font-bold text-green-600 uppercase">Hợp lệ</p>
                         <p className="text-2xl font-black text-green-700">{importStats.valid}</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center">
                         <p className="text-xs font-bold text-red-600 uppercase">Lỗi / Không tìm thấy</p>
                         <p className="text-2xl font-black text-red-700">{importStats.invalid}</p>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
                         <p className="text-xs font-bold text-amber-600 uppercase">Trùng lặp</p>
                         <p className="text-2xl font-black text-amber-700">{importStats.duplicate}</p>
                      </div>
                   </div>

                   <div className="flex-1 bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col">
                      <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 sticky top-0">
                            <tr>
                              <th className="px-6 py-3">ID</th>
                              <th className="px-6 py-3">Trạng thái</th>
                              <th className="px-6 py-3">Ghi chú</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-sm">
                            {importedData.map((row, idx) => (
                              <tr key={idx} className={row.isValid ? 'bg-white' : 'bg-red-50/50'}>
                                <td className="px-6 py-3 font-bold text-slate-700">{row.id}</td>
                                <td className="px-6 py-3">
                                  {row.isValid ? (
                                    <span className="text-green-600 font-bold text-xs flex items-center gap-1"><CheckCircle2 size={12}/> Hợp lệ</span>
                                  ) : (
                                    <span className="text-red-500 font-bold text-xs flex items-center gap-1"><AlertCircle size={12}/> Lỗi</span>
                                  )}
                                </td>
                                <td className="px-6 py-3 text-xs text-slate-500">{row.error}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                   </div>

                   <div className="flex justify-end gap-3">
                      <button onClick={() => setImportStep(1)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold uppercase text-xs hover:bg-slate-50">
                        Quay lại
                      </button>
                      <button onClick={handleConfirmImport} disabled={importStats.valid === 0} className="px-6 py-3 bg-[#00468E] text-white rounded-xl font-black uppercase text-xs shadow-lg hover:bg-[#003366] disabled:opacity-50">
                        Xác nhận thêm {importStats.valid} hồ sơ
                      </button>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-between items-center">
           <div className="text-xs font-bold text-slate-500">
              Đang chọn: <span className="text-[#00468E] text-lg">{selectedIds.size}</span> hồ sơ
           </div>
           <div className="flex gap-3">
              <button onClick={onClose} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold uppercase text-xs hover:bg-slate-50">
                Hủy bỏ
              </button>
              <button 
                onClick={() => onConfirm(Array.from(selectedIds))}
                className="px-8 py-3 bg-[#00468E] text-white rounded-xl font-black uppercase text-xs shadow-xl shadow-blue-900/20 hover:bg-[#003366] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <Save size={16} /> Lưu danh sách
              </button>
           </div>
        </div>
      </div>
    </div>
  , document.body);
};
