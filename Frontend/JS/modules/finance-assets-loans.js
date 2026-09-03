function getAutoFinData(month, year) {
    let prefix = year + '-' + month;
    let reportStartDate = new Date(year, parseInt(month) - 1, 1);
    
    // 1. TÍNH TIỀN MẶT & BANK ĐẦU KỲ (Lũy kế từ quá khứ đến trước tháng này)
    let autoTienDauKy = 0;
    (db.giaoDichVi || []).forEach(gd => {
        let gdDate = new Date(gd.date);
        if (gdDate < reportStartDate) {
            autoTienDauKy += (gd.loai === 'THU' ? 1 : -1) * Number(gd.soTien || 0);
        }
    });

    // 2. TÍNH TIỀN CHI ĐẦU TƯ (Tổng nguyên giá tài sản mua trong tháng)
    let autoTienDautu = 0;
    (db.taiSan || []).forEach(ts => {
        if (ts.ngayMua && ts.ngayMua.startsWith(prefix)) {
            autoTienDautu += Number(ts.nguyenGia || 0);
        }
    });

    // 3. CÁC DỮ LIỆU TỰ ĐỘNG KHÁC (Bán hàng, Lương, Khấu hao...)
    let salesData = (db.banHang || []).filter(b => b.date && b.date.startsWith(prefix));
    let autoDoanhThu = salesData.reduce((sum, b) => sum + (Number(b.tien) || 0), 0);
    let autoTienThu = salesData.reduce((sum, b) => sum + (Number(b.tienThuVat || b.tien) || 0), 0); 
    let autoGiaVon = salesData.reduce((sum, b) => sum + (Number(b.tien || 0) - Number(b.loiNhuan || 0)), 0);

    let autoTienLuong = 0;
    (db.nhanSu || []).forEach(emp => {
        (emp.paymentHistory || []).forEach(p => {
            if (p.payDate && p.payDate.startsWith(prefix)) autoTienLuong += (Number(p.netSalary) || 0);
        });
    });

    let autoCPBanHang = 0; let autoCPQuanLy = 0;
    (db.giaoDichVi || []).forEach(gd => {
        if(gd.date && gd.date.startsWith(prefix) && gd.loai === 'CHI') {
            if(gd.hangMuc === 'Chi phí bán hàng') autoCPBanHang += Number(gd.soTien);
            if(gd.hangMuc === 'Chi phí vận hành') autoCPQuanLy += Number(gd.soTien);
        }
    });

    let autoKhauHao = 0; let autoTaiSanDaiHan = 0;
    (db.taiSan || []).forEach(ts => {
        if(ts.status === 'Đang chạy') {
            let buyDate = new Date(ts.ngayMua); buyDate.setDate(1);
            if(reportStartDate >= buyDate) {
                let monthsDiff = (reportStartDate.getFullYear() - buyDate.getFullYear()) * 12 + (reportStartDate.getMonth() - buyDate.getMonth());
                let khauHaoThang = Number(ts.nguyenGia || 0) / Number(ts.soThang || 1);
                if(monthsDiff < ts.soThang) autoKhauHao += khauHaoThang;
                let soThangDaKhauHao = Math.min(monthsDiff + 1, ts.soThang); 
                autoTaiSanDaiHan += Math.max(0, Number(ts.nguyenGia || 0) - (khauHaoThang * soThangDaKhauHao));
            }
        }
    });

    let autoLaiVay = 0, autoGocVay = 0, autoNoDaiHan = 0, autoTienVay = 0;
    (db.khoanVay || []).forEach(loan => {
        if (loan.start && loan.start.startsWith(prefix)) autoTienVay += Number(loan.amount || 0);
        if (typeof calculateAmortization === 'function') {
            let schedule = calculateAmortization(loan);
            let kyHienTai = schedule.find(s => s.month === month && s.year === year);
            if (kyHienTai) { autoLaiVay += kyHienTai.interest; autoGocVay += kyHienTai.principal; }
            let remaining = Number(loan.amount || 0);
            schedule.forEach(s => {
                let sDate = new Date(s.year, parseInt(s.month)-1, 1);
                if (sDate <= reportStartDate) remaining -= s.principal;
            });
            autoNoDaiHan += Math.max(0, remaining);
        }
    });

    return { 
        doanhthu: autoDoanhThu, tienThuVat: autoTienThu, giavon: autoGiaVon, 
        tien_luong: autoTienLuong, khauhao: autoKhauHao, laivay: autoLaiVay,
        gocvay: autoGocVay, no_daihan: autoNoDaiHan, tien_vay: autoTienVay, taisan_daihan: autoTaiSanDaiHan,
        cp_banhang: autoCPBanHang, cp_quanly: autoCPQuanLy,
        tien_dautu: autoTienDautu, tien_dauky: autoTienDauKy // Trả về 2 giá trị Sếp cần
    };
}

