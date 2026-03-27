import { Participant, Apartment, Round } from './types';

// Quỹ căn hộ tổng thể
export const TOTAL_INVENTORY = 929; // Mua 589 + Thuê Mua 128 + Thuê 212

export const QUY_CAN_HO = {
  mua: 589,
  thueMua: 128,
  thue: 212,
  tong: 929
};

export const QUY_HO_SO = {
  mua: {
    ut1_4: 200,
    ut5: 1800,
    thuong: 3000,
    tong: 5000
  },
  thueMua: {
    ut1_4: 10,
    ut5: 70,
    thuong: 120,
    tong: 200
  },
  thue: {
    tong: 50
  }
};

// Dự án lịch sử (Tĩnh cho Tra Cứu)
export const HISTORICAL_PROJECTS = [
  { id: 'luu_tru_2023', name: 'NOXH Yên Phong (2023) - Đã kết thúc', year: 2023 },
  { id: 'luu_tru_2022', name: 'NOXH Tiên Dương (2022) - Đã kết thúc', year: 2022 }
];

export const OFFICERS = [
  { id: 'off_01', name: 'Cán Bộ A', role: 'tiepnhan' },
  { id: 'off_02', name: 'Cán Bộ B', role: 'kiemsoat' },
  { id: 'off_03', name: 'Cán Bộ C', role: 'kho' },
  { id: 'off_04', name: 'Cán Bộ D', role: 'kiemsoat' },
  { id: 'off_05', name: 'Cán Bộ E', role: 'tiepnhan' },
];

const hoLot = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];
const tenDem = ['Văn', 'Thị', 'Minh', 'Đức', 'Thành', 'Ngọc', 'Quang', 'Xuân', 'Hải'];
const ten = ['An', 'Bình', 'Cường', 'Dũng', 'Giang', 'Hạnh', 'Khánh', 'Lan', 'Nam', 'Thảo', 'Tuấn', 'Vy', 'Yến', 'Hùng'];

// Hàm sinh dữ liệu người tham gia
const sinhHoSo = (soLuong: number, tieuTo: string): Participant[] => {
  return Array.from({ length: soLuong }, (_, i) => {
    const hl = hoLot[Math.floor(Math.random() * hoLot.length)];
    const td = tenDem[Math.floor(Math.random() * tenDem.length)];
    const t = ten[Math.floor(Math.random() * ten.length)];

    const id = `${tieuTo}${String(i + 1).padStart(3, '0')}`;
    const tenDay = `${hl} ${td} ${t}`;

    const dinhDanhPrefix = ['001', '034', '036', '079'][Math.floor(Math.random() * 4)];
    const cccd = `${dinhDanhPrefix}0${Math.floor(80 + Math.random() * 20)}00${Math.floor(100000 + Math.random() * 900000)}`;

    const soDienThoaiPrefix = ['09', '03', '07', '08'][Math.floor(Math.random() * 4)];
    let soDienThoai = `${soDienThoaiPrefix}${Math.floor(10000000 + Math.random() * 90000000)}`;

    // Phân loại đối tượng
    const loaiOptions: Array<'ut1' | 'ut2' | 'ut3' | 'ut4' | 'ut5' | 'thuong'> = ['ut1', 'ut2', 'ut3', 'ut4', 'ut5', 'thuong'];
    let loai: 'ut1' | 'ut2' | 'ut3' | 'ut4' | 'ut5' | 'thuong' = 'thuong';
    const rand = Math.random();
    if (rand < 0.04) loai = 'ut1';
    else if (rand < 0.08) loai = 'ut2';
    else if (rand < 0.12) loai = 'ut3';
    else if (rand < 0.16) loai = 'ut4';
    else if (rand < 0.52) loai = 'ut5';
    else loai = 'thuong';

    let quyen: 'mua' | 'thue' | 'thue_mua' = ['mua', 'thue', 'thue_mua'][Math.floor(Math.random() * 3)] as 'mua' | 'thue' | 'thue_mua';

    // Dữ liệu mẫu cố định
    if (id === `${tieuTo}001`) {
      quyen = 'mua';
      loai = 'ut1';
      soDienThoai = '09123456789';
    } else if (id === `${tieuTo}002`) {
      quyen = 'mua';
      loai = 'ut5';
      soDienThoai = '09123456788';
    } else if (id === `${tieuTo}003`) {
      quyen = 'mua';
      loai = 'thuong';
      soDienThoai = '09123456787';
    }

    const trangThai: 'hoat_dong' | 'vo_hieu' = Math.random() > 0.9 ? 'vo_hieu' : 'hoat_dong';
    const trangThaiHoSo: 'hoan_thanh' | 'chua_hoan_thanh' = Math.random() > 0.7 ? 'hoan_thanh' : 'chua_hoan_thanh';
    const documentUrl = trangThaiHoSo === 'hoan_thanh' ? `https://example.com/docs/${id}.pdf` : null;
    const laTrung = Math.random() > 0.95;

    const lichSu: any[] = [];
    lichSu.push({
      field: 'tao_moi',
      timestamp: '2024-01-10T08:00:00.000Z',
      actor: 'Hệ thống',
      note: 'Nhập liệu từ danh sách đăng ký ban đầu',
      oldValue: '',
      newValue: 'Đã tạo'
    });

    if (id === `${tieuTo}001`) {
      lichSu.push({
        field: 'them_vao_vong',
        timestamp: '2024-03-25T15:00:00.000Z',
        actor: 'Quản trị hệ thống',
        note: 'Thêm vào danh sách bốc thăm Vòng 1',
        oldValue: 'Chưa gán',
        newValue: 'Vòng 1',
        details: 'Kỳ quay: Đợt 1 - Vòng 1 (Ưu tiên 1 - Mua)'
      });
    }

    return {
      id,
      name: tenDay,
      phone: soDienThoai,
      cccd,
      checkInStatus: false,
      photo: `https://i.pravatar.cc/150?u=${id}`,
      hasWon: id === `${tieuTo}001`,
      drawStatus: id === `${tieuTo}001` ? 'trung' : (id === `${tieuTo}002` ? 'truot' : 'cho'),
      checkInTime: id === `${tieuTo}001` || id === `${tieuTo}002` ? '08:45:00' : null,
      assignedUnit: id === `${tieuTo}001` ? 'C03.25' : undefined,
      right: quyen,
      type: loai,
      status: trangThai,
      profileStatus: trangThaiHoSo,
      documentUrl,
      isDuplicate: laTrung,
      duplicateWith: laTrung ? `${tieuTo}00${Math.floor(Math.random() * 10)}` : undefined,
      history: lichSu.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    };
  });
};

