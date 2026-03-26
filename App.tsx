import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Activity,
    ShieldCheck,
    Users,
    Trophy,
    FileText,
    Lock,
    Unlock,
    Upload,
    Smartphone,
    LayoutDashboard,
    RefreshCcw,
    Fingerprint,
    CheckCircle2,
    QrCode,
    Trash2,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    Building,
    RotateCcw,
    Edit,
    X,
    Zap,
    Search,
    Filter,
    Download,
    History,
    FileSpreadsheet,
    Layers,
    List,
    Clock,
    CircleX,
    Calendar,
    AlertCircle,
    ArrowRightLeft,
    Hand,
    Hourglass,
    PartyPopper,
    Frown,
    UserCheck,
    PlayCircle,
    StopCircle,
    Sparkles,
    Gift,
    Wifi,
    Ticket,
    Scan,
    Smartphone as PhoneIcon,
    MessageSquare,
    MoreVertical,
    FileBadge,
    Share2,
    Eye,
    Home,
    Info,
    Settings,
    Disc,
    LogOut,
    User,
    Mail,
    Key,
} from 'lucide-react';
import { LoginScreen } from './components/LoginScreen';
import { RegistrationStepper } from './components/RegistrationStepper';
import { AdminReception } from './components/AdminReception';
import { AdminControl } from './components/AdminControl';
import { AdminStorage } from './components/AdminStorage';
import { UserProfileTab } from './components/UserProfileTab';
import { ImportExcelModal } from './components/ImportExcelModal';
import { ImportApartmentModal } from './components/ImportApartmentModal';
import { BulkUploadModal } from './components/BulkUploadModal';
import { ProfileDetailsModal } from './components/ProfileDetailsModal';
import { ResultDetailsDrawer } from './components/ResultDetailsDrawer';
import { ThietLapVongQuay, DrawSession } from './components/DrawSession';
import { ManHinhMonitor, EventMonitor } from './components/EventMonitor';
import { SystemAccounts } from './components/SystemAccounts';
import MonitorSMS from './components/MonitorSMS';
import { UserDashboard } from './components/UserDashboard';
import { SubmissionWizard } from './components/SubmissionWizard';
import { ApplicationStatusModal } from './components/ApplicationStatusModal';
import {
    INITIAL_PROJECT_STATE,
    LIVE_PROJECT_CONFIGS,
    PAST_PROJECTS_DATA,
    HISTORICAL_PROJECTS,
    TOTAL_INVENTORY,
    generateDemoApartments
} from './constants';
import { Participant, Apartment, Round, SystemAccount, ParticipantHistory, ApartmentHistory } from './types';
import * as XLSX from 'xlsx';

const maskCCCD = (val: string) => val.slice(0, 3) + "***" + val.slice(-3);

const safeSave = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
            console.warn(`LocalStorage quota exceeded for key: ${key}. Data not persisted.`);
        } else {
            console.error(`Failed to save to localStorage for key: ${key}`, e);
        }
    }
};