function moFormNhapTaiChinh() {
    document.getElementById('form_nhap_taichinh').style.display = 'block';
    let m = document.getElementById('f_month_tc').value; let y = document.getElementById('f_year_tc').value;
    let autoData = window.financeSqlReport?.key === `${y}-${m}` ? window.financeSqlReport.auto : getAutoFinData(m, y);
    
    // Gán các giá trị auto
    document.getElementById('tc_doanhthu').value = formatVN(autoData.doanhthu);
    document.getElementById('tc_giavon').value = formatVN(autoData.giavon);
    document.getElementById('tc_tien_luong').value = formatVN(autoData.tien_luong);
    document.getElementById('tc_tien_thu').value = formatVN(autoData.tienThuVat); 
    document.getElementById('tc_cp_banhang').value = formatVN(autoData.cp_banhang);
    document.getElementById('tc_cp_quanly').value = formatVN(autoData.cp_quanly);
    
    // ĐÂY LÀ 2 DÒNG MỚI CHO SẾP
    document.getElementById('tc_tien_dautu').value = formatVN(autoData.tien_dautu);
    document.getElementById('tc_tien_dauky').value = formatVN(autoData.tien_dauky);

    // Các ô còn lại
    if(document.getElementById('tc_tien_trano')) document.getElementById('tc_tien_trano').value = formatVN(autoData.gocvay + autoData.laivay); 
    if(document.getElementById('tc_tien_vay')) document.getElementById('tc_tien_vay').value = formatVN(autoData.tien_vay); 
    if(document.getElementById('tc_taisan_daihan')) document.getElementById('tc_taisan_daihan').value = formatVN(autoData.taisan_daihan); 
    if(document.getElementById('tc_no_daihan')) document.getElementById('tc_no_daihan').value = formatVN(autoData.no_daihan); 

    let manualData = window.financeSqlReport?.key === `${y}-${m}` ? window.financeSqlReport.manual : (db.taiChinh.find(t => t.month === m && t.year === y) || {});
    document.getElementById('tc_giamtru').value = formatVN(manualData.giamtru || 0);
    document.getElementById('tc_phaithu').value = formatVN(manualData.phaithu || 0);
}

function saveTaiChinh(closeForm = false) {
    let m = document.getElementById('f_month_tc').value; let y = document.getElementById('f_year_tc').value;
    let autoData = window.financeSqlReport?.key === `${y}-${m}` ? window.financeSqlReport.auto : getAutoFinData(m, y);

    let data = {
        month: m, year: y,
        doanhthu: autoData.doanhthu, giavon: autoData.giavon,
        tien_tra_ncc: autoData.tien_tra_ncc, tonkho: autoData.tonkho, no_nganhan: autoData.no_nganhan,
        tien_luong: autoData.tien_luong, tien_thu: autoData.tienThuVat,
        laivay: autoData.laivay, gocvay: autoData.gocvay, no_daihan: autoData.no_daihan,
        tien_vay: autoData.tien_vay, taisan_daihan: autoData.taisan_daihan, khauhao: autoData.khauhao,

        giamtru: parseNumber(document.getElementById('tc_giamtru').value),
        cp_banhang: parseNumber(document.getElementById('tc_cp_banhang').value),
        cp_quanly: parseNumber(document.getElementById('tc_cp_quanly').value),
        tien_dautu: parseNumber(document.getElementById('tc_tien_dautu').value),
        tien_dauky: parseNumber(document.getElementById('tc_tien_dauky').value),
        phaithu: parseNumber(document.getElementById('tc_phaithu').value)
    };
    
    db.taiChinh = db.taiChinh.filter(t => !(t.month === m && t.year === y));
    db.taiChinh.push(data);
    syncDB();
    if(closeForm) document.getElementById('form_nhap_taichinh').style.display = 'none';
}

// KHÔI PHỤC CHỨC NĂNG CHUYỂN TAB VÀ IN ẤN
function switchFinTab(tab) {
    document.querySelectorAll('.fin-tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.fin-content').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('fin-' + tab).classList.add('active');
}

function clearPrintMode() {
    document.body.classList.remove('print-report', 'print-receipt');
    document.querySelectorAll('.fin-content.print-target').forEach(section => section.classList.remove('print-target'));
}

function printReport(type) {
    const report = document.getElementById(`fin-${type}`);
    if (!report) return alert('Không tìm thấy báo cáo cần in.');
    clearPrintMode();
    report.classList.add('print-target');
    document.body.classList.add('print-report');
    const titles = { pl: 'Báo cáo kết quả hoạt động kinh doanh', cashflow: 'Báo cáo lưu chuyển tiền tệ', balance: 'Bảng cân đối kế toán' };
    const previousTitle = document.title;
    document.title = `${titles[type] || 'Báo cáo tài chính'} - Phạm Khôi ERP`;
    setTimeout(() => {
        window.print();
        document.title = previousTitle;
    }, 80);
}

window.addEventListener('afterprint', clearPrintMode);