export const generateDemoApartments = (soLuong: number = 929): Apartment[] => {
  const canHos: Apartment[] = [];
  // Sử dụng Tòa A, B, C, D, E để C + Tầng.Căn -> Vd C03.25
  const toaNha = ['A', 'B', 'C', 'D', 'E'];
  const soTangToiDa = 25;
  const soCan = 12;

  // Phân bổ đúng tỷ lệ quyền căn hộ
  // Mua: 589, Thuê-Mua: 128, Thuê: 212
  const totalMua = 589;
  const totalThueMua = 128;
  const totalThue = 212;
  let demMua = 0, demThueMua = 0, demThue = 0;

  for (const toa of toaNha) {
    for (let f = 1; f <= soTangToiDa; f++) {
      for (let u = 1; u <= soCan; u++) {
        if (canHos.length >= soLuong) return canHos;

        const tang = String(f).padStart(2, '0');
        const can = String(u).padStart(2, '0');
        const id = `${toa}${tang}.${can}`;

        const dienTich = [60.5, 70.2, 55.0, 45.5, 80.0][Math.floor(Math.random() * 5)];
        const huong = ['Đông Nam', 'Tây Bắc', 'Đông Bắc', 'Tây Nam'][Math.floor(Math.random() * 4)];

        // Gán quyền theo tỷ lệ định sẵn
        let quyen: 'mua' | 'thue' | 'thue_mua';
        const tongHienTai = canHos.length;
        if (demMua < totalMua) { quyen = 'mua'; demMua++; }
        else if (demThueMua < totalThueMua) { quyen = 'thue_mua'; demThueMua++; }
        else { quyen = 'thue'; demThue++; }

        const trangThai: 'trong' | 'da_ban' = Math.random() > 0.8 ? 'da_ban' : 'trong';

        const lichSu: any[] = [{
          field: 'tao_moi',
          timestamp: '2024-01-15T08:00:00.000Z',
          actor: 'Hệ thống',
          note: 'Khởi tạo dữ liệu ban đầu từ file Excel',
          oldValue: '',
          newValue: 'Đã tạo'
        }];

        if (trangThai === 'da_ban') {
          lichSu.push({
            field: 'ket_qua_trung',
            timestamp: '2024-03-26T10:00:00.000Z',
            actor: 'Hệ thống Bốc Thăm',
            note: 'Xác nhận trúng thưởng tự động',
            oldValue: 'Chưa có chủ',
            newValue: 'Đã có chủ',
            details: 'Kỳ quay: Đợt 1 - Vòng 2. Khách hàng: Phạm Văn C (HS123)'
          });
        }

        const loaiCan: 'uu_tien' | 'thuong' = Math.random() > 0.3 ? 'thuong' : 'uu_tien';

        canHos.push({
          id,
          block: toa,
          floor: tang,
          unit: can,
          area: dienTich,
          orientation: huong,
          status: trangThai,
          right: quyen,
          type: loaiCan,
          history: lichSu.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        });
      }
    }
  }
  return canHos;
};

