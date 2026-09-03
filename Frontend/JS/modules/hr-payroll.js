        function toggleFormLuong() {
            let type = document.getElementById('ns_type').value;
            let level = document.getElementById('ns_level').value;
            
            document.getElementById('ns_form_official').style.display = type === 'official' ? 'block' : 'none';
            document.getElementById('ns_form_parttime').style.display = type === 'part-time' ? 'block' : 'none';
            
            if(type === 'official') {
                document.getElementById('ns_box_kpi').style.display = level !== 'level1' ? 'block' : 'none';
            }
        }

        function calculateBaseSalary(emp) {
            if (emp.type === 'part-time') {
                return (emp.ptRate || 0) * (emp.ptHours || 0);
            } else {
                let p1 = emp.p1 || 0;
                let p2 = (emp.level !== 'level1') ? (emp.kpiRev || 0) * ((emp.kpiPercent || 0) / 100) : 0;
                let p3 = 0;
                if(emp.p3) {
                    if(emp.p3.c1) p3 += 200000;
                    if(emp.p3.c2) p3 += 200000;
                    if(emp.p3.c3) p3 += 200000;
                    if(emp.p3.c4) p3 += 200000;
                }
                return p1 + p2 + p3;
            }
        }

function saveNhanVien() {
    let id = document.getElementById('ns_id').value || 'NV-' + Date.now();
    let name = document.getElementById('ns_name').value;
    let phone = document.getElementById('ns_phone').value; // Lấy SĐT mới
    if(!name) return alert("Vui lòng nhập tên nhân viên!");

    let emp = {
        id: id,
        name: name,
        phone: phone, // Lưu SĐT vào DB
        startDate: document.getElementById('ns_startdate').value,
        position: document.getElementById('ns_position').value,
        level: document.getElementById('ns_level').value,
        type: document.getElementById('ns_type').value,
        note: document.getElementById('ns_note').value,
        bonus: parseNumber(document.getElementById('ns_bonus').value),
        deduct: parseNumber(document.getElementById('ns_deduct').value),
        paymentHistory: []
    };

    if (emp.type === 'official') {
        emp.p1 = parseNumber(document.getElementById('ns_p1').value);
        emp.kpiRev = parseNumber(document.getElementById('ns_kpi_rev').value);
        emp.kpiPercent = parseFloat(document.getElementById('ns_kpi_percent').value) || 0;
        emp.p3 = {
            c1: document.getElementById('ns_p3_1').checked,
            c2: document.getElementById('ns_p3_2').checked,
            c3: document.getElementById('ns_p3_3').checked,
            c4: document.getElementById('ns_p3_4').checked,
        };
    } else {
        emp.ptRate = parseNumber(document.getElementById('ns_pt_rate').value);
        emp.ptHours = parseNumber(document.getElementById('ns_pt_hours').value);
        emp.bonus = parseNumber(document.getElementById('ns_pt_bonus').value);
    }

    let existIndex = db.nhanSu.findIndex(n => n.id === id);
    if (existIndex > -1) {
        emp.paymentHistory = db.nhanSu[existIndex].paymentHistory;
        db.nhanSu[existIndex] = emp;
        logActivity("Nhân Sự", `Cập nhật thông tin nhân viên: ${name}`);
        alert("Cập nhật thành công!");
    } else {
        db.nhanSu.push(emp);
        logActivity("Nhân Sự", `Thêm mới nhân viên: ${name}`);
        alert("Thêm nhân viên thành công!");
    }
    
    resetFormNS();
    syncDB();
}
		function saThaiNhanVien(id) {
    let emp = db.nhanSu.find(n => n.id === id);
    if(!emp) return;
    
    if (emp.status === 'terminated') return alert("Nhân viên này đã nghỉ việc rồi Sếp ạ!");

    checkSecurity(`THANH LÝ HỢP ĐỒNG: ${emp.name}`, () => {
        // Hỏi Sếp ngày chính thức kết thúc hợp đồng (mặc định là hôm nay)
        let todayStr = new Date().toISOString().split('T')[0];
        let endDate = prompt(`📅 Nhập ngày kết thúc hợp đồng cho nhân viên [${emp.name}]:`, todayStr);
        
        if(!endDate) return; // Nếu Sếp bấm Hủy thì thôi

        if(confirm(`Xác nhận thanh lý hợp đồng nhân viên [${emp.name}] kể từ ngày ${endDate}?\n(Hồ sơ và lịch sử lương của nhân viên này vẫn sẽ được lưu trữ lại)`)) {
            
            // Ghi nhận trạng thái và ngày nghỉ
            emp.status = 'terminated';
            emp.endDate = endDate;
            
            // Ghi lại dấu vết vào Nhật ký hệ thống
            logActivity("Nhân Sự", `🚫 Thanh lý hợp đồng nhân viên: ${emp.name} (Ngày nghỉ: ${endDate})`);
            
            syncDB();
            alert(`✅ Đã cập nhật trạng thái "Đã nghỉ việc" cho ${emp.name}.`);
        }
    });
}
		function xoaVinhVienNhanVien(id) {
    checkSecurity("XÓA SẠCH DATA NHÂN VIÊN", () => {
        if(confirm("⚠️ XÓA VĨNH VIỄN: Sếp có chắc muốn xóa sạch toàn bộ dữ liệu của nhân viên này khỏi hệ thống không? (Không thể hoàn tác)")) {
            db.nhanSu = db.nhanSu.filter(n => n.id !== id);
            syncDB();
        }
    });
}
        function editNhanVien(id) {
            let emp = db.nhanSu.find(n => n.id === id);
            if(!emp) return;
            
            document.getElementById('ns_id').value = emp.id;
            document.getElementById('ns_name').value = emp.name;
            document.getElementById('ns_startdate').value = emp.startDate;
            document.getElementById('ns_position').value = emp.position;
            document.getElementById('ns_level').value = emp.level;
            document.getElementById('ns_type').value = emp.type;
            document.getElementById('ns_note').value = emp.note || '';
            document.getElementById('ns_bonus').value = formatVN(emp.bonus || 0);
            document.getElementById('ns_deduct').value = formatVN(emp.deduct || 0);

            if(emp.type === 'official') {
                document.getElementById('ns_p1').value = formatVN(emp.p1 || 0);
                document.getElementById('ns_kpi_rev').value = formatVN(emp.kpiRev || 0);
                document.getElementById('ns_kpi_percent').value = emp.kpiPercent || 0;
                if(emp.p3) {
                    document.getElementById('ns_p3_1').checked = emp.p3.c1;
                    document.getElementById('ns_p3_2').checked = emp.p3.c2;
                    document.getElementById('ns_p3_3').checked = emp.p3.c3;
                    document.getElementById('ns_p3_4').checked = emp.p3.c4;
                }
            } else {
                document.getElementById('ns_pt_rate').value = formatVN(emp.ptRate || 0);
                document.getElementById('ns_pt_hours').value = formatVN(emp.ptHours || 0);
                document.getElementById('ns_pt_bonus').value = formatVN(emp.bonus || 0);
            }

            toggleFormLuong();
            document.getElementById('form-luong-title').innerText = "Chỉnh sửa Nhân Viên: " + emp.name;
            document.getElementById('btn-save-ns').innerText = "CẬP NHẬT";
            document.getElementById('btn-cancel-ns').style.display = "inline-block";
        }

        function resetFormNS() {
            document.getElementById('ns_id').value = '';
            document.getElementById('ns_name').value = '';
            document.getElementById('ns_note').value = '';
            document.getElementById('ns_p1').value = '0';
            document.getElementById('ns_kpi_rev').value = '0';
            document.getElementById('ns_kpi_percent').value = '0';
            document.getElementById('ns_pt_rate').value = '0';
            document.getElementById('ns_pt_hours').value = '0';
            document.getElementById('ns_bonus').value = '0';
            document.getElementById('ns_pt_bonus').value = '0';
            document.getElementById('ns_deduct').value = '0';
            document.querySelectorAll('.check-luong input').forEach(c => c.checked = false);
            
            document.getElementById('form-luong-title').innerText = "Thêm / Chỉnh Sửa Nhân Viên";
            document.getElementById('btn-save-ns').innerText = "LƯU THÔNG TIN";
            document.getElementById('btn-cancel-ns').style.display = "none";
        }

        function xoaNhanVien(id) {
            if(confirm("Xóa vĩnh viễn nhân viên này?")) {
                db.nhanSu = db.nhanSu.filter(n => n.id !== id);
                syncDB();
            }
        }

     // --- CẬP NHẬT: CHỐT LƯƠNG & CHỌN VÍ ĐỂ CHI TRẢ (FIX LỖI LỆCH THÁNG) ---
