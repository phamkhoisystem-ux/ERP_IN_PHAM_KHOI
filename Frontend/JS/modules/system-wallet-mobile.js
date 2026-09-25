async function checkSecurity(actionName, callback) {
    if (sessionStorage.getItem('userRole') !== 'ADMIN') return alert('Chỉ ADMIN được thực hiện thao tác này.');
    const enteredPin = prompt(`XÁC MINH QUẢN TRỊ\nThao tác: ${actionName}\nVui lòng nhập mã PIN:`);
    if (enteredPin === null) return;
    try {
        await window.erpApi('/users/security-pin/verify', { method: 'POST', body: JSON.stringify({ pin: enteredPin }) });
        await callback(enteredPin);
    } catch (error) { alert(error.message); }
}

// 2. HÀM XÓA DỮ LIỆU (PHẢI CÓ HÀM NÀY MỚI CHẠY ĐƯỢC)
async function resetData(pin) {
    const confirmation = prompt('CẢNH BÁO: Thao tác này xóa dữ liệu nghiệp vụ trong MySQL.\nTài khoản, quyền và PIN được giữ lại.\nNhập chính xác: XOA DU LIEU');
    if (confirmation !== 'XOA DU LIEU') return alert('Đã hủy xóa dữ liệu.');
    try {
        const result = await window.erpApi('/state/reset', { method: 'POST', body: JSON.stringify({ pin, confirmation }) });
        db = result.state;
        localStorage.setItem('phamkhoi_db_v11', JSON.stringify(db));
        renderAll();
        alert('Đã xóa dữ liệu nghiệp vụ trong MySQL. Tài khoản và PIN quản trị vẫn được giữ lại.');
        openTab(null, 'tab-kehoach');
    } catch (error) { alert(error.message); }
}
// =================================================================
// CÔNG CỤ QUẢN TRỊ CAO CẤP: BACKUP & JSON
// =================================================================

function ensureAdminDataTools() {
    if (sessionStorage.getItem('userRole') !== 'ADMIN') throw new Error('Chỉ quản trị viên được dùng chức năng này.');
}

function normalizeBackupState(payload) {
    const state = payload?.state ?? payload;
    if (!state || Array.isArray(state) || typeof state !== 'object') throw new Error('File sao lưu không chứa dữ liệu ERP hợp lệ.');
    return state;
}