// --- CẤU HÌNH ĐA DỰ ÁN ---
export const LIVE_PROJECT_CONFIGS = [
  {
    id: 'du_an_kc',
    name: 'NOXH HANDICO',
    prefix: 'KC',
    count: 100
  },
  {
    id: 'du_an_yp',
    name: 'NOXH Yên Phong (GĐ 2)',
    prefix: 'YP',
    count: 30
  }
];

const sinhHoSoChinhXac = (tieuTo: string): Participant[] => {
  const dsHoSo: Participant[] = [];
  let giayToId = 1;

  const themHoSo = (soLuong: number, quyen: 'mua' | 'thue_mua' | 'thue', loai: 'ut1' | 'ut5' | 'thuong') => {
    for (let i = 0; i < soLuong; i++) {
      const hl = hoLot[Math.floor(Math.random() * hoLot.length)];
      const td = tenDem[Math.floor(Math.random() * tenDem.length)];
      const t = ten[Math.floor(Math.random() * ten.length)];

      const id = `${tieuTo}${String(giayToId++).padStart(4, '0')}`;
      const tenDay = `${hl} ${td} ${t}`;

      const dinhDanhPrefix = ['001', '034', '036', '079'][Math.floor(Math.random() * 4)];
      const cccd = `${dinhDanhPrefix}0${Math.floor(80 + Math.random() * 20)}00${Math.floor(100000 + Math.random() * 900000)}`;

      const soDienThoaiPrefix = ['09', '03', '07', '08'][Math.floor(Math.random() * 4)];
      let soDienThoai = `${soDienThoaiPrefix}${Math.floor(10000000 + Math.random() * 90000000)}`;

      const trangThai: 'hoat_dong' | 'vo_hieu' = Math.random() > 0.9 ? 'vo_hieu' : 'hoat_dong';
      const trangThaiHoSo: 'hoan_thanh' | 'chua_hoan_thanh' = Math.random() > 0.7 ? 'hoan_thanh' : 'chua_hoan_thanh';
      const documentUrl = trangThaiHoSo === 'hoan_thanh' ? `https://example.com/docs/${id}.pdf` : null;
      const laTrung = Math.random() > 0.95;

      const lichSu: any[] = [{
        field: 'tao_moi',
        timestamp: '2024-01-10T08:00:00.000Z',
        actor: 'Hệ thống',
        note: 'Nhập liệu từ danh sách đăng ký ban đầu',
        oldValue: '',
        newValue: 'Đã tạo'
      }];

      let realLoai: 'ut1' | 'ut2' | 'ut3' | 'ut4' | 'ut5' | 'thuong' = loai;
      if (loai === 'ut1') {
        const utOptions: Array<'ut1' | 'ut2' | 'ut3' | 'ut4'> = ['ut1', 'ut2', 'ut3', 'ut4'];
        realLoai = utOptions[Math.floor(Math.random() * 4)];
      }

      // Specific Overrides Requested by User
      let finalQuyen = quyen;
      let finalCheckIn = false;
      let finalHasWon = false;
      let finalDrawStatus: 'cho' | 'trung' | 'truot' = 'cho';
      let finalAssignedUnit: string | undefined = undefined;

      if (id === `${tieuTo}0001`) {
        soDienThoai = '09123456789';
        realLoai = 'ut1';
        finalQuyen = 'mua';
      } else if (id === `${tieuTo}0002`) {
        soDienThoai = '09123456788';
        realLoai = 'ut5';
        finalQuyen = 'mua';
      } else if (id === `${tieuTo}0003`) {
        soDienThoai = '09123456787';
        realLoai = 'thuong';
        finalQuyen = 'mua';
      }

      // User Request: 200 people in priority round (UT1-4), 10 absent, 190 checked-in and won
      if (giayToId <= 200 && finalQuyen === 'mua') {
          if (giayToId <= 10) { 
              finalCheckIn = false;
              finalHasWon = false;
              finalDrawStatus = 'cho';
          } else {
              finalCheckIn = true;
              finalHasWon = true;
              finalDrawStatus = 'trung';
              finalAssignedUnit = `${['A','B','C'][Math.floor(Math.random()*3)]}${String(Math.floor(Math.random()*15)+1).padStart(2,'0')}.${String(Math.floor(Math.random()*12)+1).padStart(2,'0')}`;
          }
      }

      dsHoSo.push({
        id,
        name: tenDay,
        phone: soDienThoai,
        cccd,
        checkInStatus: finalCheckIn,
        photo: `https://i.pravatar.cc/150?u=${id}`,
        hasWon: finalHasWon,
        drawStatus: finalDrawStatus,
        checkInTime: finalCheckIn ? '08:45:00' : null,
        assignedUnit: finalAssignedUnit,
        right: finalQuyen,
        type: realLoai,
        status: trangThai,
        profileStatus: trangThaiHoSo,
        documentUrl,
        isDuplicate: laTrung,
        duplicateWith: laTrung ? `${tieuTo}000${Math.floor(Math.random() * 9)}` : undefined,
        history: lichSu
      });
    }
  };

  // Mua: UT1-4 (200), UT5 (1800), Thường (3000)
  themHoSo(200, 'mua', 'ut1');
  themHoSo(1800, 'mua', 'ut5');
  themHoSo(3000, 'mua', 'thuong');

  // Thuê Mua: UT1-4 (10), UT5 (70), Thường (120)
  themHoSo(10, 'thue_mua', 'ut1');
  themHoSo(70, 'thue_mua', 'ut5');
  themHoSo(120, 'thue_mua', 'thuong');

  // Thuê: 50 (Thường)
  themHoSo(50, 'thue', 'thuong');

  // Phase 2 Mock Data: 50 profiles with various applicationStates
  const groupKOptions = ['K1','K2','K3','K4','K5','K6','K7','K8','K9','K10','K11'];
  const applicationStates: Array<'da_nhan' | 'dang_xu_ly' | 'tra_ho_so' | 'cho_ban_cung' | 'hoan_thanh' | 'qua_han_ban_cung'> = ['da_nhan', 'dang_xu_ly', 'tra_ho_so', 'cho_ban_cung', 'hoan_thanh', 'qua_han_ban_cung'];
  const emailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'handico.vn'];
  const returnReasons = [
    'Ảnh CCCD bị mờ, vui lòng chụp lại bản gốc rõ nét hơn.',
    'Thiếu giấy xác nhận thực trạng nhà ở.',
    'Hợp đồng lao động đã hết hạn, cần bổ sung bản mới.',
    'Giấy xác nhận thu nhập không hợp lệ.',
    'Thiếu bản sao chứng minh đối tượng ưu tiên.'
  ];

  for (let pi = 0; pi < 50; pi++) {
    const idx = giayToId++;
    const id = `${tieuTo}${String(idx).padStart(4, '0')}`;
    const hl = hoLot[Math.floor(Math.random() * hoLot.length)];
    const td = tenDem[Math.floor(Math.random() * tenDem.length)];
    const t = ten[Math.floor(Math.random() * ten.length)];
    const tenDay = `${hl} ${td} ${t}`;
    const gk = groupKOptions[pi % groupKOptions.length];

    // Distribute states: 20 da_nhan, 10 dang_xu_ly, 5 tra_ho_so, 5 cho_ban_cung, 7 hoan_thanh, 3 qua_han
    let appState: typeof applicationStates[number];
    if (pi < 20) appState = 'da_nhan';
    else if (pi < 30) appState = 'dang_xu_ly';
    else if (pi < 35) appState = 'tra_ho_so';
    else if (pi < 40) appState = 'cho_ban_cung';
    else if (pi < 47) appState = 'hoan_thanh';
    else appState = 'qua_han_ban_cung';

    const submitOffset = Math.floor(Math.random() * 10) + 1;
    const submitTime = new Date(Date.now() - submitOffset * 86400000).toISOString();
    const procDeadline = new Date(Date.now() + (3 - submitOffset + 5) * 86400000).toISOString();

    const removeAccents = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

    let cccdVal = `0340${Math.floor(80 + Math.random() * 20)}0${Math.floor(100000 + Math.random() * 900000)}`;
    let phoneVal = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
    let emailVal = `${removeAccents(t).toLowerCase()}${removeAccents(td).toLowerCase()}${Math.floor(Math.random()*100)}@${emailDomains[Math.floor(Math.random() * emailDomains.length)]}`.replace(/\s+/g, '');

    const actionLogEntries: Array<{time: string; actor: string; action: string; comment?: string}> = [
      { time: submitTime, actor: 'Hệ thống', action: 'Tiếp nhận hồ sơ trực tuyến' }
    ];
    if (appState === 'dang_xu_ly' || appState === 'cho_ban_cung' || appState === 'hoan_thanh') {
      actionLogEntries.push({ time: new Date(Date.now() - (submitOffset - 1) * 86400000).toISOString(), actor: 'Trần Kiểm Soát', action: 'Duyệt hồ sơ tiếp nhận' });
    }
     if (appState === 'cho_ban_cung' || appState === 'hoan_thanh' || appState === 'qua_han_ban_cung') {
      actionLogEntries.push({ time: new Date(Date.now() - (submitOffset - 2) * 86400000).toISOString(), actor: 'Lê Kiểm Soát', action: 'Duyệt kiểm soát, chuyển chờ bản cứng' });
    }

    const officerId = OFFICERS[Math.floor(Math.random() * OFFICERS.length)].id;
    const utOptions: Array<'ut1' | 'ut2' | 'ut3' | 'ut4' | 'ut5' | 'thuong'> = ['ut1', 'ut2', 'ut3', 'ut4', 'ut5', 'thuong'];

    const dobVal = `${Math.floor(Math.random() * 28) + 1}/${Math.floor(Math.random() * 12) + 1}/${Math.floor(Math.random() * 20) + 1970}`;
    
    const form02Data: Participant['form02Data'] = {
      registrationRight: (['mua', 'thue', 'thue_mua'] as const)[Math.floor(Math.random() * 3)],
      dob: dobVal,
      currentAddress: 'Số ' + (Math.floor(Math.random()*100)+1) + ' Đường ' + ['Lê Lợi', 'Trần Hưng Đạo', 'Nguyễn Trãi', 'Lạc Long Quân'][Math.floor(Math.random()*4)] + ', Hà Nội',
      contactPhone: phoneVal,
      idNumber12: cccdVal,
      idIssuanceDate: '2018-05-20',
      idIssuancePlace: 'Cục CS QLHC về TTXH',
      permanentAddress: 'Xã ' + ['Thạch Bàn', 'Cổ Bi', 'Đặng Xá'][Math.floor(Math.random()*3)] + ', Gia Lâm, Hà Nội',
      registrationType: Math.random() > 0.8 ? 'chuyen_nhuong' : 'moi',
      housingStatus: {
        noHome: pi < 30,
        lowArea: pi >= 30 && pi < 40,
        farAway: pi >= 40,
        other: false
      },
      subjectCategory: {
        nguoiCoCong: gk === 'K1',
        ngheoNongThon: gk === 'K2',
        ngheoThienTai: false,
        ngheoDoThi: gk === 'K2',
        thuNhapThap: gk === 'K2' || true,
        congNhan: gk === 'K3',
        lucLuongVuTrang: gk === 'K4',
        canBoCongChuc: gk === 'K5',
        traNhaCongVu: false,
        thuHoiDat: gk === 'K6',
        hocSinhSinhVien: gk === 'K8',
        doanhNghiep: false
      },
      familyMembers: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, mi) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: `${hl} ${tenDem[mi % tenDem.length]} ${ten[mi % ten.length]}`,
        relationship: ['Vợ', 'Chồng', 'Con', 'Bố', 'Mẹ'][mi % 5],
        cccd12: `0340${Math.floor(80 + Math.random() * 20)}0${Math.floor(100000 + Math.random() * 900000)}`
      }))
    };

    // First profile special values
    if (pi === 0) {
      cccdVal = '123456789012';
      phoneVal = '09123456789';
      emailVal = 'nguyen.vana@gmail.com';
      appState = 'tra_ho_so';
      
      // Additional Form 02 fields for verification
      form02Data.ownerName = 'NGUYỄN VĂN A';
      form02Data.dob = '01/01/1990';
      form02Data.idNumber09 = '123456789';
      form02Data.militaryIdNumber = 'MS-555888';
      form02Data.temporaryAddress = 'Số 10, Ngõ 55, Xuân Thủy, Cầu Giấy, Hà Nội';
      form02Data.idNumber12 = cccdVal;
    }

    dsHoSo.push({
      id,
      name: pi === 0 ? 'Nguyễn Văn A' : tenDay,
      phone: phoneVal,
      cccd: cccdVal,
      dob: dobVal,
      email: emailVal,
      address: form02Data.currentAddress,
      checkInStatus: false,
      photo: `https://i.pravatar.cc/150?u=P2_${pi}`,
      hasWon: false,
      drawStatus: 'cho',
      right: form02Data.registrationRight as any,
      type: utOptions[Math.floor(Math.random() * utOptions.length)],
      status: 'hoat_dong',
      profileStatus: appState === 'hoan_thanh' ? 'hoan_thanh' : 'chua_hoan_thanh',
      isDuplicate: false,
      history: [],
      applicationState: appState,
      groupK: gk,
      submitTime,
      processingDeadline: procDeadline,
      returnReason: appState === 'tra_ho_so' ? returnReasons[pi % returnReasons.length] : undefined,
      hardCopyDueDate: ['cho_ban_cung', 'qua_han_ban_cung', 'hoan_thanh'].includes(appState)
        ? new Date(Date.now() + (appState === 'qua_han_ban_cung' ? -86400000 : 86400000 * 3)).toISOString()
        : undefined,
      hardCopySubmitDate: appState === 'hoan_thanh' ? new Date(Date.now() - 48 * 3600000).toISOString() : undefined,
      storageArrivalDate: appState === 'hoan_thanh' ? new Date(Date.now() - 24 * 3600000).toISOString() : undefined,
      actionLog: actionLogEntries,
      form02Data,
      assignedOfficerId: officerId
    });
  }

  return dsHoSo;
};