function renderTaiChinh() {
    // Lần đầu mở báo cáo, tự chọn tháng hiện tại thay vì mặc định Tháng 1.
    // Tránh tình trạng có dữ liệu nhưng người dùng đang xem nhầm kỳ báo cáo.
    const monthFilter = document.getElementById('f_month_tc');
    const yearFilter = document.getElementById('f_year_tc');
    if (monthFilter && yearFilter && !monthFilter.dataset.initialized) {
        const today = new Date();
        const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
        const currentYear = String(today.getFullYear());
        if ([...monthFilter.options].some(option => option.value === currentMonth)) monthFilter.value = currentMonth;
        if ([...yearFilter.options].some(option => option.value === currentYear)) yearFilter.value = currentYear;
        monthFilter.dataset.initialized = 'true';
    }
    let m = document.getElementById('f_month_tc').value; let y = document.getElementById('f_year_tc').value;
    const sqlReport = window.financeSqlReport?.key === `${y}-${m}` ? window.financeSqlReport : null;
    let autoData = sqlReport?.auto || getAutoFinData(m, y);
    let manualData = sqlReport?.manual || db.taiChinh.find(t => t.month === m && t.year === y) || { giamtru: 0, cp_banhang: 0, cp_quanly: 0, tien_dautu: 0, tien_dauky: 0, phaithu: 0 };
    let data = { ...autoData, ...manualData, tien_thu: autoData.tienThuVat, tien_luong: autoData.tien_luong, no_daihan: autoData.no_daihan, tien_vay: autoData.tien_vay, taisan_daihan: autoData.taisan_daihan };

    let doanhThuThuan = data.doanhthu - (Number(data.giamtru) || 0);
    let loiNhuanGop = doanhThuThuan - data.giavon;
    let tongChiPhi = (Number(data.cp_banhang) || 0) + (Number(data.cp_quanly) || 0) + (Number(data.khauhao) || 0) + (Number(data.laivay) || 0);
    let loiNhuanRong = loiNhuanGop - tongChiPhi;
    let bienLNgop = doanhThuThuan > 0 ? (loiNhuanGop / doanhThuThuan * 100).toFixed(1) : 0;

    const hasActivity = sqlReport?.hasActivity ?? ((db.banHang || []).some(item => (item.date || '').startsWith(`${y}-${m}`)) ||
        (db.giaoDichVi || []).some(item => (item.date || '').startsWith(`${y}-${m}`)) ||
        (db.taiChinh || []).some(item => item.month === m && item.year === y));
    const financeNotice = document.getElementById('finance_period_notice');
    if (financeNotice) {
        financeNotice.style.display = hasActivity ? 'none' : 'block';
        financeNotice.textContent = hasActivity ? '' : `Chưa có phát sinh tài chính trong tháng ${m}/${y}. Hãy chọn kỳ khác, hoặc tạo Phiếu bán hàng / giao dịch Sổ quỹ để báo cáo có số liệu.`;
    }

    document.getElementById('sum_doanhthu').innerText = formatVN(doanhThuThuan);
    document.getElementById('sum_loinhuan').innerText = formatVN(loiNhuanGop);
    
    let dongTienKD = data.tien_thu - data.tien_tra_ncc - data.tien_luong;
    let dongTienDT = -(Number(data.tien_dautu) || 0);
    let dongTienTC = (Number(data.tien_vay) || 0) - (data.gocvay + data.laivay);
    let tienMatCuoiKy = (Number(data.tien_dauky) || 0) + dongTienKD + dongTienDT + dongTienTC;
    
    document.getElementById('sum_tienmat').innerText = formatVN(tienMatCuoiKy);
    document.getElementById('sum_ratio').innerText = bienLNgop + '%';

    let plHtml = `
        <tr class="section-header"><td colspan="3">I. DOANH THU & GIÁ VỐN</td></tr>
        <tr><td class="subsection">Doanh thu bán hàng (Tab 4)</td><td class="text-right">${formatVN(data.doanhthu)}</td><td class="text-right">100%</td></tr>
        <tr><td class="subsection">Giảm trừ doanh thu</td><td class="text-right negative">(${formatVN(data.giamtru)})</td><td class="text-right"></td></tr>
        <tr class="total-row"><td><b>Doanh thu thuần</b></td><td class="text-right"><b>${formatVN(doanhThuThuan)}</b></td><td class="text-right">100%</td></tr>
        <tr><td class="subsection">Giá vốn hàng bán (COGS)</td><td class="text-right negative">(${formatVN(data.giavon)})</td><td class="text-right">${doanhThuThuan>0 ? (data.giavon/doanhThuThuan*100).toFixed(1) : 0}%</td></tr>
        <tr class="total-row"><td><b>Lợi nhuận gộp</b></td><td class="text-right positive"><b>${formatVN(loiNhuanGop)}</b></td><td class="text-right"><b>${bienLNgop}%</b></td></tr>
        <tr class="section-header"><td colspan="3">II. CHI PHÍ HOẠT ĐỘNG</td></tr>
        <tr><td class="subsection">Chi phí Lương (Tab 7)</td><td class="text-right negative">(${formatVN(data.tien_luong)})</td><td class="text-right"></td></tr>
        <tr><td class="subsection">Khấu hao tài sản (Tab 8)</td><td class="text-right negative">(${formatVN(data.khauhao)})</td><td class="text-right"></td></tr>
        <tr><td class="subsection">Lãi vay ngân hàng (Tab 10)</td><td class="text-right negative">(${formatVN(data.laivay || 0)})</td><td class="text-right"></td></tr>
        <tr><td class="subsection">Chi phí Bán hàng/Marketing</td><td class="text-right negative">(${formatVN(data.cp_banhang)})</td><td class="text-right"></td></tr>
        <tr><td class="subsection">Chi phí Báo cáo khác</td><td class="text-right negative">(${formatVN(data.cp_quanly)})</td><td class="text-right"></td></tr>
        <tr class="grand-total"><td><b>LỢI NHUẬN RÒNG</b></td><td class="text-right"><b>${formatVN(loiNhuanRong)}</b></td><td class="text-right"><b>${doanhThuThuan>0 ? (loiNhuanRong/doanhThuThuan*100).toFixed(1) : 0}%</b></td></tr>
    `;
    document.getElementById('pl_table_body').innerHTML = plHtml;

    let cfHtml = `
        <tr class="section-header"><td colspan="2">I. DÒNG TIỀN TỪ KINH DOANH</td></tr>
        <tr><td class="subsection">Tiền thu từ Khách Hàng</td><td class="text-right positive">+${formatVN(data.tien_thu)}</td></tr>
        <tr><td class="subsection">Tiền trả Nhà Cung Cấp</td><td class="text-right negative">-${formatVN(data.tien_tra_ncc)}</td></tr>
        <tr><td class="subsection">Tiền trả Lương Nhân Viên</td><td class="text-right negative">-${formatVN(data.tien_luong)}</td></tr>
        <tr class="total-row"><td><b>Dòng tiền thuần từ HĐKD</b></td><td class="text-right"><b>${formatVN(dongTienKD)}</b></td></tr>
        <tr class="section-header"><td colspan="2">II. DÒNG TIỀN ĐẦU TƯ & TÀI CHÍNH</td></tr>
        <tr><td class="subsection">Tiền chi Đầu tư / Mua sắm</td><td class="text-right negative">-${formatVN(data.tien_dautu)}</td></tr>
        <tr><td class="subsection">Tiền Giải Ngân Vay (Tab 10)</td><td class="text-right positive">+${formatVN(data.tien_vay)}</td></tr>
        <tr><td class="subsection">Tiền Trả Nợ Gốc & Lãi (Tab 10)</td><td class="text-right negative">-${formatVN(data.gocvay + data.laivay)}</td></tr>
        <tr class="grand-total"><td><b>TỔNG DÒNG TIỀN THUẦN</b></td><td class="text-right"><b>${formatVN(dongTienKD+dongTienDT+dongTienTC)}</b></td></tr>
        <tr class="total-row"><td><b>Tiền mặt đầu kỳ</b></td><td class="text-right">${formatVN(data.tien_dauky)}</td></tr>
        <tr class="grand-total"><td><b>TIỀN MẶT CUỐI KỲ</b></td><td class="text-right"><b>${formatVN(tienMatCuoiKy)}</b></td></tr>
    `;
    document.getElementById('cf_table_body').innerHTML = cfHtml;

    let taiSanNganHan = (Number(data.tien_dauky)||0) + (Number(data.phaithu)||0) + data.tonkho;
    let tongTaiSan = taiSanNganHan + data.taisan_daihan;
    let tongNo = data.no_nganhan + data.no_daihan;
    let vonChuSoHuu = tongTaiSan - tongNo;
    
    document.getElementById('bs_assets_body').innerHTML = `
        <tr class="section-header"><td colspan="2">TÀI SẢN</td></tr>
        <tr><td class="subsection">Tiền mặt & Ngân hàng</td><td class="text-right">${formatVN(data.tien_dauky)}</td></tr>
        <tr><td class="subsection">Phải thu khách hàng</td><td class="text-right">${formatVN(data.phaithu)}</td></tr>
        <tr><td class="subsection">Hàng tồn kho (Tab 3)</td><td class="text-right">${formatVN(data.tonkho)}</td></tr>
        <tr><td class="subsection">Tài sản cố định (Tab 8)</td><td class="text-right">${formatVN(data.taisan_daihan)}</td></tr>
        <tr class="grand-total"><td><b>TỔNG TÀI SẢN</b></td><td class="text-right"><b>${formatVN(tongTaiSan)}</b></td></tr>
    `;
    document.getElementById('bs_liabilities_body').innerHTML = `
        <tr class="section-header"><td colspan="2">NỢ & VỐN CHỦ SỞ HỮU</td></tr>
        <tr><td class="subsection">Nợ NCC ngắn hạn (Tab 5)</td><td class="text-right">${formatVN(data.no_nganhan)}</td></tr>
        <tr><td class="subsection">Nợ dài hạn Ngân Hàng (Tab 10)</td><td class="text-right">${formatVN(data.no_daihan)}</td></tr>
        <tr class="total-row"><td><b>Tổng nợ phải trả</b></td><td class="text-right"><b>${formatVN(tongNo)}</b></td></tr>
        <tr><td class="subsection">Vốn & Lợi nhuận giữ lại</td><td class="text-right">${formatVN(vonChuSoHuu)}</td></tr>
        <tr class="grand-total"><td><b>TỔNG NỢ & VỐN CSH</b></td><td class="text-right"><b>${formatVN(tongTaiSan)}</b></td></tr>
    `;

    // KHÔI PHỤC VẼ BẢNG CHỈ SỐ SỨC KHỎE
    if(document.getElementById('ratios_grid')) {
        let vongQuayTonKho = data.tonkho > 0 ? (data.giavon / data.tonkho).toFixed(2) : 0;
        let vongQuayPhaiThu = (Number(data.phaithu)||0) > 0 ? (doanhThuThuan / data.phaithu).toFixed(2) : 0;
        let currentRatio = data.no_nganhan > 0 ? (taiSanNganHan / data.no_nganhan).toFixed(2) : (taiSanNganHan > 0 ? '∞' : 0);
        let roe = vonChuSoHuu > 0 ? (loiNhuanRong / vonChuSoHuu * 100).toFixed(1) : 0;
        let debtRatio = tongTaiSan > 0 ? (tongNo / tongTaiSan * 100).toFixed(1) : 0;

        document.getElementById('ratios_grid').innerHTML = `
            <div class="ratio-card ${vongQuayTonKho >= 4 ? 'success' : vongQuayTonKho >= 2 ? '' : 'warning'}"><div class="ratio-label">Vòng Quay Tồn Kho</div><div class="ratio-value">${vongQuayTonKho}x</div></div>
            <div class="ratio-card ${vongQuayPhaiThu >= 6 ? 'success' : vongQuayPhaiThu >= 4 ? '' : 'warning'}"><div class="ratio-label">Vòng Quay Phải Thu</div><div class="ratio-value">${vongQuayPhaiThu}x</div></div>
            <div class="ratio-card ${currentRatio >= 1.5 ? 'success' : currentRatio >= 1 ? '' : 'danger'}"><div class="ratio-label">Thanh Toán Hiện Hành</div><div class="ratio-value">${currentRatio}</div></div>
            <div class="ratio-card ${parseFloat(bienLNgop) >= 25 ? 'success' : parseFloat(bienLNgop) >= 15 ? '' : 'warning'}"><div class="ratio-label">Biên Lợi Nhuận Gộp</div><div class="ratio-value">${bienLNgop}%</div></div>
            <div class="ratio-card ${parseFloat(roe) >= 15 ? 'success' : parseFloat(roe) >= 8 ? '' : 'warning'}"><div class="ratio-label">ROE</div><div class="ratio-value">${roe}%</div></div>
            <div class="ratio-card ${parseFloat(debtRatio) <= 50 ? 'success' : parseFloat(debtRatio) <= 70 ? '' : 'warning'}"><div class="ratio-label">Nợ / Tổng Tài Sản</div><div class="ratio-value">${debtRatio}%</div></div>
        `;
    }

    // KHÔI PHỤC VẼ LỊCH SỬ BÁO CÁO
    if(document.getElementById('table_lichsu_tc')) {
        const financialHistory = sqlReport?.history || db.taiChinh || [];
        document.getElementById('table_lichsu_tc').innerHTML = financialHistory.sort((a,b) => (b.year + b.month).localeCompare(a.year + a.month)).map(t => {
            let dt = t.doanhthu - (Number(t.giamtru)||0);
            let lng = dt - t.giavon;
            let lnr = lng - (Number(t.cp_banhang)||0) - (Number(t.cp_quanly)||0) - (Number(t.khauhao)||0) - (Number(t.laivay)||0);
            let tmck = (Number(t.tien_dauky)||0) + (Number(t.tien_thu)||0) - (Number(t.tien_tra_ncc)||0) - (Number(t.tien_luong)||0) - (Number(t.tien_dautu)||0) + (Number(t.tien_vay)||0) - ((Number(t.gocvay)||0) + (Number(t.laivay)||0));
            return '<tr><td>' + t.month + '/' + t.year + '</td><td>' + formatVN(dt) + '</td><td>' + formatVN(lng) + '</td><td>' + formatVN(lnr) + '</td><td style="font-weight:bold">' + formatVN(tmck) + '</td></tr>';
        }).join('') || '<tr><td colspan="5" style="text-align:center">Chưa có dữ liệu</td></tr>';
    }
}
// ==================== LOGIC Báo cáo TÀI SẢN (UPDATE CHO TÀI SẢN CŨ) ====================
function saveTaiSan() {
    let name = document.getElementById('ts_name').value.trim();
    let gia = parseNumber(document.getElementById('ts_gia').value);
    let ngay = document.getElementById('ts_ngay').value;
    let thang = parseInt(document.getElementById('ts_thang').value);
    let wallet = document.getElementById('ts_wallet').value; 
    let isOldAsset = document.getElementById('ts_is_old') ? document.getElementById('ts_is_old').checked : false;

    if(!name || gia <= 0 || !thang) return alert("Sếp nhập đủ Tên máy, Giá và Số tháng nhé!");

    db.taiSan.push({ id: 'TS-' + Date.now(), name, nguyenGia: gia, ngayMua: ngay, soThang: thang, status: 'Đang chạy' });

    // NẾU LÀ TÀI SẢN MỚI THÌ MỚI BẮN SANG SỔ QUỸ ĐỂ TRỪ TIỀN
    if (!isOldAsset) {
        if(!db.giaoDichVi) db.giaoDichVi = [];
        db.giaoDichVi.push({
            idGD: 'GD-' + Date.now(),
            date: ngay,
            loai: 'CHI',
            vi: wallet,
            doiTuong: 'Mua sắm tài sản',
            soTien: gia,
            lyDo: 'Mua máy: ' + name,
            hangMuc: 'Khác'
        });
        alert("✅ Đã lưu tài sản và lập Phiếu Chi trừ tiền trong ví!");
    } else {
        alert("✅ Đã ghi nhận TÀI SẢN CŨ vào hệ thống (Không trừ quỹ tiền mặt)!");
    }

    // Reset lại form
    document.getElementById('ts_name').value = '';
    document.getElementById('ts_gia').value = '0';
    if(document.getElementById('ts_is_old')) document.getElementById('ts_is_old').checked = false;
    syncDB();
}

