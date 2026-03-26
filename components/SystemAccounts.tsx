import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  UserPlus,
  Trash2,
  Edit,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  History,
  Shield,
  UserCog,
  Clock,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { SystemAccount, Role, AccountLog } from '../types';

interface SystemAccountsProps {
  accounts: SystemAccount[];
  onAddAccount: (account: Omit<SystemAccount, 'id'>) => void;
  onUpdateAccount: (id: string, updates: Partial<SystemAccount>) => void;
  onDeleteAccount: (id: string) => void;
}

export const SystemAccounts: React.FC<SystemAccountsProps> = ({
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount
}) => {
  // --- STATE: TABS ---
  const [activeTab, setActiveTab] = useState<'accounts' | 'roles' | 'logs'>('accounts');

  // --- STATE: ROLES ---
  const [roles, setRoles] = useState<Role[]>([
    {
      id: 'admin',
      name: 'Quản trị viên',
      description: 'Toàn quyền truy cập hệ thống',
      permissions: ['apartment.view', 'apartment.import', 'apartment.edit', 'apartment.delete', 'apartment.export', 'profile.view', 'profile.import', 'profile.edit', 'profile.disable', 'profile.view_scan', 'profile.upload_scan', 'profile.bulk_upload', 'profile.export', 'round.view', 'round.create', 'round.edit', 'round.import_participants', 'round.delete', 'round.toggle_checkin', 'monitor.view_checkin', 'monitor.view_monitor', 'monitor.export_log', 'report.view', 'report.lookup', 'report.export', 'account.view', 'account.create', 'account.edit', 'account.toggle', 'account.permission', 'profile.reception', 'profile.control', 'profile.storage'],
      isSystem: true
    },
    {
      id: 'staff',
      name: 'Nhân viên',
      description: 'Quyền hạn chế, chủ yếu xem và check-in',
      permissions: ['apartment.view', 'profile.view', 'round.view', 'monitor.view_checkin', 'report.view', 'report.lookup'],
      isSystem: true
    },
    {
      id: 'tiepnhan',
      name: 'Cán bộ Tiếp Nhận',
      description: 'Chuyên trách tiếp nhận hồ sơ trực tuyến và bản cứng',
      permissions: ['profile.view', 'profile.reception'],
      isSystem: true
    },
    {
      id: 'kiemsoat',
      name: 'Cán bộ Kiểm Soát',
      description: 'Chuyên trách thẩm định và kiểm soát tính pháp lý',
      permissions: ['profile.view', 'profile.control'],
      isSystem: true
    },
    {
      id: 'kho',
      name: 'Cán bộ Kho',
      description: 'Chuyên trách lưu trữ và quản lý kho hồ sơ',
      permissions: ['profile.view', 'profile.storage'],
      isSystem: true
    }
  ]);

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState<Partial<Role>>({ name: '', description: '', permissions: [] });
  const [isRoleDirty, setIsRoleDirty] = useState(false);

  // --- STATE: LOGS ---
  const [logs, setLogs] = useState<AccountLog[]>([
    {
      id: 'log_1',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      actorId: 'admin_01',
      actorName: 'Admin System',
      action: 'tao',
      details: 'Tạo vòng bốc thăm mới: Vòng Ưu Tiên 1->4 Mua'
    },
    {
      id: 'log_2',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      actorId: 'admin_01',
      actorName: 'Admin System',
      action: 'cap_nhat',
      details: 'Cập nhật trạng thái vòng bốc thăm "Vòng Ưu Tiên 1->4 Mua": Đang diễn ra'
    },
    {
      id: 'log_3',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      actorId: 'staff_01',
      actorName: 'Nhân viên A',
      action: 'tao',
      details: 'Import danh sách 120 hồ sơ mới vào hệ thống từ file Excel'
    },
    {
      id: 'log_4',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      actorId: 'staff_02',
      actorName: 'Nhân viên B',
      action: 'xoa',
      targetAccountId: 'user_123',
      targetAccountName: 'khach_hang_1',
      details: 'Xóa hồ sơ lỗi ID: HS0192'
    },
    {
      id: 'log_5',
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      actorId: 'admin_sys',
      actorName: 'Super Admin',
      action: 'doi_trang_thai',
      targetAccountId: 'staff_03',
      targetAccountName: 'Nhan vien thu viec',
      details: 'Vô hiệu hóa tài khoản do hết hạn thử việc'
    }
  ]);

  // --- STATE: ACCOUNTS ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [createForm, setCreateForm] = useState({
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    role: ''
  });
  const [createError, setCreateError] = useState("");

  const [editingAccount, setEditingAccount] = useState<SystemAccount | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    password: '',
    confirmPassword: '',
    role: ''
  });
  const [editError, setEditError] = useState("");

  const [confirmToggleAccount, setConfirmToggleAccount] = useState<SystemAccount | null>(null);

  // --- PERMISSION GROUPS ---
  const PERMISSION_GROUPS = [
    {
      id: 'apartment',
      label: 'Quỹ Căn Hộ',
      actions: [
        { id: 'view', label: 'Xem quỹ căn' },
        { id: 'import', label: 'Nhập căn (Import/Thêm mới)' },
        { id: 'edit', label: 'Sửa căn' },
        { id: 'delete', label: 'Xóa/Vô hiệu căn' },
        { id: 'export', label: 'Xuất danh sách căn' },
      ]
    },
    {
      id: 'profile',
      label: 'Quỹ Hồ Sơ',
      actions: [
        { id: 'view', label: 'Xem quỹ hồ sơ' },
        { id: 'import', label: 'Nhập hồ sơ (Import/Thêm mới)' },
        { id: 'edit', label: 'Sửa hồ sơ' },
        { id: 'disable', label: 'Disable/Enable hồ sơ' },
        { id: 'view_scan', label: 'Xem bộ hồ sơ scan (PDF)' },
        { id: 'upload_scan', label: 'Upload hồ sơ scan (lẻ)' },
        { id: 'reception', label: 'Tiếp nhận hồ sơ (Phase 2)' },
        { id: 'control', label: 'Kiểm soát hồ sơ (Phase 2)' },
        { id: 'storage', label: 'Quản lý kho (Phase 2)' },
        { id: 'bulk_upload', label: 'Bulk upload hồ sơ scan' },
        { id: 'export', label: 'Xuất danh sách hồ sơ' },
      ]
    },
    {
      id: 'round',
      label: 'Thiết Lập Vòng Bốc Thăm',
      actions: [
        { id: 'view', label: 'Xem vòng bốc thăm' },
        { id: 'create', label: 'Tạo vòng bốc thăm' },
        { id: 'edit', label: 'Sửa vòng bốc thăm' },
        { id: 'import_participants', label: 'Chọn/Import danh sách hồ sơ' },
        { id: 'delete', label: 'Xóa vòng bốc thăm' },
        { id: 'toggle_checkin', label: 'Mở/Đóng check-in' },
      ]
    },
    {
      id: 'monitor',
      label: 'Giám Sát & Monitor',
      actions: [
        { id: 'view_checkin', label: 'Xem giám sát check-in' },
        { id: 'view_monitor', label: 'Xem monitor sự kiện' },
        { id: 'export_log', label: 'Xuất nhật ký sự kiện' },
      ]
    },
    {
      id: 'report',
      label: 'Báo Cáo & Tra Cứu',
      actions: [
        { id: 'view', label: 'Xem báo cáo' },
        { id: 'lookup', label: 'Tra cứu kết quả' },
        { id: 'export', label: 'Xuất báo cáo (Excel/PDF)' },
      ]
    },
    {
      id: 'account',
      label: 'Tài Khoản Hệ Thống',
      actions: [
        { id: 'view', label: 'Xem danh sách tài khoản' },
        { id: 'create', label: 'Tạo tài khoản' },
        { id: 'edit', label: 'Sửa tài khoản (đổi mật khẩu)' },
        { id: 'toggle', label: 'Bật/Tắt tài khoản' },
        { id: 'permission', label: 'Phân quyền tài khoản' },
      ]
    }
  ];

  // --- LOGGING HELPER ---
  const addLog = (action: AccountLog['action'], targetAccount: SystemAccount | undefined, details: string) => {
    const newLog: AccountLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: 'current_user', // In a real app, get from context
      actorName: 'Current User',
      action,
      targetAccountId: targetAccount?.id,
      targetAccountName: targetAccount?.username,
      details
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // --- HANDLERS: ACCOUNTS ---
  const openCreateModal = () => {
    setCreateForm({ username: '', displayName: '', password: '', confirmPassword: '', role: '' });
    setCreateStep(1);
    setCreateError("");
    setIsCreateModalOpen(true);
  };

  const handleCreateNext = () => {
    setCreateError("");
    if (createStep === 1) {
      if (createForm.username.length < 3 || /\s/.test(createForm.username)) {
        setCreateError("Tên đăng nhập tối thiểu 3 ký tự và không có khoảng trắng.");
        return;
      }
      if (!createForm.displayName) {
        setCreateError("Vui lòng nhập tên hiển thị.");
        return;
      }
      if (createForm.password.length < 8) {
        setCreateError("Mật khẩu tối thiểu 8 ký tự.");
        return;
      }
      if (createForm.password !== createForm.confirmPassword) {
        setCreateError("Mật khẩu nhập lại không khớp.");
        return;
      }
      if (accounts.some(a => a.username === createForm.username)) {
        setCreateError("Tên đăng nhập đã tồn tại.");
        return;
      }
      setCreateStep(2);
    } else if (createStep === 2) {
      if (!createForm.role) {
        setCreateError("Vui lòng chọn vai trò.");
        return;
      }
      // Submit
      onAddAccount({
        username: createForm.username,
        displayName: createForm.displayName,
        password: createForm.password,
        role: createForm.role,
        status: 'active',
        lastLogin: undefined
      });
      addLog('tao', undefined, `Tạo tài khoản mới: ${createForm.username} (${createForm.role})`);
      setIsCreateModalOpen(false);
    }
  };

  const openEditModal = (account: SystemAccount) => {
    setEditingAccount(account);
    setEditForm({
      displayName: account.displayName || '',
      password: '',
      confirmPassword: '',
      role: account.role || ''
    });
    setEditError("");
  };

  const handleSaveEdit = () => {
    if (!editingAccount) return;
    setEditError("");

    const updates: Partial<SystemAccount> = {
      displayName: editForm.displayName,
      role: editForm.role
    };

    if (editForm.password) {
      if (editForm.password.length < 8) {
        setEditError("Mật khẩu mới tối thiểu 8 ký tự.");
        return;
      }
      if (editForm.password !== editForm.confirmPassword) {
        setEditError("Mật khẩu nhập lại không khớp.");
        return;
      }
      updates.password = editForm.password;
    }

    onUpdateAccount(editingAccount.id, updates);
    addLog('cap_nhat', editingAccount, `Cập nhật thông tin: ${editForm.displayName}, Role: ${editForm.role}`);
    setEditingAccount(null);
  };

  const handleToggleStatus = (account: SystemAccount) => {
    setConfirmToggleAccount(account);
  };

  const confirmToggle = () => {
    if (confirmToggleAccount) {
      const newStatus = confirmToggleAccount.status === 'active' ? 'inactive' : 'active';
      onUpdateAccount(confirmToggleAccount.id, { status: newStatus });
      addLog('doi_trang_thai', confirmToggleAccount, `Đổi trạng thái thành: ${newStatus}`);
      setConfirmToggleAccount(null);
    }
  };

  // --- HANDLERS: ROLES ---
  const handleSelectRole = (role: Role) => {
    if (isRoleDirty) {
      if (!window.confirm("Bạn có thay đổi chưa lưu. Bạn có chắc muốn chuyển không?")) return;
    }
    setSelectedRoleId(role.id);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions]
    });
    setIsRoleDirty(false);
  };

  const handleCreateRole = () => {
    if (isRoleDirty) {
      if (!window.confirm("Bạn có thay đổi chưa lưu. Bạn có chắc muốn chuyển không?")) return;
    }
    setSelectedRoleId('new');
    setRoleForm({ name: '', description: '', permissions: [] });
    setIsRoleDirty(true); // Enable save immediately for new role
  };

  const handleDeleteRole = (roleId: string) => {
    if (roles.find(r => r.id === roleId)?.isSystem) return;
    if (!window.confirm("Bạn có chắc muốn xóa vai trò này?")) return;

    setRoles(prev => prev.filter(r => r.id !== roleId));
    if (selectedRoleId === roleId) {
      setSelectedRoleId(null);
      setRoleForm({ name: '', description: '', permissions: [] });
      setIsRoleDirty(false);
    }
    addLog('xoa', undefined, `Xóa vai trò ID: ${roleId}`);
  };

  const handleSaveRole = () => {
    if (!roleForm.name) return;

    if (selectedRoleId === 'new') {
      // Create
      const newRole: Role = {
        id: `role_${Date.now()}`,
        name: roleForm.name!,
        description: roleForm.description || '',
        permissions: roleForm.permissions || [],
        isSystem: false
      };
      setRoles(prev => [...prev, newRole]);
      setSelectedRoleId(newRole.id);
      addLog('tao', undefined, `Tạo vai trò mới: ${newRole.name}`);
    } else {
      // Update
      setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, ...roleForm } as Role : r));
      addLog('cap_nhat', undefined, `Cập nhật vai trò: ${roleForm.name}`);
    }
    setIsRoleDirty(false);
  };

  const updateRoleForm = (field: keyof Role, value: any) => {
    setRoleForm(prev => ({ ...prev, [field]: value }));
    setIsRoleDirty(true);
  };

  const toggleRolePermission = (permId: string) => {
    setRoleForm(prev => {
      const currentPerms = prev.permissions || [];
      let nextPerms = [...currentPerms];

      if (nextPerms.includes(permId)) {
        nextPerms = nextPerms.filter(p => p !== permId);
      } else {
        nextPerms.push(permId);
        // Auto-check view
        const [group, action] = permId.split('.');
        if (action !== 'view') {
          const viewPerm = `${group}.view`;
          if (!nextPerms.includes(viewPerm)) nextPerms.push(viewPerm);
        }
      }
      return { ...prev, permissions: nextPerms };
    });
    setIsRoleDirty(true);
  };

  const toggleGroupPermissions = (groupId: string, selectAll: boolean) => {
    const group = PERMISSION_GROUPS.find(g => g.id === groupId);
    if (!group) return;

    const groupPerms = group.actions.map(a => `${groupId}.${a.id}`);

    setRoleForm(prev => {
      const currentPerms = prev.permissions || [];
      if (selectAll) {
        const toAdd = groupPerms.filter(p => !currentPerms.includes(p));
        return { ...prev, permissions: [...currentPerms, ...toAdd] };
      } else {
        return { ...prev, permissions: currentPerms.filter(p => !groupPerms.includes(p)) };
      }
    });
    setIsRoleDirty(true);
  };

  const renderAccountsTab = () => (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex justify-between items-center">
        <h3 className="font-black text-slate-800 uppercase flex items-center gap-2">
          <ShieldCheck size={20} className="text-[#00468E]" /> Danh sách tài khoản
        </h3>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-[#00468E] text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-blue-900/20 hover:bg-[#003366] active:scale-95 transition-all flex items-center gap-2"
        >
          <UserPlus size={16} /> Tạo tài khoản
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4">Tên hiển thị</th>
                <th className="px-6 py-4">Tên đăng nhập</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {accounts.map(acc => {
                const roleName = roles.find(r => r.id === acc.role)?.name || acc.role;
                return (
                  <tr key={acc.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-800">{acc.displayName || '---'}</td>
                    <td className="px-6 py-4 font-medium text-slate-500">{acc.username}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-50 text-[#00468E] rounded-lg text-[10px] font-black uppercase">
                        {roleName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${acc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                        {acc.status === 'active' ? 'Đang bật' : 'Đang tắt'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(acc)}
                          className="p-2 text-slate-400 hover:text-[#00468E] hover:bg-blue-50 rounded-lg transition-all"
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(acc)}
                          className={`p-2 rounded-lg transition-all ${acc.status === 'active' ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                          title={acc.status === 'active' ? 'Tắt tài khoản' : 'Bật tài khoản'}
                        >
                          {acc.status === 'active' ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRolesTab = () => (
    <div className="flex gap-6 h-full overflow-hidden">
      {/* LEFT COLUMN: ROLE LIST */}
      <div className="w-1/3 flex flex-col gap-4">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-slate-800 uppercase flex items-center gap-2">
              <Shield size={20} className="text-[#00468E]" /> Danh sách vai trò
            </h3>
            <button
              onClick={handleCreateRole}
              className="p-2 bg-[#00468E] text-white rounded-xl shadow-lg shadow-blue-900/20 hover:bg-[#003366] active:scale-95 transition-all"
              title="Thêm vai trò mới"
            >
              <UserPlus size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {roles.map(role => (
              <div
                key={role.id}
                onClick={() => handleSelectRole(role)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all group relative ${selectedRoleId === role.id ? 'bg-blue-50 border-[#00468E] shadow-sm' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-sm'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className={`font-black text-sm uppercase ${selectedRoleId === role.id ? 'text-[#00468E]' : 'text-slate-700'}`}>{role.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{role.description}</p>
                  </div>
                  {role.isSystem && (
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded text-[9px] font-bold uppercase">System</span>
                  )}
                </div>

                {!role.isSystem && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}
                    className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: ROLE DETAILS */}
      <div className="w-2/3 flex flex-col gap-4">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden relative">
          {!selectedRoleId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
              <Shield size={64} className="mb-4 opacity-20" />
              <p className="font-bold text-sm uppercase">Chọn một vai trò để xem chi tiết</p>
            </div>
          ) : (
            <>
              {/* Header / Form Info */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-4 flex-1 mr-8">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tên vai trò <span className="text-red-500">*</span></label>
                      <input
                        value={roleForm.name}
                        onChange={(e) => updateRoleForm('name', e.target.value)}
                        disabled={roles.find(r => r.id === selectedRoleId)?.isSystem}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all disabled:bg-slate-100 disabled:text-slate-500"
                        placeholder="Nhập tên vai trò..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Mô tả</label>
                      <input
                        value={roleForm.description}
                        onChange={(e) => updateRoleForm('description', e.target.value)}
                        disabled={roles.find(r => r.id === selectedRoleId)?.isSystem}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium text-slate-600 outline-none focus:border-[#00468E] transition-all disabled:bg-slate-100 disabled:text-slate-500"
                        placeholder="Mô tả ngắn gọn..."
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveRole}
                    disabled={!isRoleDirty || !roleForm.name}
                    className="px-6 py-3 bg-[#00468E] text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-blue-900/20 hover:bg-[#003366] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Lưu thay đổi
                  </button>
                </div>
              </div>

              {/* Permissions Matrix */}
              <div className="flex-1 overflow-y-auto p-6">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-4">Phân quyền chi tiết</p>
                <div className="grid grid-cols-2 gap-4">
                  {PERMISSION_GROUPS.map(group => {
                    const groupPerms = group.actions.map(a => `${group.id}.${a.id}`);
                    const allChecked = groupPerms.every(p => roleForm.permissions?.includes(p));
                    const isSystemRole = roles.find(r => r.id === selectedRoleId)?.isSystem;

                    return (
                      <div key={group.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200">
                          <h4 className="font-black text-slate-700 uppercase text-xs">{group.label}</h4>
                          <label className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${isSystemRole ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white'}`}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${allChecked ? 'bg-[#00468E] border-[#00468E]' : 'bg-white border-slate-300'}`}>
                              {allChecked && <CheckCircle2 size={10} className="text-white" />}
                            </div>
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={allChecked}
                              onChange={() => !isSystemRole && toggleGroupPermissions(group.id, !allChecked)}
                              disabled={isSystemRole}
                            />
                            <span className="text-[9px] font-bold uppercase text-slate-500">Tất cả</span>
                          </label>
                        </div>
                        <div className="space-y-2">
                          {group.actions.map(action => {
                            const permId = `${group.id}.${action.id}`;
                            const isChecked = roleForm.permissions?.includes(permId);
                            return (
                              <label key={permId} className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${isSystemRole ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white'}`}>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${isChecked ? 'bg-[#00468E] border-[#00468E]' : 'bg-white border-slate-300'}`}>
                                  {isChecked && <CheckCircle2 size={10} className="text-white" />}
                                </div>
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={isChecked || false}
                                  onChange={() => !isSystemRole && toggleRolePermission(permId)}
                                  disabled={isSystemRole}
                                />
                                <span className={`text-[10px] font-bold ${isChecked ? 'text-slate-800' : 'text-slate-500'}`}>{action.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderLogsTab = () => (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex justify-between items-center">
        <h3 className="font-black text-slate-800 uppercase flex items-center gap-2">
          <History size={20} className="text-[#00468E]" /> Nhật ký hoạt động
        </h3>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Người thực hiện</th>
                <th className="px-6 py-4">Hành động</th>
                <th className="px-6 py-4">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-300 italic font-bold">
                    Chưa có nhật ký hoạt động nào...
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{log.actorName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase 
                        ${log.action === 'create' ? 'bg-green-100 text-green-700' :
                          log.action === 'delete' ? 'bg-red-100 text-red-700' :
                            log.action === 'update' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col gap-6 animate-fade-in p-8">
      {/* TABS HEADER */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'accounts' ? 'bg-white text-[#00468E] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <UserCog size={16} /> Tài khoản
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'roles' ? 'bg-white text-[#00468E] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Shield size={16} /> Phân quyền
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-white text-[#00468E] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <History size={16} /> Nhật ký
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="flex-1 min-h-0">
        {activeTab === 'accounts' && renderAccountsTab()}
        {activeTab === 'roles' && renderRolesTab()}
        {activeTab === 'logs' && renderLogsTab()}
      </div>

      {/* --- MODALS --- */}

      {/* CREATE ACCOUNT MODAL (STEPPER) */}
      {isCreateModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-bounce-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 uppercase">Tạo tài khoản mới</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center gap-2 mb-8">
              <div className={`flex-1 h-2 rounded-full transition-all ${createStep >= 1 ? 'bg-[#00468E]' : 'bg-slate-100'}`}></div>
              <div className={`flex-1 h-2 rounded-full transition-all ${createStep >= 2 ? 'bg-[#00468E]' : 'bg-slate-100'}`}></div>
            </div>

            <div className="space-y-6">
              {createStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tên đăng nhập <span className="text-red-500">*</span></label>
                    <input
                      value={createForm.username}
                      onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all"
                      placeholder="VD: admin_01"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tên hiển thị <span className="text-red-500">*</span></label>
                    <input
                      value={createForm.displayName}
                      onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all"
                      placeholder="VD: Nguyễn Văn A"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                      <input
                        type="password"
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Nhập lại <span className="text-red-500">*</span></label>
                      <input
                        type="password"
                        value={createForm.confirmPassword}
                        onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {createStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Chọn vai trò <span className="text-red-500">*</span></label>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {roles.map(role => (
                      <label key={role.id} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${createForm.role === role.id ? 'bg-blue-50 border-[#00468E]' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                        <input
                          type="radio"
                          name="role"
                          className="mt-1"
                          checked={createForm.role === role.id}
                          onChange={() => setCreateForm({ ...createForm, role: role.id })}
                        />
                        <div>
                          <p className="font-bold text-slate-800">{role.name}</p>
                          <p className="text-xs text-slate-500">{role.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {createError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
                  <AlertCircle size={16} />
                  {createError}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                {createStep === 2 && (
                  <button
                    onClick={() => setCreateStep(1)}
                    className="px-6 py-3 border border-slate-200 text-slate-500 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 transition-all flex items-center gap-2"
                  >
                    <ChevronLeft size={16} /> Quay lại
                  </button>
                )}
                <div className="flex-1"></div>
                <button
                  onClick={handleCreateNext}
                  className="px-8 py-3 bg-[#00468E] text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-blue-900/20 hover:bg-[#003366] active:scale-95 transition-all flex items-center gap-2"
                >
                  {createStep === 1 ? <>Tiếp tục <ChevronRight size={16} /></> : 'Hoàn tất'}
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* EDIT ACCOUNT MODAL */}
      {editingAccount && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-bounce-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 uppercase">Chỉnh sửa tài khoản</h3>
              <button onClick={() => setEditingAccount(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tên đăng nhập</label>
                <input value={editingAccount.username} disabled className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-500 outline-none cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tên hiển thị</label>
                <input
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Vai trò</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all"
                >
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-[#00468E] uppercase mb-4">Đổi mật khẩu (Tùy chọn)</p>
                <div className="space-y-4">
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all"
                    placeholder="Mật khẩu mới"
                  />
                  <input
                    type="password"
                    value={editForm.confirmPassword}
                    onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#00468E] transition-all"
                    placeholder="Xác nhận mật khẩu mới"
                  />
                </div>
              </div>

              {editError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
                  <AlertCircle size={16} />
                  {editError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button onClick={() => setEditingAccount(null)} className="flex-1 py-3 border border-slate-200 text-slate-500 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 transition-all">Hủy</button>
                <button onClick={handleSaveEdit} className="flex-1 py-3 bg-[#00468E] text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-blue-900/20 hover:bg-[#003366] active:scale-95 transition-all">Lưu thay đổi</button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}



      {/* CONFIRM TOGGLE MODAL */}
      {confirmToggleAccount && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-bounce-in">
            <div className="flex flex-col items-center text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${confirmToggleAccount.status === 'active' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase">Xác nhận thay đổi trạng thái</h3>
              <p className="text-sm text-slate-500 font-medium mt-2">
                {confirmToggleAccount.status === 'active'
                  ? <span>Bạn có chắc muốn tắt tài khoản <strong className="text-slate-800">{confirmToggleAccount.username}</strong>? Người dùng sẽ <span className="text-red-500 font-bold">không thể đăng nhập</span>.</span>
                  : <span>Bạn có chắc muốn bật tài khoản <strong className="text-slate-800">{confirmToggleAccount.username}</strong>? Người dùng sẽ <span className="text-green-500 font-bold">có thể đăng nhập</span>.</span>
                }
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmToggleAccount(null)}
                className="flex-1 py-3 border border-slate-200 text-slate-500 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={confirmToggle}
                className={`flex-1 py-3 text-white rounded-xl font-bold text-xs uppercase shadow-lg transition-all ${confirmToggleAccount.status === 'active' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-green-500 hover:bg-green-600 shadow-green-200'}`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      , document.body)}

    </div>
  );
};
