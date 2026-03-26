import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((username === 'admin' || username === 'superadmin' || username === 'tiepnhan' || username === 'kiemsoat' || username === 'kho') && password === '123456') {
      onLogin(username);
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00468E] bg-opacity-95 backdrop-blur-md">
      <div className="bg-white rounded-[3rem] shadow-2xl p-12 w-full max-w-lg transform transition-all border-[10px] border-white/20">
        <div className="text-center mb-10">
          <div className="w-auto px-4 h-16 bg-[#00468E] rounded-2xl flex items-center justify-center text-white font-black text-xl mx-auto mb-6 shadow-xl shadow-blue-900/40 whitespace-nowrap">
            VGC-HANDICO
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">QUẢN TRỊ HỆ THỐNG</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">Dự án NOXH HANDICO</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-6 py-5 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-[#00468E] outline-none font-bold text-slate-800 transition-all"
              placeholder="admin"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-5 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-[#00468E] outline-none font-bold text-slate-800 transition-all"
              placeholder="••••••"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-bold text-center italic">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-5 bg-[#00468E] hover:bg-blue-800 text-white font-black rounded-[2rem] shadow-xl shadow-blue-900/20 transition-all active:scale-95 uppercase tracking-widest"
          >
            Đăng Nhập
          </button>
        </form>

        <div className="mt-12 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-40">
          &copy; 2025 Viglacera IT Security Dept.
        </div>
      </div>
    </div>
  );
};