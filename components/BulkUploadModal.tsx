import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  FileArchive, 
  Files,
  ArrowRight,
  Search,
  Trash2
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { Participant } from '../types';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (results: { success: number; skipped: number; errors: number; updatedParticipants: Participant[] }) => void;
  participants: Participant[];
}

interface FileMatchResult {
  fileName: string;
  file: File;
  status: 'matched' | 'not_found' | 'conflict' | 'error';
  participantId?: string;
  participantName?: string;
  participantCCCD?: string;
  errorMsg?: string;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  participants
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [uploadType, setUploadType] = useState<'zip' | 'multi'>('multi');
  const [files, setFiles] = useState<File[]>([]);
  const [matchResults, setMatchResults] = useState<FileMatchResult[]>([]);
  const [autoComplete, setAutoComplete] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length > 1000) {
        alert("Vượt quá giới hạn 1000 file/lần!");
        return;
      }
      setFiles(selectedFiles);
    }
  };

  // Step 2 -> 3: Process Matching
  const processMatching = () => {
    const results: FileMatchResult[] = files.map(file => {
      const name = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      let match: Participant | undefined;

      // Always match by CCCD as per requirement
      match = participants.find(p => name.includes(p.cccd));

      if (!file.name.toLowerCase().endsWith('.pdf')) {
        return {
          fileName: file.name,
          file,
          status: 'error',
          errorMsg: 'Định dạng không phải PDF'
        };
      }

      if (match) {
        // Check for conflicts (simple check: if multiple files match same ID - handled by map key later if needed, 
        // but here we just check if 1 file matches multiple profiles? No, find returns first.
        // Reverse check: if multiple files match the same profile?
        return {
          fileName: file.name,
          file,
          status: 'matched',
          participantId: match.id,
          participantName: match.name,
          participantCCCD: match.cccd
        };
      } else {
        return {
          fileName: file.name,
          file,
          status: 'not_found',
          errorMsg: 'Không tìm thấy hồ sơ khớp'
        };
      }
    });

    setMatchResults(results);
    setStep(3);
  };

  // Step 4: Final Confirmation
  const handleConfirm = () => {
    const successMatches = matchResults.filter(r => r.status === 'matched');
    
    // Create a map of updates
    const updatedParticipants = [...participants];
    let successCount = 0;

    successMatches.forEach(match => {
      const idx = updatedParticipants.findIndex(p => p.id === match.participantId);
      if (idx !== -1) {
        updatedParticipants[idx] = {
          ...updatedParticipants[idx],
          documentUrl: URL.createObjectURL(match.file), // In real app, upload to server and get URL
          profileStatus: autoComplete ? 'complete' : updatedParticipants[idx].profileStatus
        };
        successCount++;
      }
    });

    onConfirm({
      success: successCount,
      skipped: matchResults.filter(r => r.status === 'not_found').length,
      errors: matchResults.filter(r => r.status === 'error' || r.status === 'conflict').length,
      updatedParticipants
    });
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Bulk Upload Hồ Sơ Scan</h2>
            <p className="text-sm font-bold text-slate-400 mt-1">Bước {step}/4</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all shadow-sm border border-slate-100">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* STEP 1: Choose Method */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <label className={`cursor-pointer p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${uploadType === 'zip' ? 'border-[#00468E] bg-blue-50/50' : 'border-slate-200 hover:border-blue-200'}`}>
                  <input type="radio" name="type" className="hidden" checked={uploadType === 'zip'} onChange={() => setUploadType('zip')} />
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${uploadType === 'zip' ? 'bg-[#00468E] text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <FileArchive size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-slate-700 uppercase">File ZIP</p>
                    <p className="text-xs text-slate-500 mt-1">Chứa nhiều file PDF</p>
                  </div>
                </label>

                <label className={`cursor-pointer p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${uploadType === 'multi' ? 'border-[#00468E] bg-blue-50/50' : 'border-slate-200 hover:border-blue-200'}`}>
                  <input type="radio" name="type" className="hidden" checked={uploadType === 'multi'} onChange={() => setUploadType('multi')} />
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${uploadType === 'multi' ? 'bg-[#00468E] text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Files size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-slate-700 uppercase">Nhiều file PDF</p>
                    <p className="text-xs text-slate-500 mt-1">Chọn trực tiếp (Max 1000)</p>
                  </div>
                </label>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-700 uppercase">Lưu ý quan trọng</p>
                  <ul className="text-xs text-amber-600 list-disc pl-4 space-y-0.5">
                    <li>Tối đa 1000 bộ hồ sơ/lần upload.</li>
                    <li>Mỗi hồ sơ tương ứng với 1 file PDF duy nhất.</li>
                    <li>Tên file phải chứa <strong>Tên Chủ Hồ Sơ</strong> kèm <strong>CCCD</strong> (Ví dụ Nguyenvana_001191033786)</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-center">
                 <button 
                   onClick={() => setStep(2)}
                   className="px-8 py-3 bg-[#00468E] text-white rounded-xl font-black uppercase text-sm shadow-xl shadow-blue-900/20 hover:bg-[#003366] transition-all flex items-center gap-2"
                 >
                   Tiếp tục <ArrowRight size={16} />
                 </button>
              </div>
            </div>
          )}

          {/* STEP 2: Upload */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Upload File</p>
                <p className="text-xs text-slate-500">Hệ thống sẽ tự động đối soát dựa trên tên file (chứa CCCD).</p>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <input 
                    type="file" 
                    multiple 
                    accept={uploadType === 'zip' ? '.zip' : '.pdf'}
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                 />
                 <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#00468E]">
                    <Upload size={32} />
                 </div>
                 <div className="text-center">
                    <p className="font-black text-slate-700 uppercase">Click để chọn file</p>
                    <p className="text-xs text-slate-400 mt-1">{files.length > 0 ? `Đã chọn ${files.length} file` : (uploadType === 'zip' ? 'Chọn file .ZIP' : 'Chọn các file .PDF')}</p>
                 </div>
              </div>

              <div className="flex justify-between">
                 <button onClick={() => setStep(1)} className="px-6 py-3 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl">Quay lại</button>
                 <button 
                   onClick={processMatching}
                   disabled={files.length === 0}
                   className="px-8 py-3 bg-[#00468E] text-white rounded-xl font-black uppercase text-sm shadow-xl shadow-blue-900/20 hover:bg-[#003366] disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                 >
                   Tiến hành ghép <ArrowRight size={16} />
                 </button>
              </div>
            </div>
          )}

          {/* STEP 3: Preview Results */}
          {step === 3 && (
            <div className="h-full flex flex-col gap-6">
               <div className="grid grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <p className="text-[10px] font-bold text-slate-400 uppercase">Tổng file</p>
                     <p className="text-xl font-black text-slate-700">{matchResults.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                     <p className="text-[10px] font-bold text-green-600 uppercase">Ghép thành công</p>
                     <p className="text-xl font-black text-green-700">{matchResults.filter(r => r.status === 'matched').length}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                     <p className="text-[10px] font-bold text-red-600 uppercase">Không tìm thấy</p>
                     <p className="text-xl font-black text-red-700">{matchResults.filter(r => r.status === 'not_found').length}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                     <p className="text-[10px] font-bold text-amber-600 uppercase">Lỗi / Định dạng</p>
                     <p className="text-xl font-black text-amber-700">{matchResults.filter(r => r.status === 'error').length}</p>
                  </div>
               </div>

               <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                  <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex gap-6 text-xs font-black uppercase text-slate-500">
                     <div className="w-1/3">File Name</div>
                     <div className="w-1/4">Trạng thái</div>
                     <div className="flex-1">Kết quả ghép</div>
                  </div>
                  <div className="overflow-y-auto flex-1 p-0">
                     {matchResults.map((res, idx) => (
                        <div key={idx} className="px-6 py-3 border-b border-slate-50 flex gap-6 items-center text-sm hover:bg-slate-50">
                           <div className="w-1/3 font-medium text-slate-700 truncate" title={res.fileName}>{res.fileName}</div>
                           <div className="w-1/4">
                              {res.status === 'matched' && <span className="text-green-600 font-bold text-xs flex items-center gap-1"><CheckCircle2 size={12}/> Thành công</span>}
                              {res.status === 'not_found' && <span className="text-red-500 font-bold text-xs flex items-center gap-1"><Search size={12}/> Không tìm thấy</span>}
                              {res.status === 'error' && <span className="text-amber-500 font-bold text-xs flex items-center gap-1"><AlertCircle size={12}/> Lỗi file</span>}
                           </div>
                           <div className="flex-1">
                              {res.status === 'matched' ? (
                                 <div className="flex flex-col">
                                    <span className="font-bold text-[#00468E]">{res.participantId}</span>
                                    <span className="text-xs text-slate-500">{res.participantName} - {res.participantCCCD}</span>
                                 </div>
                              ) : (
                                 <span className="text-xs text-slate-400 italic">{res.errorMsg}</span>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="flex justify-between">
                 <button onClick={() => setStep(2)} className="px-6 py-3 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl">Quay lại</button>
                 <button 
                   onClick={() => setStep(4)}
                   disabled={matchResults.filter(r => r.status === 'matched').length === 0}
                   className="px-8 py-3 bg-[#00468E] text-white rounded-xl font-black uppercase text-sm shadow-xl shadow-blue-900/20 hover:bg-[#003366] disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                 >
                   Tiếp tục <ArrowRight size={16} />
                 </button>
              </div>
            </div>
          )}

          {/* STEP 4: Confirmation */}
          {step === 4 && (
             <div className="flex flex-col items-center justify-center h-full gap-8 max-w-lg mx-auto text-center">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-4">
                   <CheckCircle2 size={48} />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 uppercase">Xác nhận cập nhật</h3>
                   <p className="text-slate-500 mt-2">
                      Bạn đang chuẩn bị cập nhật PDF cho <strong className="text-[#00468E]">{matchResults.filter(r => r.status === 'matched').length}</strong> hồ sơ.
                   </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full text-left space-y-4">
                   <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-[#00468E] focus:ring-[#00468E]" defaultChecked />
                      <span className="text-sm font-bold text-slate-700">Tôi hiểu thao tác này sẽ thay thế PDF cũ (nếu có)</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer">
                      <div className={`w-10 h-6 rounded-full p-1 transition-colors ${autoComplete ? 'bg-[#00468E]' : 'bg-slate-300'}`} onClick={(e) => { e.preventDefault(); setAutoComplete(!autoComplete); }}>
                         <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${autoComplete ? 'translate-x-4' : ''}`} />
                      </div>
                      <span className="text-sm font-bold text-slate-700">Tự động đánh dấu "Hoàn thành" khi có PDF</span>
                   </label>
                </div>

                <div className="flex gap-4 w-full">
                   <button onClick={() => setStep(3)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-black uppercase text-sm hover:bg-slate-50">
                      Xem lại
                   </button>
                   <button 
                     onClick={handleConfirm}
                     className="flex-1 py-4 bg-[#00468E] text-white rounded-xl font-black uppercase text-sm shadow-xl shadow-blue-900/20 hover:bg-[#003366] transition-all"
                   >
                      Xác nhận Upload
                   </button>
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  , document.body);
};