function chotLuong(id) {
    let emp = db.nhanSu.find(n => n.id === id);
    if(!emp) return;

    let m = document.getElementById('f_month_ns').value;
    let y = document.getElementById('f_year_ns').value;

    // --- 1. RÀNG BUỘC NV CỨNG CHỈ 1 LẦN/THÁNG ---
    if (emp.type === 'official') {
        let exists = (emp.paymentHistory || []).some(p => {
            let d = new Date(p.payDate);
            return (d.getMonth() + 1) == parseInt(m) && d.getFullYear() == parseInt(y);
        });
        if (exists) return alert(`⛔ TỪ CHỐI: Nhân viên chính thức ${emp.name} đã được chốt lương tháng ${m}/${y} rồi. Không được chốt lần 2!`);
    }

    let base = calculateBaseSalary(emp);
    let net = base + (emp.bonus || 0) - (emp.deduct || 0);
    
    let lastDay = new Date(y, m, 0).getDate();
    let defaultDate = `${y}-${m}-${("0" + lastDay).slice(-2)}`;

    let inputDate = prompt(`📅 XÁC NHẬN NGÀY GHI SỔ QUỸ:\nĐang chốt lương cho tháng ${m}/${y}.`, defaultDate);
    if(!inputDate) return; 
    
    // --- 2. HỎI TUẦN NẾU LÀ PART-TIME ---
    let thongTinTuan = "";
    if (emp.type === 'part-time') {
        thongTinTuan = prompt("📅 Nhập tuần thanh toán cho Part-time (VD: Tuần 1, Tuần 2...):", "Tuần 1");
        if (!thongTinTuan) return;
    }
    
    let viChon = prompt(`💰 Xác nhận chốt lương cho ${emp.name} (Tháng ${m}/${y}).\nThực nhận: ${formatVN(net)} VNĐ\n\n1: Tiền mặt | 2: Thiên Long | 3: ACB`, "1");
    if(!viChon) return; 
    
    let mapVi = {"1":"TIENMAT", "2":"THIENLONG", "3":"ACB"};
    let thucChiVi = mapVi[viChon] || "TIENMAT"; 

    // Tạo ghi chú chi tiết
    let lyDoChi = `Thanh toán lương ${thongTinTuan} tháng ${m}/${y}`;
    
    let historyEntry = { payDate: inputDate, netSalary: net, note: emp.note || lyDoChi };
    emp.paymentHistory = emp.paymentHistory || [];
    emp.paymentHistory.push(historyEntry);

    // Reset các biến tạm sau khi chốt
    if(emp.type === 'official') {
        emp.kpiRev = 0; emp.bonus = 0; emp.deduct = 0; emp.note = '';
        if(emp.p3) { emp.p3.c1=false; emp.p3.c2=false; emp.p3.c3=false; emp.p3.c4=false; }
    } else {
        emp.ptHours = 0; emp.bonus = 0; emp.note = '';
    }

    // Bắn vào Sổ Quỹ
    if(!db.giaoDichVi) db.giaoDichVi = [];
    db.giaoDichVi.push({ 
        idGD: 'GD-' + Date.now(), 
        date: inputDate, 
        loai: 'CHI', 
        vi: thucChiVi, 
        doiTuong: emp.name, 
        soTien: net, 
        lyDo: lyDoChi, 
        hangMuc: 'Lương' 
    });

    logActivity("Chốt Lương", `${lyDoChi} cho ${emp.name}. Số tiền: ${formatVN(net)}đ`);
    alert(`✅ Đã chốt lương thành công!`);
    syncDB();
}
      // CẬP NHẬT BẢNG NHÂN SỰ: TỰ ĐỘNG PHÂN LOẠI ĐANG LÀM / ĐÃ NGHỈ