const duLieuKC = sinhHoSoChinhXac('KC');
const duLieuYP = sinhHoSo(30, 'YP');

// Dữ liệu Vòng Bốc Thăm Mẫu
const voiQuayMau: Round[] = [
  {
    id: 1,
    code: 'VQ01',
    label: 'Vòng Ưu Tiên 1 - Mua',
    date: '2026-03-26',
    startTime: '08:15',
    endTime: '09:15',
    checkInOpenTime: '06:00',
    checkInCloseTime: '08:00',
    status: 'dang_dien_ra',
    participantIds: [],
    inventoryIds: [],
    inventoryMode: 'so_luong',
    inventoryCount: 200,
    winners: [],
    right: 'mua',
    participantType: 'ut1_4',
    roundType: 'uu_tien_trung',
    supervisorDeadlineTime: '09:10',
    resultReleaseMinutes: 5,
    displayParticipantCount: 200,
    displayStatus: 'Đã thiết lập',
    displayStatusColor: 'bg-blue-100 text-blue-700'
  },
  {
    id: 2,
    code: 'VQ02',
    label: 'Vòng Ưu Tiên 2 - Mua',
    date: '2026-03-26',
    startTime: '09:30',
    endTime: '10:30',
    checkInOpenTime: '06:00',
    checkInCloseTime: '08:00',
    status: 'cho',
    participantIds: [],
    inventoryIds: [],
    inventoryMode: 'so_luong',
    inventoryCount: 389,
    winners: [],
    right: 'mua',
    participantType: 'ut5',
    roundType: 'uu_tien_trung_truot',
    regularRoundStartTime: '10:45',
    resultReleaseMinutes: 5,
    displayParticipantCount: 1800,
    displayStatus: 'Đã thiết lập',
    displayStatusColor: 'bg-blue-100 text-blue-700'
  },
  {
    id: 3,
    code: 'VQ03',
    label: 'Vòng Thông Thường - Mua',
    date: '2026-03-26',
    startTime: '10:45',
    endTime: '11:45',
    checkInOpenTime: '06:00',
    checkInCloseTime: '08:00',
    status: 'cho',
    participantIds: [],
    inventoryIds: [],
    inventoryMode: 'so_luong',
    inventoryCount: 0,
    winners: [],
    right: 'mua',
    participantType: 'thuong',
    roundType: 'thong_thuong',
    resultReleaseMinutes: 5,
    isAutoGenerated: false,
    displayParticipantCount: 3000,
    displayStatus: 'Đã thiết lập',
    displayStatusColor: 'bg-blue-100 text-blue-700'
  },
  {
    id: 4,
    code: 'VQ04',
    label: 'Vòng Ưu Tiên 1 - Thuê/Mua',
    date: '2026-03-26',
    startTime: '14:15',
    endTime: '15:15',
    checkInOpenTime: '12:00',
    checkInCloseTime: '14:00',
    status: 'cho',
    participantIds: [],
    inventoryIds: [],
    inventoryMode: 'so_luong',
    inventoryCount: 10,
    winners: [],
    right: 'thue_mua',
    participantType: 'ut1_4',
    roundType: 'uu_tien_trung',
    supervisorDeadlineTime: '15:10',
    resultReleaseMinutes: 5,
    displayParticipantCount: 10,
    displayStatus: 'Chưa mở điểm danh',
    displayStatusColor: 'bg-orange-100 text-orange-700'
  },
  {
    id: 5,
    code: 'VQ05',
    label: 'Vòng Ưu Tiên 2 - Thuê/Mua',
    date: '2026-03-26',
    startTime: '15:30',
    endTime: '16:30',
    checkInOpenTime: '12:00',
    checkInCloseTime: '14:00',
    status: 'cho',
    participantIds: [],
    inventoryIds: [],
    inventoryMode: 'so_luong',
    inventoryCount: 20,
    winners: [],
    right: 'thue_mua',
    participantType: 'ut5',
    roundType: 'uu_tien_trung_truot',
    regularRoundStartTime: '16:45',
    resultReleaseMinutes: 5,
    displayParticipantCount: 50,
    displayStatus: 'Chưa mở điểm danh',
    displayStatusColor: 'bg-orange-100 text-orange-700'
  },
  {
    id: 6,
    code: 'VQ06',
    label: 'Vòng Thông Thường - Thuê/Mua',
    date: '2026-03-26',
    startTime: '16:45',
    endTime: '17:45',
    checkInOpenTime: '12:00',
    checkInCloseTime: '14:00',
    status: 'cho',
    participantIds: [],
    inventoryIds: [],
    inventoryMode: 'so_luong',
    inventoryCount: 0,
    winners: [],
    right: 'thue_mua',
    participantType: 'thuong',
    roundType: 'thong_thuong',
    resultReleaseMinutes: 5,
    displayParticipantCount: 100,
    displayStatus: 'Chưa mở điểm danh',
    displayStatusColor: 'bg-orange-100 text-orange-700'
  }
];

