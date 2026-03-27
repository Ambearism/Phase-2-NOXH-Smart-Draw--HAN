import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileWarning,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Download,
  Trash2,
  RefreshCw,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { createPortal } from 'react-dom';
import { Apartment } from '../types';

interface ImportApartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newApartments: Apartment[]) => void;
  existingApartments: Apartment[];
}

type ImportStep = 1 | 2 | 3 | 4;

interface ExcelRow {
  [key: string]: any;
}

interface ValidationResult {
  valid: Apartment[];
  duplicates: { row: Apartment; reason: string; existingId: string }[];
  errors: { row: any; reason: string }[];
}

export const ImportApartmentModal: React.FC<ImportApartmentModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingApartments
}) => {
  const [step, setStep] = useState<ImportStep>(1);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ExcelRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult>({ valid: [], duplicates: [], errors: [] });
  const [activeTab, setActiveTab] = useState<'valid' | 'duplicate' | 'error'>('valid');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmErrors, setConfirmErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFile(null);
      setPreviewData([]);
      setHeaders([]);
      setValidationResult({ valid: [], duplicates: [], errors: [] });
      setActiveTab('valid');
      setConfirmErrors(false);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (uploadedFile: File) => {
    if (!uploadedFile.name.match(/\.(xlsx|xls)$/)) {
      alert("Vui lòng chọn file Excel (.xlsx, .xls)");
      return;
    }
    setFile(uploadedFile);
  };

  const readExcel = () => {
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { header: 1 });

      if (jsonData.length > 0) {
        const headerRow = jsonData[0] as string[];
        const rows = jsonData.slice(1);

        const objectRows = rows.map((row: any) => {
          const obj: ExcelRow = {};
          headerRow.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });

        setHeaders(headerRow);
        setPreviewData(objectRows);
        setStep(2);
      }
      setIsProcessing(false);
    };
    reader.readAsBinaryString(file);
  };

  const validateData = () => {
    setIsProcessing(true);
    const valid: Apartment[] = [];
    const duplicates: { row: Apartment; reason: string; existingId: string }[] = [];
    const errors: { row: any; reason: string }[] = [];

    const normalize = (str: any) => String(str || '').trim();

    const mapRowToApartment = (row: ExcelRow): Apartment | null => {
      const idKey = headers.find(h => h.toLowerCase().includes('id') || h.toLowerCase().includes('mã'));
      const areaKey = headers.find(h => h.toLowerCase().includes('diện tích') || h.toLowerCase().includes('dt'));
      const orientationKey = headers.find(h => h.toLowerCase().includes('hướng'));
      const rightKey = headers.find(h => h.toLowerCase().includes('quyền'));

      if (!idKey || !areaKey || !orientationKey || !rightKey) {
        return null;
      }

      const id = normalize(row[idKey]).toUpperCase();
      const areaStr = normalize(row[areaKey]);
      const orientation = normalize(row[orientationKey]);
      const rightStr = normalize(row[rightKey]).toLowerCase();

      if (!id || !areaStr || !orientation || !rightStr) return null;

      // Validate ID format: C + 6 digits (C010203)
      if (!/^C\d{6}$/.test(id)) {
        throw new Error(`ID không đúng định dạng (Cxxxxxx): ${id}`);
      }

      const area = parseFloat(areaStr);
      if (isNaN(area) || area <= 0) {
        throw new Error(`Diện tích không hợp lệ: ${areaStr}`);
      }

      // Map Right
      let right: 'buy' | 'rent' | 'rent_buy' = 'buy';
      if (rightStr.includes('thuê-mua') || rightStr.includes('thue-mua')) right = 'rent_buy';
      else if (rightStr.includes('thuê') || rightStr.includes('thue')) right = 'rent';
      else if (rightStr.includes('mua')) right = 'buy';
      else throw new Error(`Quyền không hợp lệ: ${rightStr}. Chỉ chấp nhận: Mua, Thuê, Thuê-Mua`);

      const block = id.substring(1, 3);
      const floor = id.substring(3, 5);
      const unit = id.substring(5, 7);

      return {
        id,
        block,
        floor,
        unit,
        type: (unit.includes('UT') || unit.includes('C01')) ? 'uu_tien' : 'thuong', // Default type mapping
        area,
        orientation,
        status: 'trong' as 'trong',
        right: right as 'mua' | 'thue' | 'thue_mua',
      };
    };

    previewData.forEach((row, index) => {
      try {
        const apartment = mapRowToApartment(row);

        if (!apartment) {
          errors.push({ row, reason: "Thiếu thông tin bắt buộc (ID, Diện tích, Hướng)" });
          return;
        }

        // Check Duplicates in existing data
        const duplicateInSystem = existingApartments.find(p => p.id === apartment.id);
        // Check Duplicates in current batch (valid array)
        const duplicateInBatch = valid.find(p => p.id === apartment.id);

        if (duplicateInSystem) {
          duplicates.push({
            row: apartment,
            reason: "Đã tồn tại trong hệ thống",
            existingId: duplicateInSystem.id
          });
        } else if (duplicateInBatch) {
          duplicates.push({
            row: apartment,
            reason: "Trùng lặp trong file import",
            existingId: duplicateInBatch.id
          });
        } else {
          valid.push(apartment);
        }
      } catch (e: any) {
        errors.push({ row, reason: e.message });
      }
    });

    setValidationResult({ valid, duplicates, errors });
    setStep(3);
    setIsProcessing(false);
  };

  const handleConfirmImport = () => {
    onImport(validationResult.valid);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="text-[#00468E]" /> Import Quỹ Căn Hộ
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">
              Thêm căn hộ mới vào hệ thống
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-8 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-colors ${step >= s ? 'bg-[#00468E] border-[#00468E] text-white' : 'bg-white border-slate-200 text-slate-300'
                  }`}>
                  {s}
                </div>
                <span className={`text-xs font-bold uppercase ${step >= s ? 'text-[#00468E]' : 'text-slate-300'}`}>
                  {s === 1 ? 'Upload' : s === 2 ? 'Preview' : s === 3 ? 'Validate' : 'Confirm'}
                </span>
                {s < 4 && <div className={`w-8 h-0.5 ${step > s ? 'bg-[#00468E]' : 'bg-slate-100'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-8 bg-slate-50">

          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <div className="h-full flex flex-col items-center justify-center gap-6 animate-fade-in">
              <div
                className={`w-full max-w-2xl h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${file ? 'border-[#00468E] bg-blue-50/50' : 'border-slate-300 hover:border-[#00468E] hover:bg-white'
                  }`}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                />

                {file ? (
                  <>
                    <div className="w-16 h-16 bg-blue-100 text-[#00468E] rounded-2xl flex items-center justify-center">
                      <FileSpreadsheet size={32} />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-700">{file.name}</p>
                      <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="text-red-500 text-xs font-bold uppercase hover:underline"
                    >
                      Xóa file
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
                      <Upload size={32} />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-700">Kéo thả file vào đây hoặc click để chọn</p>
                      <p className="text-sm text-slate-400">Hỗ trợ định dạng .xlsx, .xls</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-xs font-bold uppercase hover:bg-slate-50">
                  <Download size={16} /> Tải file mẫu
                </button>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 max-w-2xl w-full">
                <h4 className="text-xs font-black text-[#00468E] uppercase mb-2 flex items-center gap-2">
                  <Info size={14} /> Yêu cầu cột dữ liệu
                </h4>
                <div className="flex gap-4 text-xs text-slate-600">
                  <span className="font-bold">ID Căn (Cxxxxxx)</span>
                  <span className="font-bold">Diện tích (m2)</span>
                  <span className="font-bold">Hướng nhà</span>
                  <span className="font-bold">Quyền (Mua/Thuê/Thuê-Mua)</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW */}
          {step === 2 && (
            <div className="h-full flex flex-col gap-6 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-500" /> Mapping Cột Tự Động
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {['Mã Căn / ID', 'Diện tích', 'Hướng', 'Quyền'].map((field, i) => (
                    <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{field}</p>
                      <p className="text-sm font-bold text-slate-700 truncate">
                        {headers.find(h => h.toLowerCase().includes(field.split(' ')[0].toLowerCase())) || <span className="text-red-500">Không tìm thấy</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-700 text-sm">Preview dữ liệu (20 dòng đầu)</h3>
                </div>
                <div className="overflow-auto flex-1">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-bold text-slate-500 sticky top-0">
                      <tr>
                        {headers.map((h, i) => <th key={i} className="px-4 py-3 border-b border-slate-100">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {previewData.slice(0, 20).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          {headers.map((h, j) => <td key={j} className="px-4 py-3 text-slate-600">{row[h]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: VALIDATION */}
          {step === 3 && (
            <div className="h-full flex flex-col gap-6 animate-fade-in">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase">Tổng dòng</p>
                  <p className="text-2xl font-black text-slate-800">{previewData.length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase">Hợp lệ</p>
                  <p className="text-2xl font-black text-green-600">{validationResult.valid.length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase">Trùng lặp</p>
                  <p className="text-2xl font-black text-amber-500">{validationResult.duplicates.length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase">Lỗi dữ liệu</p>
                  <p className="text-2xl font-black text-red-500">{validationResult.errors.length}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('valid')}
                  className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'valid' ? 'border-green-500 text-green-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Hợp lệ ({validationResult.valid.length})
                </button>
                <button
                  onClick={() => setActiveTab('duplicate')}
                  className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'duplicate' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Trùng lặp ({validationResult.duplicates.length})
                </button>
                <button
                  onClick={() => setActiveTab('error')}
                  className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'error' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Lỗi ({validationResult.errors.length})
                </button>
              </div>

              {/* Result Table */}
              <div className="flex-1 bg-white rounded-b-2xl shadow-sm border border-t-0 border-slate-100 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-bold text-slate-500 sticky top-0">
                      <tr>
                        <th className="px-4 py-3">ID Căn</th>
                        <th className="px-4 py-3">Diện tích</th>
                        <th className="px-4 py-3">Hướng</th>
                        <th className="px-4 py-3">Quyền</th>
                        {activeTab === 'duplicate' && <th className="px-4 py-3">Lý do</th>}
                        {activeTab === 'error' && <th className="px-4 py-3">Lỗi</th>}
                        {activeTab === 'duplicate' && <th className="px-4 py-3 text-right">Xử lý</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {activeTab === 'valid' && validationResult.valid.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-black text-[#00468E]">{p.id}</td>
                          <td className="px-4 py-3 font-mono text-slate-500">{p.area} m²</td>
                          <td className="px-4 py-3 font-bold text-slate-700">{p.orientation}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${p.right === 'buy' ? 'bg-blue-100 text-blue-700' : p.right === 'rent' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                              {p.right === 'buy' ? 'Mua' : p.right === 'rent' ? 'Thuê' : 'Thuê-Mua'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {activeTab === 'duplicate' && validationResult.duplicates.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50 bg-amber-50/30">
                          <td className="px-4 py-3 font-black text-slate-700">{d.row.id}</td>
                          <td className="px-4 py-3 font-mono text-slate-500">{d.row.area} m²</td>
                          <td className="px-4 py-3 font-bold text-slate-700">{d.row.orientation}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${d.row.right === 'buy' ? 'bg-blue-100 text-blue-700' : d.row.right === 'rent' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                              {d.row.right === 'buy' ? 'Mua' : d.row.right === 'rent' ? 'Thuê' : 'Thuê-Mua'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-amber-600 font-medium">
                            {d.reason}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs font-bold text-slate-400">Bỏ qua</span>
                          </td>
                        </tr>
                      ))}
                      {activeTab === 'error' && validationResult.errors.map((e, i) => (
                        <tr key={i} className="hover:bg-slate-50 bg-red-50/30">
                          <td className="px-4 py-3 font-bold text-slate-700 text-opacity-50">---</td>
                          <td className="px-4 py-3 font-mono text-slate-500 text-opacity-50">---</td>
                          <td className="px-4 py-3 font-mono text-slate-500 text-opacity-50">---</td>
                          <td className="px-4 py-3 text-red-600 font-medium">{e.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRM */}
          {step === 4 && (
            <div className="h-full flex flex-col items-center justify-center gap-6 animate-fade-in max-w-lg mx-auto text-center">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-800">Sẵn sàng Import</h3>
              <p className="text-slate-500">
                Bạn sắp import <strong className="text-[#00468E]">{validationResult.valid.length}</strong> căn hộ vào hệ thống.
              </p>

              <div className="bg-slate-100 p-6 rounded-2xl w-full text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-slate-500">Hợp lệ:</span>
                  <span className="text-sm font-black text-green-600">{validationResult.valid.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-slate-500">Bỏ qua (Trùng):</span>
                  <span className="text-sm font-black text-amber-500">{validationResult.duplicates.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-slate-500">Bỏ qua (Lỗi):</span>
                  <span className="text-sm font-black text-red-500">{validationResult.errors.length}</span>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-slate-300 text-[#00468E] focus:ring-[#00468E]"
                  checked={confirmErrors}
                  onChange={(e) => setConfirmErrors(e.target.checked)}
                />
                <span className="text-sm font-bold text-slate-600 group-hover:text-[#00468E] transition-colors">
                  Tôi hiểu các dòng lỗi và trùng lặp sẽ không được nhập
                </span>
              </label>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-between items-center">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1 as ImportStep)}
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 flex items-center gap-2"
            >
              <ChevronLeft size={18} /> Quay lại
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-50"
            >
              Hủy bỏ
            </button>

            {step === 1 && (
              <button
                onClick={readExcel}
                disabled={!file || isProcessing}
                className="px-8 py-3 rounded-xl bg-[#00468E] text-white font-bold shadow-lg shadow-blue-900/20 hover:bg-[#003366] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
              >
                {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                Tiếp tục
              </button>
            )}

            {step === 2 && (
              <button
                onClick={validateData}
                disabled={isProcessing}
                className="px-8 py-3 rounded-xl bg-[#00468E] text-white font-bold shadow-lg shadow-blue-900/20 hover:bg-[#003366] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
              >
                {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                Kiểm tra dữ liệu
              </button>
            )}

            {step === 3 && (
              <button
                onClick={() => setStep(4)}
                disabled={validationResult.valid.length === 0}
                className="px-8 py-3 rounded-xl bg-[#00468E] text-white font-bold shadow-lg shadow-blue-900/20 hover:bg-[#003366] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
              >
                <ArrowRight size={18} />
                Tiếp tục
              </button>
            )}

            {step === 4 && (
              <button
                onClick={handleConfirmImport}
                disabled={!confirmErrors}
                className="px-8 py-3 rounded-xl bg-[#00468E] text-white font-bold shadow-lg shadow-blue-900/20 hover:bg-[#003366] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
              >
                <Download size={18} />
                Xác nhận Import
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  , document.body);
};
