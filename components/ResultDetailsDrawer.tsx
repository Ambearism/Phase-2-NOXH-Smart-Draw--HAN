import React from 'react';
import {
    X,
    Download,
    Building,
    QrCode,
    Printer
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { Participant } from '../types';

interface ResultDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    participant: Participant | null;
}

export const ResultDetailsDrawer: React.FC<ResultDetailsDrawerProps> = ({
    isOpen,
    onClose,
    participant
}) => {
    if (!isOpen || !participant) return null;

    const maskCCCD = (val: string) => val ? val.slice(0, 3) + "***" + val.slice(-3) : '***';

    return createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Kết Quả Bốc Thăm</h2>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all shadow-sm border border-slate-100">
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Modeled after the E-Certificate */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center w-full print-safe-area">
                    <div className="w-full max-w-sm bg-white p-6 rounded-none shadow-xl border-8 border-double border-[#00468E] flex flex-col items-center text-center relative overflow-hidden h-fit min-h-[600px] print-container">
                        {/* Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                            <Building size={300} />
                        </div>

                        <div className="w-16 h-16 bg-[#00468E] text-white flex items-center justify-center rounded-full font-black text-xl mb-4 z-10 shrink-0">VGC</div>
                        <h2 className="text-xl font-black text-[#00468E] uppercase tracking-tighter z-10">{participant.hasWon ? 'CHỨNG NHẬN' : 'XÁC NHẬN'}<br />KẾT QUẢ</h2>
                        <div className="w-32 h-1 bg-[#00468E] my-4 z-10 shrink-0"></div>

                        {/* RESULT STATUS TEXT */}
                        <div className={`z-10 mb-6 py-2 px-4 rounded-lg border ${participant.hasWon ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-200'}`}>
                            <p className={`text-sm font-black uppercase tracking-tight ${participant.hasWon ? 'text-[#00468E]' : 'text-slate-500'}`}>
                                {participant.hasWon ? 'Kết Quả Trúng Quyền' : 'XÁC NHẬN KHÔNG TRÚNG QUYỀN'} {participant.right === 'mua' ? 'Mua' : participant.right === 'thue' ? 'Thuê' : 'Thuê-Mua'}
                            </p>
                        </div>

                        <div className="text-left w-full space-y-3 text-sm z-10 flex-1">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Khách hàng</p>
                                <p className="font-bold text-slate-800 uppercase text-lg leading-tight">{participant.name}</p>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Số CCCD</p>
                                    <p className="font-bold text-slate-800">{maskCCCD(participant.cccd)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Số điện thoại</p>
                                    <p className="font-bold text-slate-800">{participant.phone || '098***1234'}</p>
                                </div>
                            </div>

                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Mã hồ sơ</p>
                                    <p className="font-bold text-[#00468E]">{participant.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Vòng bốc thăm</p>
                                    <p className="font-bold text-slate-800">{(participant as any).roundName || (participant as any).round || 'Vòng 1'}</p>
                                </div>
                            </div>

                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Ngày giờ bốc thăm</p>
                                    <p className="font-bold text-slate-800">{(participant as any).drawTime || '09:00 - 26/03/2026'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Ngày giờ nhận kết quả</p>
                                    <p className="font-bold text-slate-800">{(participant as any).resultTime || '09:12 - 26/03/2026'}</p>
                                </div>
                            </div>

                            {participant.hasWon && participant.assignedUnit ? (
                                <div className="space-y-4">
                                    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                                        <p className="text-[10px] text-blue-600 uppercase font-bold mb-2 text-center border-b border-blue-100 pb-1">Tổng quan căn hộ</p>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <p className="text-[9px] text-slate-400 uppercase">Tòa</p>
                                                <p className="font-bold text-slate-700">{(participant as any).apartmentInfo?.block || 'C03'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-slate-400 uppercase">Tầng</p>
                                                <p className="font-bold text-slate-700">{(participant as any).apartmentInfo?.floor || '05'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-slate-400 uppercase">Căn</p>
                                                <p className="font-bold text-slate-700">{(participant as any).apartmentInfo?.unit || '02'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-center">
                                        <p className="text-[10px] text-yellow-600 uppercase font-bold mb-1">Căn hộ được quyền {participant.right === 'mua' ? 'Mua' : participant.right === 'thue' ? 'Thuê' : 'Thuê-Mua'}</p>
                                        <p className="text-3xl font-black text-[#00468E]">{participant.assignedUnit}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl text-center mt-4">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-2">Kết quả bốc thăm</p>
                                    <p className="text-2xl font-black text-slate-400">KHÔNG TRÚNG</p>
                                    <p className="text-[10px] text-slate-400 mt-2 italic px-4">“Xin cảm ơn Quý khách đã tham gia chương trình bốc thăm quyền {participant.right === 'mua' ? 'mua' : participant.right === 'thue' ? 'thuê' : 'thuê-mua'} căn hộ.”</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 w-full flex flex-col items-center z-10 space-y-4 border-t border-slate-100">
                            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                                <QrCode size={100} className="text-slate-800" />
                            </div>
                            <div className="text-center">
                                <div className="h-8 w-24 bg-contain bg-no-repeat bg-center opacity-80 mx-auto" style={{ backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/f/f8/Signature_sample.svg")' }}></div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Xác nhận bởi BTC</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-white border-t border-slate-200 p-4 flex justify-between items-center hide-on-print">
                    <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-50 flex items-center gap-2">
                        <Printer size={16} /> In phiếu
                    </button>
                    <button onClick={() => window.print()} className="px-4 py-2 bg-[#00468E] text-white rounded-lg font-bold text-xs hover:bg-[#003366] flex items-center gap-2">
                        <Download size={16} /> Tải PDF
                    </button>
                </div>
            </div>
        </div>
    , document.body);
};