function renderTaiSan() {
    let html = '';
    (db.taiSan || []).forEach(ts => {
        let kh_thang = ts.nguyenGia / ts.soThang;
        let isRunning = ts.status === 'Đang chạy';
        let statusBadge = isRunning 
            ? '<span style="color:#1e8e3e; font-weight:bold">Đang chạy</span>' 
            : '<span style="color:#666">Đã thanh lý</span>';

        let btnAction = isRunning 
            ? `<button class="btn-small btn-warning" onclick="thanhLyTaiSan('${ts.id}')">Thanh lý</button>` 
            : '';

        html += `<tr>
            <td><b>${ts.name}</b></td>
            <td>${ts.ngayMua}</td>
            <td>${formatVN(ts.nguyenGia)} đ</td>
            <td>${ts.soThang} th</td>
            <td style="font-weight:bold; color:var(--danger)">${formatVN(kh_thang)} đ</td>
            <td>${statusBadge}</td>
            <td>
                ${btnAction}
                <button class="btn-small btn-danger" onclick="xoaTaiSan('${ts.id}')">Xóa</button>
            </td>
        </tr>`;
    });

    const tableBody = document.getElementById('table_taisan');
    if (tableBody) {
        tableBody.innerHTML = html || '<tr><td colspan="7" style="text-align:center; padding:20px; color:#999;">Chưa có máy móc nào. Sếp hãy thêm máy ở form trên.</td></tr>';
    }
}