async function backupDatabase() {
    try {
        ensureAdminDataTools();
        const backup = await window.erpApi('/state/backup');
        const fileData = { format: 'PHAM_KHOI_ERP_BACKUP', version: 1, exportedAt: backup.exportedAt, state: normalizeBackupState(backup) };
        const blob = new Blob([JSON.stringify(fileData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `BACKUP_ERP_PHAMKHOI_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(link.href);
        alert('Đã tải file sao lưu JSON. Tài khoản và mật khẩu không nằm trong file này.');
    } catch (error) { alert(error.message); }
}

function restoreDatabase() {
    try { ensureAdminDataTools(); } catch (error) { alert(error.message); return; }
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,application/json';
    input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
            const payload = JSON.parse(await file.text());
            const state = normalizeBackupState(payload);
            if (!confirm(`Khôi phục dữ liệu từ file “${file.name}”? Hệ thống sẽ lưu một điểm hoàn tác trước khi khôi phục.`)) return;
            const result = await window.erpApi('/state/restore', { method: 'POST', body: JSON.stringify({ state }) });
            db = normalizeBackupState(result); localStorage.setItem('phamkhoi_db_v11', JSON.stringify(db)); renderAll();
            alert('Đã khôi phục dữ liệu. Bạn có thể dùng “Hoàn tác khôi phục” nếu cần quay lại bản trước.');
        } catch (error) { alert(`Không thể khôi phục: ${error.message}`); }
    };
    input.click();
}
// ========================================================
        // HỆ THỐNG ĐĂNG NHẬP & PHÂN QUYỀN V12 (BẢN CHUẨN)
        // ========================================================
      // Hàm Đăng nhập mới: Phải hỏi ý kiến Google Sheet
async function verifyLogin() {
    let input = document.getElementById('pin-input').value;
    let errorMsg = document.getElementById('login-error');
    let btn = document.querySelector('button[onclick="verifyLogin()"]');

    if(!input) return;

    // Đổi trạng thái nút để Sếp biết máy đang gọi lên mây
    btn.innerText = "ĐANG XÁC THỰC SERVER...";
    btn.style.background = "#f29900";
    btn.disabled = true;

    try {
        // Gửi pass lên Mây
        let response = await fetch(GOOGLE_SHEET_URL + "?pin=" + input);
        let result = await response.json();

        if (result.error) {
            // Server báo sai Pass
            errorMsg.innerText = "❌ " + result.error;
            errorMsg.style.display = "block";
            document.getElementById('pin-input').value = "";
            document.getElementById('pin-input').focus();
            
            // Trả lại nút bấm
            btn.innerText = "MỞ KHÓA HỆ THỐNG";
            btn.style.background = "#1a73e8";
            btn.disabled = false;
        } else {
            // Server xác nhận đúng Pass và nhả Data về
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userRole', result.role);
            sessionStorage.setItem('userPin', input); // Lưu vé thông hành

            // Cập nhật Database lập tức
            if (result.data && Object.keys(result.data).length > 0) {
                db = result.data;
                localStorage.setItem('phamkhoi_db_v11', JSON.stringify(db));
                renderAll();
            }

            // Tắt màn hình đăng nhập
            let overlay = document.getElementById('login-overlay');
            overlay.style.transition = "opacity 0.5s ease";
            overlay.style.opacity = "0";
            setTimeout(() => { overlay.style.display = "none"; }, 500);
            
            applyRolePermissions();
        }
    } catch (e) {
        alert("❌ Lỗi kết nối đến Máy chủ Google! Vui lòng kiểm tra mạng.");
        btn.innerText = "MỞ KHÓA HỆ THỐNG";
        btn.style.background = "#1a73e8";
        btn.disabled = false;
    }
}

        function applyRolePermissions() {
            let role = sessionStorage.getItem('userRole');
            
            if (role === 'THUQUY') {
                // Ẩn tất cả Menu, chỉ chừa lại nút có chữ SỔ QUỸ
                document.querySelectorAll('.sidebar .nav-btn').forEach(btn => {
                    let text = btn.innerText.toUpperCase();
                    if (!text.includes('SỔ QUỸ')) {
                        btn.style.display = "none";
                    }
                });
                
                // Ẩn khu vực Backup/Xóa data của Sếp
                let adminBox = document.querySelector('.sidebar div[style*="border-top"]');
                if(adminBox) adminBox.style.display = "none";

                // Ép mở Tab Sổ Quỹ
                setTimeout(() => { openTab(null, 'tab-vitien'); }, 100);
            } else {
                // Sếp thì mở Kế Hoạch
                setTimeout(() => { openTab(null, 'tab-kehoach'); }, 100);
            }
        }

        document.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && document.getElementById('login-overlay').style.display !== 'none') {
                verifyLogin();
            }
        });

   window.onload = function() {
    let isLoggedIn = sessionStorage.getItem('isLoggedIn');
    let role = sessionStorage.getItem('userRole');
    let pin = sessionStorage.getItem('userPin'); // Dùng vé thông hành cũ
    
    if (isLoggedIn === 'true' && role && pin) {
        document.getElementById('login-overlay').style.display = 'none';
        applyRolePermissions();
        
        // Chạy ngầm việc kéo Data mới từ Mây bằng vé thông hành (Pass)
        fetch(GOOGLE_SHEET_URL + "?pin=" + pin)
            .then(res => res.json())
            .then(result => {
                if (!result.error && result.data && Object.keys(result.data).length > 0) {
                    db = result.data;
                    localStorage.setItem('phamkhoi_db_v11', JSON.stringify(db));
                    renderAll();
                }
            }).catch(err => console.log("Lỗi tải data ngầm: ", err));
            
    } else {
        document.getElementById('login-overlay').style.display = 'flex';
        document.getElementById('login-overlay').style.opacity = '1';
        sessionStorage.clear(); 
    }
};
let lastState = null;

// Hàm này để "chụp ảnh" dữ liệu ngay trước khi Sếp bấm Lưu
function saveState() {
    lastState = JSON.stringify(db);
    const btn = document.getElementById('btn_undo');
    if(btn) {
        btn.style.display = 'block';
        // Tự động ẩn sau 30 giây để Sidebar luôn gọn gàng
        setTimeout(() => { btn.style.display = 'none'; }, 30000);
    }
}

// Hàm thực hiện việc quay ngược thời gian
async function undoAction() {
    try {
        ensureAdminDataTools();
        if (!confirm('Hoàn tác bản khôi phục gần nhất?')) return;
        const btn = document.getElementById('btn_undo');
        btn.disabled = true; btn.textContent = 'Đang hoàn tác…';
        const result = await window.erpApi('/state/undo', { method: 'POST', body: '{}' });
        db = normalizeBackupState(result); localStorage.setItem('phamkhoi_db_v11', JSON.stringify(db)); renderAll();
        lastState = null;
        alert('Đã hoàn tác bản khôi phục và lưu vào MySQL.');
    } catch (error) { alert(error.message); }
    finally { const btn = document.getElementById('btn_undo'); if (btn) { btn.disabled = false; btn.textContent = 'Hoàn tác khôi phục'; } }
}
let myChart = null;

async function renderCharts(viewType) {
    const ctx = document.getElementById('finChart').getContext('2d');
    if (myChart) myChart.destroy(); // Xóa biểu đồ cũ để vẽ lại

    let labels = [];
    let revenueData = [];
    let profitData = [];
    let currentYear = document.getElementById('f_year_tc').value;

    try {
        const sqlTrend = await window.erpApi(`/finance/trend?year=${encodeURIComponent(currentYear)}`);
        const months = sqlTrend.months || [];
        if (viewType === 'year') {
            labels = months.map(item => `T${item.month}`);
            revenueData = months.map(item => Number(item.doanhthu || 0));
            profitData = months.map(item => Number(item.loinhuan || 0));
        } else {
            labels = ["Quý 1", "Quý 2", "Quý 3", "Quý 4"];
            for (let quarter = 0; quarter < 4; quarter += 1) {
                const quarterRows = months.slice(quarter * 3, quarter * 3 + 3);
                revenueData.push(quarterRows.reduce((sum, item) => sum + Number(item.doanhthu || 0), 0));
                profitData.push(quarterRows.reduce((sum, item) => sum + Number(item.loinhuan || 0), 0));
            }
        }
    } catch (error) {
        console.warn('Không tải được xu hướng tài chính từ MySQL:', error.message);
        // Dự phòng cho trường hợp server tạm thời không kết nối được.
        if (viewType === 'year') {
        labels = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
        for (let i = 1; i <= 12; i++) {
            let mStr = ("0" + i).slice(-2);
            let monthData = db.taiChinh.find(t => t.month === mStr && t.year === currentYear) || { doanhthu: 0, giamtru: 0, giavon: 0, cp_banhang: 0, cp_quanly: 0, khauhao: 0, laivay: 0 };
            let dt = monthData.doanhthu - (Number(monthData.giamtru) || 0);
            let cp = (Number(monthData.cp_banhang) || 0) + (Number(monthData.cp_quanly) || 0) + (Number(monthData.khauhao) || 0) + (Number(monthData.laivay) || 0);
            revenueData.push(dt);
            profitData.push(dt - monthData.giavon - cp);
        }
        } else {
        labels = ["Quý 1", "Quý 2", "Quý 3", "Quý 4"];
        const quarters = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]];
        quarters.forEach(qMonths => {
            let qRev = 0, qProfit = 0;
            qMonths.forEach(m => {
                let mStr = ("0" + m).slice(-2);
                let monthData = db.taiChinh.find(t => t.month === mStr && t.year === currentYear) || { doanhthu: 0, giamtru: 0, giavon: 0, cp_banhang: 0, cp_quanly: 0, khauhao: 0, laivay: 0 };
                let dt = monthData.doanhthu - (Number(monthData.giamtru) || 0);
                let cp = (Number(monthData.cp_banhang) || 0) + (Number(monthData.cp_quanly) || 0) + (Number(monthData.khauhao) || 0) + (Number(monthData.laivay) || 0);
                qRev += dt;
                qProfit += (dt - monthData.giavon - cp);
            });
            revenueData.push(qRev);
            profitData.push(qProfit);
        });
        }
    }

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Doanh Thu Thuần', data: revenueData, backgroundColor: '#1a73e8', borderRadius: 5 },
                { label: 'Lợi Nhuận Ròng', data: profitData, type: 'line', borderColor: '#d93025', backgroundColor: '#d93025', tension: 0.3, fill: false, borderWidth: 3 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { callback: v => v.toLocaleString() } } },
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// Tự động gọi vẽ biểu đồ khi mở tab tài chính hoặc đổi năm
const originalOpenTabTC = openTab;
openTab = function(evt, tabId) {
    originalOpenTabTC(evt, tabId);
    if (tabId === 'tab-taichinh') setTimeout(() => renderCharts('year'), 300);
}
// ================= MODULE SỔ QUỸ (VÍ TIỀN) =================
function mapViName(code) {
    if(code === 'TIENMAT') return '💵 Tiền Mặt';
    if(code === 'THIENLONG') return '💳 Bank Thiên Long';
    if(code === 'ACB') return '💳 Bank ACB';
    return code;
}

// Phiếu in dùng tên thuần văn bản để giữ mẫu chứng từ gọn, chuyên nghiệp.
function mapViPrintName(code) {
    if(code === 'TIENMAT') return 'Tiền Mặt';
    if(code === 'THIENLONG') return 'Bank Thiên Long';
    if(code === 'ACB') return 'Bank ACB';
    return String(code || '').replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').trim();
}

function toggleFormChuyenTien() {
    let type = document.getElementById('tc_loai').value;
    if(type === 'CHUYEN') {
        document.getElementById('box_tc_vi_den').style.display = 'block';
        document.getElementById('box_tc_doituong').style.display = 'none';
        document.getElementById('box_tc_hangmuc').style.display = 'none';
    } else {
        document.getElementById('box_tc_vi_den').style.display = 'none';
        document.getElementById('box_tc_doituong').style.display = 'block';
        document.getElementById('box_tc_hangmuc').style.display = 'block';
    }
}

function toggleFormNhapKhoLe() {
    let hm = document.getElementById('tc_hangmuc').value;
    document.getElementById('box_tc_nhapkho').style.display = (hm === 'Mua vật tư lẻ') ? 'block' : 'none';
}
// 1. HÀM TẠO MÃ PHIẾU CHUẨN (PT0426-1)
function genMaPhieu(loai, ngay) {
    let prefix = loai === 'THU' ? 'PT' : (loai === 'CHI' ? 'PC' : 'CK');
    let dateObj = new Date(ngay);
    let mm = ("0" + (dateObj.getMonth() + 1)).slice(-2);
    let yy = dateObj.getFullYear().toString().slice(-2);
    let codePrefix = prefix + mm + yy + "-";
    let count = db.giaoDichVi.filter(g => g.idGD && g.idGD.startsWith(codePrefix)).length;
    return codePrefix + (count + 1); 
}
// === HÀM TỰ ĐỘNG CHIA ĐƠN GIÁ VẬT TƯ LẺ ===
function tinhDonGiaVT() {
    let tien = parseNumber(document.getElementById('tc_sotien').value);
    let sl = parseNumber(document.getElementById('tc_vt_sl') ? document.getElementById('tc_vt_sl').value : 1);
    
    let inputGia = document.getElementById('tc_vt_gia');
    if (inputGia) {
        if (sl > 0) inputGia.value = formatVN(tien / sl);
        else inputGia.value = "0";
    }
}
// 2. HÀM LƯU PHIẾU (SỬ DỤNG MÃ PHIẾU MỚI & BẮN VÀO KHO)
function luuPhieuThuChi() {
    let loai = document.getElementById('tc_loai').value;
    let date = document.getElementById('tc_ngay').value || new Date().toISOString().split('T')[0];
    let tien = parseNumber(document.getElementById('tc_sotien').value);
    let vi = document.getElementById('tc_vi').value;
    let note = document.getElementById('tc_lydo').value;
    let hangMuc = document.getElementById('tc_hangmuc').value;
    let dt = document.getElementById('tc_doituong') ? document.getElementById('tc_doituong').value : 'Khác';

    if(tien <= 0) return alert("Vui lòng nhập số tiền hợp lệ!");
    if(!db.giaoDichVi) db.giaoDichVi = [];

    if(loai === 'CHUYEN') {
        let viDen = document.getElementById('tc_vi_den').value;
        if(vi === viDen) return alert("Sếp ơi, không thể chuyển cùng 1 ví được!");
        let maCK = genMaPhieu('CHUYEN', date);
        db.giaoDichVi.push({ idGD: maCK + 'A', date, loai: 'CHI', vi: vi, doiTuong: 'Nội bộ', soTien: tien, lyDo: `Chuyển sang ${mapViName(viDen)}. ${note}`, hangMuc: 'Chuyển quỹ' });
        db.giaoDichVi.push({ idGD: maCK + 'B', date, loai: 'THU', vi: viDen, doiTuong: 'Nội bộ', soTien: tien, lyDo: `Nhận từ ${mapViName(vi)}. ${note}`, hangMuc: 'Chuyển quỹ' });
    } else {
        let maPhieu = genMaPhieu(loai, date);
        
        // KIỂM TRA MUA VẬT TƯ LẺ BẮN VÀO KHO (FULL TRƯỜNG DỮ LIỆU)
        if(hangMuc === 'Mua vật tư lẻ' && loai === 'CHI' && document.getElementById('tc_vt_ten')) {
            let vtTen = document.getElementById('tc_vt_ten').value.trim();
            let vtSl = parseNumber(document.getElementById('tc_vt_sl').value);
            let vtDvt = document.getElementById('tc_vt_dvt').value.trim() || 'Cái'; // Mặc định là Cái nếu để trống
            let vtGia = parseNumber(document.getElementById('tc_vt_gia').value);

            if(vtTen && vtSl > 0) {
                let exist = db.khoVatTu.find(v => v.name.toLowerCase() === vtTen.toLowerCase());
                if(exist) { 
                    exist.qty += vtSl; 
                    exist.dvt = vtDvt; // Cập nhật lại ĐVT nếu Sếp có gõ khác
                } else { 
                    db.khoVatTu.push({ name: vtTen, qty: vtSl, warn: 10, dvt: vtDvt }); 
                }
                
                if(!db.lichSuVatTu) db.lichSuVatTu = [];
                db.lichSuVatTu.push({ idTK: 'TK-' + Date.now(), date: date, type: 'NHẬP', name: vtTen, qty: vtSl, dvt: vtDvt, gia: vtGia, thanhTien: tien, note: `Mua lẻ từ Sổ Quỹ (${maPhieu})` });
                
                // Ghi thẳng Đơn giá & ĐVT vào Ghi chú Phiếu Chi để Sếp dễ đối soát
                note = `[Nhập Kho: ${formatVN(vtSl)} ${vtDvt} ${vtTen} | Giá: ${formatVN(vtGia)}đ] ` + note;
            }
        }

        db.giaoDichVi.push({ idGD: maPhieu, date, loai, vi, doiTuong: dt, soTien: tien, lyDo: note, hangMuc: hangMuc });
    }
    
    alert("✅ Đã ghi nhận giao dịch thành công!");
    document.getElementById('form_thu_chi').style.display = 'none';
    document.getElementById('tc_sotien').value = '0';
    document.getElementById('tc_lydo').value = '';
    syncDB();
}

// 3. HÀM HIỂN THỊ SỔ QUỸ (ĐÃ CANH CHUẨN 8 CỘT)
function renderViTien() {
    if(!db.giaoDichVi) db.giaoDichVi = [];

    // TÍNH TỔNG SỐ DƯ 3 VÍ
    let tm = 0, tl = 0, acb = 0;
    db.giaoDichVi.forEach(gd => {
        let heSo = gd.loai === 'THU' ? 1 : -1;
        if(gd.vi === 'TIENMAT') tm += gd.soTien * heSo;
        if(gd.vi === 'THIENLONG') tl += gd.soTien * heSo;
        if(gd.vi === 'ACB') acb += gd.soTien * heSo;
    });

    document.getElementById('so_du_tienmat').innerText = formatVN(tm) + ' đ';
    document.getElementById('so_du_thienlong').innerText = formatVN(tl) + ' đ';
    document.getElementById('so_du_acb').innerText = formatVN(acb) + ' đ';

    // LỌC VÀ HIỂN THỊ THEO THÁNG
    let monthSelect = document.getElementById('f_month_sq');
    let yearSelect = document.getElementById('f_year_sq');
    let m = monthSelect ? monthSelect.value : ("0" + (new Date().getMonth() + 1)).slice(-2);
    let y = yearSelect ? yearSelect.value : new Date().getFullYear().toString();
    let prefix = y + '-' + m;

    let html = db.giaoDichVi
        .filter(g => g.date.startsWith(prefix))
        .sort((a,b) => new Date(b.date) - new Date(a.date) || (b.idGD || "").localeCompare(a.idGD || ""))
        .map(gd => {
            let mauSac = gd.loai === 'THU' ? '#1e8e3e' : '#d93025';
            let dau = gd.loai === 'THU' ? '+' : '-';
            let tenVi = typeof mapViName === 'function' ? mapViName(gd.vi) : gd.vi;

            return `<tr>
                <td style="font-family:monospace; font-weight:bold; color:#1a73e8;">${gd.idGD || 'N/A'}</td>
                <td style="color:#666; font-size:12px;">${gd.date.slice(8,10)}/${gd.date.slice(5,7)}</td>
                <td><span class="badge" style="background:#eee">${tenVi}</span></td>
                <td>
                    <b onclick="goToCongNo('${gd.doiTuong}')" 
                       style="${gd.hangMuc === 'Nhập hàng' ? 'color:#1a73e8; cursor:pointer; text-decoration:underline;' : ''}"
                       title="${gd.hangMuc === 'Nhập hàng' ? 'Bấm để xem Sổ cái Công nợ' : ''}">
                        ${gd.doiTuong || 'Khác'}
                    </b>
                </td>
                <td><i>${gd.hangMuc || 'Khác'}</i></td>
                <td>${gd.lyDo}</td>
                <td class="text-right" style="color:${mauSac}; font-weight:bold;">${dau}${formatVN(gd.soTien)}</td>
                <td class="text-center"><button class="btn-small btn-print" onclick="inPhieuThuChi('${gd.idGD}')">In phiếu</button>
										<button class="btn-small btn-danger" onclick="xoaGiaoDich('${gd.idGD}')">🗑️ Xóa</button>
</td>
            </tr>`;
        }).join('');

    let tbody = document.getElementById('table_giao_dich_vi');
    if (tbody) {
        tbody.innerHTML = html || `<tr><td colspan="8" style="text-align:center; padding: 20px;">Chưa có giao dịch nào trong tháng ${m}/${y}</td></tr>`;
    }
}

function inPhieuThuChi(idGD) {
    let gd = db.giaoDichVi.find(g => g.idGD === idGD);
    if(!gd) return;
    let dt = new Date(gd.date);
    const isReceipt = gd.loai === 'THU';
    const day = ("0" + dt.getDate()).slice(-2);
    const month = ("0" + (dt.getMonth() + 1)).slice(-2);
    const amount = Number(gd.soTien) || 0;

    document.getElementById('prt_title').innerText = isReceipt ? 'PHIẾU THU' : 'PHIẾU CHI';
    document.getElementById('prt_date').innerText = `Ngày ${("0"+dt.getDate()).slice(-2)} tháng ${("0"+(dt.getMonth()+1)).slice(-2)} năm ${dt.getFullYear()}`;
    document.getElementById('prt_number').innerText = gd.idGD || '';
    document.getElementById('prt_person_label').innerText = isReceipt ? 'nộp tiền' : 'nhận tiền';
    document.getElementById('prt_reason_label').innerText = isReceipt ? 'Lý do nộp' : 'Lý do chi';
    document.getElementById('prt_expense_label').innerText = isReceipt ? 'thu' : 'chi';
    document.getElementById('prt_name').innerText = gd.doiTuong;
    document.getElementById('prt_reason').innerText = gd.lyDo;
    document.getElementById('prt_amount').innerText = `${formatVN(amount)} đồng`;
    document.getElementById('prt_attachment').innerText = gd.hangMuc || '';
    document.getElementById('prt_voucher').innerText = mapViPrintName(gd.vi);
    document.getElementById('prt_sign_date').innerText = `Ngày ${day} tháng ${month} năm ${dt.getFullYear()}`;
    document.getElementById('prt_payer_signature').innerHTML = isReceipt ? 'Người nộp<br>tiền' : 'Người nhận<br>tiền';
    // CSS chỉ hiển thị khu vực phiếu khi có lớp này; các báo cáo dùng print-report.
    document.body.classList.remove('print-report');
    document.body.classList.add('print-receipt');
    const previousTitle = document.title;
    document.title = `${gd.loai === 'THU' ? 'Phiếu thu' : 'Phiếu chi'} ${gd.idGD || ''} - Phạm Khôi ERP`;
    setTimeout(() => {
        window.print();
        document.title = previousTitle;
    }, 80);
}

function vietNamDongBangChu(value) {
    const digitWords = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const readThreeDigits = (number, full) => {
        const hundreds = Math.floor(number / 100);
        const tens = Math.floor((number % 100) / 10);
        const units = number % 10;
        let words = [];
        if (full || hundreds > 0) words.push(digitWords[hundreds], 'trăm');
        if (tens > 1) {
            words.push(digitWords[tens], 'mươi');
            if (units === 1) words.push('mốt');
            else if (units === 4) words.push('tư');
            else if (units === 5) words.push('lăm');
            else if (units) words.push(digitWords[units]);
        } else if (tens === 1) {
            words.push('mười');
            if (units === 5) words.push('lăm');
            else if (units) words.push(digitWords[units]);
        } else if (units) {
            if (full || hundreds > 0) words.push('lẻ');
            words.push(digitWords[units]);
        }
        return words.join(' ');
    };

    const amount = Math.round(Math.abs(Number(value) || 0));
    if (!amount) return 'Không đồng chẵn';
    const groups = ['', 'nghìn', 'triệu', 'tỷ'];
    const triplets = [];
    let rest = amount;
    while (rest > 0) {
        triplets.unshift(rest % 1000);
        rest = Math.floor(rest / 1000);
    }
    const result = triplets.reduce((words, group, index) => {
        if (!group) return words;
        const groupName = groups[triplets.length - index - 1];
        words.push(`${readThreeDigits(group, index > 0 && group < 100)}${groupName ? ` ${groupName}` : ''}`.trim());
        return words;
    }, []);
    const text = result.join(' ').replace(/\s+/g, ' ').trim();
    return `${text.charAt(0).toUpperCase()}${text.slice(1)} đồng chẵn`;
}
// Hàm mở/đóng Menu trên Mobile
function toggleMobileMenu() {
    document.getElementById('mySidebar').classList.toggle('open');
}

// Tự động đóng Menu khi Sếp bấm chọn 1 Tab bất kỳ trên điện thoại
const originalOpenTabMobile = openTab;
openTab = function(evt, tabId) {
    originalOpenTabMobile(evt, tabId);
    let sidebar = document.getElementById('mySidebar');
    if(sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
    }
}
// Hàm Ghi Log Hệ Thống
function logActivity(actionName, details) {
    if (!db.historyLog) db.historyLog = []; // Tạo kho log nếu chưa có
    
    let currentUser = sessionStorage.getItem('userRole') || 'KHÁCH';
    let now = new Date();
    let timeString = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN');

    // Đẩy hành động mới lên đầu danh sách
    db.historyLog.unshift({
        time: timeString,
        user: currentUser,
        action: actionName,
        details: details
    });

    // Giới hạn lưu 500 hành động gần nhất để web chạy nhanh
    if (db.historyLog.length > 500) {
        db.historyLog.length = 500; 
    }
}
// === HÀM CHUYỂN NHANH SANG TAB CÔNG NỢ VÀ MỞ LEDGER CỦA NCC ===
function goToCongNo(nccName) {
    if (!nccName || nccName === 'Khác' || nccName === 'Khách lẻ') return;

    // 1. Chuyển sang Tab 5 (Công nợ)
    openTab(null, 'tab-congno');

    // 2. Điền tên NCC vào ô tìm kiếm để lọc ra ngay NCC đó
    let searchInput = document.getElementById('search_cn');
    if (searchInput) {
        searchInput.value = nccName;
        renderCongNo(); // Vẽ lại bảng danh sách NCC
    }

    // 3. Tự động mở chi tiết công nợ (Ledger) của NCC đó
    setTimeout(() => {
        viewLedgerNCC(nccName);
        // Trượt xuống khu vực chi tiết cho Sếp xem
        document.getElementById('cn_detail_viewer').scrollIntoView({ behavior: 'smooth' });
    }, 200);
}
// === HÀM CHUYỂN NHANH ĐẾN SỔ QUỸ VÀ HIGHLIGHT MÃ PHIẾU ===
function goToSoQuy(idGD) {
    // 1. Chuyển sang Tab 10 (Sổ Quỹ)
    openTab(null, 'tab-vitien');

    // 2. Tìm giao dịch trong Sổ Quỹ để lấy Tháng/Năm
    let gd = db.giaoDichVi.find(g => g.idGD === idGD);
    if (gd) {
        let d = new Date(gd.date);
        let m = ("0" + (d.getMonth() + 1)).slice(-2);
        let y = d.getFullYear().toString();

        // 3. Tự động chỉnh lại bộ lọc Tháng/Năm cho đúng với phiếu đó
        let mSelect = document.getElementById('f_month_sq');
        let ySelect = document.getElementById('f_year_sq');
        if(mSelect) mSelect.value = m;
        if(ySelect) ySelect.value = y;

        // 4. Render lại sổ quỹ theo tháng vừa chỉnh
        renderViTien();

        // 5. Tìm đúng dòng chứa mã phiếu, Tô Vàng và Trượt màn hình tới đó
        setTimeout(() => {
            let rows = document.querySelectorAll('#table_giao_dich_vi tr');
            rows.forEach(r => {
                if (r.innerText.includes(idGD)) {
                    // Tô màu vàng nhạt báo hiệu
                    r.style.backgroundColor = '#fff3cd'; 
                    r.style.transition = 'background-color 1.5s';
                    // Trượt màn hình ngay tới dòng đó
                    r.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Tự tắt màu vàng sau 3 giây
                    setTimeout(() => { r.style.backgroundColor = ''; }, 3000);
                }
            });
        }, 300); // Đợi giao diện load xong mới tô màu
    } else {
        alert("Không tìm thấy phiếu " + idGD + " trong Sổ Quỹ (Có thể đã bị xóa)!");
    }
}
// HÀM TÍNH TOÁN BÁN HÀNG VÀ LỢI NHUẬN ĐÃ ĐƯỢC KHÔI PHỤC
function tinhLoiNhuanBanHang() {
    let anPham = document.getElementById('bh_anpham');
    if(!anPham) return;
    
    let anPhamName = anPham.value;
    let apKho = db.khoAnPham.find(a => a.name === anPhamName);
    let unitCost = apKho ? (apKho.unitCost || 0) : 0;

    let sl = parseNumber(document.getElementById('bh_sl').value);
    let doanhThuChuaVat = parseNumber(document.getElementById('bh_tien').value);
    let hasVat = document.getElementById('bh_vat').checked;

    // Tính toán
    let giaVonTong = sl * unitCost;
    let tongThuGomVat = doanhThuChuaVat + (hasVat ? doanhThuChuaVat * 0.08 : 0);
    let loiNhuan = doanhThuChuaVat - giaVonTong;

    // Hiển thị lên màn hình (Form Bán Hàng)
    document.getElementById('bh_tongthu').value = formatVN(tongThuGomVat);
    document.getElementById('bh_giavon_view').innerText = formatVN(giaVonTong) + ' đ';
    
    let lnView = document.getElementById('bh_loinhuan_view');
    lnView.innerText = formatVN(loiNhuan) + ' đ';
    lnView.style.color = loiNhuan >= 0 ? '#1e8e3e' : '#d93025'; // Lỗ thì hiện đỏ, lãi hiện xanh
}
function xoaGiaoDich(idGD) {
    checkSecurity("XÓA GIAO DỊCH SỔ QUỸ", () => {
        if (!confirm("Sếp chắc chắn muốn xóa giao dịch này? Số dư các ví sẽ tự động cộng lại!")) return;
        
        let idx = db.giaoDichVi.findIndex(g => g.idGD === idGD);
        if (idx !== -1) {
            let gd = db.giaoDichVi[idx];
            
            // Nếu xóa phiếu Lương, phải tìm trong hồ sơ nhân viên để xóa lịch sử trả lương
            if (gd.hangMuc === 'Lương') {
                db.nhanSu.forEach(emp => {
                    if (emp.name === gd.doiTuong) {
                        emp.paymentHistory = (emp.paymentHistory || []).filter(p => 
                            !(p.payDate === gd.date && p.netSalary === gd.soTien)
                        );
                    }
                });
            }
            
            db.giaoDichVi.splice(idx, 1); // Xóa khỏi danh sách
            logActivity("Sổ Quỹ", `Xóa giao dịch ${idGD} của ${gd.doiTuong}. Hoàn lại: ${formatVN(gd.soTien)}đ`);
            alert("✅ Đã xóa và hoàn trả tiền vào ví thành công!");
            syncDB();
        }
    });
}