export default function App() {
    // --- CORE STATE (MULTI-TENANT) ---
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [adminUsername, setAdminUsername] = useState<string>('');

    // Initialize view based on URL parameter ?role=user or ?role=admin
    const [currentView, setCurrentView] = useState<'admin' | 'user'>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('role') === 'user' ? 'user' : 'admin';
    });

    // --- STATE SYNCHRONIZATION (CROSS-TAB SUPPORT) ---
    // We initialize state from localStorage if available to support multiple tabs (Admin in one, User in another)
    const [projects, setProjects] = useState(() => {
        const saved = localStorage.getItem('vgc_projects_data_v4');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to load state", e);
            }
        }

        const initial = { ...INITIAL_PROJECT_STATE };
        // Inject sessionStatus into initial state
        Object.keys(initial).forEach(key => {
            // @ts-ignore
            initial[key] = {
                ...initial[key],
                sessionStatus: 'waiting',
                rounds: initial[key].rounds || []
            };
        });
        return initial;
    });

    // Persist state changes to localStorage
    useEffect(() => {
        safeSave('vgc_projects_data_v4', JSON.stringify(projects));
    }, [projects]);

    // Listen for storage changes from other tabs (e.g., Admin toggles Live in another tab)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'vgc_projects_data_v4' && e.newValue) {
                try {
                    const newState = JSON.parse(e.newValue);
                    setProjects(newState);
                    // Optional: Flash a message or visual cue
                } catch (err) {
                    console.error("Sync error", err);
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const [currentProjectId, setCurrentProjectId] = useState<string>(LIVE_PROJECT_CONFIGS[0].id);

    const handleNextRound = () => {
        const activeRounds = activeProject.rounds || [];
        const currentIndex = activeRounds.findIndex((r: Round) => r.status === 'dang_dien_ra');
        
        let nextRounds = [...activeRounds];
        
        if (currentIndex === -1) {
            // No active round, activate the first pending one
            const firstPendingIndex = activeRounds.findIndex((r: Round) => r.status === 'cho');
            if (firstPendingIndex !== -1) {
                nextRounds[firstPendingIndex] = { 
                    ...nextRounds[firstPendingIndex], 
                    status: 'dang_dien_ra',
                    startTime: '00:00', // Override time to prevent auto-revert
                    endTime: '23:59' 
                };
                addLog(`DEMO: Kích hoạt ${nextRounds[firstPendingIndex].label}`);
            }
        } else {
            // Complete current, activate next
            nextRounds[currentIndex] = { ...nextRounds[currentIndex], status: 'hoan_thanh' };
            const nextIndex = currentIndex + 1;
            if (nextIndex < nextRounds.length) {
                nextRounds[nextIndex] = { 
                    ...nextRounds[nextIndex], 
                    status: 'dang_dien_ra',
                    startTime: '00:00', // Override time to prevent auto-revert
                    endTime: '23:59' 
                };
                addLog(`DEMO: Chuyển sang ${nextRounds[nextIndex].label}`);
            } else {
                addLog(`DEMO: Tất cả các vòng đã hoàn thành.`);
            }
        }
        
        updateActiveProject({ rounds: nextRounds });
    };

    // Derived Active State
    const activeProject = (projects[currentProjectId as keyof typeof projects] || {}) as any;
    const participants = (activeProject.participants || []) as Participant[];
    const isGateOpen = activeProject.isGateOpen;
    const sessionStatus = activeProject.sessionStatus as 'waiting' | 'live';

    // Removed hardcoded 'proj_kc' legacy check that was crashing the app

    const [activeTab, setActiveTab] = useState<'data' | 'profiles' | 'inventory' | 'monitor' | 'event-monitor' | 'round-setup' | 'reports' | 'system-accounts' | 'reception' | 'control' | 'storage'>('data');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [reportPage, setReportPage] = useState(1);
    const ITEMS_PER_PAGE_REPORT = 10;

    const mockReportData = useMemo(() => [
        { id: 'KC000001', name: 'Trần Văn An', phone: '09123456789', cccd: '001191033786', date: '26/03/2026', round: 'Vòng 1', unit: 'C01.05', result: 'won' },
        { id: 'KC000002', name: 'Nguyễn Văn Bình', phone: '09123456788', cccd: '034195088221', date: '26/03/2026', round: 'Vòng 1', unit: '—', result: 'lost' },
        { id: 'KC000236', name: 'Nguyễn Văn An', phone: '0912345678', cccd: '001191033786', date: '26/03/2026', round: 'Vòng 1', unit: 'C01.02', result: 'won' },
        { id: 'KC001102', name: 'Trần Thị Mai', phone: '0987654321', cccd: '001198045112', date: '26/03/2026', round: 'Vòng 1', unit: '—', result: 'lost' },
        { id: 'KC002519', name: 'Lê Hoàng Minh', phone: '0903123456', cccd: '001200067901', date: '26/03/2026', round: 'Vòng 1', unit: 'C02.08', result: 'won' },
        { id: 'KC003014', name: 'Phạm Ngọc Ánh', phone: '0938001122', cccd: '001197022345', date: '26/03/2026', round: 'Vòng 1', unit: '—', result: 'lost' },
        { id: 'KC003889', name: 'Đặng Quốc Huy', phone: '0977112233', cccd: '001199088776', date: '26/03/2026', round: 'Vòng 1', unit: '—', result: 'lost' },
        { id: 'KC004276', name: 'Vũ Thị Hạnh', phone: '0909888777', cccd: '001201010101', date: '26/03/2026', round: 'Vòng 1', unit: 'C01.11', result: 'won' },
        { id: 'KC004991', name: 'Nguyễn Đức Long', phone: '0944556677', cccd: '001196055432', date: '26/03/2026', round: 'Vòng 1', unit: '—', result: 'lost' },
        { id: 'KC005120', name: 'Bùi Thảo Vy', phone: '0966123123', cccd: '001202099999', date: '26/03/2026', round: 'Vòng 1', unit: '—', result: 'lost' },
        { id: 'KC005678', name: 'Hoàng Gia Bảo', phone: '0911222333', cccd: '001195044321', date: '26/03/2026', round: 'Vòng 1', unit: 'C03.05', result: 'won' },
        { id: 'KC006031', name: 'Đỗ Minh Khang', phone: '0988333444', cccd: '001203012345', date: '26/03/2026', round: 'Vòng 1', unit: '—', result: 'lost' },
        { id: 'KC006540', name: 'Nguyễn Thùy Linh', phone: '0977000111', cccd: '001194077777', date: '26/03/2026', round: 'Vòng 1', unit: '—', result: 'lost' },
        { id: 'KC007002', name: 'Trịnh Văn Nam', phone: '0904000222', cccd: '001193066666', date: '26/03/2026', round: 'Vòng 1', unit: 'C02.12', result: 'won' },
        { id: 'KC007111', name: 'Phan Văn Hùng', phone: '0911112222', cccd: '001192011111', date: '26/03/2026', round: 'Vòng 1', unit: '—', result: 'lost' },
        { id: 'KC007222', name: 'Lý Thị Thu', phone: '0922223333', cccd: '001193022222', date: '26/03/2026', round: 'Vòng 1', unit: 'C05.05', result: 'won' },
        { id: 'KC007333', name: 'Trương Minh Tuấn', phone: '0933334444', cccd: '001194033333', date: '26/03/2026', round: 'Vòng 1', unit: '—', result: 'lost' },
        { id: 'KC007444', name: 'Đinh Ngọc Lan', phone: '0944445555', cccd: '001195044444', date: '26/03/2026', round: 'Vòng 1', unit: '—', result: 'lost' },
        { id: 'KC007555', name: 'Võ Thanh Tâm', phone: '0955556666', cccd: '001196055555', date: '26/03/2026', round: 'Vòng 1', unit: 'C06.06', result: 'won' },
        { id: 'KC007666', name: 'Dương Văn Khánh', phone: '0966667777', cccd: '001197066666', date: '26/03/2026', round: 'Vòng 1', unit: '—', result: 'lost' },
        { id: 'KC007777', name: 'Hà Thị Mai', phone: '0977778888', cccd: '001198077777', date: '26/03/2026', round: 'Vòng 1', unit: '—', result: 'lost' },
        { id: 'KC007888', name: 'Ngô Văn Phúc', phone: '0988889999', cccd: '001199088888', date: '26/03/2026', round: 'Vòng 1', unit: 'C07.07', result: 'won' },
        { id: 'KC007999', name: 'Bùi Thị Dung', phone: '0999990000', cccd: '001200099999', date: '26/03/2026', round: 'Vòng 1', unit: '—', result: 'lost' },
        { id: 'KC008000', name: 'Hồ Văn Hải', phone: '0900001111', cccd: '001201000000', date: '26/03/2026', round: 'Vòng 1', unit: '—', result: 'lost' },
    ], []);

    const handleExportExcel = () => {
        const dataToExport = mockReportData.map(p => ({
            'Mã Hồ Sơ': p.id,
            'Họ và Tên': p.name,
            'Số Điện Thoại': p.phone,
            'Số CCCD': p.cccd,
            'Ngày Quay': p.date,
            'Vòng Bốc Thăm': p.round,
            'Kết Quả': p.result === 'won' ? 'Trúng Tuyển' : 'Không Trúng',
            'Căn Trúng': p.unit && p.unit !== '—' ? p.unit : ''
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "BaoCao");
        XLSX.writeFile(wb, "VGC_KetQuaBocTham.xlsx");
    };

    const paginatedReportData = useMemo(() => {
        const start = (reportPage - 1) * ITEMS_PER_PAGE_REPORT;
        return mockReportData.slice(start, start + ITEMS_PER_PAGE_REPORT);
    }, [reportPage, mockReportData]);
    const [systemAccounts, setSystemAccounts] = useState<SystemAccount[]>([
        { id: 'admin1', username: 'admin', displayName: 'Quản trị viên', role: 'admin', status: 'active' },
        { id: 'staff1', username: 'staff', displayName: 'Nhân viên 1', role: 'staff', status: 'active' },
        { id: 'tn1', username: 'tiepnhan', displayName: 'Cán bộ Tiếp Nhận', role: 'tiepnhan', status: 'active' },
        { id: 'ks1', username: 'kiemsoat', displayName: 'Cán bộ Kiểm Soát', role: 'kiemsoat', status: 'active' },
        { id: 'kho1', username: 'kho', displayName: 'Cán bộ Kho', role: 'kho', status: 'active' }
    ]);

    const handleAddAccount = (newAccount: Omit<SystemAccount, 'id'>) => {
        const id = `acc_${Date.now()}`;
        setSystemAccounts(prev => [...prev, { ...newAccount, id }]);
    };

    const handleUpdateAccount = (id: string, updates: Partial<SystemAccount>) => {
        setSystemAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updates } : acc));
    };

    const handleDeleteAccount = (id: string) => {
        setSystemAccounts(prev => prev.filter(acc => acc.id !== id));
    };

    const [logs, setLogs] = useState<string[]>(["Hệ thống khởi tạo thành công.", `Đang kết nối: ${activeProject.name}`]);

    // --- MONITOR STATE ---
    const [monitorSearch, setMonitorSearch] = useState("");
    const [monitorFilterStatus, setMonitorFilterStatus] = useState<'all' | 'checked-in' | 'pending'>('all');

    // --- PROFILE MANAGEMENT STATE ---
    const [profileSearch, setProfileSearch] = useState("");
    const [profileFilterRight, setProfileFilterRight] = useState<'ALL' | 'BUY' | 'RENT' | 'RENT_BUY'>('ALL');
    const [profileFilterType, setProfileFilterType] = useState<'ALL' | 'UT1' | 'UT2' | 'UT3' | 'UT4' | 'UT5' | 'THUONG'>('ALL');
    const [profileFilterGroup, setProfileFilterGroup] = useState<'ALL' | 'uu_tien_trung' | 'uu_tien_trung_truot' | 'thong_thuong'>('ALL');
    const [profileFilterEligibility, setProfileFilterEligibility] = useState<'ALL' | 'DU_DK' | 'THIEU_TT'>('ALL');
    const [profileFilterStatus, setProfileFilterStatus] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');
    const [profileFilterCompletion, setProfileFilterCompletion] = useState<'ALL' | 'COMPLETE' | 'INCOMPLETE'>('ALL');
    const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(new Set());
    const [profileSort, setProfileSort] = useState<{ field: keyof Participant, direction: 'asc' | 'desc' }>({ field: 'id', direction: 'asc' });
    const [profilePage, setProfilePage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [newlyImportedIds, setNewlyImportedIds] = useState<Set<string>>(new Set());

    // Modals
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
    const [activeProfileForDetails, setActiveProfileForDetails] = useState<Participant | null>(null);
    const [activeResultProfile, setActiveResultProfile] = useState<Participant | null>(null);
    const [viewingHistoryProfile, setViewingHistoryProfile] = useState<Participant | null>(null);
    const [editingProfile, setEditingProfile] = useState<Participant | null>(null);
    const [isProfilesSealed, setIsProfilesSealed] = useState(false);
    const [isApartmentsSealed, setIsApartmentsSealed] = useState(false);
    const [editProfileReason, setEditProfileReason] = useState("");

    // --- APARTMENT INVENTORY STATE ---
    const [apartments, setApartments] = useState<Apartment[]>(() => generateDemoApartments(929));
    const [apartmentSearch, setApartmentSearch] = useState("");
    const [apartmentFilterRight, setApartmentFilterRight] = useState<'ALL' | 'BUY' | 'RENT' | 'RENT_BUY'>('ALL');
    const [apartmentFilterType, setApartmentFilterType] = useState<'ALL' | 'UT' | 'TT'>('ALL');
    const [apartmentFilterStatus, setApartmentFilterStatus] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED'>('ALL');
    const [apartmentSort, setApartmentSort] = useState<{ field: keyof Apartment, direction: 'asc' | 'desc' }>({ field: 'block', direction: 'asc' });
    const [apartmentPage, setApartmentPage] = useState(1);
    const [isImportApartmentModalOpen, setIsImportApartmentModalOpen] = useState(false);
    const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
    const [editApartmentReason, setEditApartmentReason] = useState("");
    const [viewingHistoryApartment, setViewingHistoryApartment] = useState<Apartment | null>(null);

    // --- REPORT & HISTORY STATE ---
    const [reportSearch, setReportSearch] = useState("");
    const [reportFilterResult, setReportFilterResult] = useState<'ALL' | 'WON' | 'LOST'>('ALL');
    const [reportFilterRound, setReportFilterRound] = useState<string>('ALL');
    const [reportFilterDate, setReportFilterDate] = useState("");

    // --- USER MOBILE STATE ---
    /*
      Step Definition:
      1: Login
      6: Check-in Success
      7: Lobby/Game (Live Event Room)
      10: Portal Dashboard (Main Menu)
      11: Rules View
    */
    const [mobileStep, setMobileStep] = useState(1);
    const [loginStep, setLoginStep] = useState<'credentials' | 'register_cccd' | 'register_ekyc' | 'first_time_auth' | 'add_email' | 'forgot_password' | 'otp' | 'password_setup'>('credentials');
    const [verifyMode, setVerifyMode] = useState<'first_time' | 'forgot_password'>('first_time');
    const [inputCccd, setInputCccd] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [inputId, setInputId] = useState("");
    const [inputPhone, setInputPhone] = useState("");
    const [userError, setUserError] = useState("");
    const [currentUser, setCurrentUser] = useState<Participant | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [otpValue, setOtpValue] = useState("");
    const [isSpinning, setIsSpinning] = useState(false);
    const [spinCountdown, setSpinCountdown] = useState(60); // countdown in seconds
    const [priorityGroupMappingBuy, setPriorityGroupMappingBuy] = useState<Record<string, 'uu_tien_trung' | 'uu_tien_trung_truot' | 'thong_thuong'>>({
        ut1: 'uu_tien_trung', ut2: 'uu_tien_trung', ut3: 'uu_tien_trung', ut4: 'uu_tien_trung', ut5: 'uu_tien_trung_truot', thuong: 'thong_thuong'
    });
    const [priorityGroupMappingRentBuy, setPriorityGroupMappingRentBuy] = useState<Record<string, 'uu_tien_trung' | 'uu_tien_trung_truot' | 'thong_thuong'>>({
        ut1: 'uu_tien_trung', ut2: 'uu_tien_trung', ut3: 'uu_tien_trung', ut4: 'uu_tien_trung', ut5: 'uu_tien_trung_truot', thuong: 'thong_thuong'
    });
    const [priorityGroupMappingRent, setPriorityGroupMappingRent] = useState<Record<string, 'uu_tien_trung' | 'uu_tien_trung_truot' | 'thong_thuong'>>({
        ut1: 'uu_tien_trung', ut2: 'uu_tien_trung', ut3: 'uu_tien_trung', ut4: 'uu_tien_trung', ut5: 'uu_tien_trung_truot', thuong: 'thong_thuong'
    });

    const [tempMappingBuy, setTempMappingBuy] = useState(priorityGroupMappingBuy);
    const [tempMappingRentBuy, setTempMappingRentBuy] = useState(priorityGroupMappingRentBuy);
    const [tempMappingRent, setTempMappingRent] = useState(priorityGroupMappingRent);

    const [isMappingChanged, setIsMappingChanged] = useState(false);
    const [connectionPulse, setConnectionPulse] = useState(0);
    const [showCertificate, setShowCertificate] = useState(false);
    const [lobbyCountdown, setLobbyCountdown] = useState(300); // 5 minutes in seconds
    const [isAppStatusOpen, setIsAppStatusOpen] = useState(false);
    const [userActiveTab, setUserActiveTab] = useState<'home' | 'profile'>('home');

    // --- PROFILE STATISTICS ---
    const profileStats = useMemo(() => {
        const total = participants.length;
        const ut1 = participants.filter(p => p.type === 'ut1').length;
        const ut2 = participants.filter(p => p.type === 'ut2').length;
        const ut3 = participants.filter(p => p.type === 'ut3').length;
        const ut4 = participants.filter(p => p.type === 'ut4').length;
        const ut5 = participants.filter(p => p.type === 'ut5').length;
        const tt = participants.filter(p => p.type === 'thuong').length;

        const getGroup = (p: Participant) => {
            if (p.right === 'mua') return priorityGroupMappingBuy[p.type] || 'thong_thuong';
            if (p.right === 'thue_mua') return priorityGroupMappingRentBuy[p.type] || 'thong_thuong';
            return priorityGroupMappingRent[p.type] || 'thong_thuong';
        };

        const groupCounts = {
            uu_tien_trung: participants.filter(p => getGroup(p) === 'uu_tien_trung').length,
            uu_tien_trung_truot: participants.filter(p => getGroup(p) === 'uu_tien_trung_truot').length,
            thong_thuong: participants.filter(p => getGroup(p) === 'thong_thuong').length,
        };

        return { total, ut1, ut2, ut3, ut4, ut5, tt, groupCounts };
    }, [participants, priorityGroupMappingBuy, priorityGroupMappingRentBuy, priorityGroupMappingRent]);

    // --- PERSISTENCE & INIT LOGIC ---
    useEffect(() => {
        // Session Restoration Logic
        const savedSession = localStorage.getItem('vgc_session_id');
        const savedProject = localStorage.getItem('vgc_project_id');

        if (savedSession && savedProject === currentProjectId) {
            const foundUser = participants.find(p => p.id === savedSession);
            if (foundUser) {
                setCurrentUser(foundUser);
                setMobileStep(10); // Restore to Portal Dashboard
                addLog(`RE-CONNECT: User ${savedSession} restored from session.`);
            }
        }
    }, [currentProjectId]);

    // Sync currentUser with global state changes (e.g. when they win/lose via admin simulation or other tab)
    useEffect(() => {
        if (currentUser) {
            const freshUserData = participants.find(p => p.id === currentUser.id);
            if (freshUserData && JSON.stringify(freshUserData) !== JSON.stringify(currentUser)) {
                setCurrentUser(freshUserData);
            }
        }
    }, [participants, currentUser]);

    // Connection Heartbeat Simulation & Countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setConnectionPulse(prev => prev + 1);
            if (mobileStep === 7 && sessionStatus === 'waiting') {
                setLobbyCountdown(prev => (prev > 0 ? prev - 1 : 300));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [mobileStep, sessionStatus]);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] [${activeProject.prefix}] ${msg}`, ...prev]);
    };

    // --- STATE MODIFIERS ---
    const updateActiveProject = (updates: any) => {
        setProjects(prev => {
            const next = {
                ...prev,
                [currentProjectId]: { ...prev[currentProjectId as keyof typeof prev], ...updates }
            };
            safeSave('vgc_projects_data_v4', JSON.stringify(next));
            return next;
        });
    };

    const updateParticipants = (newParticipants: Participant[]) => {
        updateActiveProject({ participants: newParticipants });
    };

    // --- DRAW HANDLERS ---
    const handleUpdateRounds = (newRounds: Round[]) => {
        setProjects(prev => {
            const updatedProjects = {
                ...prev,
                [currentProjectId]: {
                    ...prev[currentProjectId as keyof typeof prev],
                    rounds: newRounds
                }
            };
            safeSave('vgc_projects_data_v4', JSON.stringify(updatedProjects));
            return updatedProjects;
        });
    };



    const handleUpdateParticipant = (id: string, updates: Partial<Participant>) => {
        const updated = participants.map(p => p.id === id ? { ...p, ...updates } : p);
        updateParticipants(updated);
    };

    const handleUpdateApartment = (id: string, updates: Partial<Apartment>) => {
        setApartments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    };

    const handleDeleteProfile = (id: string) => {
        if (confirm(`Bạn có chắc chắn muốn xóa hồ sơ ${id}? Hành động này không thể hoàn tác.`)) {
            const updated = participants.filter(p => p.id !== id);
            updateParticipants(updated);
            addLog(`XÓA HỒ SƠ: ${id} đã bị xóa khỏi hệ thống.`);
        }
    };

    const handleUploadScan = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const updated = participants.map(p =>
                p.id === id ? { ...p, documentUrl: url, profileStatus: 'hoan_thanh' as const } : p
            );
            updateParticipants(updated);
            addLog(`UPLOAD SCAN: ${id} đã cập nhật hồ sơ scan.`);
        }
    };

    // --- ADMIN HANDLERS ---
    const handleImport = () => {
        const freshData = INITIAL_PROJECT_STATE[currentProjectId as keyof typeof INITIAL_PROJECT_STATE].participants.map(p => ({ ...p }));
        updateActiveProject({
            participants: freshData,
            isDataSealed: false,
            sealedHash: null,
            sessionStatus: 'waiting'
        });
        addLog(`RESET: Dữ liệu dự án đã được làm mới (${freshData.length} HS).`);
    };

    const handleSeal = () => {
        if (participants.length === 0) return;
        const hash = (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)).toUpperCase();
        updateActiveProject({
            isDataSealed: true,
            sealedHash: `8F4B${hash}`
        });
        addLog(`NIÊM PHONG: Mã băm SHA-256: 8F4B${hash}`);
    };

    const toggleGate = (status: boolean) => {
        updateActiveProject({ isGateOpen: status });
        addLog(status ? "MỞ CỔNG check-in." : "ĐÓNG CỔNG check-in.");
    };

    const toggleSession = () => {
        const newStatus = sessionStatus === 'waiting' ? 'live' : 'waiting';
        updateActiveProject({ sessionStatus: newStatus });
        addLog(newStatus === 'live' ? "KÍCH HOẠT PHIÊN BỐC THĂM: Tất cả người dùng chuyển sang màn hình Game." : "TẠM DỪNG PHIÊN BỐC THĂM.");
    };

    const handleAutoCheckIn = () => {
        if (!isGateOpen) {
            alert("Vui lòng MỞ CỔNG (Open Gate) trước khi chạy Demo Check-in!");
            return;
        }
        const available = participants.filter(p => !p.checkInStatus);
        if (available.length === 0) {
            alert("Tất cả hồ sơ đã được check-in!");
            return;
        }
        const countToPick = Math.max(1, Math.floor(available.length * 0.8));
        const shuffled = [...available].sort(() => 0.5 - Math.random());
        const selectedIds = new Set(shuffled.slice(0, countToPick).map(p => p.id));

        const updated = participants.map(p => {
            if (selectedIds.has(p.id)) {
                addLog(`CHECK-IN: ${p.name} (${p.id}) đã check-in.`);
                return {
                    ...p,
                    checkInStatus: true,
                    checkInTime: new Date().toLocaleTimeString('vi-VN')
                };
            }
            return p;
        });
        updateParticipants(updated);
        addLog(`DEMO: Đã check-in tự động ${countToPick} khách hàng.`);
    };

    // --- INVENTORY HELPERS ---
    const getGlobalInventory = () => {
        // Calculate total units based on apartments data if available, otherwise use TOTAL_INVENTORY
        const totalUnits = apartments.length > 0 ? apartments.length : TOTAL_INVENTORY;

        // Calculate overall stats
        const used = apartments.filter(a => a.status === 'OCCUPIED').length;
        const remaining = totalUnits - used;

        // Calculate stats by right
        const buyTotal = apartments.filter(a => a.right === 'BUY').length;
        const buyUsed = apartments.filter(a => a.right === 'BUY' && a.status === 'OCCUPIED').length;

        const rentTotal = apartments.filter(a => a.right === 'RENT').length;
        const rentUsed = apartments.filter(a => a.right === 'RENT' && a.status === 'OCCUPIED').length;

        const rentBuyTotal = apartments.filter(a => a.right === 'RENT_BUY').length;
        const rentBuyUsed = apartments.filter(a => a.right === 'RENT_BUY' && a.status === 'OCCUPIED').length;

        return {
            total: totalUnits,
            used,
            remaining,
            buy: { total: buyTotal, used: buyUsed, remaining: buyTotal - buyUsed },
            rent: { total: rentTotal, used: rentUsed, remaining: rentTotal - rentUsed },
            rentBuy: { total: rentBuyTotal, used: rentBuyUsed, remaining: rentBuyTotal - rentBuyUsed }
        };
    };

    const getProfileInventory = () => {
        const total = participants.length;
        const priority = participants.filter(p => ['ut1', 'ut2', 'ut3', 'ut4', 'ut5'].includes(p.type)).length;
        const regular = total - priority;
        const buy = participants.filter(p => p.right === 'mua').length;
        const rent = participants.filter(p => p.right === 'thue').length;
        const rentBuy = participants.filter(p => p.right === 'thue_mua').length;
        const complete = participants.filter(p => p.profileStatus === 'hoan_thanh').length;

        return {
            total,
            priority,
            regular,
            buy,
            rent,
            rentBuy,
            complete
        };
    };

    // --- SIMULATE ALL HANDLER ---
    const handleSimulateAll = () => {

        // 1. Get Global Inventory
        let { remaining } = getGlobalInventory();

        // 2. Xác định người dùng cần bốc thăm (Đã đăng nhập VÀ Chờ bốc)
        const eligibleUsers = participants.filter(p => p.checkInStatus && p.drawStatus === 'cho');

        if (eligibleUsers.length === 0) {
            alert("Không có hồ sơ nào đủ điều kiện (Đã Đăng Nhập và chưa bốc thăm).");
            return;
        }

        // 3. Shuffle to ensure fairness for limited inventory during simulation
        const shuffledUsers = [...eligibleUsers].sort(() => 0.5 - Math.random());
        const shuffledIds = new Set(shuffledUsers.map(u => u.id));

        // Used count for assigning sequential unit numbers
        let currentUsedCount = getGlobalInventory().used;

        // 4. Chạy giả lập bốc thăm
        const updated = participants.map(p => {
            if (shuffledIds.has(p.id)) {
                let result: 'trung' | 'truot' = 'truot';
                let assignedUnit = undefined;

                if (remaining > 0) {
                    // 50% cơ hội trúng khi còn căn hộ
                    if (Math.random() > 0.5) {
                        result = 'trung';
                        currentUsedCount++;
                        assignedUnit = `Căn ${100 + currentUsedCount}`;
                        remaining--;
                    }
                }

                return {
                    ...p,
                    hasWon: result === 'trung',
                    drawStatus: result,
                    assignedUnit: assignedUnit
                };
            }
            return p;
        });

        updateParticipants(updated as any);
        addLog(`AUTO-SIMULATION: Đã hoàn tất bốc thăm cho ${eligibleUsers.length} hồ sơ.`);
    };

    const handleSupervisorDraw = (roundId: number) => {
        const round = activeProject.rounds.find(r => r.id === roundId);
        if (!round) return;

        // match Event Monitor logic: if round has explicit IDs use them, otherwise use fallback criteria
        const hasIds = round.participantIds && round.participantIds.length > 0;
        const eligibleUsers = participants.filter(p => {
            if (p.checkInStatus || p.drawStatus === 'trung') return false;
            if (hasIds) return round.participantIds.includes(p.id);
            
            // Fallback criteria
            if (round.right && p.right !== round.right) return false;
            if (round.participantType === 'ut1_4' && !['ut1', 'ut2', 'ut3', 'ut4'].includes(p.type)) return false;
            if (round.participantType === 'ut5' && p.type !== 'ut5') return false;
            if (round.participantType === 'thuong' && p.type !== 'thuong') return false;
            return true;
        });

        if (eligibleUsers.length === 0) return;

        let availableApartments = apartments.filter(a => a.status === 'trong');

        if (round.inventoryIds && round.inventoryIds.length > 0) {
            availableApartments = availableApartments.filter(a => round.inventoryIds.includes(a.id));
        } else if (round.apartmentRightFilter && round.apartmentRightFilter !== 'all') {
            availableApartments = availableApartments.filter(a => a.right === round.apartmentRightFilter);
        }

        let currentApartments = [...apartments];
        const updates = eligibleUsers.map((u, idx) => {
            const apt = availableApartments[idx];
            if (apt) {
                currentApartments = currentApartments.map(a => 
                    a.id === apt.id ? { ...a, status: 'da_ban' as const, ownerId: u.id } : a
                );
                return { ...u, hasWon: true, drawStatus: 'trung' as const, assignedUnit: apt.id };
            }
            return { ...u, hasWon: true, drawStatus: 'trung' as const, assignedUnit: `C0${Math.floor(Math.random()*9)+1}${String(idx).padStart(2,'0')}` };
        });

        const newParticipants = participants.map(p => {
            const upd = updates.find(u => u.id === p.id);
            return upd ? upd : p;
        });

        const updatedRounds = activeProject.rounds.map(r => 
            r.id === roundId ? { ...r, winners: [...(r.winners || []), ...eligibleUsers.map(u => u.id)] } : r
        );

        setApartments(currentApartments);
        safeSave('vgc_apartments_v4', JSON.stringify(currentApartments));
        
        setProjects(prev => {
            const nextProj = {
                ...prev,
                [currentProjectId]: {
                    ...prev[currentProjectId as keyof typeof prev],
                    rounds: updatedRounds,
                    participants: newParticipants
                }
            };
            safeSave('vgc_projects_data_v4', JSON.stringify(nextProj));
            return nextProj;
        });

        addLog(`GIÁM SÁT VIÊN: Bốc thăm vắng mặt cho ${eligibleUsers.length} hồ sơ tại vòng ${round.label}`);
    };

    // --- USER SPIN LOGIC (THE GACHA MOMENT) ---
    const handleUserSpin = () => {
        if (!currentUser) return;

        // Tìm vòng cho người dùng này (nếu đang bật demo 'live' thì cho phép luôn)
        let activeRound = activeProject.rounds.find(r =>
            r.status === 'dang_dien_ra' &&
            r.participantIds.includes(currentUser.id)
        );

        if (!activeRound && sessionStatus === 'live') {
            // Demo fallback: Lấy vòng bốc thăm mà hồ sơ thuộc về, nếu không lấy luôn vòng bất kỳ để thoả điều kiện demo nhanh
            activeRound = activeProject.rounds.find(r => r.participantIds.includes(currentUser.id))
                          || activeProject.rounds[0]
                          || { id: 'demo1', label: 'Demo', inventoryIds: [], apartmentRightFilter: 'all', winners: [] } as any;
        }

        if (!activeRound) {
            alert("Chưa tới lượt bộ hồ sơ của bạn hoặc vòng bốc thăm chưa được kích hoạt. Vui lòng chờ tín hiệu chuyển vòng từ ban tổ chức.");
            return;
        }
        const SPIN_DURATION = 3; // seconds - Cho chờ 3s rồi trả kết quả
        setIsSpinning(true);
        setSpinCountdown(SPIN_DURATION);

        if (currentUser.drawStatus === 'trung') {
            updateActiveProject({ sessionStatus: 'completed' }); // Hoàn thành ngay bản thân user
        }

        // Countdown interval - đếm ngược mỗi giây
        let remaining = SPIN_DURATION;
        const countdownInterval = setInterval(() => {
            remaining -= 1;
            setSpinCountdown(remaining);
            if (remaining <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);

        // Xử lý kết quả sau 60 giây
        setTimeout(() => {
            clearInterval(countdownInterval);
            setSpinCountdown(0);

            // Lấy căn hộ còn trống theo vòng bốc thăm
            let availableApartments = apartments.filter(a => a.status === 'trong');

            // Lọc theo inventoryIds của vòng
            if (activeRound.inventoryIds && activeRound.inventoryIds.length > 0) {
                availableApartments = availableApartments.filter(a => activeRound.inventoryIds.includes(a.id));
            } else if (activeRound.apartmentRightFilter && activeRound.apartmentRightFilter !== 'all') {
                availableApartments = availableApartments.filter(a => a.right === activeRound.apartmentRightFilter);
            }

            let result: 'trung' | 'truot' = 'truot';
            let assignedUnit = undefined;

            // LOGIC: Check Inventory First
            if (availableApartments.length > 0) {
                if (true) { // Luôn trúng cho demo
                    result = 'trung';
                    const randomAptIndex = Math.floor(Math.random() * availableApartments.length);
                    let wonApt = availableApartments[randomAptIndex] || { id: 'Mocked-Apt' } as any;

                    // OVERRIDE FOR KC0001 -> C03.25
                    if (currentUser.id === 'KC0001') {
                        const specificApt = apartments.find(a => a.id === 'C03.25');
                        if (specificApt && specificApt.status === 'trong') {
                            wonApt = specificApt;
                        } else {
                            wonApt = specificApt || { id: 'C03.25', block: 'C', floor: '03', unit: '25', type: 'TT', right: 'BUY', status: 'trong' } as any;
                        }
                    }

                    assignedUnit = wonApt.id;

                    // Cập nhật trạng thái căn hộ → đã bán
                    const updatedApartments = apartments.map(a =>
                        a.id === wonApt.id ? { ...a, status: 'da_ban' as const, ownerId: currentUser.id } : a
                    );
                    setApartments(updatedApartments);

                    setProjects(prev => {
                        const proj = prev[currentProjectId];
                        const updatedRounds = proj.rounds.map(r => {
                            if (r.id === activeRound.id) {
                                return { ...r, winners: [...(r.winners || []), currentUser.id] };
                            }
                            return r;
                        });
                        return {
                            ...prev,
                            [currentProjectId]: {
                                ...proj,
                                rounds: updatedRounds
                            }
                        };
                    });
                }
            }

            // Cập nhật state người dùng
            const updated = participants.map(p => {
                if (p.id === currentUser.id) {
                    return {
                        ...p,
                        hasWon: result === 'trung',
                        drawStatus: result,
                        assignedUnit: assignedUnit
                    };
                }
                return p;
            });

            updateParticipants(updated);

            const updatedUser = updated.find(u => u.id === currentUser.id);
            if (updatedUser) setCurrentUser(updatedUser);

            setIsSpinning(false);
            addLog(`USER ACTION: ${currentUser.id} đã bốc thăm tại vòng ${activeRound.label}. Kết quả: ${result === 'trung' ? `TRÚNG (${assignedUnit})` : 'TRƯỢT'}`);

        }, SPIN_DURATION * 1000);
    };


    // --- USER HANDLERS ---
    const handleUserLogin = () => {
        const cleanCccd = inputCccd.trim();
        if (!cleanCccd) {
            setUserError("Vui lòng nhập Số CCCD.");
            return;
        }

        // DEMO BYPASS: CCCD 0123456789 with password 123456
        if (cleanCccd === '0123456789' && newPassword === '123456') {
            const demoMatch = participants.find(p => p.cccd === '0123456789');
            if (demoMatch) {
                setCurrentUser(demoMatch);
                setUserError("");
                
                const updated = participants.map(p =>
                    p.id === demoMatch.id ? { ...p, checkInStatus: true, checkInTime: new Date().toLocaleTimeString() } : p
                );
                updateParticipants(updated);
                
                safeSave('vgc_session_id', demoMatch.id);
                safeSave('vgc_project_id', currentProjectId);
                
                setLoginStep('credentials');
                setInputCccd("");
                setNewPassword("");
                setMobileStep(10);
                addLog(`DEMO LOGIN: ${demoMatch.id} (Nguyễn Văn A) đăng nhập bằng tài khoản giả lập.`);
                return;
            }
        }

        const match = participants.find(p => p.cccd === cleanCccd);
        if (!match) {
            setUserError(`CCCD chưa được liên kết với bất kỳ hồ sơ nào.`);
        } else if (!match.passwordSet) {
            setUserError(`Tài khoản chưa được kích hoạt. Hãy chọn "ĐĂNG KÝ TÀI KHOẢN".`);
        } else if (match.password !== newPassword) {
            setUserError(`Mật khẩu không chính xác.`);
        } else {
            setCurrentUser(match);
            setUserError("");
            
            const updated = participants.map(p =>
                p.id === match.id ? { ...p, checkInStatus: true, checkInTime: new Date().toLocaleTimeString() } : p
            );
            updateParticipants(updated);
            
            safeSave('vgc_session_id', match.id);
            safeSave('vgc_project_id', currentProjectId);
            
            setLoginStep('credentials');
            setInputCccd("");
            setNewPassword("");
            setMobileStep(10);
            addLog(`LOGIN: ${match.id} đăng nhập vào Cổng thông tin.`);
        }
    };

    const handleRegisterNext = () => {
        const cleanCccd = inputCccd.trim();
        if (!cleanCccd) {
            setUserError("Vui lòng nhập Số CCCD.");
            return;
        }
        const match = participants.find(p => p.cccd === cleanCccd);
        if (!match) {
            setUserError("Không tìm thấy hồ sơ khớp với CCCD này.");
            return;
        }
        if (match.passwordSet) {
            setUserError("Tài khoản này đã được đăng ký. Vui lòng đăng nhập.");
            return;
        }
        setUserError("");
        setLoginStep('register_ekyc');
    };

    const handleStartEkyc = () => {
        setUserError("");
        setIsSimulating(true);
        setTimeout(() => {
            setIsSimulating(false);
            setLoginStep('password_setup');
        }, 2000);
    };


    const handleRegisterComplete = (userData: any) => {
        // Create new participant
        const newId = `${activeProject.prefix}${String(participants.length + 1).padStart(4, '0')}`;
        const newParticipant: Participant = {
            id: newId,
            name: userData.name,
            cccd: userData.cccd,
            phone: userData.phone,
            email: userData.email,
            password: userData.password,
            passwordSet: true,
            checkInStatus: true,
            checkInTime: new Date().toLocaleTimeString(),
            photo: userData.cccdFront || `https://i.pravatar.cc/150?u=${newId}`,
            hasWon: false,
            drawStatus: 'cho',
            right: 'mua', // Default right
            type: 'thuong', // Default type
            status: 'hoat_dong',
            profileStatus: 'chua_hoan_thanh',
            applicationState: 'nhap',
            isDuplicate: false,
            history: [{
                field: 'dang_ky',
                timestamp: new Date().toISOString(),
                actor: 'Người dùng',
                note: 'Đăng ký tài khoản mới qua eKYC',
                newValue: 'Đã tạo'
            }]
        };

        const updated = [...participants, newParticipant];
        updateParticipants(updated);
        
        setCurrentUser(newParticipant);
        safeSave('vgc_session_id', newId);
        safeSave('vgc_project_id', currentProjectId);
        
        setLoginStep('credentials');
        setMobileStep(10);
        addLog(`REGISTER: ${newId} (${userData.name}) đã hoàn tất đăng ký eKYC.`);
    };

    const handleStartCheckIn = () => {
        if (currentUser?.checkInStatus) {
            alert("Bạn đã đăng nhập rồi!");
            return;
        }
        // DEMO OVERRIDE: Allow check-in even if gate is closed
        // if (!isGateOpen) {
        //     alert("Cổng đăng nhập hiện đang đóng.");
        //     return;
        // }
        // Proceed to final checkin
        handleFinalCheckin();
    };

    const handleFinalCheckin = () => {
        setIsSimulating(true);
        setTimeout(() => {
            if (currentUser) {
                // 1. Update Global State
                const updated = participants.map(p =>
                    p.id === currentUser.id ? { ...p, checkInStatus: true, checkInTime: new Date().toLocaleTimeString() } : p
                );
                updateParticipants(updated);

                // 2. Persist Session
                safeSave('vgc_session_id', currentUser.id);
                safeSave('vgc_project_id', currentProjectId);
            }
            setIsSimulating(false);
            setMobileStep(6);
            addLog(`ĐĂNG NHẬP USER: ${currentUser?.id} hoàn tất.`);
        }, 1000);
    };

    const handleUserLogout = () => {
        localStorage.removeItem('vgc_session_id');
        localStorage.removeItem('vgc_project_id');
        setMobileStep(1);
        setInputId("");
        setInputPhone("");
        setOtpValue("");
        setCurrentUser(null);
        setLoginStep('credentials');
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // --- PROFILE FILTERING HELPER ---
    const getProfileData = () => {
        let data = participants.filter(p => {
            const s = profileSearch.toLowerCase();
            const matchSearch = (p.name?.toLowerCase() || '').includes(s) ||
                (p.id?.toLowerCase() || '').includes(s) ||
                (p.cccd || '').includes(s) ||
                (p.phone || '').includes(s);

            const matchRight = profileFilterRight === 'ALL' ||
                (profileFilterRight === 'BUY' && p.right === 'mua') ||
                (profileFilterRight === 'RENT' && p.right === 'thue') ||
                (profileFilterRight === 'RENT_BUY' && p.right === 'thue_mua');

            const matchType = profileFilterType === 'ALL' ||
                (profileFilterType === 'UT1' && p.type === 'ut1') ||
                (profileFilterType === 'UT2' && p.type === 'ut2') ||
                (profileFilterType === 'UT3' && p.type === 'ut3') ||
                (profileFilterType === 'UT4' && p.type === 'ut4') ||
                (profileFilterType === 'UT5' && p.type === 'ut5') ||
                (profileFilterType === 'THUONG' && p.type === 'thuong') ||
                // Backward compat
                (profileFilterType === 'PRIORITY' && ['ut1', 'ut2', 'ut3', 'ut4', 'ut5'].includes(p.type)) ||
                (profileFilterType === 'REGULAR' && p.type === 'thuong');

            const matchStatus = profileFilterStatus === 'ALL' ||
                (profileFilterStatus === 'ACTIVE' && (p.status === 'hoat_dong' || p.status === 'active' as any)) ||
                (profileFilterStatus === 'DISABLED' && (p.status === 'vo_hieu' || p.status === 'disabled' as any));

            const getPGroup = (participant: Participant) => {
                if (participant.right === 'mua') return priorityGroupMappingBuy[participant.type] || 'thong_thuong';
                if (participant.right === 'thue_mua') return priorityGroupMappingRentBuy[participant.type] || 'thong_thuong';
                return priorityGroupMappingRent[participant.type] || 'thong_thuong';
            };
            const matchGroup = profileFilterGroup === 'ALL' || getPGroup(p) === profileFilterGroup;
            const matchEligibility = profileFilterEligibility === 'ALL' || (profileFilterEligibility === 'DU_DK' ? p.profileStatus === 'hoan_thanh' : p.profileStatus !== 'hoan_thanh');

            const matchDrawStatus = profileFilterCompletion === 'ALL' ||
                (profileFilterCompletion === 'COMPLETE' && p.drawStatus === 'trung') ||
                (profileFilterCompletion === 'INCOMPLETE' && (p.drawStatus === 'truot' || p.drawStatus === 'cho'));

            return matchSearch && matchRight && matchType && matchStatus && matchGroup && matchEligibility && matchDrawStatus;
        });

        // Sorting
        data.sort((a, b) => {
            const aVal = a[profileSort.field];
            const bVal = b[profileSort.field];
            if (aVal === bVal) return 0;
            if (aVal === undefined || aVal === null) return 1;
            if (bVal === undefined || bVal === null) return -1;

            if (profileSort.direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        return data;
    };

    const profileData = getProfileData();
    const totalProfilePages = Math.ceil(profileData.length / ITEMS_PER_PAGE);
    const paginatedProfiles = profileData.slice((profilePage - 1) * ITEMS_PER_PAGE, profilePage * ITEMS_PER_PAGE);

    const handleProfileSort = (field: keyof Participant) => {
        setProfileSort(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleSelectProfile = (id: string) => {
        const newSet = new Set(selectedProfileIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedProfileIds(newSet);
    };

    const handleSelectAllProfiles = () => {
        if (selectedProfileIds.size === paginatedProfiles.length) {
            setSelectedProfileIds(new Set());
        } else {
            const newSet = new Set(paginatedProfiles.map(p => p.id));
            setSelectedProfileIds(newSet);
        }
    };

    const handleSaveProfile = (updatedProfile: Participant) => {
        // Add history entry
        const historyEntry: ParticipantHistory = {
            field: 'update_info',
            timestamp: new Date().toISOString(),
            actor: currentView === 'admin' ? 'Hệ thống (Admin)' : 'Cán bộ vận hành',
            note: editProfileReason || 'Cập nhật thông tin hồ sơ',
            details: 'Thay đổi thông tin cơ bản'
        };

        const updatedParticipants = participants.map(p => {
            if (p.id === updatedProfile.id) {
                return {
                    ...updatedProfile,
                    history: [historyEntry, ...(p.history || [])]
                };
            }
            return p;
        });

        updateParticipants(updatedParticipants);
        setEditingProfile(null);
        setEditProfileReason("");
        addLog(`Cập nhật hồ sơ ${updatedProfile.id}: ${updatedProfile.name}`);
    };

    const handleDisableProfiles = () => {
        const updated = participants.map(p => {
            if (selectedProfileIds.has(p.id)) {
                return { ...p, status: 'vo_hieu' as const };
            }
            return p;
        });
        updateParticipants(updated);
        setSelectedProfileIds(new Set());
        addLog(`ADMIN: Đã vô hiệu hóa ${selectedProfileIds.size} hồ sơ.`);
    };

    const handleBulkUploadConfirm = (results: { success: number; skipped: number; errors: number; updatedParticipants: Participant[] }) => {
        // Update participants with new data
        const updatedMap = new Map(results.updatedParticipants.map(p => [p.id, p]));

        const newParticipants = participants.map(p => updatedMap.get(p.id) || p);

        // Update project state
        const updatedProjects = {
            ...projects,
            [currentProjectId]: {
                ...activeProject,
                participants: newParticipants
            }
        };

        setProjects(updatedProjects);
        safeSave('projects', JSON.stringify(updatedProjects));

        addLog(`BULK UPLOAD: Thành công ${results.success}, Bỏ qua ${results.skipped}, Lỗi ${results.errors}`);
    };

    const handleOpenProfileDetails = (participant: Participant) => {
        setActiveProfileForDetails(participant);
    };

    const handleEnableProfiles = () => {
        const updated = participants.map(p => {
            if (selectedProfileIds.has(p.id)) {
                return { ...p, status: 'hoat_dong' as const };
            }
            return p;
        });
        updateParticipants(updated);
        setSelectedProfileIds(new Set());
        addLog(`ADMIN: Đã kích hoạt lại ${selectedProfileIds.size} hồ sơ.`);
    };

    const handleImportExcel = () => {
        setIsImportModalOpen(true);
    };

    const handleImportConfirm = (newParticipants: Participant[]) => {
        const updated = [...participants, ...newParticipants];
        updateParticipants(updated);
        addLog(`IMPORT: Đã thêm ${newParticipants.length} hồ sơ mới từ Excel.`);

        // Highlight new rows
        const newIds = new Set(newParticipants.map(p => p.id));
        setNewlyImportedIds(newIds);

        // Auto-switch to show new profiles if needed, or just refresh list
        setProfileFilterRight('ALL');
        setProfileFilterStatus('ALL');
        setProfileSearch("");
        // Go to last page to see new entries
        const newTotalPages = Math.ceil(updated.length / ITEMS_PER_PAGE);
        setProfilePage(newTotalPages);

        // Clear highlight after 5 seconds
        setTimeout(() => {
            setNewlyImportedIds(new Set());
        }, 5000);
    };

    const handleImportApartment = () => {
        setIsImportApartmentModalOpen(true);
    };

    const handleImportApartmentConfirm = (newApartments: Apartment[]) => {
        setApartments(prev => [...prev, ...newApartments]);
        addLog(`IMPORT: Đã thêm ${newApartments.length} căn hộ vào quỹ căn.`);
        setApartmentSearch("");
        const newTotalPages = Math.ceil((apartments.length + newApartments.length) / ITEMS_PER_PAGE);
        setApartmentPage(newTotalPages);
    };

    const handleResetApartments = () => {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu Quỹ Căn Hộ? Hành động này không thể hoàn tác.')) {
            setApartments([]);
            addLog('Xóa toàn bộ dữ liệu Quỹ Căn Hộ');
        }
    };

    const handleSaveApartment = () => {
        if (!editingApartment || !editApartmentReason.trim()) {
            alert("Vui lòng nhập lý do sửa đổi");
            return;
        }

        if (isApartmentsSealed && currentView !== 'admin') {
            alert("Dữ liệu đã được niêm phong. Chỉ quản trị viên mới có quyền chỉnh sửa.");
            return;
        }

        setApartments(prev => prev.map(apt => {
            if (apt.id === editingApartment.id) {
                const historyEntries: ApartmentHistory[] = [];
                const timestamp = new Date().toISOString();

                if (apt.status !== editingApartment.status) {
                    historyEntries.push({
                        field: 'status',
                        timestamp,
                        actor: 'Admin',
                        note: editApartmentReason,
                        oldValue: apt.status === 'occupied' ? 'Có Chủ' : 'Chưa Chủ',
                        newValue: editingApartment.status === 'occupied' ? 'Có Chủ' : 'Chưa Chủ'
                    });
                }

                if (apt.block !== editingApartment.block) {
                    historyEntries.push({
                        field: 'block',
                        timestamp,
                        actor: 'Admin',
                        note: editApartmentReason,
                        oldValue: apt.block,
                        newValue: editingApartment.block
                    });
                }

                if (apt.floor !== editingApartment.floor) {
                    historyEntries.push({
                        field: 'floor',
                        timestamp,
                        actor: 'Admin',
                        note: editApartmentReason,
                        oldValue: apt.floor,
                        newValue: editingApartment.floor
                    });
                }

                if (apt.unit !== editingApartment.unit) {
                    historyEntries.push({
                        field: 'unit',
                        timestamp,
                        actor: 'Admin',
                        note: editApartmentReason,
                        oldValue: apt.unit,
                        newValue: editingApartment.unit
                    });
                }

                if (apt.right !== editingApartment.right) {
                    historyEntries.push({
                        field: 'right',
                        timestamp,
                        actor: 'Admin',
                        note: editApartmentReason,
                        oldValue: apt.right === 'buy' ? 'Mua' : apt.right === 'rent' ? 'Thuê' : 'Thuê-Mua',
                        newValue: editingApartment.right === 'buy' ? 'Mua' : editingApartment.right === 'rent' ? 'Thuê' : 'Thuê-Mua'
                    });
                }

                return {
                    ...editingApartment,
                    history: [...historyEntries, ...(apt.history || [])]
                };
            }
            return apt;
        }));

        addLog(`Cập nhật căn hộ ${editingApartment.id}. Lý do: ${editApartmentReason}`);
        setEditingApartment(null);
        setEditApartmentReason("");
    };

    const getApartmentData = () => {
        let data = apartments.filter(a => {
            const s = apartmentSearch.toLowerCase();
            // Allow search "010203" to match "C010203"
            const idMatch = a.id.toLowerCase().includes(s) || a.id.toLowerCase().includes('c' + s);
            const locationMatch = a.block.includes(s) || a.floor.includes(s) || a.unit.includes(s);

            const rightMatch = apartmentFilterRight === 'ALL' || a.right.toUpperCase() === apartmentFilterRight;
            const statusMatch = apartmentFilterStatus === 'ALL' || a.status.toUpperCase() === apartmentFilterStatus;

            const type = a.type === 'uu_tien' ? 'UT' : 'TT';
            const typeMatch = apartmentFilterType === 'ALL' || type === apartmentFilterType;

            return (idMatch || locationMatch) && rightMatch && statusMatch && typeMatch;
        });

        data.sort((a, b) => {
            // Default sort: Block -> Floor -> Unit
            if (apartmentSort.field === 'block') { // Special case for default sort logic
                if (a.block !== b.block) return a.block.localeCompare(b.block);
                if (a.floor !== b.floor) return a.floor.localeCompare(b.floor);
                return a.unit.localeCompare(b.unit);
            }

            const aVal = a[apartmentSort.field];
            const bVal = b[apartmentSort.field];

            if (aVal === bVal) return 0;
            if (aVal === undefined) return 1;
            if (bVal === undefined) return -1;

            if (apartmentSort.direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        return data;
    };

    const apartmentData = getApartmentData();
    const paginatedApartments = apartmentData.slice((apartmentPage - 1) * ITEMS_PER_PAGE, apartmentPage * ITEMS_PER_PAGE);

    const handleApartmentSort = (field: keyof Apartment) => {
        setApartmentSort(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // --- FILTERING HELPER ---
    const getReportData = () => {
        let data: any[] = [];
        const rounds = activeProject.rounds || [];

        if (rounds.length === 0) return [];

        rounds.forEach((round: Round) => {
            // Filter by Round ID if selected
            if (reportFilterRound !== 'ALL' && round.id.toString() !== reportFilterRound) return;

            // Filter by Date if selected
            if (reportFilterDate && round.date !== reportFilterDate) return;

            (round.participantIds || []).forEach(pId => {
                const p = participants.find(user => user.id === pId);
                if (p) {
                    // Check search
                    const s = reportSearch.toLowerCase();
                    const matchSearch = (p.name?.toLowerCase() || '').includes(s) ||
                        (p.id?.toLowerCase() || '').includes(s) ||
                        (p.cccd || '').includes(s) ||
                        (p.phone || '').includes(s);

                    // Xác định kết quả cho vòng này
                    let result = 'cho';
                    if (round.status === 'hoan_thanh') {
                        if ((round.winners || []).includes(p.id)) result = 'trung';
                        else result = 'truot';
                    }

                    const matchResult = reportFilterResult === 'ALL' ||
                        (reportFilterResult === 'WON' && result === 'trung') ||
                        (reportFilterResult === 'LOST' && result === 'truot');

                    if (matchSearch && matchResult) {
                        data.push({
                            ...p,
                            roundLabel: round.label,
                            roundDate: round.date,
                            roundResult: result,
                            displayUnit: result === 'won' ? p.assignedUnit : null
                        });
                    }
                }
            });
        });

        return data;
    };

    // --- ROLE-BASED ACCESS CONTROL ---
    useEffect(() => {
        if (isAdminLoggedIn) {
            if (adminUsername === 'tiepnhan') setActiveTab('reception');
            else if (adminUsername === 'kiemsoat') setActiveTab('control');
            else if (adminUsername === 'kho') setActiveTab('storage');
            else if (adminUsername === 'admin' || adminUsername === 'superadmin') {
                if (!['data', 'profiles', 'inventory', 'round-setup', 'reports', 'system-accounts', 'reception', 'control', 'storage', 'event-monitor', 'monitor-sms'].includes(activeTab)) {
                    setActiveTab('data');
                }
            }
        }
    }, [isAdminLoggedIn, adminUsername]);

    const reportData = getReportData();
    const reportStats = {
        total: reportData.length,
        checkedIn: reportData.filter(p => p.checkInStatus).length,
        won: reportData.filter(p => p.roundResult === 'won').length,
        lost: reportData.filter(p => p.roundResult === 'lost').length,
    };

    const monitorData = participants.filter(p => {
        const s = monitorSearch.toLowerCase();
        const matchSearch = (p.name || '').toLowerCase().includes(s) ||
            (p.id || '').toLowerCase().includes(s) ||
            (p.cccd || '').includes(s) ||
            (p.phone || '').includes(s);
        let matchStatus = true;
        if (monitorFilterStatus === 'checked-in') matchStatus = p.checkInStatus;
        if (monitorFilterStatus === 'pending') matchStatus = !p.checkInStatus;
        return matchSearch && matchStatus;
    });

    const globalInventory = getGlobalInventory();

    const sidebarGroups = [
        {
            title: "VẬN HÀNH",
            roles: ['admin', 'superadmin'],
            items: [
                { id: 'data', icon: <ShieldCheck size={20} />, label: "Tổng Quan Dự Án" },
                { id: 'event-monitor', icon: <Activity size={20} />, label: "Theo dõi Sự Kiện" },
                ...(adminUsername === 'superadmin' ? [{ id: 'monitor-sms', icon: <MessageSquare size={20} />, label: "Theo dõi SMS" }] : []),
            ]
        },
        {
            title: "QUẢN LÝ HỒ SƠ (PHASE 2)",
            roles: ['admin', 'superadmin', 'tiepnhan', 'kiemsoat', 'kho'],
            items: [
                ...(adminUsername === 'superadmin' || adminUsername === 'admin' || adminUsername === 'tiepnhan' ? [{ id: 'reception', icon: <FileText size={20} />, label: "Tiếp Nhận Hồ Sơ" }] : []),
                ...(adminUsername === 'superadmin' || adminUsername === 'admin' || adminUsername === 'kiemsoat' ? [{ id: 'control', icon: <CheckCircle2 size={20} />, label: "Kiểm Soát Hồ Sơ" }] : []),
                ...(adminUsername === 'superadmin' || adminUsername === 'admin' || adminUsername === 'kho' ? [{ id: 'storage', icon: <Layers size={20} />, label: "Kho Lưu Trữ" }] : []),
            ]
        },
        {
            title: "THIẾT LẬP",
            roles: ['admin', 'superadmin'],
            items: [
                { id: 'inventory', icon: <Building size={20} />, label: "Quỹ Căn Hộ" },
                { id: 'profiles', icon: <FileBadge size={20} />, label: "Quỹ Hồ Sơ" },
                { id: 'round-setup', icon: <Disc size={20} />, label: "Thiết lập Vòng Bốc Thăm" },
            ]
        },
        {
            title: "KẾT QUẢ & ĐỐI SOÁT",
            roles: ['admin', 'superadmin'],
            items: [
                { id: 'reports', icon: <FileText size={20} />, label: "Báo Cáo & Tra Cứu" },
            ]
        },
        {
            title: "HỆ THỐNG",
            roles: ['superadmin'],
            items: [
                { id: 'system-accounts', icon: <Fingerprint size={20} />, label: "Tài Khoản Hệ Thống" },
            ]
        }
    ].filter(group => group.roles.includes(adminUsername as any) || adminUsername === 'superadmin' || adminUsername === 'admin');

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">

            <div className="fixed bottom-6 right-6 z-[100]">
                <button
                    onClick={() => setCurrentView(currentView === 'admin' ? 'user' : 'admin')}
                    className="bg-[#00468E] text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold hover:scale-105 active:scale-95 transition-all border-4 border-white"
                >
                    {currentView === 'admin' ? <Smartphone size={20} /> : <LayoutDashboard size={20} />}
                    Chuyển sang {currentView === 'admin' ? 'Người dùng' : 'Quản trị'}
                </button>
            </div>

            {currentView === 'admin' ? (
                !isAdminLoggedIn ? (
                    <LoginScreen onLogin={(username) => {
                        setIsAdminLoggedIn(true);
                        setAdminUsername(username);
                    }} />
                ) : (
                    <div className="flex flex-1 h-screen overflow-hidden">
                        {/* Sidebar */}
                        <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-[#00468E] text-white flex flex-col transition-all duration-300 ease-in-out shrink-0 border-r border-blue-900 shadow-2xl relative`}>
                            {/* Collapse Button */}
                            <button
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                className="absolute -right-3 top-8 bg-white text-[#00468E] p-1 rounded-full shadow-md border border-slate-100 hover:bg-slate-50 z-50 hover:scale-110 transition-transform"
                            >
                                {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                            </button>

                            <div className={`p-6 mb-2 ${isSidebarCollapsed ? 'items-center px-2' : ''} flex flex-col transition-all`}>
                                <div className={`flex items-center gap-3 mb-2 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                                    {!isSidebarCollapsed && <h1 className="font-bold text-lg tracking-tighter animate-fade-in whitespace-nowrap">VIGLACERA - HANDICO</h1>}
                                </div>
                                {!isSidebarCollapsed && <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest opacity-60 animate-fade-in whitespace-nowrap">Smart Draw V1.0</p>}
                            </div>

                            <nav className="flex-1 overflow-y-auto px-3 space-y-6 custom-scrollbar">
                                {sidebarGroups.map((group, groupIndex) => (
                                    <div key={groupIndex} className="space-y-2">
                                        {!isSidebarCollapsed && (
                                            <div className="px-3 pb-1 border-b border-white/10 mb-2">
                                                <p className="text-[10px] font-black text-blue-300/70 uppercase tracking-wider whitespace-nowrap">{group.title}</p>
                                            </div>
                                        )}
                                        {isSidebarCollapsed && groupIndex > 0 && <div className="border-t border-white/10 my-2 mx-2" />}

                                        <div className="space-y-1">
                                            {group.items.map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setActiveTab(item.id as any)}
                                                    title={isSidebarCollapsed ? item.label : ''}
                                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium text-sm group relative
                            ${activeTab === item.id
                                                            ? 'bg-white text-[#00468E] shadow-lg shadow-blue-900/20'
                                                            : 'text-white/70 hover:text-white hover:bg-white/10'
                                                        }
                            ${isSidebarCollapsed ? 'justify-center' : ''}
                          `}
                                                >
                                                    <span className={`${activeTab === item.id ? 'text-[#00468E]' : ''} shrink-0`}>{item.icon}</span>
                                                    {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </nav>
                        </aside>

                        {/* Main Content */}
                        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                            {/* HEADER */}
                            <header className="h-20 bg-white border-b border-slate-200 px-10 flex items-center justify-end shrink-0 shadow-sm z-30">
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-700">Quản trị viên</p>
                                    </div>
                                    <div className="w-10 h-10 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-400">
                                        <User size={20} />
                                    </div>
                                    <button
                                        onClick={() => setIsAdminLoggedIn(false)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Đăng xuất"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            </header>

                            <div className="flex-1 overflow-y-auto p-10">


                                {activeTab === 'system-accounts' && (
                                    <SystemAccounts
                                        accounts={systemAccounts}
                                        onAddAccount={handleAddAccount}
                                        onUpdateAccount={handleUpdateAccount}
                                        onDeleteAccount={handleDeleteAccount}
                                    />
                                )}

                                {activeTab === 'monitor-sms' && adminUsername === 'superadmin' && (
                                    <MonitorSMS participants={participants} />
                                )}
                                
                                {activeTab === 'data' && (
                                    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">

                                        {/* --- DASHBOARD STATS --- */}
                                        <div className="grid grid-cols-4 gap-6">
                                            {/* Total Inventory */}
                                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2.5 bg-blue-50 text-[#00468E] rounded-xl">
                                                        <Building size={20} />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tổng Quỹ Căn</span>
                                                </div>
                                                <p className="text-4xl font-black text-slate-800">{apartments.length}</p>
                                                <div className="text-[10px] font-bold text-slate-400 mt-auto pt-2 border-t border-slate-50">
                                                    DỰ ÁN {activeProject.prefix}
                                                </div>
                                            </div>

                                            {/* Units Won */}
                                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                                                        <CheckCircle2 size={20} />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Đã Trúng</span>
                                                </div>
                                                <p className="text-4xl font-black text-green-600">
                                                    {apartments.filter(a => a.status === 'occupied').length}
                                                </p>
                                                <div className="text-[10px] font-bold text-slate-400 mt-auto pt-2 border-t border-slate-50">
                                                    {((apartments.filter(a => a.status === 'occupied').length / (apartments.length || 1)) * 100).toFixed(1)}% Đã phân phối
                                                </div>
                                            </div>

                                            {/* Units Remaining */}
                                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                                                        <Layers size={20} />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Còn Lại</span>
                                                </div>
                                                <p className="text-4xl font-black text-orange-600">
                                                    {apartments.length - apartments.filter(a => a.status === 'occupied').length}
                                                </p>
                                                <div className="text-[10px] font-bold text-slate-400 mt-auto pt-2 border-t border-slate-50">
                                                    Căn hộ khả dụng
                                                </div>
                                            </div>

                                            {/* Rounds Completed */}
                                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                                                        <RefreshCcw size={20} />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Vòng Đã Quay</span>
                                                </div>
                                                <p className="text-4xl font-black text-purple-600">
                                                    {(activeProject.rounds || []).filter((r: Round) => r.status === 'hoan_thanh').length} / {(activeProject.rounds || []).length}
                                                </p>
                                                <div className="text-[10px] font-bold text-slate-400 mt-auto pt-2 border-t border-slate-50">
                                                    Tiến độ tổ chức
                                                </div>
                                            </div>
                                        </div>

                                        {/* --- ROUNDS DATA TABLE --- */}
                                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                                            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-blue-50 text-[#00468E] rounded-xl">
                                                        <List size={22} />
                                                    </div>
                                                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Danh sách vòng bốc thăm</h2>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                                        <tr>
                                                            <th className="px-8 py-4">Vòng</th>
                                                            <th className="px-8 py-4">Tên vòng bốc thăm</th>
                                                            <th className="px-8 py-4">Thời gian quay</th>
                                                            <th className="px-8 py-4">Trạng thái</th>
                                                            <th className="px-8 py-4 text-right">Số căn trúng</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
                                                        {(activeProject.rounds || []).length === 0 ? (
                                                            <tr>
                                                                <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                                                                    Chưa có dữ liệu vòng bốc thăm. Vui lòng thiết lập ở màn "Tổ Chức Bốc Thăm".
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            (activeProject.rounds || []).map((round: Round, idx: number) => (
                                                                <tr key={round.id} className="hover:bg-slate-50/50 transition-colors">
                                                                    <td className="px-8 py-5 font-black text-slate-400">Vòng {idx + 1}</td>
                                                                    <td className="px-8 py-5 font-bold text-[#00468E]">{round.label}</td>
                                                                    <td className="px-8 py-5 font-mono text-xs">
                                                                        {round.startTime} - {round.endTime}
                                                                    </td>
                                                                    <td className="px-8 py-5">
                                                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${round.status === 'hoan_thanh' ? 'bg-green-100 text-green-700' :
                                                                            round.status === 'dang_dien_ra' ? 'bg-blue-100 text-blue-700' :
                                                                                'bg-slate-100 text-slate-500'
                                                                            }`}>
                                                                            {round.status === 'hoan_thanh' ? 'Đã hoàn thành' :
                                                                                round.status === 'dang_dien_ra' ? 'Đang bốc thăm' : 'Chờ'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-8 py-5 text-right font-black text-slate-800">
                                                                        {round.winners ? round.winners.length : 0}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'profiles' && (
                                    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in flex flex-col h-full">

                                        {/* BẢNG THỐNG KÊ QUỸ HỒ SƠ */}
                                        {/* THÔNG SỐ TỔNG QUAN */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            {/* Tổng số */}
                                            <div className="bg-[#00468E] rounded-3xl p-6 text-white shadow-lg shadow-blue-900/20 flex flex-col justify-between">
                                                <div className="flex justify-between items-start">
                                                    <div className="p-2 bg-white/20 rounded-xl">
                                                        <Users size={20} />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Toàn hệ thống</span>
                                                </div>
                                                <div className="mt-4">
                                                    <div className="text-4xl font-black">{profileStats.total.toLocaleString()}</div>
                                                    <div className="text-xs font-bold uppercase mt-1 opacity-80">Tổng hồ sơ</div>
                                                </div>
                                            </div>

                                            {/* Phân loại gốc */}
                                            <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                                        <Activity size={16} />
                                                    </div>
                                                    <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Phân loại đối tượng</h3>
                                                </div>
                                                <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                                                    {[
                                                        { label: 'UT1', value: profileStats.ut1, color: 'text-blue-600' },
                                                        { label: 'UT2', value: profileStats.ut2, color: 'text-blue-600' },
                                                        { label: 'UT3', value: profileStats.ut3, color: 'text-blue-600' },
                                                        { label: 'UT4', value: profileStats.ut4, color: 'text-blue-600' },
                                                        { label: 'UT5', value: profileStats.ut5, color: 'text-orange-600' },
                                                        { label: 'THƯỜNG', value: profileStats.tt, color: 'text-slate-600' },
                                                    ].map((item) => (
                                                        <div key={item.label} className="flex flex-col">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase">{item.label}</span>
                                                            <span className={`text-xl font-black ${item.color}`}>{item.value.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Nhóm xử lý */}
                                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                                        <Layers size={16} />
                                                    </div>
                                                    <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Nhóm xử lý hiện tại</h3>
                                                </div>
                                                <div className="space-y-3">
                                                    {[
                                                        { label: 'Ưu Tiên 1', value: profileStats.groupCounts.uu_tien_trung, color: 'bg-emerald-500' },
                                                        { label: 'Ưu Tiên 2', value: profileStats.groupCounts.uu_tien_trung_truot, color: 'bg-orange-500' },
                                                        { label: 'Thông thường', value: profileStats.groupCounts.thong_thuong, color: 'bg-slate-400' },
                                                    ].map((item) => (
                                                        <div key={item.label}>
                                                            <div className="flex justify-between items-end mb-1">
                                                                <span className="text-[10px] font-black text-slate-500 uppercase">{item.label}</span>
                                                                <span className="text-sm font-black text-slate-800">{item.value.toLocaleString()}</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full ${item.color}`}
                                                                    style={{ width: `${(item.value / profileStats.total) * 100}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* KHU VỰC 2: KHỐI CẤU HÌNH GOM NHÓM CATEGORIZED BY RIGHTS */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {[
                                                { label: 'QUYỀN MUA', mapping: priorityGroupMappingBuy, temp: tempMappingBuy, setTemp: setTempMappingBuy, setMapping: setPriorityGroupMappingBuy, color: 'text-blue-600', bg: 'bg-blue-50/30' },
                                                { label: 'QUYỀN THUÊ - MUA', mapping: priorityGroupMappingRentBuy, temp: tempMappingRentBuy, setTemp: setTempMappingRentBuy, setMapping: setPriorityGroupMappingRentBuy, color: 'text-indigo-600', bg: 'bg-indigo-50/30' },
                                                { label: 'QUYỀN THUÊ', mapping: priorityGroupMappingRent, temp: tempMappingRent, setTemp: setTempMappingRent, setMapping: setPriorityGroupMappingRent, color: 'text-emerald-600', bg: 'bg-emerald-50/30' }
                                            ].map((config, idx) => {
                                                const hasChanged = JSON.stringify(config.temp) !== JSON.stringify(config.mapping);
                                                return (
                                                    <div key={idx} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                                        <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center ${config.bg}`}>
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-lg bg-white shadow-sm font-black border border-slate-100 ${config.color} text-[10px] uppercase tracking-wider`}>
                                                                    {config.label}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {hasChanged && (
                                                                    <button
                                                                        onClick={() => {
                                                                            config.setTemp(config.mapping);
                                                                            setIsMappingChanged(false);
                                                                        }}
                                                                        className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                                                                        title="Hoàn tác"
                                                                    >
                                                                        <RefreshCcw size={14} />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => {
                                                                        config.setMapping(config.temp);
                                                                        setIsMappingChanged(false);
                                                                        addLog(`Cập nhật cấu hình nhóm xử lý ưu tiên cho ${config.label}.`);
                                                                    }}
                                                                    disabled={!hasChanged}
                                                                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${hasChanged ? 'bg-[#00468E] text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                                                >
                                                                    Lưu
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="p-0 flex-1">
                                                            <table className="w-full text-left">
                                                                <thead className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 border-b border-slate-100">
                                                                    <tr>
                                                                        <th className="px-4 py-3">Loại</th>
                                                                        <th className="px-4 py-3">Nhóm xử lý</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-50">
                                                                    {Object.entries(config.temp).map(([key, group]) => {
                                                                        const label = key === 'thuong' ? 'Thông Thường' : `UT ${key.replace('ut', '')}`;
                                                                        const rowChanged = config.temp[key] !== config.mapping[key];

                                                                        return (
                                                                            <tr key={key} className={`transition-colors ${rowChanged ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                                                                                <td className="px-4 py-2.5 font-black text-slate-700 text-[11px] whitespace-nowrap">{label}</td>
                                                                                <td className="px-4 py-2.5">
                                                                                    <div className="relative group">
                                                                                        <select
                                                                                            className={`w-full bg-white border rounded-lg px-3 py-1.5 text-[10px] font-black uppercase outline-none transition-all cursor-pointer appearance-none pr-8 ${group === 'uu_tien_trung' ? 'border-emerald-200 text-emerald-700' : group === 'uu_tien_trung_truot' ? 'border-orange-200 text-orange-700' : 'border-slate-200 text-slate-500'}`}
                                                                                            value={group}
                                                                                            onChange={(e) => {
                                                                                                config.setTemp({ ...config.temp, [key]: e.target.value as any });
                                                                                                setIsMappingChanged(true);
                                                                                            }}
                                                                                        >
                                                                                            <option value="uu_tien_trung">Ưu Tiên 1</option>
                                                                                            <option value="uu_tien_trung_truot">Ưu Tiên 2</option>
                                                                                            <option value="thong_thuong">Thông Thường</option>
                                                                                        </select>
                                                                                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* --- FILTERS & ACTIONS --- */}
                                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-6">
                                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                                <div className="relative w-full max-w-md">
                                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-[#00468E] transition-all text-sm font-bold text-slate-700 placeholder:text-slate-400"
                                                        placeholder="Tìm theo Họ tên / CCCD / SĐT / ID..."
                                                        value={profileSearch}
                                                        onChange={(e) => setProfileSearch(e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-slate-50 flex items-center gap-2">
                                                        <FileSpreadsheet size={16} /> Mẫu Excel
                                                    </button>
                                                    <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-slate-50 flex items-center gap-2">
                                                        <Download size={16} /> Xuất Excel
                                                    </button>
                                                    <button
                                                        onClick={handleImportExcel}
                                                        className="px-4 py-2.5 bg-[#00468E] text-white rounded-xl text-xs font-black uppercase hover:bg-[#003366] shadow-lg shadow-blue-900/20 flex items-center gap-2"
                                                    >
                                                        <FileSpreadsheet size={16} /> Import Excel
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-50">
                                                <div className="flex flex-wrap gap-2">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                                                        <Filter size={14} className="text-slate-400" />
                                                        <select
                                                            value={profileFilterRight}
                                                            onChange={(e) => setProfileFilterRight(e.target.value as any)}
                                                            className="text-[10px] font-black uppercase text-slate-600 outline-none bg-transparent"
                                                        >
                                                            <option value="ALL">Tất cả quyền</option>
                                                            <option value="BUY">Mua</option>
                                                            <option value="RENT">Thuê</option>
                                                            <option value="RENT_BUY">Thuê - Mua</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                                                        <Filter size={14} className="text-slate-400" />
                                                        <select
                                                            value={profileFilterType}
                                                            onChange={(e) => setProfileFilterType(e.target.value as any)}
                                                            className="text-[10px] font-black uppercase text-slate-600 outline-none bg-transparent"
                                                        >
                                                            <option value="ALL">Tất cả loại ưu tiên</option>
                                                            <option value="UT1">Ưu Tiên 1</option>
                                                            <option value="UT2">Ưu Tiên 2</option>
                                                            <option value="UT3">Ưu Tiên 3</option>
                                                            <option value="UT4">Ưu Tiên 4</option>
                                                            <option value="UT5">Ưu Tiên 5</option>
                                                            <option value="THUONG">Thông Thường</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                                                        <Layers size={14} className="text-slate-400" />
                                                        <select
                                                            value={profileFilterGroup}
                                                            onChange={(e) => setProfileFilterGroup(e.target.value as any)}
                                                            className="text-[10px] font-black uppercase text-slate-600 outline-none bg-transparent"
                                                        >
                                                            <option value="ALL">Tất cả nhóm xử lý</option>
                                                            <option value="uu_tien_trung">Nhóm Ưu Tiên 1</option>
                                                            <option value="uu_tien_trung_truot">Nhóm Ưu Tiên 2</option>
                                                            <option value="thong_thuong">Nhóm Thông Thường</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                                                        <CheckCircle2 size={14} className="text-slate-400" />
                                                        <select
                                                            value={profileFilterEligibility}
                                                            onChange={(e) => setProfileFilterEligibility(e.target.value as any)}
                                                            className="text-[10px] font-black uppercase text-slate-600 outline-none bg-transparent"
                                                        >
                                                            <option value="ALL">Điều kiện: Tất cả</option>
                                                            <option value="DU_DK">Đủ điều kiện</option>
                                                            <option value="THIEU_TT">Thiếu thông tin</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const updated = participants.map(p => ({ ...p, checkInStatus: true }));
                                                            updateParticipants(updated);
                                                            addLog("DEMO: Đã thực hiện đăng nhập cho toàn bộ danh sách.");
                                                        }}
                                                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-100 flex items-center gap-2 border border-blue-100"
                                                    >
                                                        <CheckCircle2 size={14} /> Đăng nhập Demo
                                                    </button>
                                                    <button
                                                        onClick={() => { if (confirm('Xóa tất cả hồ sơ?')) updateParticipants([]); }}
                                                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase hover:bg-red-100 flex items-center gap-2 border border-red-100"
                                                    >
                                                        <Trash2 size={14} /> Xóa tất cả
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* --- AREA 3: DATA TABLE --- */}
                                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-[600px]">
                                            <div className="overflow-auto flex-1">
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-slate-50/80 backdrop-blur-md text-[10px] font-black uppercase text-slate-400 sticky top-0 z-10 border-b border-slate-200">
                                                        <tr>
                                                            <th className="px-6 py-5 w-12 text-center text-slate-300">#</th>
                                                            <th className="px-4 py-5 font-black">Mã HS</th>
                                                            <th className="px-4 py-5 font-black">Tên HS</th>
                                                            <th className="px-4 py-5 font-black">Quyền</th>
                                                            <th className="px-4 py-5 font-black">CCCD</th>
                                                            <th className="px-4 py-5 font-black">SĐT</th>
                                                            <th className="px-4 py-5 font-black">Loại HS (Gốc)</th>
                                                            <th className="px-4 py-5 font-black">Nhóm Xử Lí</th>
                                                            <th className="px-4 py-5 font-black">Trạng thái hồ sơ</th>
                                                            <th className="px-4 py-5 font-black">Trạng Thái Phân Bổ</th>
                                                            <th className="px-6 py-5 text-right font-black">Thao tác</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-600">
                                                        {paginatedProfiles.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={11} className="py-24 text-center">
                                                                    <div className="flex flex-col items-center gap-6 text-slate-200">
                                                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                                                            <FileSpreadsheet size={40} className="text-slate-200" />
                                                                        </div>
                                                                        <p className="text-sm font-black uppercase tracking-tight text-slate-400">Không tìm thấy hồ sơ phù hợp</p>
                                                                        <button
                                                                            onClick={() => {
                                                                                setProfileSearch("");
                                                                                setProfileFilterRight("ALL");
                                                                                setProfileFilterType("ALL");
                                                                                setProfileFilterGroup("ALL");
                                                                                setProfileFilterEligibility("ALL");
                                                                            }}
                                                                            className="px-6 py-2 bg-white border border-slate-200 text-[#00468E] rounded-xl text-xs font-black uppercase hover:bg-slate-50 transition-all shadow-sm"
                                                                        >
                                                                            Xóa bộ lọc
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            paginatedProfiles.map((p, pIdx) => {
                                                                const getPGroup = (participant: Participant) => {
                                                                    if (participant.right === 'mua') return priorityGroupMappingBuy[participant.type] || 'thong_thuong';
                                                                    if (participant.right === 'thue_mua') return priorityGroupMappingRentBuy[participant.type] || 'thong_thuong';
                                                                    return priorityGroupMappingRent[participant.type] || 'thong_thuong';
                                                                };
                                                                const group = getPGroup(p);
                                                                const groupLabel = group === 'uu_tien_trung' ? 'Ưu Tiên 1' : group === 'uu_tien_trung_truot' ? 'Ưu Tiên 2' : 'Thông Thường';
                                                                const groupColor = group === 'uu_tien_trung' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : group === 'uu_tien_trung_truot' ? 'text-orange-600 bg-orange-50 border-orange-100' : 'text-slate-500 bg-slate-50 border-slate-200';

                                                                return (
                                                                    <tr key={p.id} className={`group transition-all hover:bg-slate-50/80 ${selectedProfileIds.has(p.id) ? 'bg-blue-50/50' : ''}`}>
                                                                        <td className="px-6 py-4 text-center text-[10px] font-black text-slate-300">
                                                                            {(profilePage - 1) * ITEMS_PER_PAGE + pIdx + 1}
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                                            <span className="text-xs font-black text-[#00468E] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">{p.id}</span>
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                                            <div className="flex flex-col">
                                                                                <span className="font-black text-slate-800 tracking-tight">{p.name}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                                                            <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">{p.right === 'mua' ? 'Quyền Mua' : p.right === 'thue' ? 'Quyền Thuê' : 'Thuê - Mua'}</span>
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                                            <span className="font-mono text-xs text-slate-600">{maskCCCD(p.cccd)}</span>
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap font-mono text-xs text-slate-600">
                                                                            {p.phone}
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                                                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-black uppercase text-[10px] border border-slate-200">
                                                                                {p.type === 'thuong' ? 'TT' : `UT${String(p.type).replace('ut', '')}`}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                                            <div className={`inline-flex items-center px-2.5 py-1 rounded-xl border text-[10px] font-black uppercase ${groupColor}`}>
                                                                                {groupLabel}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                                            {p.profileStatus === 'hoan_thanh' ? (
                                                                                <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" /> Đã scan
                                                                                </span>
                                                                            ) : (
                                                                                <span className="flex items-center gap-1.5 text-orange-500 font-black text-[10px] uppercase">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-sm" /> Chưa scan
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                                            {p.drawStatus === 'trung' ? (
                                                                                <div className="flex flex-col gap-0.5">
                                                                                    <span className="text-emerald-600 font-black text-[10px] uppercase flex items-center gap-1.5">
                                                                                        <Trophy size={12} className="shrink-0" /> Đã trúng {p.assignedUnit}
                                                                                    </span>
                                                                                    <span className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[120px]">{p.wonRoundLabel}</span>
                                                                                </div>
                                                                            ) : p.drawStatus === 'truot' ? (
                                                                                <span className="text-slate-400 font-black text-[10px] uppercase flex items-center gap-1.5">
                                                                                    <AlertCircle size={12} /> Trượt bốc
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-blue-500 font-black text-[10px] uppercase flex items-center gap-1.5">
                                                                                    <Clock size={12} /> Chờ bốc
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <div className="flex justify-end gap-1">
                                                                                <button
                                                                                    onClick={() => setActiveProfileForDetails(p)}
                                                                                    className="p-1.5 text-slate-400 hover:text-[#00468E] hover:bg-blue-50 rounded-lg transition-all"
                                                                                    title="Chi tiết hồ sơ"
                                                                                >
                                                                                    <Eye size={16} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setViewingHistoryProfile(p)}
                                                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                                                    title="Nhật ký thay đổi"
                                                                                >
                                                                                    <History size={16} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setEditingProfile(p)}
                                                                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                                                                    title="Sửa thông tin"
                                                                                >
                                                                                    <Edit size={16} />
                                                                                </button>
                                                                                <label className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer" title="Upload Scan PDF">
                                                                                    <Upload size={16} />
                                                                                    <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleUploadScan(p.id, e)} />
                                                                                </label>
                                                                                <button
                                                                                    onClick={() => handleDeleteProfile(p.id)}
                                                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                                    title="Xóa hồ sơ"
                                                                                >
                                                                                    <Trash2 size={16} />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* --- PAGINATION & STATUS BAR --- */}
                                            <div className="px-8 py-6 border-t border-slate-100 flex justify-between items-center bg-white sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.01)]">
                                                <div className="flex items-center gap-6">
                                                    <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                                                        Hiển thị <span className="text-slate-800">{paginatedProfiles.length}</span> / <span className="text-[#00468E]">{profileData.length}</span> hồ sơ
                                                    </p>
                                                    {selectedProfileIds.size > 0 && (
                                                        <div className="h-4 w-px bg-slate-200" />
                                                    )}
                                                    {selectedProfileIds.size > 0 && (
                                                        <span className="text-[11px] font-black uppercase text-[#00468E] flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#00468E] animate-pulse" />
                                                            Đã chọn {selectedProfileIds.size} hồ sơ
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => setProfilePage(Math.max(1, profilePage - 1))}
                                                        disabled={profilePage === 1}
                                                        className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        <ChevronLeft size={20} />
                                                    </button>
                                                    <div className="flex gap-1.5">
                                                        {Array.from({ length: Math.min(5, totalProfilePages) }, (_, i) => {
                                                            const pageNum = i + 1;
                                                            return (
                                                                <button
                                                                    key={pageNum}
                                                                    onClick={() => setProfilePage(pageNum)}
                                                                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${profilePage === pageNum ? 'bg-[#00468E] text-white shadow-lg shadow-blue-900/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                                                >
                                                                    {pageNum}
                                                                </button>
                                                            );
                                                        })}
                                                        {totalProfilePages > 5 && <span className="flex items-end px-1 pb-1 text-slate-400 font-bold">...</span>}
                                                    </div>
                                                    <button
                                                        onClick={() => setProfilePage(Math.min(totalProfilePages, profilePage + 1))}
                                                        disabled={profilePage === totalProfilePages || totalProfilePages === 0}
                                                        className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        <ChevronRight size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Profile History Modal Removed */}
                                        {viewingHistoryProfile && (
                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                                                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
                                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                                                        <h3 className="text-lg font-black text-slate-800 uppercase">Lịch sử thay đổi hồ sơ</h3>
                                                        <button onClick={() => setViewingHistoryProfile(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                                            <X size={20} />
                                                        </button>
                                                    </div>

                                                    <div className="p-6 border-b border-slate-100 bg-blue-50/50 shrink-0">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-xs font-bold text-blue-400 uppercase">Mã hồ sơ</span>
                                                            <span className="text-lg font-black text-[#00468E]">{viewingHistoryProfile.id}</span>
                                                        </div>
                                                        <div className="flex gap-4 text-sm text-slate-600">
                                                            <span>Họ tên: <b>{viewingHistoryProfile.name}</b></span>
                                                            <span>CCCD: <b>{viewingHistoryProfile.cccd}</b></span>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 overflow-auto p-0">
                                                        {(!viewingHistoryProfile.history || viewingHistoryProfile.history.length === 0) ? (
                                                            <div className="text-center py-12 text-slate-400 italic flex flex-col items-center gap-3">
                                                                <History size={48} className="opacity-20" />
                                                                Chưa có lịch sử thay đổi nào.
                                                            </div>
                                                        ) : (
                                                            <table className="w-full text-left border-collapse min-w-[800px]">
                                                                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 sticky top-0 z-10">
                                                                    <tr>
                                                                        <th className="px-6 py-4 border-b border-slate-100 whitespace-nowrap">Thời gian</th>
                                                                        <th className="px-6 py-4 border-b border-slate-100 whitespace-nowrap">Thông tin thay đổi</th>
                                                                        <th className="px-6 py-4 border-b border-slate-100 whitespace-nowrap">Lịch sử quay vòng</th>
                                                                        <th className="px-6 py-4 border-b border-slate-100 whitespace-nowrap">Kết quả</th>
                                                                        <th className="px-6 py-4 border-b border-slate-100 whitespace-nowrap">Người thực hiện</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-50 text-sm text-slate-600">
                                                                    {viewingHistoryProfile.history.map((entry, idx) => (
                                                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                                            <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                                                                                {new Date(entry.timestamp).toLocaleString('vi-VN')}
                                                                            </td>
                                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                                {entry.field === 'create' ? (
                                                                                    <span className="text-slate-400 italic">Đã tạo mới</span>
                                                                                ) : (
                                                                                    <div className="flex flex-col gap-1">
                                                                                        <div className="flex items-center gap-2 whitespace-nowrap">
                                                                                            <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs line-through decoration-red-600/50">
                                                                                                {entry.oldValue || '—'}
                                                                                            </span>
                                                                                            <ArrowRightLeft size={12} className="text-slate-300" />
                                                                                            <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs font-bold">
                                                                                                {entry.newValue || '—'}
                                                                                            </span>
                                                                                        </div>
                                                                                        {entry.details && (
                                                                                            <div className="text-xs text-slate-500 mt-1 bg-slate-50 p-1.5 rounded border border-slate-100 whitespace-nowrap">
                                                                                                {entry.details}
                                                                                            </div>
                                                                                        )}
                                                                                        {entry.note && !entry.field.includes('result') && entry.field !== 'create' && (
                                                                                            <div className="text-[10px] text-slate-400 italic mt-0.5">
                                                                                                Lý do: {entry.note}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                                {entry.field.includes('result') || entry.field === 'add_to_round' ? (
                                                                                    <span className="text-xs font-bold text-slate-700">{entry.details || entry.note}</span>
                                                                                ) : (
                                                                                    <span className="text-xs text-slate-400 italic">—</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                                {entry.field === 'result_win' ? (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-black uppercase">
                                                                                        <Trophy size={12} /> Trúng thưởng
                                                                                    </span>
                                                                                ) : entry.field === 'result_loss' ? (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase">
                                                                                        <Frown size={12} /> Trượt
                                                                                    </span>
                                                                                ) : entry.field === 'result_cancel' ? (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-[10px] font-black uppercase">
                                                                                        <CircleX size={12} /> Hủy kết quả
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-xs text-slate-400 italic">—</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-6 py-4 font-medium text-slate-800 whitespace-nowrap">
                                                                                {entry.actor}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {editingProfile && (
                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                                                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                                        <h3 className="text-lg font-black text-slate-800 uppercase">Sửa thông tin hồ sơ</h3>
                                                        <button onClick={() => setEditingProfile(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                                            <X size={20} />
                                                        </button>
                                                    </div>

                                                    <div className="p-6 space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Mã hồ sơ</label>
                                                                <input
                                                                    type="text"
                                                                    value={editingProfile.id}
                                                                    disabled
                                                                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 cursor-not-allowed"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Số CCCD</label>
                                                                <input
                                                                    type="text"
                                                                    value={editingProfile.cccd}
                                                                    onChange={(e) => setEditingProfile({ ...editingProfile, cccd: e.target.value })}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Họ và Tên</label>
                                                                <input
                                                                    type="text"
                                                                    value={editingProfile.name}
                                                                    onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Số điện thoại</label>
                                                                <input
                                                                    type="text"
                                                                    value={editingProfile.phone}
                                                                    onChange={(e) => setEditingProfile({ ...editingProfile, phone: e.target.value })}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Quyền</label>
                                                                <select
                                                                    value={editingProfile.right}
                                                                    onChange={(e) => setEditingProfile({ ...editingProfile, right: e.target.value as any })}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all"
                                                                >
                                                                    <option value="mua">Mua</option>
                                                                    <option value="thue">Thuê</option>
                                                                    <option value="thue_mua">Thuê - Mua</option>
                                                                </select>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Loại Đối Tượng</label>
                                                                <select
                                                                    value={editingProfile.type}
                                                                    onChange={(e) => setEditingProfile({ ...editingProfile, type: e.target.value as any })}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all"
                                                                >
                                                                    <option value="ut1">Ưu Tiên 1</option>
                                                                    <option value="ut2">Ưu Tiên 2</option>
                                                                    <option value="ut3">Ưu Tiên 3</option>
                                                                    <option value="ut4">Ưu Tiên 4</option>
                                                                    <option value="ut5">Ưu Tiên 5</option>
                                                                    <option value="ut6">Ưu Tiên 6</option>
                                                                    <option value="thuong">Thông Thường</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black uppercase text-slate-400 px-1">Lý do thay đổi</label>
                                                            <textarea
                                                                value={editProfileReason}
                                                                onChange={(e) => setEditProfileReason(e.target.value)}
                                                                placeholder="Nhập lý do cập nhật thông tin..."
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all min-h-[100px]"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                                                        <button
                                                            onClick={() => setEditingProfile(null)}
                                                            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-slate-50"
                                                        >
                                                            Hủy
                                                        </button>
                                                        <button
                                                            onClick={() => handleSaveProfile(editingProfile)}
                                                            disabled={!editProfileReason.trim()}
                                                            className="px-6 py-2.5 bg-[#00468E] text-white rounded-xl text-xs font-black uppercase hover:bg-[#003366] shadow-lg shadow-blue-900/20 disabled:opacity-50"
                                                        >
                                                            Lưu thay đổi
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'reception' && (
                                    <AdminReception
                                        participants={participants}
                                        updateParticipants={updateParticipants}
                                        onNavigate={setActiveTab}
                                    />
                                )}

                                {activeTab === 'control' && (
                                    <AdminControl
                                        participants={participants}
                                        updateParticipants={updateParticipants}
                                        onNavigate={setActiveTab}
                                    />
                                )}

                                {activeTab === 'storage' && (
                                    <AdminStorage
                                        participants={participants}
                                        updateParticipants={updateParticipants}
                                        onNavigate={setActiveTab}
                                    />
                                )}

                                {activeTab === 'round-setup' && (
                                    <ThietLapVongQuay
                                        participants={participants}
                                        apartments={apartments}
                                        rounds={activeProject.rounds || []}
                                        onUpdateRounds={handleUpdateRounds}
                                        onUpdateParticipant={handleUpdateParticipant}
                                        onUpdateApartment={handleUpdateApartment}
                                        onLog={addLog}
                                    />
                                )}



                                {activeTab === 'event-monitor' && (
                                    <ManHinhMonitor
                                        participants={participants}
                                        apartments={apartments}
                                        logs={logs}
                                        rounds={activeProject.rounds || []}
                                        onUpdateRounds={handleUpdateRounds}
                                        onUpdateParticipant={handleUpdateParticipant}
                                        onNextRound={handleNextRound}
                                        onSupervisorDraw={handleSupervisorDraw}
                                    />
                                )}

                                {activeTab === 'inventory' && (
                                    <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-fade-in h-full">

                                        <div className="flex flex-col gap-6 h-full overflow-hidden">
                                            {/* HIGH CONTRAST SUMMARY CARDS */}
                                            <div className="grid grid-cols-4 gap-4">
                                                {/* OVERALL */}
                                                <div className="bg-blue-600 p-5 rounded-2xl shadow-md flex flex-col justify-between h-32 transform transition-all hover:scale-105">
                                                    <span className="text-[10px] font-black uppercase opacity-70 text-white">TỔNG QUAN</span>
                                                    <div className="flex justify-between items-end">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-blue-200 font-bold uppercase">Tổng</span>
                                                            <span className="text-2xl font-black tracking-tighter text-white">{globalInventory.total}</span>
                                                        </div>
                                                        <div className="flex flex-col text-right">
                                                            <span className="text-xs text-blue-200 font-bold uppercase">Đã có chủ</span>
                                                            <span className="text-2xl font-black tracking-tighter text-white">{globalInventory.used}</span>
                                                        </div>
                                                        <div className="flex flex-col text-right">
                                                            <span className="text-xs text-blue-200 font-bold uppercase">Còn lại</span>
                                                            <span className="text-2xl font-black tracking-tighter text-white">{globalInventory.remaining}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* MUA */}
                                                <div className="bg-indigo-600 p-5 rounded-2xl shadow-md flex flex-col justify-between h-32 transform transition-all hover:scale-105">
                                                    <span className="text-[10px] font-black uppercase opacity-70 text-white">MUA</span>
                                                    <div className="flex justify-between items-end">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-indigo-200 font-bold uppercase">Tổng</span>
                                                            <span className="text-2xl font-black tracking-tighter text-white">{globalInventory.buy.total}</span>
                                                        </div>
                                                        <div className="flex flex-col text-right">
                                                            <span className="text-xs text-indigo-200 font-bold uppercase">Đã có chủ</span>
                                                            <span className="text-2xl font-black tracking-tighter text-white">{globalInventory.buy.used}</span>
                                                        </div>
                                                        <div className="flex flex-col text-right">
                                                            <span className="text-xs text-indigo-200 font-bold uppercase">Còn lại</span>
                                                            <span className="text-2xl font-black tracking-tighter text-white">{globalInventory.buy.remaining}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* THUÊ - MUA */}
                                                <div className="bg-teal-600 p-5 rounded-2xl shadow-md flex flex-col justify-between h-32 transform transition-all hover:scale-105">
                                                    <span className="text-[10px] font-black uppercase opacity-70 text-white">THUÊ - MUA</span>
                                                    <div className="flex justify-between items-end">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-teal-200 font-bold uppercase">Tổng</span>
                                                            <span className="text-2xl font-black tracking-tighter text-white">{globalInventory.rentBuy.total}</span>
                                                        </div>
                                                        <div className="flex flex-col text-right">
                                                            <span className="text-xs text-teal-200 font-bold uppercase">Đã có chủ</span>
                                                            <span className="text-2xl font-black tracking-tighter text-white">{globalInventory.rentBuy.used}</span>
                                                        </div>
                                                        <div className="flex flex-col text-right">
                                                            <span className="text-xs text-teal-200 font-bold uppercase">Còn lại</span>
                                                            <span className="text-2xl font-black tracking-tighter text-white">{globalInventory.rentBuy.remaining}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* THUÊ */}
                                                <div className="bg-orange-600 p-5 rounded-2xl shadow-md flex flex-col justify-between h-32 transform transition-all hover:scale-105">
                                                    <span className="text-[10px] font-black uppercase opacity-70 text-white">THUÊ</span>
                                                    <div className="flex justify-between items-end">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-orange-200 font-bold uppercase">Tổng</span>
                                                            <span className="text-2xl font-black tracking-tighter text-white">{globalInventory.rent.total}</span>
                                                        </div>
                                                        <div className="flex flex-col text-right">
                                                            <span className="text-xs text-orange-200 font-bold uppercase">Đã có chủ</span>
                                                            <span className="text-2xl font-black tracking-tighter text-white">{globalInventory.rent.used}</span>
                                                        </div>
                                                        <div className="flex flex-col text-right">
                                                            <span className="text-xs text-orange-200 font-bold uppercase">Còn lại</span>
                                                            <span className="text-2xl font-black tracking-tighter text-white">{globalInventory.rent.remaining}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* --- FILTERS & ACTIONS --- */}
                                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 sticky top-0 z-30">
                                                {/* Row 1: Search & Excel Actions */}
                                                <div className="flex justify-between items-center gap-4">
                                                    <div className="relative w-full max-w-md">
                                                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-[#00468E] transition-all text-sm font-bold text-slate-700 placeholder:text-slate-400"
                                                            placeholder="Tìm kiếm theo Mã căn, Tòa, Tầng..."
                                                            value={apartmentSearch}
                                                            onChange={(e) => setApartmentSearch(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-slate-50 flex items-center gap-2">
                                                            <FileSpreadsheet size={16} /> Mẫu Excel
                                                        </button>
                                                        <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-slate-50 flex items-center gap-2">
                                                            <Download size={16} /> Xuất Excel
                                                        </button>
                                                        <button
                                                            onClick={handleImportApartment}
                                                            disabled={isApartmentsSealed && currentView !== 'admin'}
                                                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all ${isApartmentsSealed && currentView !== 'admin'
                                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                : 'bg-[#00468E] text-white hover:bg-[#003366] shadow-lg shadow-blue-900/20'
                                                                }`}
                                                        >
                                                            <Upload size={16} /> Import Excel
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Row 2: Filters & Bulk Actions */}
                                                <div className="flex justify-between items-center gap-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        <select
                                                            value={apartmentFilterRight}
                                                            onChange={(e) => setApartmentFilterRight(e.target.value as any)}
                                                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#00468E]/20"
                                                        >
                                                            <option value="ALL">Tất cả Quyền</option>
                                                            <option value="BUY">Mua</option>
                                                            <option value="RENT">Thuê</option>
                                                            <option value="RENT_BUY">Thuê-Mua</option>
                                                        </select>

                                                        <select
                                                            value={apartmentFilterType}
                                                            onChange={(e) => setApartmentFilterType(e.target.value as any)}
                                                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#00468E]/20"
                                                        >
                                                            <option value="ALL">Tất cả Loại</option>
                                                            <option value="UT">Ưu tiên</option>
                                                            <option value="TT">Thông thường</option>
                                                        </select>

                                                        <select
                                                            value={apartmentFilterStatus}
                                                            onChange={(e) => setApartmentFilterStatus(e.target.value as any)}
                                                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#00468E]/20"
                                                        >
                                                            <option value="ALL">Tất cả trạng thái</option>
                                                            <option value="AVAILABLE">Chưa chủ</option>
                                                            <option value="OCCUPIED">Có chủ</option>
                                                        </select>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setIsApartmentsSealed(!isApartmentsSealed)}
                                                            disabled={currentView !== 'admin'}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all ${isApartmentsSealed
                                                                ? 'bg-red-50 text-red-600 border border-red-100'
                                                                : 'bg-green-50 text-green-600 border border-green-100 hover:bg-green-100'
                                                                } ${currentView !== 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            {isApartmentsSealed ? <Lock size={12} /> : <Unlock size={12} />}
                                                            {isApartmentsSealed ? 'Đã Niêm Phong' : 'Niêm Phong Căn Hộ'}
                                                        </button>
                                                        <button
                                                            onClick={handleResetApartments}
                                                            disabled={isApartmentsSealed && currentView !== 'admin'}
                                                            className={`px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all ${isApartmentsSealed && currentView !== 'admin'
                                                                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                                                : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                                                                }`}
                                                        >
                                                            <RotateCcw size={12} /> Thiết lập lại
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Table */}
                                            <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                                                <div className="overflow-y-auto flex-1">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 sticky top-0 z-10 shadow-sm">
                                                            <tr>
                                                                <th className="px-6 py-4 cursor-pointer hover:text-slate-600" onClick={() => handleApartmentSort('id')}>
                                                                    MÃ CĂN {apartmentSort.field === 'id' && (apartmentSort.direction === 'asc' ? '↑' : '↓')}
                                                                </th>
                                                                <th className="px-6 py-4 cursor-pointer hover:text-slate-600" onClick={() => handleApartmentSort('block')}>
                                                                    TÒA {apartmentSort.field === 'block' && (apartmentSort.direction === 'asc' ? '↑' : '↓')}
                                                                </th>
                                                                <th className="px-6 py-4 cursor-pointer hover:text-slate-600" onClick={() => handleApartmentSort('floor')}>
                                                                    TẦNG {apartmentSort.field === 'floor' && (apartmentSort.direction === 'asc' ? '↑' : '↓')}
                                                                </th>
                                                                <th className="px-6 py-4 cursor-pointer hover:text-slate-600" onClick={() => handleApartmentSort('unit')}>
                                                                    CĂN {apartmentSort.field === 'unit' && (apartmentSort.direction === 'asc' ? '↑' : '↓')}
                                                                </th>
                                                                <th className="px-6 py-4">LOẠI</th>
                                                                <th className="px-6 py-4">QUYỀN</th>
                                                                <th className="px-6 py-4">TRẠNG THÁI</th>
                                                                <th className="px-6 py-4 text-right">CHỦ SỞ HỮU</th>
                                                                <th className="px-6 py-4 text-center">THAO TÁC</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {paginatedApartments.map((apt) => (
                                                                <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                                                                    <td className="px-6 py-4 font-black text-[#00468E]">{apt.id}</td>
                                                                    <td className="px-6 py-4 font-bold text-slate-700">{apt.block}</td>
                                                                    <td className="px-6 py-4 font-mono text-sm text-slate-500">{apt.floor}</td>
                                                                    <td className="px-6 py-4 font-mono text-sm text-slate-500">{apt.unit}</td>
                                                                    <td className="px-6 py-4">
                                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${apt.type === 'uu_tien' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                                                                            {apt.type === 'uu_tien' ? 'Ưu tiên' : 'Thông thường'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${apt.right === 'buy' ? 'bg-blue-50 text-blue-600' : apt.right === 'rent' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'}`}>
                                                                            {apt.right === 'buy' ? 'Mua' : apt.right === 'rent' ? 'Thuê' : 'Thuê-Mua'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        {apt.status === 'occupied' ? (
                                                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-black uppercase shadow-sm">
                                                                                CÓ CHỦ
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-black uppercase">
                                                                                CHƯA CHỦ
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right font-mono text-xs text-slate-400">
                                                                        {apt.ownerId || '—'}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-center">
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <button
                                                                                onClick={() => setViewingHistoryApartment(apt)}
                                                                                className="p-2 text-slate-400 hover:text-[#00468E] hover:bg-blue-50 rounded-lg transition-colors"
                                                                                title="Xem lịch sử"
                                                                            >
                                                                                <History size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setEditingApartment(apt)}
                                                                                disabled={isApartmentsSealed && currentView !== 'admin'}
                                                                                className={`p-2 rounded-lg transition-colors ${isApartmentsSealed && currentView !== 'admin'
                                                                                    ? 'text-slate-200 cursor-not-allowed'
                                                                                    : 'text-slate-400 hover:text-[#00468E] hover:bg-blue-50'
                                                                                    }`}
                                                                                title="Sửa thông tin"
                                                                            >
                                                                                <Edit size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                            }
                                                            {paginatedApartments.length === 0 && (
                                                                <tr>
                                                                    <td colSpan={8} className="px-6 py-8 text-center text-slate-400 italic">
                                                                        Không tìm thấy căn hộ nào.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Pagination Controls */}
                                                <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white sticky bottom-0 z-10">
                                                    <div className="text-xs font-bold text-slate-400 uppercase">
                                                        Hiển thị {paginatedApartments.length} / {apartmentData.length} kết quả
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setApartmentPage(Math.max(1, apartmentPage - 1))}
                                                            disabled={apartmentPage === 1}
                                                            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
                                                        >
                                                            <ChevronLeft size={16} />
                                                        </button>
                                                        <span className="px-4 py-2 rounded-lg bg-slate-50 text-slate-600 text-xs font-black flex items-center">
                                                            Trang {apartmentPage} / {Math.ceil(apartmentData.length / ITEMS_PER_PAGE)}
                                                        </span>
                                                        <button
                                                            onClick={() => setApartmentPage(apartmentPage + 1)}
                                                            disabled={apartmentPage >= Math.ceil(apartmentData.length / ITEMS_PER_PAGE)}
                                                            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
                                                        >
                                                            <ChevronRight size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Edit Apartment Modal */}
                                        {editingApartment && (
                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                                                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                                                        <h3 className="text-lg font-black text-slate-800 uppercase">Cập nhật thông tin căn hộ</h3>
                                                        <button onClick={() => { setEditingApartment(null); setEditApartmentReason(""); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                                            <X size={20} />
                                                        </button>
                                                    </div>

                                                    <div className="p-6 space-y-6 overflow-y-auto">
                                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-xs font-bold text-blue-400 uppercase">Mã căn</span>
                                                                <span className="text-lg font-black text-[#00468E]">{editingApartment.id}</span>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-4">
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Tòa</label>
                                                                <input
                                                                    type="text"
                                                                    value={editingApartment.block}
                                                                    onChange={(e) => setEditingApartment({ ...editingApartment, block: e.target.value })}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Tầng</label>
                                                                <input
                                                                    type="text"
                                                                    value={editingApartment.floor}
                                                                    onChange={(e) => setEditingApartment({ ...editingApartment, floor: e.target.value })}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black uppercase text-slate-400 px-1">Căn</label>
                                                                <input
                                                                    type="text"
                                                                    value={editingApartment.unit}
                                                                    onChange={(e) => setEditingApartment({ ...editingApartment, unit: e.target.value })}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black uppercase text-slate-400 px-1">Quyền</label>
                                                            <select
                                                                value={editingApartment.right}
                                                                onChange={(e) => setEditingApartment({ ...editingApartment, right: e.target.value as any })}
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all"
                                                            >
                                                                <option value="buy">Mua</option>
                                                                <option value="rent">Thuê</option>
                                                                <option value="rent_buy">Thuê-Mua</option>
                                                            </select>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <label className="text-xs font-black text-slate-500 uppercase">Trạng thái mới</label>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <button
                                                                    onClick={() => setEditingApartment({ ...editingApartment, status: 'available' })}
                                                                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2
                                                ${editingApartment.status === 'available'
                                                                            ? 'border-green-500 bg-green-50 text-green-700'
                                                                            : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                                                >
                                                                    <div className={`w-3 h-3 rounded-full ${editingApartment.status === 'available' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                                                    CHƯA CHỦ
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingApartment({ ...editingApartment, status: 'occupied' })}
                                                                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2
                                                ${editingApartment.status === 'occupied'
                                                                            ? 'border-red-500 bg-red-50 text-red-700'
                                                                            : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                                                >
                                                                    <div className={`w-3 h-3 rounded-full ${editingApartment.status === 'occupied' ? 'bg-red-500' : 'bg-slate-300'}`}></div>
                                                                    CÓ CHỦ
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <label className="text-xs font-black text-slate-500 uppercase">Lý do sửa đổi <span className="text-red-500">*</span></label>
                                                            <textarea
                                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#00468E] text-sm font-medium h-24 resize-none"
                                                                placeholder="Nhập lý do thay đổi..."
                                                                value={editApartmentReason}
                                                                onChange={(e) => setEditApartmentReason(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
                                                        <button
                                                            onClick={() => { setEditingApartment(null); setEditApartmentReason(""); }}
                                                            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                                                        >
                                                            Hủy bỏ
                                                        </button>
                                                        <button
                                                            onClick={handleSaveApartment}
                                                            disabled={!editApartmentReason.trim()}
                                                            className="flex-1 py-3 bg-[#00468E] text-white rounded-xl font-bold hover:bg-[#003366] transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Lưu thay đổi
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* History Modal */}
                                        {viewingHistoryApartment && (
                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                                                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
                                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                                                        <h3 className="text-lg font-black text-slate-800 uppercase">Lịch sử thay đổi căn hộ</h3>
                                                        <button onClick={() => setViewingHistoryApartment(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                                            <X size={20} />
                                                        </button>
                                                    </div>

                                                    <div className="p-6 border-b border-slate-100 bg-blue-50/50 shrink-0">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-xs font-bold text-blue-400 uppercase">Mã căn</span>
                                                            <span className="text-lg font-black text-[#00468E]">{viewingHistoryApartment.id}</span>
                                                        </div>
                                                        <div className="flex gap-4 text-sm text-slate-600">
                                                            <span>Tòa: <b>{viewingHistoryApartment.block}</b></span>
                                                            <span>Tầng: <b>{viewingHistoryApartment.floor}</b></span>
                                                            <span>Căn: <b>{viewingHistoryApartment.unit}</b></span>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 overflow-auto p-0">
                                                        {(!viewingHistoryApartment.history || viewingHistoryApartment.history.length === 0) ? (
                                                            <div className="text-center py-12 text-slate-400 italic flex flex-col items-center gap-3">
                                                                <History size={48} className="opacity-20" />
                                                                Chưa có lịch sử thay đổi nào.
                                                            </div>
                                                        ) : (
                                                            <table className="w-full text-left border-collapse min-w-[800px]">
                                                                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 sticky top-0 z-10">
                                                                    <tr>
                                                                        <th className="px-6 py-4 border-b border-slate-100 whitespace-nowrap">Thời gian</th>
                                                                        <th className="px-6 py-4 border-b border-slate-100 whitespace-nowrap">Thay đổi</th>
                                                                        <th className="px-6 py-4 border-b border-slate-100 whitespace-nowrap">Chi tiết</th>
                                                                        <th className="px-6 py-4 border-b border-slate-100 whitespace-nowrap">Người thực hiện</th>
                                                                        <th className="px-6 py-4 border-b border-slate-100 whitespace-nowrap">Ghi chú</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-50 text-sm text-slate-600">
                                                                    {viewingHistoryApartment.history.map((entry, idx) => (
                                                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                                            <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                                                                                {new Date(entry.timestamp).toLocaleString('vi-VN')}
                                                                            </td>
                                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                                {entry.field === 'create' ? (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-black uppercase">
                                                                                        <Sparkles size={12} /> Khởi tạo
                                                                                    </span>
                                                                                ) : (entry.field === 'result' || entry.field === 'result_win') ? (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-black uppercase">
                                                                                        <Trophy size={12} /> Trúng thưởng
                                                                                    </span>
                                                                                ) : entry.field === 'result_cancel' ? (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded text-[10px] font-black uppercase">
                                                                                        <CircleX size={12} /> Hủy kết quả
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase">
                                                                                        <Edit size={12} /> {
                                                                                            entry.field === 'status' ? 'Trạng thái' :
                                                                                                entry.field === 'block' ? 'Tòa' :
                                                                                                    entry.field === 'floor' ? 'Tầng' :
                                                                                                        entry.field === 'unit' ? 'Căn' :
                                                                                                            entry.field === 'right' ? 'Quyền' :
                                                                                                                entry.field
                                                                                        }
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                                {entry.field === 'create' ? (
                                                                                    <span className="text-slate-400 italic">Đã tạo mới</span>
                                                                                ) : (
                                                                                    <div className="flex flex-col gap-1">
                                                                                        <div className="flex items-center gap-2 whitespace-nowrap">
                                                                                            <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs line-through decoration-red-600/50">
                                                                                                {entry.oldValue || '—'}
                                                                                            </span>
                                                                                            <ArrowRightLeft size={12} className="text-slate-300" />
                                                                                            <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs font-bold">
                                                                                                {entry.newValue || '—'}
                                                                                            </span>
                                                                                        </div>
                                                                                        {entry.details && (
                                                                                            <div className="text-xs text-slate-500 mt-1 bg-slate-50 p-1.5 rounded border border-slate-100 whitespace-nowrap">
                                                                                                {entry.details}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-6 py-4 font-medium text-slate-800 whitespace-nowrap">
                                                                                {entry.actor}
                                                                            </td>
                                                                            <td className="px-6 py-4 text-slate-500 italic text-xs whitespace-nowrap">
                                                                                {entry.note}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'reports' && (
                                    <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-fade-in h-full">

                                        <div className="flex flex-col gap-6 h-full overflow-hidden">
                                            {/* HIGH CONTRAST SUMMARY CARDS */}
                                            <div className="grid grid-cols-4 gap-4">
                                                {[
                                                    { label: 'TỔNG THAM GIA', val: '5,550', color: 'text-white', bg: 'bg-blue-600' },
                                                    { label: 'ĐÃ ĐĂNG NHẬP', val: '4,982', color: 'text-white', bg: 'bg-indigo-600' },
                                                    { label: 'TRÚNG', val: '929', color: 'text-white', bg: 'bg-green-600' },
                                                    { label: 'KHÔNG TRÚNG', val: '4,621', color: 'text-white', bg: 'bg-red-600' },
                                                ].map(stat => (
                                                    <div key={stat.label} className={`${stat.bg} p-5 rounded-2xl shadow-md flex flex-col justify-between h-28 transform transition-all hover:scale-105`}>
                                                        <span className={`text-[10px] font-black uppercase opacity-70 ${stat.color}`}>{stat.label}</span>
                                                        <span className={`text-4xl font-black tracking-tighter ${stat.color}`}>{stat.val}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Toolbar */}
                                            <div className="flex gap-4">
                                                <div className="flex-1 bg-white p-2 pl-4 rounded-2xl border border-slate-200 flex items-center gap-2">
                                                    <Search size={20} className="text-slate-400" />
                                                    <input
                                                        placeholder="Mã HS / Họ tên / CCCD/Mã Căn"
                                                        className="w-full bg-transparent outline-none font-medium text-slate-700 placeholder:text-slate-300"
                                                        value={reportSearch}
                                                        onChange={(e) => setReportSearch(e.target.value)}
                                                    />
                                                </div>

                                                {/* Round Filter */}
                                                <div className="bg-white px-4 rounded-2xl border border-slate-200 flex items-center gap-2 min-w-[200px]">
                                                    <History size={18} className="text-slate-400" />
                                                    <select
                                                        className="w-full bg-transparent outline-none font-bold text-[#00468E]"
                                                        defaultValue="Vòng 1"
                                                    >
                                                        <option value="ALL">Tất cả các vòng</option>
                                                        <option value="Vòng 1">Vòng 1</option>
                                                        {(activeProject.rounds || []).map((r: Round) => (
                                                            <option key={r.id} value={r.id.toString()}>{r.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Date Filter */}
                                                <div className="bg-white px-4 rounded-2xl border border-slate-200 flex items-center gap-2 min-w-[180px]">
                                                    <Calendar size={18} className="text-slate-400" />
                                                    <input
                                                        type="date"
                                                        className="bg-transparent outline-none font-bold text-slate-700"
                                                        defaultValue="2026-03-26"
                                                    />
                                                </div>

                                                {/* Result Filter */}
                                                <div className="bg-white px-4 rounded-2xl border border-slate-200 flex items-center gap-2 min-w-[180px]">
                                                    <Filter size={18} className="text-slate-400" />
                                                    <select
                                                        className="w-full bg-transparent outline-none font-bold text-[#00468E]"
                                                        defaultValue="ALL"
                                                    >
                                                        <option value="ALL">Trúng/Không Trúng</option>
                                                        <option value="WON">Trúng</option>
                                                        <option value="LOST">Không Trúng</option>
                                                    </select>
                                                </div>

                                                <button
                                                    onClick={handleExportExcel}
                                                    className="px-6 py-2 bg-green-600 text-white rounded-2xl font-black text-xs uppercase hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-900/20 whitespace-nowrap"
                                                >
                                                    <FileSpreadsheet size={16} />
                                                    Xuất Excel
                                                </button>
                                            </div>

                                            {/* Table */}
                                            <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                                                <div className="overflow-y-auto flex-1">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 sticky top-0 z-10 shadow-sm">
                                                            <tr>
                                                                <th className="px-6 py-4">MÃ HỒ SƠ</th>
                                                                <th className="px-6 py-4">HỌ VÀ TÊN</th>
                                                                <th className="px-6 py-4">SỐ ĐIỆN THOẠI</th>
                                                                <th className="px-6 py-4">SỐ CCCD</th>
                                                                <th className="px-6 py-4">NGÀY QUAY</th>
                                                                <th className="px-6 py-4">VÒNG BỐC THĂM</th>
                                                                <th className="px-6 py-4">KẾT QUẢ</th>
                                                                <th className="px-6 py-4 text-right">CĂN TRÚNG</th>
                                                                <th className="px-6 py-4 text-center">THAO TÁC</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {paginatedReportData.map((p, index) => (
                                                                <tr key={`${p.id}-${index}`} className="hover:bg-slate-50 transition-colors">
                                                                    <td className="px-6 py-4 font-black text-[#00468E]">{p.id}</td>
                                                                    <td className="px-6 py-4 font-bold text-slate-700">{p.name}</td>
                                                                    <td className="px-6 py-4 font-mono text-sm text-slate-500">{p.phone}</td>
                                                                    <td className="px-6 py-4 font-mono text-sm text-slate-400">{p.cccd}</td>
                                                                    <td className="px-6 py-4 font-mono text-sm text-slate-500">{p.date}</td>
                                                                    <td className="px-6 py-4 font-bold text-slate-700">{p.round}</td>
                                                                    <td className="px-6 py-4">
                                                                        {p.result === 'won' ? (
                                                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-black uppercase shadow-sm">
                                                                                <CheckCircle2 size={12} /> TRÚNG
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase">
                                                                                <CircleX size={12} /> KHÔNG TRÚNG
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right font-black text-[#00468E]">
                                                                        {p.unit}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-center">
                                                                        {(p.result === 'won' || p.result === 'lost') && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    const unit = p.unit && p.unit !== '-' ? p.unit : null;
                                                                                    setActiveResultProfile({
                                                                                        ...p,
                                                                                        hasWon: p.result === 'won',
                                                                                        assignedUnit: unit,
                                                                                        apartmentInfo: unit ? {
                                                                                            block: unit.substring(1, 3),
                                                                                            floor: unit.substring(3, 5),
                                                                                            unit: unit.substring(5)
                                                                                        } : null,
                                                                                        drawTime: '09:00 - 26/03/2026',
                                                                                        resultTime: '09:12 - 26/03/2026'
                                                                                    } as any);
                                                                                }}
                                                                                className="px-3 py-1.5 bg-blue-50 text-[#00468E] rounded-lg text-xs font-bold hover:bg-[#00468E] hover:text-white transition-all shadow-sm"
                                                                            >
                                                                                Chi tiết
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Pagination Controls */}
                                                <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white sticky bottom-0 z-10">
                                                    <div className="text-xs font-bold text-slate-400 uppercase">
                                                        Hiển thị {paginatedReportData.length} / {mockReportData.length} kết quả
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setReportPage(Math.max(1, reportPage - 1))}
                                                            disabled={reportPage === 1}
                                                            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
                                                        >
                                                            <ChevronLeft size={16} />
                                                        </button>
                                                        <span className="px-4 py-2 rounded-lg bg-slate-50 text-slate-600 text-xs font-black flex items-center">
                                                            Trang {reportPage} / {Math.ceil(mockReportData.length / ITEMS_PER_PAGE_REPORT)}
                                                        </span>
                                                        <button
                                                            onClick={() => setReportPage(reportPage + 1)}
                                                            disabled={reportPage >= Math.ceil(mockReportData.length / ITEMS_PER_PAGE_REPORT)}
                                                            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
                                                        >
                                                            <ChevronRight size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                </div>
                            </main>
                        </div>
                )
            ) : (
                <div className="min-h-screen relative bg-[#F8FAFC] flex flex-col items-center justify-center p-0 md:p-6 overflow-hidden">
                    {/* Smartphone Mock Wrapper for User Portal */}
                    <div className="w-full h-[100dvh] md:h-[850px] md:max-w-[380px] md:rounded-[2.5rem] bg-white shadow-2xl md:shadow-blue-900/10 overflow-hidden relative flex flex-col md:border-[8px] md:border-slate-800">
                        {/* Status bar mock (desktop only) */}
                        <div className="hidden md:flex h-6 bg-white w-full items-center justify-center shrink-0">
                            <div className="w-16 h-4 bg-slate-800 rounded-b-xl"></div>
                        </div>
                        
                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-white custom-scrollbar">
                            {/* NOTE: Login Screen */}
                            {!currentUser && (
                                <div className="flex-1 flex flex-col items-center justify-center p-6 relative bg-white min-h-full">
                                    <div className="w-full relative z-10 flex flex-col">
                                        {/* Logo Area */}
                                        <div className="flex flex-col items-center mb-8 shrink-0 mt-8">
                                            <div className="w-20 h-20 bg-[#00468E] rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-900/20 transition-transform">
                                                <Home size={40} className="text-white relative top-[-2px]" />
                                            </div>
                                            <h1 className="text-3xl font-black text-[#00468E] tracking-tighter uppercase text-center leading-none">Dự Án NOXH<br />HANDICO</h1>
                                        </div>

                                        {/* Dynamic Forms */}
                                        <div className="flex-1 flex flex-col justify-center pb-8">

                                    {loginStep === 'credentials' && (
                                        <div className="space-y-4 animate-fade-in">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số CCCD</label>
                                                <div className="relative">
                                                    <input
                                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-bold text-[#00468E] outline-none placeholder:text-slate-300 focus:border-[#00468E] transition-all"
                                                        placeholder="Nhập số CCCD"
                                                        type="text"
                                                        value={inputCccd}
                                                        onChange={(e) => { setInputCccd(e.target.value); setUserError(""); }}
                                                    />
                                                    <User className="absolute left-4 top-4 text-slate-300" size={20} />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
                                                <div className="relative">
                                                    <input
                                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-bold text-slate-700 outline-none placeholder:text-slate-300 focus:border-[#00468E] transition-all"
                                                        placeholder="••••••••"
                                                        type="password"
                                                        value={newPassword}
                                                        onChange={(e) => { setNewPassword(e.target.value); setUserError(""); }}
                                                    />
                                                    <Key className="absolute left-4 top-4 text-slate-300" size={20} />
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleUserLogin}
                                                className="w-full py-5 bg-[#00468E] text-white rounded-[2rem] font-black uppercase shadow-xl shadow-blue-200 active:scale-95 transition-all mt-4"
                                            >
                                                ĐĂNG NHẬP
                                            </button>
                                            
                                            <div className="pt-4 space-y-3">
                                                <button
                                                    onClick={() => {
                                                        setLoginStep('register_cccd');
                                                        setUserError("");
                                                    }}
                                                    className="w-full text-center text-[11px] font-black text-[#00468E] uppercase tracking-widest underline decoration-blue-200 underline-offset-4 hover:text-blue-700 transition-colors"
                                                >
                                                    ĐĂNG KÝ TÀI KHOẢN MỚI
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        alert("Vui lòng liên hệ ban quản lý bằng CCCD để lấy lại mật khẩu.");
                                                    }}
                                                    className="w-full text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-[#00468E] transition-colors"
                                                >
                                                    Quên mật khẩu?
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {loginStep === 'register_cccd' && (
                                        <RegistrationStepper 
                                            onComplete={handleRegisterComplete}
                                            onCancel={() => setLoginStep('credentials')}
                                        />
                                    )}

                                    {userError && <p className="text-red-500 text-center text-xs font-bold animate-shake">{userError}</p>}
                                </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 10: PORTAL DASHBOARD (Main Menu) */}
                            {mobileStep === 10 && currentUser && (
                                <>
                                    {userActiveTab === 'home' ? (
                                        <UserDashboard 
                                            currentUser={currentUser}
                                            sessionStatus={sessionStatus}
                                            lobbyCountdown={lobbyCountdown}
                                            formatTime={formatTime}
                                            onLogout={handleUserLogout}
                                            onNavigate={setMobileStep}
                                            onStartSubmission={() => setMobileStep(20)}
                                            onViewApplicationStatus={() => setIsAppStatusOpen(true)}
                                            onTriggerDemoLive={() => updateActiveProject({ sessionStatus: 'live' })}
                                        />
                                    ) : (
                                        <UserProfileTab currentUser={currentUser} />
                                    )}

                                    {/* BOTTOM NAVIGATION FOR USER PORTAL */}
                                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-100 flex items-center justify-around px-6 pb-2 z-50">
                                        <button 
                                            onClick={() => setUserActiveTab('home')}
                                            className={`flex flex-col items-center gap-1 transition-all ${userActiveTab === 'home' ? 'text-[#00468E]' : 'text-slate-400'}`}
                                        >
                                            <Home size={22} className={userActiveTab === 'home' ? 'fill-[#00468E]/10' : ''} />
                                            <span className="text-[10px] font-black uppercase tracking-tighter">Trang chủ</span>
                                        </button>
                                        <button 
                                            onClick={() => setUserActiveTab('profile')}
                                            className={`flex flex-col items-center gap-1 transition-all ${userActiveTab === 'profile' ? 'text-[#00468E]' : 'text-slate-400'}`}
                                        >
                                            <User size={22} className={userActiveTab === 'profile' ? 'fill-[#00468E]/10' : ''} />
                                            <span className="text-[10px] font-black uppercase tracking-tighter">Hồ sơ của tôi</span>
                                        </button>
                                    </div>
                                </>
                            )}
                            
                            {/* STEP 20: SUBMISSION WIZARD */}
                            {mobileStep === 20 && currentUser && (
                                <SubmissionWizard 
                                    currentUser={currentUser}
                                    onGoBack={() => setMobileStep(10)}
                                    onSubmit={(groupK, uploadedFiles, form02Data) => {
                                        const isResubmission = currentUser.applicationState === 'tra_ho_so';
                                        
                                        // Merge files if resubmission
                                        let finalFiles = uploadedFiles;
                                        const newStatuses = { ...(currentUser.documentStatuses || {}) };

                                        if (isResubmission) {
                                            const existingFiles = currentUser.files || [];
                                            const fileMap = new Map();
                                            existingFiles.forEach(f => fileMap.set(f.id || f.category, f));
                                            
                                            uploadedFiles.forEach(f => {
                                                fileMap.set(f.id || f.category, f);
                                                if (f.id) newStatuses[f.id] = 'pending';
                                            });
                                            
                                            finalFiles = Array.from(fileMap.values());
                                        } else {
                                            uploadedFiles.forEach(f => {
                                                if (f.id) newStatuses[f.id] = 'pending';
                                            });
                                        }

                                        const updatedUser: Participant = { 
                                            ...currentUser, 
                                            groupK, 
                                            files: finalFiles,
                                            form02Data,
                                            applicationState: isResubmission ? 'dang_xu_ly' : 'da_nhan',
                                            submitTime: currentUser.submitTime || new Date().toISOString(),
                                            documentStatuses: newStatuses,
                                            actionLog: [
                                                ...(currentUser.actionLog || []),
                                                { 
                                                    time: new Date().toISOString(), 
                                                    actor: 'Người dùng', 
                                                    action: isResubmission ? 'Bổ sung hồ sơ lỗi' : 'Nộp hồ sơ trực tuyến' 
                                                }
                                            ]
                                        };
                                        
                                        const newParticipants = participants.map(p => p.id === currentUser.id ? updatedUser : p);
                                        updateActiveProject({ participants: newParticipants });
                                        setCurrentUser(updatedUser);
                                        
                                        alert(isResubmission ? "Bổ sung hồ sơ thành công! Trạng thái đã chuyển sang Đang xử lý." : "Nộp hồ sơ thành công! Hệ thống đã tiếp nhận dữ liệu.");
                                        setMobileStep(10);
                                    }}
                                />
                            )}
                            
                            {isAppStatusOpen && currentUser && (
                                <ApplicationStatusModal 
                                    isOpen={isAppStatusOpen}
                                    onClose={() => setIsAppStatusOpen(false)}
                                    participant={currentUser}
                                />
                            )}

                            {/* STEP 11: RULES & INSTRUCTIONS */}
                            {mobileStep === 11 && (
                                <div className="flex-1 flex flex-col h-full animate-fade-in relative -mx-8 bg-slate-50">
                                    <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center gap-4 sticky top-0 z-20">
                                        <button onClick={() => setMobileStep(10)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                            <ChevronLeft size={20} />
                                        </button>
                                        <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">HƯỚNG DẪN</h3>
                                    </div>
                                    <div className="p-6 space-y-6 overflow-y-auto pb-20">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                            <h4 className="font-bold text-[#00468E] mb-2 flex items-center gap-2 mt-2">1. Nhập thông tin & Nhận OTP</h4>
                                            <p className="text-sm text-slate-500 leading-relaxed text-justify mb-4">
                                                Quý khách nhập Mã hồ sơ và Số điện thoại đã đăng ký. Hệ thống sẽ gửi mã OTP xác thực qua tin nhắn.
                                            </p>
                                            <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 font-bold border-2 border-dashed border-slate-200"> [Hình ảnh: Màn hình Nhập OTP] </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                            <h4 className="font-bold text-[#00468E] mb-2 flex items-center gap-2 mt-2">2. Đăng nhập hệ thống</h4>
                                            <p className="text-sm text-slate-500 leading-relaxed text-justify mb-4">
                                                Sau khi nhập đúng mã OTP, Quý khách sẽ được tự động đăng nhập và chuyển vào giao diện chính để chờ bốc thăm.
                                            </p>
                                            <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 font-bold border-2 border-dashed border-slate-200"> [Hình ảnh: Giao diện Trang chủ] </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                            <h4 className="font-bold text-[#00468E] mb-2 flex items-center gap-2 mt-2">3. Thực hiện bốc thăm</h4>
                                            <p className="text-sm text-slate-500 leading-relaxed text-justify mb-4">
                                                Khi phiên bốc thăm bắt đầu, Quý khách nhấn nút "QUAY" để hệ thống thực hiện chọn căn hộ ngẫu nhiên.
                                            </p>
                                            <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 font-bold border-2 border-dashed border-slate-200"> [Hình ảnh: Thao tác Quay số] </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                            <h4 className="font-bold text-[#00468E] mb-2 flex items-center gap-2 mt-2">4. Nhận kết quả</h4>
                                            <p className="text-sm text-slate-500 leading-relaxed text-justify mb-4">
                                                Kết quả bốc thăm sẽ hiển thị ngay lập tức. Quý khách có thể xem và tải Chứng nhận kết quả về thiết bị.
                                            </p>
                                            <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 font-bold border-2 border-dashed border-slate-200"> [Hình ảnh: Màn hình Kết quả] </div>
                                        </div>
                                    </div>
                                </div>
                            )}



                            {/* STEP 6: EKYC SUCCESS (Transition Screen) */}
                            {mobileStep === 6 && (
                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-celebration pb-10">
                                    <div className="w-24 h-24 bg-green-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl animate-bounce"><CheckCircle2 size={50} /></div>
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black text-[#00468E] leading-tight">THÀNH CÔNG!</h3>
                                        <p className="text-sm font-bold text-slate-800 uppercase tracking-tighter">{currentUser?.name}</p>
                                        <p className="text-xs text-slate-400 font-bold">Đã hoàn tất đăng nhập</p>
                                    </div>
                                    <button onClick={() => setMobileStep(10)} className="w-full py-5 bg-[#00468E] text-white rounded-[2rem] font-black uppercase shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                                        <Home size={18} /> VỀ TRANG CHỦ
                                    </button>
                                </div>
                            )}

                            {/* STEP 7: UNIFIED LOBBY & GAME AREA */}
                            {mobileStep === 7 && currentUser && (
                                <div className="flex-1 flex flex-col h-full animate-fade-in relative pt-4">

                                    {/* HEADER: USER INFO */}
                                    <div className="flex items-center justify-between mb-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setMobileStep(10)} className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-300"><ChevronLeft size={20} /></button>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-[#00468E]">SỰ KIỆN TRỰC TIẾP</span>
                                                <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{activeProject.name}</span>
                                            </div>
                                        </div>
                                        <div className="bg-red-50 text-red-600 px-3 py-1 rounded-lg flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                                            <span className="text-[10px] font-black uppercase">LIVE</span>
                                        </div>
                                    </div>

                                    {/* --- REAL-TIME DASHBOARD (NEW) --- */}
                                    <div className="mb-6 animate-fade-in">
                                        <div className="bg-[#00468E] rounded-2xl p-3 text-center text-white shadow-lg">
                                            <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider mb-1">TỔNG SỐ CĂN</p>
                                            <p className="text-2xl font-black">{globalInventory.total}</p>
                                        </div>
                                    </div>

                                    {/* --- SCREEN B: THE LOBBY (WAITING ROOM) --- */}
                                    {(sessionStatus === 'waiting' && currentUser.drawStatus === 'cho') && (
                                        <div className="flex-1 flex flex-col items-center animate-fade-in overflow-y-auto pb-4">
                                            {/* COUNTDOWN */}
                                            <div className="w-full text-center mb-6">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Thời gian còn lại</p>
                                                <div className="text-4xl font-black text-slate-800 tracking-tighter font-mono mb-4">
                                                    {formatTime(lobbyCountdown)}
                                                </div>
                                                <button
                                                    onClick={() => updateActiveProject({ sessionStatus: 'live' })}
                                                    className="px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase hover:bg-slate-200"
                                                >
                                                    Bắt đầu (Demo)
                                                </button>
                                            </div>

                                            {/* RULES SUMMARY */}
                                            <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FileText size={16} className="text-[#00468E]" />
                                                    <span className="text-xs font-black text-[#00468E] uppercase">QUY CHẾ TÓM TẮT</span>
                                                </div>
                                                <ul className="text-[10px] text-slate-500 space-y-2 list-disc pl-4 font-medium leading-relaxed">
                                                    <li>Mỗi hồ sơ chỉ được quay số 01 lần duy nhất.</li>
                                                    <li>Kết quả sẽ được hiển thị ngay lập tức trên màn hình.</li>
                                                    <li>Người trúng giải vui lòng tải Chứng nhận điện tử để làm thủ tục.</li>
                                                </ul>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-60 mt-auto">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                    Đang kết nối máy chủ...
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- SCREEN C: THE GAME (LIVE DRAW) --- */}
                                    {(sessionStatus === 'live' && currentUser.drawStatus === 'cho') && (
                                        <div className="flex-1 flex flex-col items-center justify-center animate-bounce-in pb-10">
                                            {/* Background decorations for Gacha */}
                                            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10 opacity-30">
                                                <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full blur-3xl animate-pulse"></div>
                                                <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-200 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                                            </div>

                                            {isSpinning ? (
                                                // SPINNING ANIMATION WITHOUT COUNTDOWN
                                                <div className="flex flex-col items-center w-full px-4">
                                                    {/* Outer spinning ring */}
                                                    <div className="relative mb-6 flex justify-center items-center">
                                                        {/* Ring layer 1 - spins fast */}
                                                        <div className="w-56 h-56 rounded-full border-[10px] border-[#00468E] border-t-transparent border-r-transparent animate-spin" style={{ animationDuration: '0.8s' }}></div>
                                                        {/* Ring layer 2 - spins slow opposite */}
                                                        <div className="absolute rounded-full border-[6px] border-blue-300 border-b-transparent border-l-transparent animate-spin" style={{ width: '200px', height: '200px', animationDuration: '1.4s', animationDirection: 'reverse' }}></div>
                                                        {/* Gift Box Icon in center */}
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                            <Gift size={48} className="text-[#00468E] animate-bounce" />
                                                        </div>
                                                    </div>

                                                    <p className="text-sm font-black text-[#00468E] uppercase tracking-widest animate-pulse text-center mt-4">ĐANG BỐC THĂM...</p>
                                                    <p className="text-[10px] text-slate-400 font-bold mt-1">Xin vui lòng chờ trong giây lát</p>
                                                </div>
                                            ) : (
                                                // READY TO SPIN
                                                <div className="flex flex-col items-center">
                                                    <p className="text-sm font-bold text-green-600 uppercase tracking-widest mb-8 animate-bounce text-center px-4">CỔNG BỐC THĂM ĐÃ MỞ!<br />CHÚC BẠN MAY MẮN</p>

                                                    <button
                                                        onClick={handleUserSpin}
                                                        className="group relative w-60 h-60 rounded-full bg-gradient-to-b from-blue-500 to-[#00468E] shadow-[0_20px_50px_rgba(0,70,142,0.5)] border-[8px] border-white flex flex-col items-center justify-center active:scale-95 transition-all duration-200 ring-8 ring-blue-200 ring-opacity-50"
                                                    >
                                                        <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping"></div>
                                                        <Gift size={60} className="text-white mb-3 group-hover:scale-110 transition-transform" />
                                                        <span className="text-4xl font-black text-white tracking-tight uppercase">Bốc Thăm</span>
                                                        <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-1">Nhấn để bốc thăm</span>
                                                    </button>

                                                    <p className="text-[10px] text-slate-400 font-bold mt-8 uppercase">Hệ thống minh bạch - Công khai</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* STATE 4: RESULT (Won) */}
                                    {currentUser.drawStatus === 'trung' && (
                                        showCertificate ? (
                                            // E-CERTIFICATE VIEW
                                            <div className="flex-1 flex flex-col animate-fade-in relative">
                                                <div className="flex items-center justify-between mb-2">
                                                    <button onClick={() => setShowCertificate(false)} className="text-slate-400 flex items-center gap-1 text-[10px] font-bold uppercase"><ChevronRight className="rotate-180" size={14} /> Quay lại</button>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => window.print()} className="text-[#00468E] flex items-center gap-1 text-[10px] font-bold uppercase underline"><Download size={14} /> Tải về</button>
                                                        <button onClick={() => setMobileStep(10)} className="text-[#00468E] flex items-center gap-1 text-[10px] font-bold uppercase underline">Trang chủ <Home size={14} /></button>
                                                    </div>
                                                </div>

                                                <div className="bg-white p-6 rounded-none shadow-2xl border-8 border-double border-[#00468E] flex-1 flex flex-col items-center text-center relative overflow-hidden my-2" id="certificate">
                                                    {/* Watermark */}
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                                                        <Building size={300} />
                                                    </div>

                                                    <div className="w-16 h-16 bg-[#00468E] text-white flex items-center justify-center rounded-full font-black text-xl mb-4 z-10">VGC</div>
                                                    <h2 className="text-xl font-black text-[#00468E] uppercase tracking-tighter z-10">CHỨNG NHẬN<br />KẾT QUẢ</h2>
                                                    <div className="w-32 h-1 bg-[#00468E] my-4 z-10"></div>

                                                    {/* RESULT STATUS TEXT */}
                                                    <div className="z-10 mb-6 py-2 px-4 bg-blue-50 rounded-lg border border-blue-100">
                                                        <p className="text-sm font-black text-[#00468E] uppercase tracking-tight">
                                                            Kết Quả Trúng Quyền {currentUser.right === 'mua' ? 'Mua' : currentUser.right === 'thue' ? 'Thuê' : 'Thuê-Mua'}
                                                        </p>
                                                    </div>

                                                    <div className="text-left w-full space-y-3 text-sm z-10 flex-1">
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Khách hàng</p>
                                                            <p className="font-bold text-slate-800 uppercase text-lg leading-tight">{currentUser.name}</p>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <div>
                                                                <p className="text-[10px] text-slate-400 uppercase font-bold">Số CCCD</p>
                                                                <p className="font-bold text-slate-800">{maskCCCD(currentUser.cccd)}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] text-slate-400 uppercase font-bold">Mã hồ sơ</p>
                                                                <p className="font-bold text-[#00468E]">{currentUser.id}</p>
                                                            </div>
                                                        </div>
                                                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-center mt-2">
                                                            <p className="text-[10px] text-yellow-600 uppercase font-bold mb-1">Căn hộ được quyền {currentUser.right === 'mua' ? 'mua' : currentUser.right === 'thue' ? 'thuê' : 'thuê-mua'}</p>
                                                            <p className="text-3xl font-black text-[#00468E]">{currentUser.assignedUnit}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-auto pt-6 w-full flex flex-col items-center z-10 space-y-4">
                                                        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                                                            <QrCode size={120} className="text-slate-800" />
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="h-8 w-24 bg-contain bg-no-repeat bg-center opacity-80 mx-auto" style={{ backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/f/f8/Signature_sample.svg")' }}></div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Xác nhận bởi BTC</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // CELEBRATION SCREEN
                                            <div className="flex-1 flex flex-col items-center justify-center animate-celebration relative">
                                                {/* CSS Confetti */}
                                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                                    {[...Array(20)].map((_, i) => (
                                                        <div key={i} className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                                                            style={{
                                                                top: '-10px',
                                                                left: `${Math.random() * 100}%`,
                                                                animation: `fall ${2 + Math.random() * 3}s linear infinite`,
                                                                backgroundColor: ['#FCD34D', '#34D399', '#60A5FA', '#F87171'][Math.floor(Math.random() * 4)]
                                                            }}
                                                        />
                                                    ))}
                                                </div>

                                                <PartyPopper size={80} className="text-yellow-500 mb-6 drop-shadow-lg" />
                                                <h2 className="text-4xl font-black text-green-600 uppercase tracking-tighter mb-2 drop-shadow-sm">CHÚC MỪNG!</h2>
                                                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-10">Bạn đã trúng quyền {currentUser.right === 'mua' ? 'mua' : currentUser.right === 'thue' ? 'thuê' : 'thuê-mua'} căn hộ</p>
                                                <div className="px-10 py-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-3xl mb-8 shadow-xl transform rotate-1">
                                                    <p className="text-center text-3xl font-black text-[#00468E]">{currentUser.assignedUnit}</p>
                                                </div>

                                                <button
                                                    onClick={() => setShowCertificate(true)}
                                                    className="w-full py-5 bg-[#00468E] text-white rounded-[2rem] font-black uppercase shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mb-4"
                                                >
                                                    XEM CHỨNG NHẬN <ChevronRight size={18} />
                                                </button>

                                                <button
                                                    onClick={() => setMobileStep(10)}
                                                    className="text-xs font-bold text-slate-400 hover:text-[#00468E] underline uppercase"
                                                >
                                                    Về trang chủ
                                                </button>
                                            </div>
                                        )
                                    )}

                                    {/* STATE 4: RESULT (Lost) */}
                                    {currentUser.drawStatus === 'truot' && (
                                        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in grayscale opacity-80">
                                            <Frown size={80} className="text-slate-400 mb-6" />
                                            <h2 className="text-3xl font-black text-slate-600 uppercase tracking-tighter mb-2">RẤT TIẾC</h2>
                                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest text-center px-10">Số lượng căn hộ đợt này đã hết hoặc bạn chưa may mắn.</p>
                                            <button
                                                onClick={() => setMobileStep(10)}
                                                className="mt-12 text-[#00468E] font-black text-xs uppercase underline tracking-widest"
                                            >
                                                Về trang chủ
                                            </button>
                                        </div>
                                    )}

                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}

            {/* DEMO TOOLBAR AT THE BOTTOM REMOVED - MOVED TO MONITOR SCREEN */}

            <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes bounceIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-bounce-in { animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes celebration { 0% { transform: scale(0.9); opacity: 0; } 50% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
        .animate-celebration { animation: celebration 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 3; }
        @keyframes fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(800px) rotate(720deg); opacity: 0; } }
        @keyframes scan { 0% { top: 0%; opacity: 0; } 50% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>
            {/* Modals */}
            <ImportExcelModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportConfirm}
                existingParticipants={participants}
                projectPrefix={activeProject.prefix}
            />
            <ImportApartmentModal
                isOpen={isImportApartmentModalOpen}
                onClose={() => setIsImportApartmentModalOpen(false)}
                onImport={handleImportApartmentConfirm}
                existingApartments={apartments}
            />
            <BulkUploadModal
                isOpen={isBulkUploadModalOpen}
                onClose={() => setIsBulkUploadModalOpen(false)}
                onConfirm={handleBulkUploadConfirm}
                participants={participants}
            />
            {
                activeProfileForDetails && (
                    <ProfileDetailsModal
                        isOpen={!!activeProfileForDetails}
                        onClose={() => setActiveProfileForDetails(null)}
                        participant={activeProfileForDetails}
                        onUpdate={handleUpdateParticipant}
                    />
                )
            }
            {
                activeResultProfile && (
                    <ResultDetailsDrawer
                        isOpen={!!activeResultProfile}
                        onClose={() => setActiveResultProfile(null)}
                        participant={activeResultProfile}
                    />
                )
            }
        </div >
    );
}