function thanhLyTaiSan(id) {
	saveState();
    if(confirm("Xác nhận máy này đã hỏng hoặc thanh lý?")) {
        let ts = db.taiSan.find(t => t.id === id);
        if(ts) ts.status = 'Đã thanh lý';
        syncDB();
    }
}

function xoaTaiSan(id) {
    if(confirm("Sếp chắc chắn muốn XÓA VĨNH VIỄN máy này khỏi dữ liệu?")) {
        db.taiSan = db.taiSan.filter(t => t.id !== id);
        syncDB();
    }
}
// =================================================================
// BỘ NÃO V19: ĐỌC TRỰC TIẾP TỪ TAB 4 (XUẤT BÁN HÀNG) - BẤT TỬ 100%
// =================================================================

function renderSalesAnalysis() {
    let m = document.getElementById('f_month_tc').value;
    let y = document.getElementById('f_year_tc').value;

    if (!db.banHang) db.banHang = [];
    
    // Lấy toàn bộ đơn đã xuất bán trong Tháng từ Tab 4
    let filtered = db.banHang.filter(b => b.date && b.date.startsWith(`${y}-${m}`));

    const setHTML = (id, html) => {
        let el = document.getElementById(id);
        if (el) el.innerHTML = html;
    };

    if (filtered.length === 0) {
        let msg = `<div style="text-align:center; padding:30px; color:#d93025; font-size:14px;"><b>Tháng ${m}/${y} chưa xuất bán đơn nào.</b><br><br>Sếp hãy qua Tab 4 (Xuất Bán Hàng) để lập lệnh xuất kho nhé!</div>`;
        setHTML('stat_products', msg); setHTML('stat_margin', msg); setHTML('stat_vip', msg); setHTML('stat_qty', msg);
        return;
    }

    let pMap = {}, cMap = {};
    filtered.forEach(b => {
        let tien = b.tien || 0;
        let ln = b.loiNhuan || 0;
        let sl = b.sl || 0;
        let ap = b.anPham || 'Khác';
        let kh = b.kh || 'Khách vãng lai';

        if(!pMap[ap]) pMap[ap] = { rev: 0, profit: 0, qty: 0 };
        pMap[ap].rev += tien;
        pMap[ap].profit += ln;
        pMap[ap].qty += sl;

        cMap[kh] = (cMap[kh] || 0) + tien;
    });

    const f = (n) => Number(n).toLocaleString('vi-VN') + " đ";
    const q = (n) => Number(n).toLocaleString('vi-VN') + " sp";

    // Vẽ 4 Bảng
    setHTML('stat_products', Object.entries(pMap).sort((a,b)=>b[1].rev-a[1].rev).map(i => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;"><span>${i[0]}</span><b>${f(i[1].rev)}</b></div>`).join(''));
    
    setHTML('stat_margin', Object.entries(pMap).map(i => {
        let margin = i[1].rev > 0 ? ((i[1].profit / i[1].rev) * 100).toFixed(1) : 0;
        return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;"><span>${i[0]}</span><b style="color:#1e8e3e">${margin}%</b></div>`;
    }).join(''));
    
    setHTML('stat_vip', Object.entries(cMap).sort((a,b)=>b[1]-a[1]).slice(0,10).map(i => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;"><span>${i[0]}</span><b style="color:var(--warning)">${f(i[1])}</b></div>`).join(''));
    
    setHTML('stat_qty', Object.entries(pMap).sort((a,b)=>b[1].qty-a[1].qty).map(i => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;"><span>${i[0]}</span><b style="color:var(--purple)">${q(i[1].qty)}</b></div>`).join(''));
}

// Chèn tự động cập nhật khi đổi tháng (Không cần Sếp phải bấm nút)
if (typeof oldRenderTaiChinh === 'undefined') {
    const oldRenderTaiChinh = renderTaiChinh;
    renderTaiChinh = function() {
        if(typeof oldRenderTaiChinh === 'function') oldRenderTaiChinh();
        renderSalesAnalysis();
    }
}
setTimeout(renderSalesAnalysis, 500); // Vẽ luôn khi vừa load trang
// --- Báo cáo KHOẢN VAY (AUTO FINANCE LINK) ---
if (!db.khoanVay) db.khoanVay = [];

function saveKhoanVay() {
    let bank = document.getElementById('loan_bank').value;
    let amount = parseNumber(document.getElementById('loan_amount').value);
    let rate = parseFloat(document.getElementById('loan_rate').value);
    let term = parseInt(document.getElementById('loan_term').value);
    let start = document.getElementById('loan_startdate').value;
    let method = document.getElementById('loan_method').value;
    let wallet = document.getElementById('loan_wallet').value; 

    if (!bank || amount <= 0 || !term) return alert("Sếp nhập thiếu thông tin rồi!");

    db.khoanVay.push({ id: 'LOAN-' + Date.now(), bank, amount, rate, term, start, method, status: 'Đang trả' });

    if(!db.giaoDichVi) db.giaoDichVi = [];
    db.giaoDichVi.push({ idGD: 'GD-' + Date.now(), date: start, loai: 'THU', vi: wallet, doiTuong: bank, soTien: amount, lyDo: 'Giải ngân khoản vay ngân hàng', hangMuc: 'Khác' });

    // ---> CAMERA <---
    logActivity("Khoản Vay", `Giải ngân vay [${bank}] số tiền ${formatVN(amount)}đ vào ${mapViName(wallet)}`);

    alert("✅ Tiền vay đã được cộng vào Ví của Sếp!");
    syncDB();
}

function renderKhoanVay() {
    let html = '';
    let currentMonth = document.getElementById('f_month_tc').value;
    let currentYear = document.getElementById('f_year_tc').value;

    db.khoanVay.forEach(loan => {
        let schedule = calculateAmortization(loan);
        // Tìm dư nợ còn lại tính đến tháng hiện tại đang xem báo cáo
        let remaining = loan.amount;
        let reportDate = new Date(currentYear, parseInt(currentMonth)-1, 1);
        
        schedule.forEach(s => {
            let sDate = new Date(s.year, parseInt(s.month)-1, 1);
            if (sDate < reportDate) remaining -= s.principal;
        });

        html += `<tr>
            <td><b>${loan.bank}</b></td>
            <td>${loan.start}</td>
            <td>${formatVN(loan.amount)}</td>
            <td>${loan.rate}%</td>
            <td>${loan.term} th</td>
            <td style="color:var(--danger); font-weight:bold">${formatVN(Math.max(0, remaining))}</td>
            <td>
                <button class="btn-small btn-success" onclick="viewLoanSchedule('${loan.id}')">Xem Lịch</button>
                <button class="btn-small btn-danger" onclick="deleteLoan('${loan.id}')">Xóa</button>
            </td>
        </tr>`;
    });
    document.getElementById('table_loan_list').innerHTML = html || '<tr><td colspan="7" style="text-align:center">Chưa có khoản vay ngân hàng</td></tr>';
}

// Hàm tính toán lịch trả nợ chuẩn ngân hàng
function calculateAmortization(loan) {
    let schedule = [];
    let remaining = loan.amount;
    let monthlyRate = (loan.rate / 100) / 12;
    let startDate = new Date(loan.start);

    for (let i = 1; i <= loan.term; i++) {
        let interest = loan.method === 'reducing' ? remaining * monthlyRate : (loan.amount * monthlyRate);
        let principal = loan.amount / loan.term;
        remaining -= principal;

        let payDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
        schedule.push({
            period: i,
            month: ("0" + (payDate.getMonth() + 1)).slice(-2),
            year: payDate.getFullYear().toString(),
            principal,
            interest,
            total: principal + interest,
            remaining: Math.max(0, remaining)
        });
    }
    return schedule;
}

// CẬP NHẬT HÀM AUTO FINANCE ĐỂ HÚT SỐ TỪ KHOẢN VAY
const originalGetAutoFinData = getAutoFinData;
getAutoFinData = function(month, year) {
    let data = originalGetAutoFinData(month, year);
    let loanInterest = 0;
    let loanPrincipalPay = 0;
    let totalRemainingDebt = 0;

    (db.khoanVay || []).forEach(loan => {
        let schedule = calculateAmortization(loan);
        let reportMonth = schedule.find(s => s.month === month && s.year === year);
        if (reportMonth) {
            loanInterest += reportMonth.interest;
            loanPrincipalPay += reportMonth.principal;
        }

        // Tính tổng nợ còn lại cho Bảng Cân Đối
        let remaining = loan.amount;
        let reportDate = new Date(year, parseInt(month)-1, 1);
        schedule.forEach(s => {
            let sDate = new Date(s.year, parseInt(s.month)-1, 1);
            if (sDate <= reportDate) remaining -= s.principal;
        });
        totalRemainingDebt += Math.max(0, remaining);
    });

    // Link số liệu: Lãi vay vào Chi phí, Nợ gốc vào Dòng tiền & Cân đối
    data.cp_quanly += loanInterest; // Đưa lãi vào chi phí Báo cáo
    data.tien_trano += (loanPrincipalPay + loanInterest); // Tổng tiền mặt phải trả NH
    data.no_daihan = totalRemainingDebt; // Cập nhật dư nợ vào Cân Đối Kế Toán
    
    return data;
};

function viewLoanSchedule(id) {
    let loan = db.khoanVay.find(l => l.id === id);
    let schedule = calculateAmortization(loan);
    document.getElementById('loan_schedule_view').style.display = 'block';
    document.getElementById('schedule_title').innerText = "Lịch Trả Nợ: " + loan.bank;
    
    document.getElementById('table_loan_schedule').innerHTML = schedule.map(s => `
        <tr>
            <td>Kỳ ${s.period} (${s.month}/${s.year})</td>
            <td>${formatVN(s.principal)}</td>
            <td>${formatVN(s.interest)}</td>
            <td style="font-weight:bold">${formatVN(s.total)}</td>
            <td style="color:var(--danger)">${formatVN(s.remaining)}</td>
        </tr>
    `).join('');
}

function deleteLoan(id) {
    if(confirm("Sếp muốn xóa khoản vay này? Dữ liệu tài chính sẽ được cập nhật lại.")) {
        db.khoanVay = db.khoanVay.filter(l => l.id !== id);
        syncDB();
    }
}

// Báo cáo tài chính ưu tiên dữ liệu tổng hợp trực tiếp từ MySQL. db vẫn chỉ
// được giữ để các biểu mẫu legacy hoạt động trong giai đoạn chuyển đổi.
const renderTaiChinhLegacy = renderTaiChinh;
renderTaiChinh = async function renderTaiChinhFromSql() {
    const monthInput = document.getElementById('f_month_tc');
    const yearInput = document.getElementById('f_year_tc');
    if (!monthInput || !yearInput || typeof window.erpApi !== 'function') return renderTaiChinhLegacy();
    const key = `${yearInput.value}-${monthInput.value}`;
    try {
        const report = await window.erpApi(`/finance/report?year=${encodeURIComponent(yearInput.value)}&month=${encodeURIComponent(monthInput.value)}`);
        window.financeSqlReport = { ...report, key };
    } catch (error) {
        console.warn('Không tải được báo cáo tài chính từ MySQL, dùng dữ liệu cục bộ:', error.message);
        window.financeSqlReport = null;
    }
    return renderTaiChinhLegacy();
};

