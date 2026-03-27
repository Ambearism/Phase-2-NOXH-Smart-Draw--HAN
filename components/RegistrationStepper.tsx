import React, { useState } from 'react';
import { ChevronLeft, Camera, Upload, User, Mail, Phone, Fingerprint, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

interface RegistrationStepperProps {
  onComplete: (userData: any) => void;
  onCancel: () => void;
  isDesktop?: boolean;
}

export function RegistrationStepper({ onComplete, onCancel, isDesktop = false }: RegistrationStepperProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    cccd: '',
    phone: '',
    email: '',
    password: '',
    cccdFront: null as string | null,
    cccdBack: null as string | null,
    otp: '',
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (side: 'cccdFront' | 'cccdBack', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setFormData({ ...formData, [side]: url });
    }
  };

  const nextStep = () => {
    if (step === 1) {
      // Simulate sending OTP
      setOtpTimer(60);
      setCanResend(false);
      const timer = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setStep(2);
    } else if (step === 2) {
      if (formData.otp === '1234' || formData.otp.length === 4) {
        setStep(3);
      } else {
        alert('Mã OTP không chính xác. Vui lòng thử lại (Demo: 1234)');
      }
    } else if (step === 4) {
      setIsSimulating(true);
      setTimeout(() => {
        setIsSimulating(false);
        setStep(5);
      }, 3000);
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  const isStep1Valid = formData.name && formData.cccd && formData.phone && formData.email;
  const isStep2Valid = formData.otp.length === 4;
  const isStep3Valid = formData.cccdFront && formData.cccdBack;
  const isStep5Valid = formData.password.length >= 8;

  return (
    <div className={`flex-1 flex flex-col h-full bg-slate-50 relative pb-10 animate-fade-in ${isDesktop ? 'max-w-5xl mx-auto' : ''}`}>
      {/* Header */}
      <div className={`bg-white ${isDesktop ? 'px-12 py-8 rounded-t-3xl border-x border-t' : 'px-6 py-4 border-b'} border-slate-100 flex items-center justify-between sticky top-0 z-20 shadow-sm`}>
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 focus:outline-none active:scale-90 transition-transform">
            <ChevronLeft size={20} />
          </button>
          <h3 className={`font-black text-[#00468E] ${isDesktop ? 'text-2xl' : 'text-lg'} uppercase tracking-tight`}>Đăng Ký Tài Khoản</h3>
        </div>
        <div className="font-bold text-slate-400 text-xs text-right">
          BƯỚC {step}/5<br/>
          <span className="text-[10px] opacity-60">XÁC MINH SĐT</span>
        </div>
      </div>

      {/* Stepper Indicator */}
      <div className={`bg-white ${isDesktop ? 'px-12 border-x' : 'px-6'} py-3 border-b border-slate-100 flex gap-2 justify-between sticky ${isDesktop ? 'top-[97px]' : 'top-[65px]'} z-10`}>
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} className="flex-1 h-1.5 rounded-full transition-all duration-500" style={{ backgroundColor: s <= step ? '#00468E' : '#E2E8F0' }} />
        ))}
      </div>

      <div className={`${isDesktop ? 'p-12 bg-white border-x border-b rounded-b-3xl shadow-sm' : 'p-6'} flex-1 overflow-y-auto pb-24`}>
        {/* STEP 1: PERSONAL INFO */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className={`${isDesktop ? 'w-24 h-24' : 'w-16 h-16'} bg-blue-50 text-[#00468E] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                <User size={isDesktop ? 48 : 32} />
              </div>
              <h4 className={`font-black text-slate-800 ${isDesktop ? 'text-3xl' : 'text-xl'} tracking-tight uppercase`}>Thông Tin Cá Nhân</h4>
              <p className={`${isDesktop ? 'text-sm' : 'text-xs'} text-slate-500 font-medium`}>Vui lòng nhập chính xác thông tin như trên CCCD</p>
            </div>

            <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và Tên</label>
                <div className="relative">
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-base font-bold text-[#00468E] outline-none focus:border-[#00468E] transition-all"
                    placeholder="NGUYỄN VĂN A"
                  />
                  <User className="absolute left-4 top-4 text-slate-300" size={20} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số CCCD (12 số)</label>
                <div className="relative">
                  <input
                    name="cccd"
                    value={formData.cccd}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-base font-bold text-[#00468E] outline-none focus:border-[#00468E] transition-all"
                    placeholder="001200******"
                    maxLength={12}
                  />
                  <Fingerprint className="absolute left-4 top-4 text-slate-300" size={20} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số Điện Thoại</label>
                <div className="relative">
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-base font-bold text-[#00468E] outline-none focus:border-[#00468E] transition-all"
                    placeholder="09********"
                  />
                  <Phone className="absolute left-4 top-4 text-slate-300" size={20} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ Email</label>
                <div className="relative">
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-base font-bold text-[#00468E] outline-none focus:border-[#00468E] transition-all"
                    placeholder="email@example.com"
                  />
                  <Mail className="absolute left-4 top-4 text-slate-300" size={20} />
                </div>
              </div>
            </div>

            <button
              disabled={!isStep1Valid}
              onClick={nextStep}
              className="w-full py-5 bg-[#00468E] text-white rounded-[2rem] font-black uppercase shadow-xl shadow-blue-200 active:scale-95 transition-all mt-4 disabled:opacity-50"
            >
              TIẾP TỤC
            </button>
          </div>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className={`text-center mb-10 ${isDesktop ? 'max-w-xl mx-auto' : ''}`}>
              <div className={`${isDesktop ? 'w-24 h-24' : 'w-16 h-16'} bg-blue-50 text-[#00468E] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                <ShieldCheck size={isDesktop ? 48 : 32} />
              </div>
              <h4 className={`font-black text-slate-800 ${isDesktop ? 'text-3xl' : 'text-xl'} tracking-tight uppercase`}>Xác thực số điện thoại</h4>
              <p className={`${isDesktop ? 'text-sm' : 'text-xs'} text-slate-500 font-medium italic mt-2`}>Mã OTP đã được gửi đến số {formData.phone}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Nhập mã OTP (4 số)</label>
                <input
                  name="otp"
                  value={formData.otp}
                  onChange={handleInputChange}
                  maxLength={6}
                  className="w-full py-4 bg-slate-50 border-none rounded-2xl text-3xl font-black text-[#00468E] text-center outline-none focus:ring-2 focus:ring-[#00468E] tracking-[0.5em]"
                  placeholder="000000"
                />
              </div>

              <div className="text-center">
                {otpTimer > 0 ? (
                  <p className="text-xs font-bold text-slate-400 uppercase">Gửi lại mã sau <span className="text-[#00468E]">{otpTimer}s</span></p>
                ) : (
                  <button 
                    onClick={() => { setOtpTimer(60); setCanResend(false); }}
                    className="text-xs font-black text-[#00468E] uppercase underline"
                  >
                    Gửi lại mã OTP
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={prevStep} className="w-1/3 py-4 rounded-2xl font-black text-slate-500 bg-slate-200 uppercase text-xs">Quay Lại</button>
              <button
                disabled={!isStep2Valid}
                onClick={nextStep}
                className="w-2/3 py-4 bg-[#00468E] text-white rounded-2xl font-black uppercase shadow-xl shadow-blue-200 active:scale-95 transition-all disabled:opacity-50"
              >
                Tiếp Tục
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest bg-slate-100 py-2 rounded-lg">
              Demo bypass: Nhập 1234
            </p>
          </div>
        )}

        {/* STEP 3: eKYC CCCD */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-10">
              <div className={`${isDesktop ? 'w-24 h-24' : 'w-16 h-16'} bg-blue-50 text-[#00468E] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                <Fingerprint size={isDesktop ? 48 : 32} />
              </div>
              <h4 className={`font-black text-slate-800 ${isDesktop ? 'text-3xl' : 'text-xl'} tracking-tight uppercase`}>Xác thực CCCD</h4>
              <p className={`${isDesktop ? 'text-sm' : 'text-xs'} text-slate-500 font-medium`}>Chụp hoặc tải lên ảnh CCCD 2 mặt</p>
            </div>

            <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'} gap-8`}>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mặt trước CCCD</p>
                <div className="relative group">
                  <input type="file" className="hidden" id="cccdFront" onChange={(e) => handleFileUpload('cccdFront', e)} />
                  <label htmlFor="cccdFront" className={`w-full h-40 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${formData.cccdFront ? 'border-green-500 bg-green-50' : 'border-[#00468E]/30 bg-white hover:border-[#00468E]'}`}>
                    {formData.cccdFront ? (
                      <img src={formData.cccdFront} className="w-full h-full object-cover" alt="Mặt trước" />
                    ) : (
                      <>
                        <Camera size={32} className="text-[#00468E] mb-2 opacity-40" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Tải Mặt Trước</span>
                      </>
                    )}
                  </label>
                  {formData.cccdFront && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mặt sau CCCD</p>
                <div className="relative group">
                  <input type="file" className="hidden" id="cccdBack" onChange={(e) => handleFileUpload('cccdBack', e)} />
                  <label htmlFor="cccdBack" className={`w-full h-40 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${formData.cccdBack ? 'border-green-500 bg-green-50' : 'border-[#00468E]/30 bg-white hover:border-[#00468E]'}`}>
                    {formData.cccdBack ? (
                      <img src={formData.cccdBack} className="w-full h-full object-cover" alt="Mặt sau" />
                    ) : (
                      <>
                        <Camera size={32} className="text-[#00468E] mb-2 opacity-40" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Tải Mặt Sau</span>
                      </>
                    )}
                  </label>
                  {formData.cccdBack && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={prevStep} className="w-1/3 py-4 rounded-2xl font-black text-slate-500 bg-slate-200 uppercase text-xs">Quay Lại</button>
              <button
                disabled={!isStep3Valid}
                onClick={nextStep}
                className="w-2/3 py-4 bg-[#00468E] text-white rounded-2xl font-black uppercase shadow-xl shadow-blue-200 active:scale-95 transition-all disabled:opacity-50"
              >
                Xác Thực
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: FACE SCAN */}
        {step === 4 && (
          <div className={`space-y-6 animate-fade-in flex flex-col items-center ${isDesktop ? 'max-w-2xl mx-auto' : ''}`}>
            <div className="text-center mb-8 w-full">
              <div className={`${isDesktop ? 'w-24 h-24' : 'w-16 h-16'} bg-blue-50 text-[#00468E] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                <ShieldCheck size={isDesktop ? 48 : 32} />
              </div>
              <h4 className={`font-black text-slate-800 ${isDesktop ? 'text-3xl' : 'text-xl'} tracking-tight uppercase`}>Xác thực khuôn mặt</h4>
              <p className={`${isDesktop ? 'text-sm' : 'text-xs'} text-slate-500 font-medium mt-2`}>Giữ điện thoại trước mặt và nhìn thẳng vào camera</p>
            </div>

            <div className="w-full aspect-square max-w-[280px] border-8 border-[#00468E] rounded-full relative overflow-hidden bg-slate-900 shadow-2xl flex items-center justify-center">
              {isSimulating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-full h-1 bg-[#00468E] absolute top-0 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_15px_#00468E]"></div>
                  <User size={120} className="text-white/20 animate-pulse" />
                  <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[2px]"></div>
                  <div className="z-10 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                     <span className="text-xs font-black text-white uppercase tracking-widest animate-pulse">Đang Phân Tích...</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <Camera size={64} className="text-white opacity-20" />
                  <div className="w-24 h-24 rounded-full border-4 border-white/10 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-red-500/20 animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 w-full">
              <p className="text-[10px] text-blue-600 font-bold leading-relaxed text-center italic">
                Lưu ý: Đảm bảo ánh sáng tốt và không đeo kính đen, khẩu trang khi thực hiện quét mặt.
              </p>
            </div>

            <div className="flex gap-3 mt-6 w-full">
              <button disabled={isSimulating} onClick={prevStep} className="w-1/3 py-4 rounded-2xl font-black text-slate-500 bg-slate-200 uppercase text-xs">Quay Lại</button>
              <button
                disabled={isSimulating}
                onClick={nextStep}
                className="w-2/3 py-4 bg-[#00468E] text-white rounded-2xl font-black uppercase shadow-xl shadow-blue-200 active:scale-95 transition-all"
              >
                QUÉT MẶT
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: PASSWORD SETUP */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className={`text-center mb-10 ${isDesktop ? 'max-w-xl mx-auto' : ''}`}>
              <div className={`${isDesktop ? 'w-32 h-32' : 'w-20 h-20'} bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-8 border-white`}>
                <CheckCircle2 size={isDesktop ? 64 : 40} />
              </div>
              <h4 className={`font-black text-slate-800 ${isDesktop ? 'text-4xl' : 'text-2xl'} tracking-tight uppercase`}>XÁC THỰC THÀNH CÔNG</h4>
              <p className={`${isDesktop ? 'text-base' : 'text-xs'} text-green-600 font-bold uppercase mt-2`}>Đã kiểm tra danh tính điện tử</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Tạo mật khẩu đăng nhập</label>
                  <div className="relative">
                    <input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl text-2xl font-black text-center text-[#00468E] outline-none focus:border-[#00468E] focus:bg-white transition-all tracking-[0.5em]"
                      placeholder="••••••"
                    />
                    <Lock className="absolute left-6 top-5 text-slate-300" size={20} />
                  </div>
                  <p className="text-[10px] text-slate-400 text-center font-medium">Ít nhất 8 ký tự để đảm bảo bảo mật</p>
               </div>
            </div>

            <button
              disabled={!isStep5Valid}
              onClick={() => onComplete(formData)}
              className="w-full py-5 bg-green-600 text-white rounded-[2rem] font-black uppercase shadow-xl shadow-green-100 active:scale-95 transition-all mt-4 disabled:opacity-50"
            >
              HOÀN TẤT ĐĂNG KÝ
            </button>
          </div>
        )}

      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
