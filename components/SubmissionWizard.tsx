import React, { useState } from 'react';
import { ChevronLeft, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Participant } from '../types';
import { GROUP_K_CONFIGS } from '../constants';

interface SubmissionWizardProps {
  currentUser: Participant;
  onGoBack: () => void;
  onSubmit: (groupK: string, files: any[], form02Data: any) => void;
  isDesktop?: boolean;
}

export function SubmissionWizard({ currentUser, onGoBack, onSubmit, isDesktop = false }: SubmissionWizardProps) {
  const [step, setStep] = useState(currentUser.applicationState === 'tra_ho_so' ? 2 : 1);
  const [selectedGroup, setSelectedGroup] = useState<string>(currentUser.groupK || '');
  const [files, setFiles] = useState<Record<string, File[]>>({}); // Changed to Array for multi-upload
  const [form02Data, setForm02Data] = useState(currentUser.form02Data || {
    ownerName: currentUser.name || '',
    registrationRight: '' as any,
    currentAddress: '',
    contactPhone: currentUser.phone || '',
    idNumber09: '',
    idNumber12: currentUser.cccd || '',
    idIssuanceDate: '',
    idIssuancePlace: '',
    militaryIdNumber: '', 
    permanentAddress: '',
    temporaryAddress: '',
    registrationType: 'moi' as const,
    oldOwnerName: '',
    oldOwnerId: '',
    transferContractDate: '',
    householdMemberCount: 1,
    familyMembers: [] as { id: string, name: string, relationship: string, cccd09: string, cccd12: string }[],
    housingStatus: {
      noHome: false,
      lowArea: false,
      farAway: false,
      other: false,
    },
    subjectCategory: {
      nguoiCoCong: false,
      ngheoNongThon: false,
      ngheoThienTai: false,
      ngheoDoThi: false,
      thuNhapThap: false,
      congNhan: false,
      lucLuongVuTrang: false,
      canBoCongChuc: false,
      traNhaCongVu: false,
      thuHoiDat: false,
      hocSinhSinhVien: false,
      doanhNghiep: false,
    },
  });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const getForm02Errors = () => {
    const errors: string[] = [];
    if (!form02Data.ownerName) errors.push("Vui lòng nhập Họ tên chủ hồ sơ");
    if (!form02Data.registrationRight) errors.push("Vui lòng chọn Hình thức đăng ký (Mua, Thuê hoặc Thuê Mua)");
    if (!form02Data.currentAddress) errors.push("Vui lòng nhập Địa chỉ nơi ở hiện nay");
    if (!form02Data.contactPhone) errors.push("Vui lòng nhập Số điện thoại liên lạc");
    if (!form02Data.permanentAddress) errors.push("Vui lòng nhập Hộ khẩu thường trú");
    
    const has09 = form02Data.idNumber09 && form02Data.idNumber09.length === 9;
    const has12 = form02Data.idNumber12 && form02Data.idNumber12.length === 12;
    
    if (!has09 && !has12) {
      errors.push("Vui lòng nhập đúng Số CMND (9 số) hoặc Số thẻ CCCD (12 số)");
    }

    if (!form02Data.idIssuanceDate) errors.push("Vui lòng chọn Ngày cấp CMND/CCCD");
    if (!form02Data.idIssuancePlace) errors.push("Vui lòng nhập Nơi cấp CMND/CCCD");
    
    const invalidFamily = form02Data.familyMembers.some((m: any) => !m.name || (!m.cccd09 && !m.cccd12));
    if (invalidFamily) errors.push("Vui lòng điền đầy đủ Họ tên và Số định danh (CMND/CCCD) cho tất cả thành viên gia đình");

    if (!Object.values(form02Data.housingStatus).some(v => v)) errors.push("Vui lòng chọn 1 tình trạng nhà ở (Mục 3)");
    if (!Object.values(form02Data.subjectCategory).some(v => v)) errors.push("Vui lòng chọn 1 phân loại đối tượng (Mục 4)");
    
    return errors;
  };

  const isForm02Valid = getForm02Errors().length === 0;

  const activeGroupConfig = GROUP_K_CONFIGS.find(g => g.id === selectedGroup);

  const handleFileChange = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => ({ 
        ...prev, 
        [docId]: [...(prev[docId] || []), ...newFiles] 
      }));
    }
  };

  const removeFile = (docId: string, index: number) => {
    setFiles(prev => ({
      ...prev,
      [docId]: (prev[docId] || []).filter((_, i) => i !== index)
    }));
  };

  const addFamilyMember = () => {
    if (form02Data.familyMembers.length >= 7) return;
    setForm02Data({
      ...form02Data,
      familyMembers: [...form02Data.familyMembers, { id: Math.random().toString(36).substr(2, 9), name: '', relationship: '', cccd09: '', cccd12: '' }]
    });
  };

  const updateFamilyMember = (id: string, field: string, value: string) => {
    setForm02Data({
      ...form02Data,
      familyMembers: form02Data.familyMembers.map(m => m.id === id ? { ...m, [field]: value } : m)
    });
  };

  const removeFamilyMember = (id: string) => {
    if (form02Data.familyMembers.length > 1) {
      setForm02Data({
        ...form02Data,
        familyMembers: form02Data.familyMembers.filter(m => m.id !== id)
      });
    }
  };

  const isForm02ValidOld = form02Data.registrationRight && form02Data.currentAddress && form02Data.contactPhone && form02Data.familyMembers.every(m => m.name && (m.cccd09 || m.cccd12));

  const finishSubmission = () => {
    // Flatten files for the parent component
    const uploadedFiles = Object.entries(files).flatMap(([category, fileList]) => 
      (fileList as File[]).map(f => ({
        id: category,
        name: f.name,
        category: category,
        url: URL.createObjectURL(f)
      }))
    );
    onSubmit(selectedGroup, uploadedFiles, form02Data);
  };

  return (
    <div className={`flex-1 flex flex-col h-full animate-fade-in bg-slate-50 relative pb-10 ${isDesktop ? 'max-w-7xl mx-auto' : ''}`}>
      {/* Header */}
      <div className={`bg-white ${isDesktop ? 'px-12 py-8 rounded-t-3xl border-x border-t' : 'px-6 py-4 border-b'} border-slate-100 flex items-center justify-between sticky top-0 z-20 shadow-sm`}>
        <div className="flex items-center gap-4">
          <button onClick={onGoBack} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <ChevronLeft size={20} />
          </button>
          <h3 className={`font-black text-[#00468E] ${isDesktop ? 'text-2xl' : 'text-lg'} uppercase tracking-tight`}>Nộp Hồ Sơ</h3>
        </div>
        <div className="font-bold text-slate-400 text-xs text-right">
          BƯỚC {step}/6<br/>
          <span className="text-[10px] opacity-60 uppercase">Xác thực OTP</span>
        </div>
      </div>

      {/* Horizontal Progress Bar (Desktop) */}
      {isDesktop ? (
        <div className="bg-white px-12 py-6 border-b border-slate-100 flex items-center justify-between sticky top-[97px] z-10 shadow-sm">
          {[
            { id: 1, label: 'Biểu mẫu 02' },
            { id: 2, label: 'Nhóm đối tượng' },
            { id: 3, label: 'Đính kèm hồ sơ' },
            { id: 4, label: 'Cam kết hồ sơ' },
            { id: 5, label: 'Xác thực OTP' },
            { id: 6, label: 'Hoàn tất' }
          ].map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${s.id <= step ? 'bg-[#00468E] text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                  {s.id < step ? <CheckCircle2 size={16} /> : s.id}
                </div>
                <div className="flex flex-col">
                  <p className={`text-[9px] font-black uppercase tracking-widest ${s.id <= step ? 'text-[#00468E]' : 'text-slate-400'}`}>{s.label}</p>
                </div>
              </div>
              {idx < 5 && <div className={`flex-1 h-[2px] mx-4 rounded-full ${s.id < step ? 'bg-[#00468E]' : 'bg-slate-100'}`} />}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div className="bg-white px-6 py-3 border-b border-slate-100 flex gap-1 justify-between sticky top-[65px] z-10">
          {[1, 2, 3, 4, 5, 6].map(s => (
            <div key={s} className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: s <= step ? '#00468E' : '#E2E8F0' }} />
          ))}
        </div>
      )}

      <div className={`${isDesktop ? 'p-12 border-x border-b bg-white rounded-b-3xl shadow-sm' : 'p-6'} overflow-y-auto flex-1 pb-24`}>
            {/* STEP 1: BIỂU MẪU 02 */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className={`bg-[#00468E] text-white ${isDesktop ? 'p-10 rounded-3xl mb-10' : 'p-6 -mx-6 -mt-6 mb-6'}`}>
              <h4 className={`font-black ${isDesktop ? 'text-3xl' : 'text-xl'} uppercase tracking-tight`}>Kê khai Biểu mẫu 02</h4>
              <p className={`${isDesktop ? 'text-base' : 'text-xs'} text-blue-100 font-medium`}>Vui lòng điền đầy đủ thông tin đăng ký (Mục 1, 2, 5)</p>
            </div>

            <div className="space-y-6">
              {/* 0. Thông tin cá nhân cơ bản */}
              <div className={`${isDesktop ? 'p-10' : 'p-5'} bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4`}>
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Thông tin định danh & Liên lạc</h5>
                <div className={`grid ${isDesktop ? 'grid-cols-3' : 'grid-cols-1'} gap-x-6 gap-y-4`}>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Họ và tên chủ hồ sơ *</label>
                    <input 
                      placeholder="Nhập họ và tên" 
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-black uppercase text-[#00468E] focus:ring-1 focus:ring-blue-200"
                      value={form02Data.ownerName}
                      onChange={(e) => setForm02Data({ ...form02Data, ownerName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Số điện thoại *</label>
                    <input 
                      placeholder="09xxx" 
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-200"
                      value={form02Data.contactPhone}
                      onChange={(e) => setForm02Data({ ...form02Data, contactPhone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">CMND (9 số)</label>
                    <input 
                      placeholder="Nếu có" 
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-200"
                      value={form02Data.idNumber09}
                      onChange={(e) => setForm02Data({ ...form02Data, idNumber09: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Thẻ CCCD (12 số) *</label>
                    <input 
                      placeholder="12 số" 
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-200"
                      value={form02Data.idNumber12}
                      onChange={(e) => setForm02Data({ ...form02Data, idNumber12: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Ngày cấp *</label>
                    <input 
                      type="date"
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-200"
                      value={form02Data.idIssuanceDate}
                      onChange={(e) => setForm02Data({ ...form02Data, idIssuanceDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nơi cấp *</label>
                    <input 
                      placeholder="Công an tỉnh..." 
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-200"
                      value={form02Data.idIssuancePlace}
                      onChange={(e) => setForm02Data({ ...form02Data, idIssuancePlace: e.target.value })}
                    />
                  </div>
                  <div className={`${isDesktop ? 'col-span-3' : ''} space-y-1`}>
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Hộ khẩu thường trú *</label>
                    <input 
                      placeholder="Theo sổ hộ khẩu" 
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-200"
                      value={form02Data.permanentAddress}
                      onChange={(e) => setForm02Data({ ...form02Data, permanentAddress: e.target.value })}
                    />
                  </div>
                  <div className={`${isDesktop ? 'col-span-3' : ''} space-y-1`}>
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Địa chỉ hiện tại *</label>
                    <input 
                      placeholder="Chỗ ở hiện nay" 
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-200"
                      value={form02Data.currentAddress}
                      onChange={(e) => setForm02Data({ ...form02Data, currentAddress: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tạm trú</label>
                    <input 
                      placeholder="Nếu có" 
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-200"
                      value={form02Data.temporaryAddress}
                      onChange={(e) => setForm02Data({ ...form02Data, temporaryAddress: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Số CMT CBCS</label>
                    <input 
                      placeholder="Dành cho CBCS" 
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-200"
                      value={form02Data.militaryIdNumber}
                      onChange={(e) => setForm02Data({ ...form02Data, militaryIdNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* 1. Hình thức đăng ký */}
              <div className="space-y-3">
                <label className="text-sm font-black text-slate-700 uppercase">1. Hình thức đăng ký</label>
                <div className="grid grid-cols-3 gap-3">
                  {['mua', 'thue', 'thue_mua'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setForm02Data({ ...form02Data, registrationRight: r as any })}
                      className={`py-3 rounded-xl border-2 font-bold text-xs uppercase transition-all ${form02Data.registrationRight === r ? 'border-[#00468E] bg-blue-50 text-[#00468E]' : 'border-slate-100 bg-white text-slate-400'}`}
                    >
                      {r === 'mua' ? 'Mua' : r === 'thue' ? 'Thuê' : 'Thuê Mua'}
                    </button>
                  ))}
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="regType" 
                      checked={form02Data.registrationType === 'moi'} 
                      onChange={() => setForm02Data({...form02Data, registrationType: 'moi'})}
                      className="accent-[#00468E] w-4 h-4"
                    />
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">Đăng ký mới</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="regType" 
                      checked={form02Data.registrationType === 'chuyen_nhuong'} 
                      onChange={() => setForm02Data({...form02Data, registrationType: 'chuyen_nhuong'})}
                      className="accent-[#00468E] w-4 h-4"
                    />
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">Nhận chuyển nhượng</span>
                  </label>
                </div>

                {form02Data.registrationType === 'chuyen_nhuong' && (
                  <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 space-y-4 animate-slide-down">
                    <h6 className="text-[10px] font-black text-[#00468E] uppercase tracking-widest border-b border-blue-100 pb-2">Thông tin người đăng ký cũ</h6>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Họ và tên người đăng ký cũ *</label>
                        <input 
                          placeholder="NGUYỄN VĂN B" 
                          className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold focus:border-[#00468E] outline-none"
                          value={form02Data.oldOwnerName}
                          onChange={(e) => setForm02Data({ ...form02Data, oldOwnerName: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Số CMTND/Thẻ CCCD *</label>
                          <input 
                            placeholder="Số ID người cũ" 
                            className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold focus:border-[#00468E] outline-none"
                            value={form02Data.oldOwnerId}
                            onChange={(e) => setForm02Data({ ...form02Data, oldOwnerId: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Ngày ký hợp đồng *</label>
                          <input 
                            type="date"
                            className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold focus:border-[#00468E] outline-none"
                            value={form02Data.transferContractDate}
                            onChange={(e) => setForm02Data({ ...form02Data, transferContractDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-slate-100/50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Số lượng người trong cùng sổ hộ khẩu</label>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setForm02Data({...form02Data, householdMemberCount: Math.max(1, (form02Data.householdMemberCount || 1) - 1)})} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600">-</button>
                            <span className="text-sm font-black text-[#00468E] w-6 text-center">{form02Data.householdMemberCount}</span>
                            <button onClick={() => setForm02Data({...form02Data, householdMemberCount: Math.min(15, (form02Data.householdMemberCount || 1) + 1)})} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600">+</button>
                        </div>
                    </div>
                </div>
              </div>

              {/* 2. Thành viên gia đình */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-black text-slate-700 uppercase">2. Thành viên cùng trong sổ hộ khẩu (Tối đa 15)</label>
                  <button 
                    onClick={() => {
                      if (form02Data.familyMembers.length >= 15) return;
                      setForm02Data({
                        ...form02Data,
                        familyMembers: [...form02Data.familyMembers, { id: Math.random().toString(36).substr(2, 9), name: '', relationship: '', cccd09: '', cccd12: '' }]
                      });
                    }} 
                    className="w-8 h-8 rounded-full bg-blue-100 text-[#00468E] flex items-center justify-center font-bold font-mono shadow-sm hover:bg-blue-200 transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="space-y-3">
                  {form02Data.familyMembers.map((member, idx) => (
                    <div key={member.id} className={`${isDesktop ? 'p-8' : 'p-4'} bg-white rounded-2xl border border-slate-100 shadow-sm relative animate-fade-in`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 rounded-lg bg-[#00468E] flex items-center justify-center text-[10px] font-black text-white">{idx + 1}</span>
                        <input 
                          placeholder="Họ và tên thành viên" 
                          className={`px-0 py-0 bg-transparent border-none ${isDesktop ? 'text-sm' : 'text-xs'} font-black text-[#00468E] flex-1 focus:ring-0 uppercase`}
                          value={member.name}
                          onChange={(e) => updateFamilyMember(member.id, 'name', e.target.value)}
                        />
                        <button 
                          onClick={() => {
                            setForm02Data({
                              ...form02Data,
                              familyMembers: form02Data.familyMembers.filter(m => m.id !== member.id)
                            });
                          }} 
                          className="text-[10px] font-black text-red-500 uppercase px-2 py-1 bg-red-50 rounded-lg"
                        >
                          Xóa
                        </button>
                      </div>
                      <div className={`grid ${isDesktop ? 'grid-cols-3' : 'grid-cols-1'} gap-4`}>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Quan hệ với người đăng ký *</label>
                           <input 
                             placeholder="VD: Vợ, con..." 
                             className={`px-3 py-2 bg-slate-50 border-none rounded-lg ${isDesktop ? 'text-sm' : 'text-xs'} font-bold w-full focus:ring-1 focus:ring-blue-100`}
                             value={member.relationship}
                             onChange={(e) => updateFamilyMember(member.id, 'relationship', e.target.value)}
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Số CMTND (09 số)</label>
                           <input 
                             placeholder="Nếu có" 
                             className={`px-3 py-2 bg-slate-50 border-none rounded-lg ${isDesktop ? 'text-sm' : 'text-xs'} font-bold w-full focus:ring-1 focus:ring-blue-100`}
                             value={member.cccd09}
                             onChange={(e) => updateFamilyMember(member.id, 'cccd09', e.target.value)}
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Số thẻ căn cước công dân (12 số)</label>
                           <input 
                             placeholder="Nhập 12 số CCCD" 
                             className={`px-3 py-2 bg-slate-50 border-none rounded-lg ${isDesktop ? 'text-sm' : 'text-xs'} font-bold w-full focus:ring-1 focus:ring-blue-100`}
                             value={member.cccd12}
                             onChange={(e) => updateFamilyMember(member.id, 'cccd12', e.target.value)}
                           />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Tình trạng nhà ở */}
              <div className="space-y-3">
                <label className="text-sm font-black text-slate-700 uppercase">3. Tình trạng nhà ở khi nộp hồ sơ (Chọn 1 trong 4)</label>
                <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  {[
                    { id: 'noHome', label: 'Chưa có nhà ở thuộc sở hữu của mình, chưa được mua, thuê hoặc thuê mua nhà ở xã hội, chưa được hưởng chính sách hỗ trợ nhà ở, đất ở dưới mọi hình thức tại nơi sinh sống, học tập' },
                    { id: 'lowArea', label: 'Có nhà ở thuộc sở hữu của mình nhưng diện tích nhà ở bình quân đầu người trong hộ gia đình dưới 15m²/người' },
                    { id: 'farAway', label: 'Có nhà ở nhưng cách xa địa điểm làm việc (theo Nghị quyết 201/2025)' },
                    { id: 'other', label: 'Loại khác' }
                  ].map(item => (
                    <label key={item.id} className="flex items-start gap-3 cursor-pointer group py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 rounded-lg px-2 -mx-2 transition-colors">
                      <input 
                        type="radio" 
                        name="housingStatus"
                        className="w-5 h-5 accent-[#00468E] mt-0.5"
                        checked={(form02Data.housingStatus as any)[item.id]}
                        onChange={(e) => {
                            const newStatus = { noHome: false, lowArea: false, farAway: false, other: false };
                            (newStatus as any)[item.id] = true;
                            setForm02Data({ ...form02Data, housingStatus: newStatus });
                        }}
                      />
                      <span className="text-xs font-bold text-slate-600 group-hover:text-[#00468E] leading-tight">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 4. Đối tượng đăng ký phân loại (Điều 76) */}
              <div className="space-y-3">
                <label className="text-sm font-black text-slate-700 uppercase">4. Phân loại đối tượng (Chọn 1 trong 12 loại)</label>
                <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  {[
                    { id: 'nguoiCoCong', label: 'Người có công với cách mạng, thân nhân liệt sĩ thuộc trường hợp được hỗ trợ cải thiện nhà ở theo quy định của Pháp lệnh Ưu đãi người có công với cách mạng' },
                    { id: 'ngheoNongThon', label: 'Hộ gia đình nghèo, cận nghèo tại khu vực nông thôn' },
                    { id: 'ngheoThienTai', label: 'Hộ gia đình nghèo, cận nghèo tại khu vực nông thôn thuộc vùng thường xuyên bị ảnh hưởng bởi thiên tai, biến đổi khí hậu' },
                    { id: 'ngheoDoThi', label: 'Hộ gia đình nghèo, cận nghèo tại khu vực đô thị' },
                    { id: 'thuNhapThap', label: 'Người thu nhập thấp tại khu vực đô thị' },
                    { id: 'congNhan', label: 'Công nhân, người lao động đang làm việc tại doanh nghiệp, hợp tác xã, liên hiệp hợp tác xã trong và ngoài khu công nghiệp' },
                    { id: 'lucLuongVuTrang', label: 'Sĩ quan, quân nhân chuyên nghiệp, hạ sĩ quan thuộc lực lượng vũ trang nhân dân, công nhân công an, công chức, công nhân và viên chức quốc phòng đang phục vụ tại ngũ; người làm công tác cơ yếu, người làm công tác khác trong tổ chức cơ yếu hưởng lương từ ngân sách nhà nước đang công tác' },
                    { id: 'canBoCongChuc', label: 'Cán bộ, công chức, viên chức theo quy định của pháp luật về cán bộ, công chức, viên chức' },
                    { id: 'traNhaCongVu', label: 'Đối tượng đã trả lại nhà ở công vụ theo quy định tại khoản 4 Điều 125 của Luật này, trừ trường hợp bị thu hồi nhà ở công vụ do vi phạm quy định của Luật này.' },
                    { id: 'thuHoiDat', label: 'Hộ gia đình, cá nhân thuộc trường hợp bị thu hồi đất và phải giải tỏa, phá dỡ nhà ở theo quy định của pháp luật mà chưa được Nhà nước bồi thường bằng nhà ở, đất ở' },
                    { id: 'hocSinhSinhVien', label: 'Học sinh, sinh viên đại học, học viện, trường đại học, cao đẳng, dạy nghề, trường chuyên biệt theo quy định của pháp luật; học sinh trường dân tộc nội trú công lập.' },
                    { id: 'doanhNghiep', label: 'Doanh nghiệp, hợp tác xã, liên hiệp hợp tác xã trong khu công nghiệp' },
                  ].map(item => (
                    <label key={item.id} className="flex items-start gap-3 cursor-pointer group py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 rounded-lg px-2 -mx-2 transition-colors">
                      <input 
                        type="radio" 
                        name="subjectCategory"
                        className="w-5 h-5 accent-[#00468E] mt-0.5"
                        checked={(form02Data.subjectCategory as any)[item.id]}
                        onChange={(e) => {
                            const newCat = { 
                                nguoiCoCong: false, ngheoNongThon: false, ngheoThienTai: false, ngheoDoThi: false, 
                                thuNhapThap: false, congNhan: false, lucLuongVuTrang: false, canBoCongChuc: false, 
                                traNhaCongVu: false, thuHoiDat: false, hocSinhSinhVien: false, doanhNghiep: false 
                            };
                            (newCat as any)[item.id] = true;
                            setForm02Data({ ...form02Data, subjectCategory: newCat });
                        }}
                      />
                      <span className="text-xs font-bold text-slate-600 group-hover:text-[#00468E] leading-tight">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {showErrors && (
              <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl space-y-2 animate-shake">
                <div className="flex items-center gap-2 text-red-600 font-black text-xs uppercase">
                  <AlertCircle size={16} /> Thông tin chưa đầy đủ:
                </div>
                <ul className="list-disc list-inside text-[11px] text-red-700 font-bold space-y-1 ml-1">
                  {getForm02Errors().map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            <button 
              onClick={() => {
                const errors = getForm02Errors();
                if (errors.length === 0) {
                  setStep(2);
                  setShowErrors(false);
                } else {
                  setShowErrors(true);
                  // Scroll to bottom to ensure errors are seen
                  setTimeout(() => {
                    const container = document.querySelector('.overflow-y-auto');
                    if (container) container.scrollTop = container.scrollHeight;
                  }, 100);
                }
              }}
              className={`w-full mt-2 py-4 rounded-2xl font-black uppercase tracking-wider transition-all shadow-lg ${isForm02Valid ? 'bg-[#00468E] text-white shadow-blue-100' : 'bg-slate-200 text-slate-400'}`}
            >
              Tiếp Theo (Bước 2/6)
            </button>
          </div>
        )}

        {/* STEP 2: CHỌN NHÓM ĐỐI TƯỢNG */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">Nhóm Đối Tượng K</h4>
            <p className="text-xs text-slate-500 font-medium mb-4">Vui lòng chọn đúng nhóm đối tượng của bạn để hệ thống gợi ý danh mục hồ sơ.</p>
            
            <div className={`grid ${isDesktop ? 'grid-cols-3' : 'grid-cols-1'} gap-4`}>
              {GROUP_K_CONFIGS.map(group => (
                <div 
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${selectedGroup === group.id ? 'border-[#00468E] bg-blue-50/50 shadow-md ring-2 ring-[#00468E]/10' : 'border-slate-200 bg-white hover:border-blue-200'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${selectedGroup === group.id ? 'border-[#00468E] bg-[#00468E]' : 'border-slate-300'}`}>
                      {selectedGroup === group.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <h5 className={`font-black uppercase text-[10px] tracking-widest ${selectedGroup === group.id ? 'text-[#00468E]' : 'text-slate-400'}`}>
                        Nhóm {group.id}
                      </h5>
                      <p className={`font-black text-slate-800 text-sm mt-1 leading-tight`}>{group.name}</p>
                    </div>
                  </div>
                  <p className={`text-[11px] text-slate-500 mt-4 leading-relaxed font-medium line-clamp-3`}>{group.description}</p>
                </div>
              ))}
            </div>
            
            {showErrors && !selectedGroup && (
              <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-center gap-3 animate-shake">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
                <p className="text-xs font-black text-red-700 uppercase tracking-tight">Vui lòng chọn 1 nhóm đối tượng để tiếp tục</p>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => {
                  setStep(1);
                  setShowErrors(false);
                }} 
                className="w-1/3 py-4 rounded-2xl font-black uppercase text-slate-500 bg-slate-200"
              >
                Quay Lại
              </button>
              <button 
                onClick={() => {
                  if (selectedGroup) {
                    setStep(3);
                    setShowErrors(false);
                  } else {
                    setShowErrors(true);
                  }
                }}
                className={`w-2/3 py-4 rounded-2xl font-black uppercase tracking-wider transition-all ${selectedGroup ? 'bg-[#00468E] text-white' : 'bg-slate-200 text-slate-400'}`}
              >
                Tiếp Tục
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CHECKLIST & UPLOAD */}
        {step === 3 && activeGroupConfig && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="font-black text-slate-800 text-lg">Tải biểu mẫu & Đính kèm</h4>
            <div className={`p-4 rounded-2xl text-xs font-medium flex gap-3 ${currentUser.applicationState === 'tra_ho_so' ? 'bg-red-50 border-2 border-red-100 text-red-700' : 'bg-blue-50 border-2 border-blue-100 text-[#00468E]'} ${isDesktop ? 'text-sm p-6' : ''}`}>
              <AlertCircle size={isDesktop ? 24 : 16} className="shrink-0" />
              {currentUser.applicationState === 'tra_ho_so' 
                ? 'Hồ sơ của bạn bị trả lại. Vui lòng bổ sung hoặc đính kèm lại các giấy tờ bị từ chối (màu đỏ).'
                : `Bạn thuộc Nhóm ${activeGroupConfig.id}. Việc tải lên giấy tờ trực tuyến hiện là Tùy chọn để tối ưu thời gian chờ.`}
            </div>

            <div className={`grid ${isDesktop ? 'grid-cols-2 gap-4' : 'grid-cols-1 space-y-4'} mt-4`}>
              {activeGroupConfig.requiredDocs.map(doc => {
                const status = currentUser.documentStatuses?.[doc.id] || 'pending';
                const comment = currentUser.documentComments?.[doc.id];
                const isApproved = status === 'approved';
                const isRejected = status === 'rejected';

                return (
                  <div key={doc.id} className={`bg-white p-4 rounded-xl shadow-sm border transition-all ${isApproved ? 'border-green-100 bg-green-50/10' : isRejected ? 'border-red-100 bg-red-50/20' : 'border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <h5 className="font-black text-xs text-slate-700 pr-2 uppercase tracking-tight">{doc.name}</h5>
                        {isApproved && <span className="text-[10px] font-black text-green-600 uppercase mt-1 flex items-center gap-1"><CheckCircle2 size={12}/> Hợp lệ</span>}
                        {isRejected && <span className="text-[10px] font-black text-red-600 uppercase mt-1 flex items-center gap-1"><AlertCircle size={12}/> Nộp lại</span>}
                      </div>
                    </div>

                    {isRejected && comment && (
                      <div className="mb-3 p-2 bg-red-50 rounded-lg border border-red-100 text-[10px] text-red-700 font-bold italic">
                        {comment}
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      {files[doc.id]?.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-500 truncate max-w-[150px]">{f.name}</span>
                          <button onClick={() => removeFile(doc.id, i)} className="text-[10px] font-black text-red-400 uppercase">Gỡ</button>
                        </div>
                      ))}
                    </div>

                    {!isApproved && (
                      <div className="mt-3 flex gap-2">
                        <button className="px-3 py-2 bg-slate-50 text-[#00468E] rounded-lg text-[9px] font-black uppercase hover:bg-slate-100 flex items-center gap-1 border border-slate-100">
                          Mẫu
                        </button>
                        <label className="flex-1 py-2 px-3 border border-dashed border-[#00468E] text-[#00468E] rounded-lg text-[9px] font-black uppercase cursor-pointer hover:bg-blue-50 flex items-center justify-center gap-2">
                          <input type="file" multiple className="hidden" onChange={(e) => handleFileChange(doc.id, e)} />
                          <Upload size={12} /> Tải lên {files[doc.id]?.length > 0 ? 'thêm' : ''}
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setStep(2)}
                className="w-1/3 py-4 rounded-2xl font-black uppercase text-slate-500 bg-slate-200 border-slate-300"
              >
                Quay Lại
              </button>
              <button 
                onClick={() => setStep(4)}
                className="w-2/3 py-4 rounded-2xl font-black uppercase bg-[#00468E] text-white"
              >
                Tiếp Tục
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW (SUMMARY) */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">Kiểm tra thông tin & Cam kết</h4>
            
            <div className={`${isDesktop ? 'p-10' : 'p-5'} bg-white rounded-3xl border border-slate-100 shadow-sm space-y-8`}>
              <div className={`grid ${isDesktop ? 'grid-cols-4' : 'grid-cols-1'} gap-6`}>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Chủ hồ sơ</label>
                  <p className="text-sm font-black text-[#00468E] uppercase">{form02Data.ownerName}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Thẻ CCCD</label>
                  <p className="text-sm font-black text-[#00468E]">{form02Data.idNumber12 || form02Data.idNumber09}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Điện thoại</label>
                  <p className="text-sm font-black text-[#00468E]">{form02Data.contactPhone}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hình thức</label>
                  <p className="text-sm font-black text-[#00468E] uppercase">{form02Data.registrationRight}</p>
                </div>
              </div>

              <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'} gap-6 pt-6 border-t border-slate-50`}>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nhóm đối tượng</label>
                  <p className="text-xs font-bold text-slate-700">{selectedGroup} - {activeGroupConfig?.name}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tài liệu đính kèm</label>
                  <p className="text-xs font-bold text-slate-700">{Object.values(files).reduce((acc, curr) => acc + (curr as any).length, 0)} tệp tin đã tải lên</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-start gap-4 ring-2 ring-[#00468E]/5">
               <input type="checkbox" id="camket" className="mt-1 w-5 h-5 accent-[#00468E] shrink-0" defaultChecked />
               <label htmlFor="camket" className="text-xs text-slate-600 font-medium leading-relaxed">
                 Tôi cam đoan những thông tin khai báo và tài liệu đính kèm là hoàn toàn chính xác. Tôi hoàn toàn chịu trách nhiệm trước pháp luật về tính xác thực của thông tin này.
               </label>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setStep(3)} 
                className="w-1/3 py-4 rounded-2xl font-black text-slate-400 bg-slate-100 uppercase"
              >
                Quay Lại
              </button>
              <button 
                onClick={() => {
                  setOtpTimer(60);
                  const timer = setInterval(() => {
                    setOtpTimer((prev) => {
                      if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                      }
                      return prev - 1;
                    });
                  }, 1000);
                  setStep(5);
                }} 
                className="w-2/3 py-4 rounded-2xl font-black bg-[#00468E] text-white shadow-lg relative overflow-hidden group uppercase tracking-widest"
              >
                NỘP HỒ SƠ
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: OTP VERIFICATION */}
        {step === 5 && (
          <div className={`space-y-8 animate-fade-in ${isDesktop ? 'max-w-xl mx-auto py-16' : ''}`}>
            <div className="text-center mb-8">
              <div className={`${isDesktop ? 'w-20 h-20' : 'w-16 h-16'} bg-[#00468E]/5 text-[#00468E] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#00468E]/10`}>
                <CheckCircle2 size={isDesktop ? 32 : 24} className="animate-pulse" />
              </div>
              <h4 className={`font-black text-slate-800 ${isDesktop ? 'text-2xl' : 'text-xl'} tracking-tight uppercase`}>Xác thực bảo mật</h4>
              <p className={`${isDesktop ? 'text-xs' : 'text-[10px]'} text-slate-400 font-black uppercase tracking-widest mt-2`}>Mã OTP đã được gửi đến số {currentUser.phone}</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-50/50 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00468E] to-blue-400" />
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center block mb-2">Nhập mã xác thực 6 chữ số</label>
                <input
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  maxLength={6}
                  className="w-full py-5 bg-slate-50 border-none rounded-2xl text-4xl font-black text-[#00468E] text-center outline-none focus:ring-2 focus:ring-[#00468E]/20 tracking-[0.4em] shadow-inner"
                  placeholder="000000"
                />
              </div>

              <div className="text-center">
                {otpTimer > 0 ? (
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Gửi lại sau <span className="text-[#00468E] underline">{otpTimer} giây</span></p>
                ) : (
                  <button 
                    onClick={() => setOtpTimer(60)}
                    className="text-[10px] font-black text-[#00468E] uppercase tracking-widest hover:underline"
                  >
                    Gửi lại mã OTP
                  </button>
                )}
              </div>
            </div>

            {showErrors && otpValue.length !== 4 && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 animate-shake">
                <AlertCircle size={18} className="text-red-500" />
                <p className="text-[10px] font-black text-red-700 uppercase tracking-tight">Vui lòng nhập đủ 6 chữ số</p>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => {
                  setStep(4);
                  setShowErrors(false);
                }} 
                className="w-1/3 py-4 rounded-2xl font-black text-slate-400 bg-slate-100 uppercase text-xs"
              >
                Quay Lại
              </button>
              <button
                onClick={() => {
                  if (otpValue.length === 4) {
                    if (otpValue === '1234' || otpValue.length === 4) {
                      setStep(6);
                      setTimeout(() => {
                        setShowSuccessPopup(true);
                      }, 2000);
                    } else {
                      alert('Mã OTP không chính xác. Vui lòng thử lại (Demo: 1234)');
                    }
                  } else {
                    setShowErrors(true);
                  }
                }}
                className={`w-2/3 py-4 rounded-2xl font-black uppercase shadow-xl transition-all tracking-widest ${otpValue.length === 4 ? 'bg-[#00468E] text-white shadow-blue-200 active:scale-95' : 'bg-slate-200 text-slate-400 shadow-none'}`}
              >
                Xác Nhận Nộp
              </button>
            </div>
            
            <div className="text-center">
                <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.2em]">
                  Bypass code: 1234
                </p>
            </div>
          </div>
        )}

        {/* STEP 6: SIMULATION */}
        {step === 6 && !showSuccessPopup && (
          <div className="h-64 flex flex-col items-center justify-center text-center animate-fade-in space-y-4">
            <div className="w-16 h-16 bg-blue-100 text-[#00468E] rounded-full flex items-center justify-center animate-bounce">
              <Upload size={32} />
            </div>
            <div>
              <h4 className="font-black text-[#00468E] text-xl">Đang tải hồ sơ...</h4>
              <p className="text-slate-500 text-sm font-medium mt-1">Hệ thống đang tiếp nhận hồ sơ trực tuyến.</p>
            </div>
          </div>
        )}

        {/* SUCCESS POPUP OVERLAY */}
        {showSuccessPopup && (
            <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in`}>
              <div className={`bg-white rounded-3xl ${isDesktop ? 'p-16 w-[500px]' : 'p-8 w-[340px]'} shadow-2xl text-center relative max-h-screen overflow-y-auto`}>
                <div className={`${isDesktop ? 'w-28 h-28 -top-14 -mb-10 border-[10px]' : 'w-20 h-20 -top-12 -mb-8 border-[6px]'} bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border-white shadow-lg relative`}>
                  <CheckCircle2 size={isDesktop ? 56 : 40} className="animate-pulse" />
                </div>
                <h3 className={`${isDesktop ? 'text-4xl' : 'text-2xl'} font-black text-slate-800 uppercase tracking-tighter leading-none mb-3`}>Nộp Hồ Sơ<br/>Thành Công</h3>
                <p className={`${isDesktop ? 'text-base' : 'text-sm'} font-medium text-slate-600 mb-8 px-2`}>
                  Thao tác đăng ký đã hoàn tất. Bạn có thể theo dõi tiến độ xử lý hồ sơ ngay tại Cổng Thông Tin.
                </p>
               <button 
                 onClick={finishSubmission}
                 className="w-full py-4 bg-[#00468E] text-white rounded-2xl font-black uppercase tracking-wider text-sm shadow-xl shadow-blue-200 hover:bg-blue-800 transition-all active:scale-95"
               >
                 Đóng & Trang Chủ
               </button>
             </div>
           </div>
        )}

      </div>
    </div>
  );
}