function renderNhanVien() {
    let htmlNS = '';
    
    // Sắp xếp: Người đang làm hiện lên trên, người đã nghỉ chìm xuống dưới
    let sortedNS = [...db.nhanSu].sort((a, b) => {
        let aStatus = a.status === 'terminated' ? 1 : 0;
        let bStatus = b.status === 'terminated' ? 1 : 0;
        return aStatus - bStatus;
    });

    sortedNS.forEach(emp => {
        let isActive = emp.status !== 'terminated';
        let base = isActive ? calculateBaseSalary(emp) : 0;
        let net = isActive ? (base + (emp.bonus || 0) - (emp.deduct || 0)) : 0;
        
        let posName = nsPositions.find(p => p.id === emp.position)?.name || '';
        let lvlName = nsLevels.find(l => l.id === emp.level)?.name || '';

        // Tùy biến giao diện dựa trên trạng thái
        let rowStyle = isActive ? '' : 'background-color: #f8f9fa; opacity: 0.6;'; // Bôi xám người đã nghỉ
        
        let statusBadge = isActive 
            ? '<span style="color:#1e8e3e; font-size:12px; font-weight:bold;">🟢 Đang làm việc</span>' 
            : `<span style="color:#d93025; font-size:12px; font-weight:bold;">🔴 Đã nghỉ (${emp.endDate})</span>`;

        // Đã nghỉ thì giấu nút chốt lương đi, chỉ để lại nút Xem/Sửa và Xóa hẳn
        let actionButtons = isActive 
            ? `<button class="btn-small btn-success" onclick="chotLuong('${emp.id}')">✔️ Chốt Lương</button>
               <button class="btn-small btn-warning" onclick="editNhanVien('${emp.id}')">✏️ Sửa</button>
               <button class="btn-small btn-danger" onclick="saThaiNhanVien('${emp.id}')" title="Thanh lý hợp đồng">🚫 Nghỉ việc</button>`
            : `<button class="btn-small btn-warning" onclick="editNhanVien('${emp.id}')">👁️ Xem</button>
               <button class="btn-small btn-outline" style="border-color:#d93025; color:#d93025;" onclick="xoaVinhVienNhanVien('${emp.id}')" title="Xóa vĩnh viễn khỏi Database">🗑️ Xóa hẳn</button>`;

        htmlNS += `<tr style="${rowStyle}">
            <td><b>${emp.name}</b><br><i style="font-size:11px; color:#666">${emp.type === 'official' ? 'Hợp đồng' : 'Part-time'}</i></td>
            <td style="font-family: monospace; font-weight: bold;">${emp.phone || '-'}</td>
            <td>${posName}<br><span style="font-size:11px; color:#1a73e8">${lvlName}</span></td>
            <td style="color:#555;">${isActive ? formatVN(base) : '-'}</td>
            <td style="font-weight:bold; color:#1e8e3e">${isActive ? formatVN(net) + ' đ' : '-'}</td>
            <td class="text-center">
                <div style="margin-bottom: 5px;">${statusBadge}</div>
                ${actionButtons}
            </td>
        </tr>`;
    });
    
    document.getElementById('table_nhanvien').innerHTML = htmlNS || '<tr><td colspan="6" style="text-align:center">Chưa có nhân viên</td></tr>';

    // (Phần render lịch sử trả lương giữ nguyên như cũ)
    let m = document.getElementById('f_month_ns').value; 
    let y = document.getElementById('f_year_ns').value;
    let prefix = y + '-' + m;
    let htmlLichSu = '';
    db.nhanSu.forEach(emp => {
        (emp.paymentHistory || []).forEach(p => {
            if(p.payDate.startsWith(prefix)) {
                let dateObj = new Date(p.payDate);
                htmlLichSu += `<tr>
                    <td>${("0" + dateObj.getDate()).slice(-2)}/${("0" + (dateObj.getMonth() + 1)).slice(-2)}/${dateObj.getFullYear()}</td>
                    <td><b>${emp.name}</b></td>
                    <td>Tháng ${m}/${y}</td>
                    <td style="font-weight:bold; color:#1e8e3e">${formatVN(p.netSalary)}</td>
                    <td>${p.note}</td>
                </tr>`;
            }
        });
    });
    document.getElementById('table_lichsu_luong').innerHTML = htmlLichSu || '<tr><td colspan="5" style="text-align:center">Không có lịch sử trả lương trong tháng này</td></tr>';
}

        // ==================== FINANCIAL REPORTING V11.1 (LINKED WITH SALARY) ====================
// =================================================================
// BỘ NÃO V22 FINAL: KHÔI PHỤC CHUYỂN TAB & FULL BÁO CÁO TỰ ĐỘNG
// =================================================================