// Khởi tạo dữ liệu ban đầu
export const INITIAL_PROJECT_STATE = {
  'du_an_kc': {
    id: 'du_an_kc',
    name: 'NOXH HANDICO',
    prefix: 'KC',
    participants: duLieuKC,
    rounds: voiQuayMau,
    isGateOpen: false,
    isDataSealed: false,
    sealedHash: null as string | null
  },
  'du_an_yp': {
    id: 'du_an_yp',
    name: 'NOXH Yên Phong (GĐ 2)',
    prefix: 'YP',
    participants: duLieuYP,
    rounds: [],
    isGateOpen: false,
    isDataSealed: false,
    sealedHash: null as string | null
  }
};

// Dữ liệu Lịch Sử (Cho Tra Cứu)
const sinhLichSuDayDu = (soLuong: number, tieuTo: string): Participant[] => {
  const base = sinhHoSo(soLuong, tieuTo);
  return base.map((p, i) => {
    const laChienThang = i % 2 === 0;
    return {
      ...p,
      checkInStatus: true,
      checkInTime: '08:00:00',
      hasWon: laChienThang,
      drawStatus: laChienThang ? 'trung' : 'truot',
      assignedUnit: laChienThang ? `${['A','B','C'][Math.floor(Math.random()*3)]}${String(Math.floor(Math.random()*15)+1).padStart(2,'0')}.${String(Math.floor(Math.random()*12)+1).padStart(2,'0')}` : undefined,
      right: 'mua',
      type: 'thuong',
      status: 'hoat_dong',
      isDuplicate: false
    };
  });
};

export const PAST_PROJECTS_DATA: Record<string, Participant[]> = {
  'luu_tru_2023': sinhLichSuDayDu(100, 'HIS23'),
  'luu_tru_2022': sinhLichSuDayDu(100, 'HIS22'),
};

// --- DATA CẤU HÌNH NHÓM ĐỐI TƯỢNG K (PHASE 2) ---
export const GROUP_K_CONFIGS = [
  {
    id: 'K1',
    name: 'Người có công với cách mạng',
    description: 'Người có công với cách mạng, thân nhân liệt sĩ',
    requiredDocs: [
      { id: 'doc1', name: 'Đơn đăng ký mua/thuê/thuê mua NOXH (Mẫu 01)', required: true },
      { id: 'doc2', name: 'Giấy tờ chứng minh đối tượng người có công', required: true },
      { id: 'doc3', name: 'Giấy tờ chứng minh điều kiện cư trú', required: true },
      { id: 'doc4', name: 'Giấy tờ chứng minh điều kiện thu nhập', required: false }
    ]
  },
  {
    id: 'K2',
    name: 'Người thu nhập thấp, hộ nghèo, cận nghèo',
    description: 'Người thu nhập thấp, hộ nghèo, cận nghèo tại khu vực đô thị',
    requiredDocs: [
      { id: 'doc1', name: 'Đơn đăng ký (Mẫu 01)', required: true },
      { id: 'doc2', name: 'Giấy chứng minh điều kiện thu nhập (Mẫu 08)', required: true },
      { id: 'doc3', name: 'Giấy xác nhận thực trạng nhà ở (Mẫu 03)', required: true }
    ]
  },
  {
    id: 'K3',
    name: 'Người lao động tại doanh nghiệp',
    description: 'Người lao động đang làm việc tại các doanh nghiệp trong/ngoài KCN',
    requiredDocs: [
      { id: 'doc1', name: 'Đơn đăng ký (Mẫu 01)', required: true },
      { id: 'doc2', name: 'Hợp đồng lao động & Giấy xác nhận BHXH', required: true },
      { id: 'doc3', name: 'Giấy xác nhận thực trạng nhà ở', required: true }
    ]
  },
  {
    id: 'K4',
    name: 'Sĩ quan, quân nhân chuyên nghiệp',
    description: 'Sĩ quan, quân nhân chuyên nghiệp, hạ sĩ quan thuộc lực lượng vũ trang',
    requiredDocs: [
      { id: 'doc1', name: 'Đơn đăng ký (Mẫu 01)', required: true },
      { id: 'doc2', name: 'Quyết định phục viên/xuất ngũ', required: true },
      { id: 'doc3', name: 'Giấy xác nhận thực trạng nhà ở', required: true }
    ]
  },
  {
    id: 'K5',
    name: 'Cán bộ, công chức, viên chức',
    description: 'Cán bộ, công chức, viên chức hưởng lương từ NSNN',
    requiredDocs: [
      { id: 'doc1', name: 'Đơn đăng ký (Mẫu 01)', required: true },
      { id: 'doc2', name: 'Quyết định tuyển dụng/bổ nhiệm', required: true },
      { id: 'doc3', name: 'Xác nhận thu nhập cơ quan', required: true }
    ]
  },
  {
    id: 'K6',
    name: 'Hộ gia đình, cá nhân thuộc diện tái định cư',
    description: 'Hộ gia đình, cá nhân thuộc diện giải tỏa tái định cư',
    requiredDocs: [
      { id: 'doc1', name: 'Đơn đăng ký (Mẫu 01)', required: true },
      { id: 'doc2', name: 'Quyết định thu hồi đất / Biên bản giải tỏa', required: true },
      { id: 'doc3', name: 'Xác nhận chưa được bố trí tái định cư', required: true }
    ]
  },
  {
    id: 'K7',
    name: 'Người khuyết tật, người cao tuổi',
    description: 'Người khuyết tật, người cao tuổi neo đơn',
    requiredDocs: [
      { id: 'doc1', name: 'Đơn đăng ký (Mẫu 01)', required: true },
      { id: 'doc2', name: 'Giấy xác nhận khuyết tật / Giấy chứng nhận người cao tuổi', required: true },
      { id: 'doc3', name: 'Giấy xác nhận thực trạng nhà ở', required: true }
    ]
  },
  {
    id: 'K8',
    name: 'Sinh viên, học viên',
    description: 'Sinh viên, học viên các trường đại học, cao đẳng, trung cấp',
    requiredDocs: [
      { id: 'doc1', name: 'Đơn đăng ký thuê NOXH', required: true },
      { id: 'doc2', name: 'Giấy xác nhận sinh viên / Thẻ sinh viên', required: true }
    ]
  },
  {
    id: 'K9',
    name: 'Hộ gia đình đông con',
    description: 'Hộ gia đình từ 3 con trở lên chưa có nhà ở',
    requiredDocs: [
      { id: 'doc1', name: 'Đơn đăng ký (Mẫu 01)', required: true },
      { id: 'doc2', name: 'Sổ hộ khẩu / Giấy khai sinh của các con', required: true },
      { id: 'doc3', name: 'Giấy xác nhận chưa được hỗ trợ nhà ở', required: true }
    ]
  },
  {
    id: 'K10',
    name: 'Người lao động ngành giáo dục, y tế',
    description: 'Giáo viên, nhân viên y tế công lập',
    requiredDocs: [
      { id: 'doc1', name: 'Đơn đăng ký (Mẫu 01)', required: true },
      { id: 'doc2', name: 'Hợp đồng làm việc tại cơ sở GD/YT', required: true },
      { id: 'doc3', name: 'Xác nhận thu nhập', required: true }
    ]
  },
  {
    id: 'K11',
    name: 'Đối tượng khác theo quy định',
    description: 'Các đối tượng khác theo quy định của pháp luật về NOXH',
    requiredDocs: [
      { id: 'doc1', name: 'Đơn đăng ký (Mẫu 01)', required: true },
      { id: 'doc2', name: 'Giấy tờ chứng minh đối tượng', required: true },
      { id: 'doc3', name: 'Giấy xác nhận thực trạng nhà ở', required: false }
    ]
  }
];
