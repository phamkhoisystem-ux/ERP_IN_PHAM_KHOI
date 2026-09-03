
        // ================= CẤU HÌNH GOOGLE SHEETS =================
        // Đồng bộ dữ liệu qua Node.js/MySQL; Google Sheets không còn là nơi lưu chính.
        const GOOGLE_SHEET_URL = "";
        // ==========================================================
		// ================= CAMERA NHẬT KÝ HỆ THỐNG =================
function logActivity(actionName, details) {
    if (!db.historyLog) db.historyLog = []; 
    let currentUser = sessionStorage.getItem('userRole') || 'KHÁCH';
    let now = new Date();
    let timeString = ("0" + now.getDate()).slice(-2) + '/' + ("0" + (now.getMonth() + 1)).slice(-2) + '/' + now.getFullYear() + ' ' + ("0" + now.getHours()).slice(-2) + ':' + ("0" + now.getMinutes()).slice(-2);

    db.historyLog.unshift({
        time: timeString,
        user: currentUser,
        action: actionName,
        details: details
    });

    if (db.historyLog.length > 500) db.historyLog.length = 500; 
}
// ============================================================
// Hàm tự động kéo dữ liệu từ Google Sheet về máy
async function loadDataFromCloud() {
    if (!GOOGLE_SHEET_URL || !GOOGLE_SHEET_URL.startsWith("https://")) {
        console.log("⚠️ Sếp chưa cấu hình link Google Sheet chuẩn.");
        return;
    }

    console.log("📥 Đang tải dữ liệu mới nhất từ Cloud...");
    try {
        // Gọi đến App Script để lấy Data
        const response = await fetch(GOOGLE_SHEET_URL);
        const cloudData = await response.json();
        
        if (cloudData && Object.keys(cloudData).length > 0) {
            // Ghi đè dữ liệu trên Sheet vào bộ não Local
            db = cloudData;
            localStorage.setItem('phamkhoi_db_v11', JSON.stringify(db));
            renderAll(); // Vẽ lại giao diện sau khi có data mới
            console.log("✅ Đã đồng bộ dữ liệu từ Cloud thành công!");
        }
    } catch (e) {
        console.log("❌ Không thể kết nối Cloud hoặc Sheet chưa có data. Đang dùng data Local.");
    }
}
        document.addEventListener('input', function (e) {
            if (e.target.classList.contains('format-number') && !e.target.readOnly) {
                let val = e.target.value.replace(/[^\d.]/g, '');
                if(val === '') return;
                let parts = val.split('.');
                parts[0] = parseInt(parts[0] || 0, 10).toLocaleString('en-US');
                e.target.value = parts.join('.');
            }
        });
        function parseNumber(val) {
            if(!val) return 0;
            if(typeof val === 'number') return val;
            return parseFloat(val.toString().replace(/,/g, '')) || 0;
        }

let db = JSON.parse(localStorage.getItem('phamkhoi_db_v11')) || 
                 { keHoach: [], sanXuat: [], khoVatTu: [ { name: 'Màng Bóng (m)', qty: 5000, warn: 1000 } ], khoAnPham: [], banHang: [], chiTietNo: [], lichSuThanhToan: [], nccList: ["Cty Giấy Toàn Cầu", "Xưởng In 86", "Gia Công Bế Dán C"], nhatKyCa: [], taiChinh: [], nhanSu: [], taiSan: [], khoanVay: [], giaoDichVi: [] }; 
                 // ^ SẾP NHÌN NÈ: Đã thêm giaoDichVi: [] ở cuối cùng

        // Fix for old data migration
        if (!db.nhanSu) db.nhanSu = [];
        if (!db.taiSan) db.taiSan = [];
        if (!db.giaoDichVi) db.giaoDichVi = []; // <--- THÊM DÒNG NÀY ĐỂ KHÔNG BỊ LỖI DATA CŨ

        function syncDB() {
            // Hiển thị tức thời, sau đó lưu bản trạng thái vào MySQL qua API Node.js.
            localStorage.setItem('phamkhoi_db_v11', JSON.stringify(db));
            renderAll();
            if (sessionStorage.getItem('accessToken') && typeof window.erpApi === 'function') {
                window.erpApi('/state', { method: 'PUT', body: JSON.stringify(db) })
                    .then(() => console.log('✅ Đã lưu dữ liệu vào MySQL.'))
                    .catch(err => console.error('❌ Không thể lưu MySQL:', err.message));
            }
        }

        // ================= KHỞI TẠO DỮ LIỆU NHÂN SỰ =================
        const nsLevels = [
            { id: 'level1', name: 'Level 1 - Thử việc' },
            { id: 'level2', name: 'Level 2 - Nhân viên' },
            { id: 'level3', name: 'Level 3 - Chuyên viên' }
        ];
        const nsPositions = [
            { id: 'admin', name: 'Admin' },
            { id: 'sale', name: 'Sale' },
            { id: 'designer', name: 'Designer' },
            { id: 'worker', name: 'Worker' }
        ];

        document.addEventListener('DOMContentLoaded', () => {
            const today = new Date();
            const yyyy = today.getFullYear().toString();
            const mm = ("0" + (today.getMonth() + 1)).slice(-2);
            const todayStr = yyyy + '-' + mm + '-' + ("0" + today.getDate()).slice(-2);
            document.querySelectorAll('input[type="date"]').forEach(el => el.value = todayStr);
            ['kh', 'sx', 'bh', 'bc', 'tc', 'ns'].forEach(pfx => {
                if(document.getElementById('f_month_' + pfx)) document.getElementById('f_month_' + pfx).value = mm;
                if(document.getElementById('f_year_' + pfx)) document.getElementById('f_year_' + pfx).value = yyyy;
            });
            
            // Render selects cho form Lương
            document.getElementById('ns_level').innerHTML = nsLevels.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
            document.getElementById('ns_position').innerHTML = nsPositions.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
            
            addGiaCongRow(); renderAll();
            toggleFormLuong();
			// THÊM ĐOẠN NÀY VÀO CUỐI: Đọc bộ nhớ xem trước khi F5 đang ở Tab nào
    let savedTab = localStorage.getItem('current_tab_phamkhoi') || 'tab-kehoach';
    openTab(null, savedTab);
        });

      // GHI ĐÈ LÊN HÀM OPENTAB CŨ
function openTab(evt, tabId) {
    document.querySelectorAll('.module').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if(evt) evt.currentTarget.classList.add('active');
    else {
        // Tự động tìm nút bấm ứng với Tab để làm sáng nó lên khi F5
        let btn = document.querySelector(`.nav-btn[onclick*="${tabId}"]`);
        if(btn) btn.classList.add('active');
    }
    
    // LƯU TAB HIỆN TẠI VÀO BỘ NHỚ TRÌNH DUYỆT (CHỐNG F5)
    localStorage.setItem('current_tab_phamkhoi', tabId);

    // TỰ ĐỘNG CẬP NHẬT DỮ LIỆU KHI MỞ TAB TƯƠNG ỨNG
    if(tabId === 'tab-taichinh') renderTaiChinh();
    if(tabId === 'tab-luong') renderNhanVien();
    if(tabId === 'tab-taisan') renderTaiSan();
    if(tabId === 'tab-khoanvay') renderKhoanVay();
    if(tabId === 'tab-vitien') renderViTien(); 
}

        function formatVN(num) { return Number(num).toLocaleString('en-US'); }
        function updateNCCDatalist() { document.getElementById('list-ncc').innerHTML = db.nccList.map(n => '<option value="' + n + '">').join(''); }
        function saveNCC(name) { if(name && !db.nccList.includes(name.trim())) { db.nccList.push(name.trim()); updateNCCDatalist(); } }
        function moFormAddNCC() { let b = document.getElementById('box_manage_ncc'); b.style.display = b.style.display === 'none' ? 'block' : 'none'; }
        function addNCCManual() { let n = document.getElementById('new_ncc_name').value; if(n){ saveNCC(n); syncDB(); document.getElementById('new_ncc_name').value=''; alert("Đã thêm NCC!"); } }
        		function renderHistoryLog() {
    let tbody = document.getElementById('table_history_log');
    if (!tbody) return;

    let s = (document.getElementById('search_log')?.value || '').toLowerCase();
    let html = '';

    (db.historyLog || []).filter(log => 
        log.action.toLowerCase().includes(s) || 
        log.details.toLowerCase().includes(s) || 
        log.user.toLowerCase().includes(s)
    ).forEach(log => {
        
        // Tô màu cho tài khoản để dễ nhìn
        let userColor = log.user === 'ADMIN' ? 'color: red; font-weight: bold;' : 'color: blue;';

        html += `<tr>
            <td style="font-size: 13px; color: #555;">${log.time}</td>
            <td style="${userColor}">${log.user}</td>
            <td><span class="badge" style="background: #f1f3f4; color: #333;">${log.action}</span></td>
            <td>${log.details}</td>
        </tr>`;
    });

    tbody.innerHTML = html || '<tr><td colspan="4" style="text-align:center;">Chưa có lịch sử hoạt động</td></tr>';
}
        function renderAll() {
            updateNCCDatalist();
            renderKeHoach(); renderSanXuat(); renderTonKho(); renderBanHang(); renderCongNo(); renderBaoCao(); renderNhanVien(); renderTaiChinh(); renderTaiSan(); renderLichSuThanhToanNCC();
            if(typeof renderKhoanVay === 'function') renderKhoanVay();
            
            renderViTien(); 
            if(typeof renderHistoryLog === 'function') renderHistoryLog(); // Gọi hàm vẽ tab Log
            
            const sel = document.getElementById('bh_anpham');
            if(sel) {
                sel.innerHTML = db.khoAnPham.map(ap => '<option value="' + ap.name + '">' + ap.name + ' (Tồn: ' + formatVN(ap.qty) + ' - Giá vốn: ' + formatVN(ap.unitCost||0) + ' đ)</option>').join('');
                tinhLoiNhuanBanHang();
            }
            let optSX = db.sanXuat.filter(s => s.status !== 'Hoàn thành').map(s => '<option value="' + s.idSX + '">' + s.idSX + ' - ' + s.baiIn + '</option>').join('');
            if(document.getElementById('nk_idSX')) document.getElementById('nk_idSX').innerHTML = optSX || '<option value="">Không có lệnh đang chạy</option>';
        }
        function toggleLoaiPhieu() {
            const type = document.querySelector('input[name="loai_phieu"]:checked').value;
            document.getElementById('form_thuongmai').style.display = type === 'thuongmai' ? 'block' : 'none';
            document.getElementById('form_sanxuat').style.display = type === 'sanxuat' ? 'block' : 'none';
            tinhTongTienPhieu();
        }
        function handleGiaCongSelect(sel) {
            const row = sel.closest('.row-gc'); const subBox = row.querySelector('.gc-sub-opts'); let val = sel.value;
            subBox.innerHTML = ''; subBox.style.display = 'none';
            if(val === 'Cán màng') {
                subBox.style.display = 'flex';
                subBox.innerHTML = '<div style="flex:1"><label style="font-size:11px;color:#1a73e8">Loại Màng Tồn Kho</label><select class="gc_sub_mang_loai"><option value="Màng Bóng (m)">Màng Bóng (m)</option><option value="Màng Mờ (m)">Màng Mờ (m)</option></select></div><div style="flex:1"><label style="font-size:11px;color:#1a73e8">Khấu hao màng (m)</label><input type="text" class="format-number gc_sub_mang_hao" value="0"></div>';
            } else if (val === 'Bế') {
                subBox.style.display = 'flex';
                subBox.innerHTML = '<div style="flex:1"><label style="font-size:11px;color:#1a73e8">Trạng thái Khuôn</label><select class="gc_sub_be_loai" onchange="toggleKhuonOpts(this)"><option value="Cũ">Khuôn Cũ</option><option value="Mới">Làm Khuôn Mới</option></select></div><div style="flex:1; display:none;" class="box-khuon-ncc"><label style="font-size:11px;color:#1a73e8">NCC Khuôn</label><input type="text" class="gc_sub_be_ncc" list="list-ncc"></div><div style="flex:1; display:none;" class="box-khuon-tien"><label style="font-size:11px;color:#1a73e8">Tiền Khuôn (Chưa VAT)</label><input type="text" class="format-number gc_sub_be_tien" value="0" oninput="tinhTongTienPhieu()"></div>';
            } else if (val === 'Khác') {
                subBox.style.display = 'flex'; subBox.innerHTML = '<div style="flex:1"><label style="font-size:11px;color:#1a73e8">Nhập tên Gia Công</label><input type="text" class="gc_sub_khac_ten"></div>';
            }
            tinhTongTienPhieu();
        }
        function toggleKhuonOpts(sel) {
            const subBox = sel.closest('.gc-sub-opts'); const isNew = sel.value === 'Mới';
            subBox.querySelector('.box-khuon-ncc').style.display = isNew ? 'block' : 'none';
            subBox.querySelector('.box-khuon-tien').style.display = isNew ? 'block' : 'none';
            if(!isNew) subBox.querySelector('.gc_sub_be_tien').value = 0; tinhTongTienPhieu();
        }
        function addGiaCongRow() {
            const div = document.createElement('div'); div.className = 'row-gc';
            div.innerHTML = '<div class="gc-main-row"><div style="flex:2;"><label>NCC Gia Công</label><input type="text" class="gc_ncc" list="list-ncc"></div><div style="flex:2;"><label>Loại Gia Công</label><select class="gc_loai" onchange="handleGiaCongSelect(this)"><option value="Cắt">Cắt</option><option value="Bế">Bế</option><option value="Dán">Dán</option><option value="Bồi">Bồi</option><option value="Cán màng">Cán màng</option><option value="Khác">Khác</option></select></div><div style="flex:1;"><label>SL</label><input type="text" class="format-number gc_sl" value="0" oninput="tinhTongTienPhieu()"></div><div style="flex:1.2;"><label>Đơn Giá (Chưa VAT)</label><input type="text" class="format-number gc_gia" value="0" oninput="tinhTongTienPhieu()"></div><div style="flex:1;"><label class="vat-box"><input type="checkbox" class="gc_vat" onchange="tinhTongTienPhieu()"> 8%</label></div><div style="flex:1.5;"><label>Thành Tiền</label><input type="text" class="gc_thanh" readonly style="background:#f1f3f4; font-weight:bold; color:#d93025"></div><div><label>&nbsp;</label><button class="btn-small btn-danger" onclick="this.closest(\'.row-gc\').remove(); tinhTongTienPhieu()">✕</button></div></div><div class="gc-sub-opts"></div>';
            document.getElementById('list_giacong').appendChild(div); handleGiaCongSelect(div.querySelector('.gc_loai'));
        }
        function calcRow(sl, gia, hasVat) {
            let t = parseNumber(sl) * parseNumber(gia); let v = hasVat ? t * 0.08 : 0; return { t, v, tong: t + v };
        }
        let tongTienHienTai = 0;
        function tinhTongTienPhieu() {
            tongTienHienTai = 0;
            const type = document.querySelector('input[name="loai_phieu"]:checked').value;
            if(type === 'thuongmai') {
                let r = calcRow(document.getElementById('tm_sl').value, document.getElementById('tm_gia').value, document.getElementById('tm_vat').checked);
                document.getElementById('tm_thanh').value = formatVN(r.tong); tongTienHienTai = r.tong;
            } else {
                let g = calcRow(document.getElementById('sx_giay_sl').value, document.getElementById('sx_giay_gia').value, document.getElementById('sx_giay_vat').checked);
                document.getElementById('sx_giay_thanh').value = formatVN(g.tong); tongTienHienTai += g.tong;
                let i = calcRow(document.getElementById('sx_in_sl').value, document.getElementById('sx_in_gia').value, document.getElementById('sx_in_vat').checked);
                document.getElementById('sx_in_thanh').value = formatVN(i.tong); tongTienHienTai += i.tong;
                document.querySelectorAll('.row-gc').forEach(row => {
                    let gc = calcRow(row.querySelector('.gc_sl').value, row.querySelector('.gc_gia').value, row.querySelector('.gc_vat').checked);
                    let tk = 0;
                    if(row.querySelector('.gc_loai').value === 'Bế' && row.querySelector('.gc_sub_be_loai') && row.querySelector('.gc_sub_be_loai').value === 'Mới') {
                        tk = calcRow(1, row.querySelector('.gc_sub_be_tien').value, row.querySelector('.gc_vat').checked).tong; 
                    }
                    row.querySelector('.gc_thanh').value = formatVN(gc.tong + tk); tongTienHienTai += (gc.tong + tk);
                });
            }
            document.getElementById('hienthi_tongtien').innerText = formatVN(tongTienHienTai);
        }
        function ghiNhanNoChiTiet(idSX, ncc, khau, thongtin, date, tienChuaVat, isVat) {
            if(!ncc || tienChuaVat <= 0) return; saveNCC(ncc);
            let vat = isVat ? tienChuaVat * 0.08 : 0;
            db.chiTietNo.push({ idSX, ncc, date, khau, thongtin, tienChuaVat, tienVat: vat, tongTien: tienChuaVat + vat, daTra: 0 });
        }
function saveKeHoach() {
    try {
        saveState();
        tinhTongTienPhieu(); // Ép hệ thống tính lại một lần nữa cho chắc
        const anPham = document.getElementById('kh_anpham').value; 
        if(!anPham) return alert("BẮT BUỘC: Nhập Tên Bài In (Thành phẩm)!"); 
        if(tongTienHienTai <= 0) return alert("Hệ thống báo Tổng tiền bằng 0! Sếp hãy kiểm tra lại Đơn giá và Số lượng.");
        
        const type = document.querySelector('input[name="loai_phieu"]:checked').value;
        let dStr = document.getElementById('kh_ngay').value; let d = new Date(dStr);
        
        // Fix lỗi cấm tạo ID nếu data cũ bị khuyết thông tin
        if(!db.keHoach) db.keHoach = [];
        if(!db.sanXuat) db.sanXuat = [];
        if(!db.chiTietNo) db.chiTietNo = [];
        
        let prefix = 'SX-' + ("0" + (d.getMonth() + 1)).slice(-2) + d.getFullYear().toString().slice(-2);
        let dsCungThang = db.keHoach.filter(s => s && s.idSX && s.idSX.startsWith(prefix));
        let idSX = prefix + '-' + (dsCungThang.length + 1);
        
        let chiTietLuu = []; let objRollback = []; 
        
        if(type === 'thuongmai') {
            let ncc = document.getElementById('tm_ncc').value; if(!ncc) return alert("Nhập NCC!");
            let sl = parseNumber(document.getElementById('tm_sl').value); let gia = parseNumber(document.getElementById('tm_gia').value);
            
            ghiNhanNoChiTiet(idSX, ncc, "Thương Mại", "Mua thành phẩm", dStr, sl*gia, document.getElementById('tm_vat').checked);
            chiTietLuu.push({ khau: "Thương Mại", ncc, thongtin: "Mua thành phẩm", tien: tongTienHienTai });

            if(sl > 0) {
                let donGiaVon = tongTienHienTai / sl;
                let apKho = db.khoAnPham.find(a => a.name === anPham);
                if(apKho) {
                    let tongGiaTriCu = apKho.qty * (apKho.unitCost || 0);
                    let tongGiaTriMoi = sl * donGiaVon;
                    apKho.qty += sl;
                    apKho.unitCost = (tongGiaTriCu + tongGiaTriMoi) / apKho.qty; 
                } else { db.khoAnPham.push({ name: anPham, qty: sl, unitCost: donGiaVon }); }
            }
        } else {
            let gNcc = document.getElementById('sx_giay_ncc').value; let gVal = parseNumber(document.getElementById('sx_giay_sl').value) * parseNumber(document.getElementById('sx_giay_gia').value); let gVat = document.getElementById('sx_giay_vat').checked;
            let gInfo = document.getElementById('sx_giay_loai').value + ' - Khổ: ' + document.getElementById('sx_giay_kho').value;
            ghiNhanNoChiTiet(idSX, gNcc, "Giấy", gInfo, dStr, gVal, gVat);
            chiTietLuu.push({ khau: "Giấy", ncc: gNcc, thongtin: gInfo, tien: gVal * (gVat?1.08:1) });
            
            let iNcc = document.getElementById('sx_in_ncc').value; let iVal = parseNumber(document.getElementById('sx_in_sl').value) * parseNumber(document.getElementById('sx_in_gia').value); let iVat = document.getElementById('sx_in_vat').checked;
            let iInfo = 'Máy ' + document.getElementById('sx_in_may').value + ' - Khổ: ' + document.getElementById('sx_in_kho').value;
            ghiNhanNoChiTiet(idSX, iNcc, "In", iInfo, dStr, iVal, iVat);
            chiTietLuu.push({ khau: "In", ncc: iNcc, thongtin: iInfo, tien: iVal * (iVat?1.08:1) });
            
            document.querySelectorAll('.row-gc').forEach(row => {
                let cNcc = row.querySelector('.gc_ncc').value; let loai = row.querySelector('.gc_loai').value;
                let cVal = parseNumber(row.querySelector('.gc_sl').value) * parseNumber(row.querySelector('.gc_gia').value);
                let cVat = row.querySelector('.gc_vat').checked; let info = loai;
                if(loai === 'Khác') info = row.querySelector('.gc_sub_khac_ten').value;
                if(loai === 'Cán màng') {
                    let m = row.querySelector('.gc_sub_mang_loai').value; let hao = parseNumber(row.querySelector('.gc_sub_mang_hao').value);
                    info = 'Cán màng ' + m + ' (Hao: ' + hao + 'm)';
                    let mK = db.khoVatTu.find(v => v.name === m); if(mK) mK.qty -= hao;
                    objRollback.push({ type: 'vt', name: m, qty: hao }); 
                }
                if(loai === 'Bế') {
                    if(row.querySelector('.gc_sub_be_loai').value === 'Mới') {
                        let k_ncc = row.querySelector('.gc_sub_be_ncc').value; let k_tien = parseNumber(row.querySelector('.gc_sub_be_tien').value);
                        ghiNhanNoChiTiet(idSX, k_ncc, "Khuôn Bế", "Làm khuôn mới", dStr, k_tien, cVat);
                        db.khoVatTu.push({ name: 'Khuôn Bế: ' + anPham, qty: 1, warn: 0 });
                        info = 'Bế (Khuôn mới NCC: ' + k_ncc + ')'; 
                    } else { info = 'Bế (Dùng khuôn cũ)'; }
                }
                ghiNhanNoChiTiet(idSX, cNcc, "Gia Công", info, dStr, cVal, cVat);
                chiTietLuu.push({ khau: "Gia Công", ncc: cNcc, thongtin: info, tien: cVal * (cVat?1.08:1) });
            });
        }
        
        let dl = document.getElementById('kh_deadline').value;
        
        let rawData = {
            type: type,
            tm: type === 'thuongmai' ? { ncc: document.getElementById('tm_ncc').value, sl: document.getElementById('tm_sl').value, gia: document.getElementById('tm_gia').value, vat: document.getElementById('tm_vat').checked } : null,
            sx: type === 'sanxuat' ? {
                giay: { ncc: document.getElementById('sx_giay_ncc').value, loai: document.getElementById('sx_giay_loai').value, kho: document.getElementById('sx_giay_kho').value, sl: document.getElementById('sx_giay_sl').value, gia: document.getElementById('sx_giay_gia').value, vat: document.getElementById('sx_giay_vat').checked },
                in: { ncc: document.getElementById('sx_in_ncc').value, may: document.getElementById('sx_in_may').value, kho: document.getElementById('sx_in_kho').value, sl: document.getElementById('sx_in_sl').value, gia: document.getElementById('sx_in_gia').value, vat: document.getElementById('sx_in_vat').checked },
                gc: Array.from(document.querySelectorAll('.row-gc')).map(row => ({ ncc: row.querySelector('.gc_ncc').value, loai: row.querySelector('.gc_loai').value, sl: row.querySelector('.gc_sl').value, gia: row.querySelector('.gc_gia').value, vat: row.querySelector('.gc_vat').checked, subKhac: row.querySelector('.gc_sub_khac_ten') ? row.querySelector('.gc_sub_khac_ten').value : '', subMangLoai: row.querySelector('.gc_sub_mang_loai') ? row.querySelector('.gc_sub_mang_loai').value : '', subMangHao: row.querySelector('.gc_sub_mang_hao') ? row.querySelector('.gc_sub_mang_hao').value : '', subBeLoai: row.querySelector('.gc_sub_be_loai') ? row.querySelector('.gc_sub_be_loai').value : '', subBeNcc: row.querySelector('.gc_sub_be_ncc') ? row.querySelector('.gc_sub_be_ncc').value : '', subBeTien: row.querySelector('.gc_sub_be_tien') ? row.querySelector('.gc_sub_be_tien').value : '' }))
            } : null
        };

        db.keHoach.push({ idSX, ten: document.getElementById('kh_ten').value, baiIn: anPham, type: type === 'thuongmai' ? 'Thương Mại' : 'Sản Xuất', date: dStr, deadline: dl, tongTien: tongTienHienTai, details: chiTietLuu, rollbackData: objRollback, rawData: rawData });
        if(type === 'sanxuat') { db.sanXuat.push({ idSX, baiIn: anPham, status: 'Đang in', deadline: dl }); }
        syncDB();
        
        if(type === 'sanxuat') { 
            alert('LƯU THÀNH CÔNG LỆNH SẢN XUẤT!\nMã: ' + idSX); 
            document.getElementById('btn_nav_kanban').click(); 
        } else { 
            alert('LƯU PHIẾU THƯƠNG MẠI THÀNH CÔNG!\nMã: ' + idSX); 
        }
        
        // Gọi hàm dọn dẹp Form sau khi lưu xong
        resetFormKeHoach();

    } catch (e) {
        alert("❌ Hệ thống báo lỗi khi lưu phiếu: " + e.message);
        console.error(e);
    }
}

// BỔ SUNG HÀM DỌN DẸP FORM VỀ MẶC ĐỊNH
function resetFormKeHoach() {
    const today = new Date();
    const yyyy = today.getFullYear().toString();
    const mm = ("0" + (today.getMonth() + 1)).slice(-2);
    const todayStr = yyyy + '-' + mm + '-' + ("0" + today.getDate()).slice(-2);
    
    // Đưa ngày về hôm nay
    document.getElementById('kh_ngay').value = todayStr;
    document.getElementById('kh_deadline').value = todayStr;

    // Xóa thông tin chung
    document.getElementById('kh_ten').value = '';
    document.getElementById('kh_anpham').value = '';

    // Xóa tab Thương mại
    document.getElementById('tm_ncc').value = '';
    document.getElementById('tm_sl').value = '0';
    document.getElementById('tm_gia').value = '0';
    document.getElementById('tm_vat').checked = false;

    // Xóa tab Sản xuất
    document.getElementById('sx_giay_ncc').value = '';
    document.getElementById('sx_giay_loai').value = '';
    document.getElementById('sx_giay_kho').value = '';
    document.getElementById('sx_giay_sl').value = '0';
    document.getElementById('sx_giay_gia').value = '0';
    document.getElementById('sx_giay_vat').checked = false;

    document.getElementById('sx_in_ncc').value = '';
    document.getElementById('sx_in_kho').value = '';
    document.getElementById('sx_in_sl').value = '0';
    document.getElementById('sx_in_gia').value = '0';
    document.getElementById('sx_in_vat').checked = false;

    // Làm sạch toàn bộ dòng gia công và tạo lại 1 dòng trắng đầu tiên
    document.getElementById('list_giacong').innerHTML = '';
    addGiaCongRow();
    
    // Reset lại ô hiển thị tổng tiền
    tinhTongTienPhieu();
}
function loadEditPlan(idSX) {
            // 1. Kiểm tra xem đã trả tiền cho NCC chưa
            if(db.chiTietNo.some(n => n.idSX === idSX && n.daTra > 0)) {
                return alert("⛔ Lệnh ĐÃ CÓ THANH TOÁN. Vào Sổ Cái hủy phiếu chi trước!");
            }

            let kh = db.keHoach.find(k => k.idSX === idSX); 
            if(!kh) return;
            
            // 2. Hỏi xác nhận để tránh bấm nhầm
            if(!confirm("Hệ thống sẽ THU HỒI phiếu này về khung nhập liệu.\nVật tư và Công nợ cũ sẽ bị xóa để Sếp sửa lại. Tiếp tục?")) return;
            
            // 3. Hoàn trả vật tư (nếu có)
            if(kh.rollbackData) {
                kh.rollbackData.forEach(rb => { 
                    if(rb.type === 'vt') { 
                        let vt = db.khoVatTu.find(v => v.name === rb.name); 
                        if(vt) vt.qty += rb.qty; 
                    } 
                });
            }

            // 4. Xóa dữ liệu cũ trong database để chuẩn bị lưu mới
            db.chiTietNo = db.chiTietNo.filter(n => n.idSX !== idSX); 
            db.keHoach = db.keHoach.filter(k => k.idSX !== idSX); 
            db.sanXuat = db.sanXuat.filter(s => s.idSX !== idSX);
            
            // 5. Đẩy dữ liệu cơ bản lên form
            document.getElementById('kh_ngay').value = kh.date; 
            document.getElementById('kh_deadline').value = kh.deadline;
            document.getElementById('kh_ten').value = kh.ten; 
            document.getElementById('kh_anpham').value = kh.baiIn;

            // 6. Thông báo và cập nhật giao diện
            document.getElementById('kh_detail_viewer').innerHTML = '<div style="text-align:center; color:#1e8e3e; margin-top:50px;"><h3>✅ Đã rút phiếu về form!</h3><i>Sếp sửa lại số và bấm LƯU nhé.</i></div>';
            syncDB();

            // 7. LỆNH TRƯỢT MÀN HÌNH LÊN TRÊN CÙNG (Dòng Sếp đang tìm đây ạ)
            window.scrollTo({ top: 0, behavior: 'smooth' }); 
        }
    function renderKeHoach() {
            const y = document.getElementById('f_year_kh').value; const m = document.getElementById('f_month_kh').value;
            const s = document.getElementById('search_kh').value.toLowerCase().trim();
            const filterPrefix = y + '-' + m; const today = new Date();
            
            let html = db.keHoach.filter(k => (!s || k.idSX.toLowerCase().includes(s) || k.baiIn.toLowerCase().includes(s)) && k.date.startsWith(filterPrefix)).map(k => {
                let days = Math.ceil((new Date(k.deadline) - today) / (1000 * 60 * 60 * 24));
                let badge = days < 0 ? '<span class="badge" style="background:#fce8e6; color:#d93025;">Trễ ' + Math.abs(days) + ' ng</span>' : '<span class="badge" style="background:#fef7e0; color:#f29900;">Còn ' + days + ' ng</span>';
                let tBadge = k.type === 'Thương Mại' ? '<span class="badge" style="background:#f3e8fd; color:#9334e6; margin-top:4px; display:inline-block">Thương Mại</span>' : '';

                // --- LOGIC LẤY TRẠNG THÁI KANBAN VÀ CHECK HOLD ---
                let sx = db.sanXuat.find(s => s.idSX === k.idSX);
                let statusText = k.type === 'Thương Mại' ? 'Nhập thẳng kho' : (sx ? sx.status : 'Chưa SX');
                let statusColor = statusText === 'Hoàn thành' ? '#1e8e3e' : (statusText === 'Đang in' ? '#1a73e8' : '#f29900');
                
                let statusHtml = '';
                if (k.isHold) {
                    // Nếu đang Hold thì hiện nút Đỏ cấm sản xuất
                    statusHtml = '<span class="badge" style="background:#d93025; color:#fff; cursor:pointer; padding:6px; box-shadow: 0 2px 4px rgba(217,48,37,0.3);" onclick="event.stopPropagation(); toggleHold(\'' + k.idSX + '\')" title="Bấm để Gỡ Hold">⏸️ ĐANG HOLD</span>';
                } else {
                    // Nếu bình thường thì hiện trạng thái Kanban (Cho phép bấm vào để Hold)
                    statusHtml = '<span class="badge" style="background:#f1f3f4; color:' + statusColor + '; cursor:pointer; border: 1px dashed ' + statusColor + ';" onclick="event.stopPropagation(); toggleHold(\'' + k.idSX + '\')" title="Bấm để HOLD lệnh này (Tạm ngưng SX)">' + statusText + '</span>';
                }

                return '<tr class="tr-click" onclick="viewChiTietKH(\'' + k.idSX + '\')"><td>' + k.date.slice(8,10) + '/' + k.date.slice(5,7) + '</td><td><b>' + k.idSX + '</b><br><i style="font-size:11px">' + k.baiIn + '</i><br>' + tBadge + '</td><td>' + badge + '</td><td style="font-weight:bold; color:#1a73e8">' + formatVN(k.tongTien) + '</td><td>' + statusHtml + '</td></tr>';
            }).join('');
            document.getElementById('table_kehoach').innerHTML = html || '<tr><td colspan="5" style="text-align:center">Trống</td></tr>';
        }

        // === HÀM XỬ LÝ KHÓA / MỞ KHÓA LỆNH (HOLD) ===
        function toggleHold(idSX) {
            let kh = db.keHoach.find(k => k.idSX === idSX);
            if (!kh) return;
            
            let sx = db.sanXuat.find(s => s.idSX === idSX);
            if (sx && sx.status === 'Hoàn thành' && !kh.isHold) {
                return alert("⛔ TỪ CHỐI: Lệnh này đã nhập kho xong, không thể Hold được nữa!");
            }

            if (kh.isHold) {
                if(confirm(`🔓 MỞ KHÓA (UNHOLD) lệnh [${idSX}] để xưởng tiếp tục sản xuất?`)) {
                    kh.isHold = false;
                    logActivity("Kế Hoạch", `🔓 Mở khóa (Unhold) lệnh ${idSX}`);
                }
            } else {
                let reason = prompt(`⏸️ KHÓA LỆNH (HOLD): Nhập lý do (VD: Chờ file, Sai giá, Đợi duyệt...):`, "Thiếu số liệu");
                if (reason) {
                    kh.isHold = true;
                    kh.holdReason = reason;
                    logActivity("Kế Hoạch", `⏸️ Khóa (Hold) lệnh ${idSX} - Lý do: ${reason}`);
                }
            }
            syncDB();
        }
        function viewChiTietKH(idSX) {
            let kh = db.keHoach.find(k => k.idSX === idSX); if(!kh) return;
            let html = '<div class="detail-box"><div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding-bottom:10px; margin-bottom:10px;"><h2 style="color:#1a73e8; margin:0">' + kh.idSX + '</h2><div> <button class="btn-small btn-warning" onclick="loadEditPlan(\'' + kh.idSX + '\')">✏️ Sửa Lệnh</button></div></div><p><b>Bài in sinh ra:</b> <span style="color:#1e8e3e; font-weight:bold">' + kh.baiIn + '</span></p><p><b>Loại phiếu:</b> ' + kh.type + '</p><h3 style="font-size:15px; margin-top:20px;">Chi tiết Bóc Tách:</h3><table style="font-size:13px; margin-top:5px;"><tr style="background:#f1f3f4"><th>Khâu</th><th>NCC</th><th>Thông tin</th><th>Tổng Tiền</th></tr>';
            kh.details.forEach(dt => { html += '<tr><td><b>' + dt.khau + '</b></td><td>' + dt.ncc + '</td><td>' + dt.thongtin + '</td><td style="color:#d93025; font-weight:bold">' + formatVN(dt.tien) + '</td></tr>'; });
            html += '</table><div style="text-align:right; font-size:18px; font-weight:bold; margin-top:15px;">TỔNG: <span style="color:#d93025">' + formatVN(kh.tongTien) + ' đ</span></div></div>';
            document.getElementById('kh_detail_viewer').innerHTML = html;
        }
     function renderSanXuat() {
            const m = document.getElementById('f_month_sx').value; const y = document.getElementById('f_year_sx').value.slice(-2);
            let colIn = "", colGC = "", colHT = ""; const today = new Date();
            
            db.sanXuat.filter(sx => sx.idSX.startsWith('SX-' + m + y)).forEach(sx => {
                let kh = db.keHoach.find(k => k.idSX === sx.idSX);
                let isHold = kh ? kh.isHold : false;
                let holdReason = (kh && kh.holdReason) ? kh.holdReason : 'Tạm dừng';

                let days = Math.ceil((new Date(sx.deadline) - today) / (1000 * 60 * 60 * 24));
                let badge = sx.status === 'Hoàn thành' ? '<span style="color:#1e8e3e">Đã kho</span>' : '<span style="color:' + (days<0?'#d93025':'#f29900') + '">' + (days<0?'Trễ '+Math.abs(days):'Còn '+days) + ' ng</span>';
                
                // NẾU LỆNH BỊ HOLD -> Bôi đỏ thẻ Kanban và CẤM KÉO THẢ (draggable="false")
                let cardStyle = isHold ? 'border-left: 5px solid #d93025; background: #fce8e6; opacity: 0.95;' : 'border-left: 3px solid var(--primary);';
                let holdBadge = isHold ? `<div style="background:#d93025; color:#fff; font-size:11px; font-weight:bold; padding:4px; border-radius:4px; margin-top:5px; text-align:center;">⏸️ HOLD: ${holdReason}</div>` : '';
                let dragAttr = isHold ? 'draggable="false"' : 'draggable="true" ondragstart="drag(event)"';

                let card = '<div class="kanban-card" ' + dragAttr + ' id="' + sx.idSX + '" style="' + cardStyle + '"><div class="k-title">' + sx.baiIn + '</div><div class="k-meta">Mã: <b style="color:#1a73e8">' + sx.idSX + '</b></div><div class="k-meta">⏳ DL: ' + sx.deadline + ' (' + badge + ')</div>' + holdBadge + '</div>';
                
                if(sx.status === 'Đang in') colIn += card; else if(sx.status === 'Đang gia công') colGC += card; else colHT += card;
            });
            document.getElementById('list-dangin').innerHTML = colIn; document.getElementById('list-danggiacong').innerHTML = colGC; document.getElementById('list-hoanthanh').innerHTML = colHT;
        }
        function allowDrop(ev) { ev.preventDefault(); ev.target.closest('.kanban-col')?.classList.add('drag-over'); }
        function drag(ev) { ev.dataTransfer.setData("text", ev.target.id); }
function drop(ev, newStatus) {
            ev.preventDefault(); document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
            let idSX = ev.dataTransfer.getData("text"); let idx = db.sanXuat.findIndex(s => s.idSX === idSX);
            if(idx === -1 || db.sanXuat[idx].status === newStatus) return;

            // --- BẢO VỆ CHỐNG KÉO THẢ LỆNH ĐANG HOLD (Lỡ tay bẻ khóa HTML) ---
            let kh = db.keHoach.find(k => k.idSX === idSX);
            if(kh && kh.isHold) {
                return alert("⛔ LỆNH ĐANG BỊ KHÓA (HOLD)! Xưởng không được phép thao tác. Yêu cầu báo Kế Hoạch mở khóa trước!");
            }

            if(newStatus === 'Hoàn thành') {
                let qtyStr = prompt('Nhập số lượng thực tế nhập kho cho lệnh [' + db.sanXuat[idx].idSX + ']:', "1000");
                let qty = parseNumber(qtyStr);
                if(!qty || isNaN(qty)) return alert("Hủy thao tác!");
                let newUnitCost = qty > 0 ? ((kh ? kh.tongTien : 0) / qty) : 0;
                let ap = db.khoAnPham.find(a => a.name === db.sanXuat[idx].baiIn);
                if(ap) {
                    let totalValueOld = ap.qty * (ap.unitCost || 0);
                    let totalValueNew = qty * newUnitCost;
                    ap.qty += qty;
                    ap.unitCost = (totalValueOld + totalValueNew) / ap.qty;
                } else { db.khoAnPham.push({ name: db.sanXuat[idx].baiIn, qty: qty, unitCost: newUnitCost }); }
                
                db.sanXuat[idx].actualQty = qty;
            }
            db.sanXuat[idx].status = newStatus; syncDB();
        }
        document.addEventListener("dragleave", function(ev) { ev.target.closest('.kanban-col')?.classList.remove('drag-over'); });
        function moFormNhapVT() { document.getElementById('form_nhap_vt').style.display = 'block'; }
        function nhapVatTu() {
            let ten = document.getElementById('vt_ten').value.trim(); let sl = parseNumber(document.getElementById('vt_sl').value);
            if(ten && sl) {
                let exist = db.khoVatTu.find(v => v.name.toLowerCase() === ten.toLowerCase());
                if(exist) exist.qty += sl; else db.khoVatTu.push({ name: ten, qty: sl, warn: parseNumber(document.getElementById('vt_warn').value) });
                if (!db.lichSuVatTu) db.lichSuVatTu = [];
                db.lichSuVatTu.push({ date: new Date().toISOString().slice(0, 10), type: 'NHẬP', name: ten, qty: sl, dvt: exist?.dvt || 'Cái', note: 'Nhập kho lẻ' });
                document.getElementById('form_nhap_vt').style.display = 'none'; syncDB();
            }
        }
// --- HÀM VẼ GIAO DIỆN KHO (TỰ ĐỘNG TẠO LINK MÃ PHIẾU) ---
function renderTonKho() {
    document.getElementById('table_anpham').innerHTML = db.khoAnPham.filter(a => a.name.toLowerCase().includes(document.getElementById('search_ap').value.toLowerCase())).map(a => '<tr><td><b>' + a.name + '</b></td><td style="font-size:16px; font-weight:bold;">' + formatVN(a.qty) + '</td><td style="color:#d93025">' + formatVN(a.unitCost||0) + ' đ</td><td>' + (a.qty > 0 ? '<span class="text-success">Sẵn sàng xuất</span>' : '<span class="text-danger">Hết hàng</span>') + '</td></tr>').join('');
    
    // Thêm Đơn vị tính vào bảng Tồn Kho hiện tại
    document.getElementById('table_vattu').innerHTML = db.khoVatTu.filter(v => v.name.toLowerCase().includes(document.getElementById('search_vt').value.toLowerCase())).map(v => '<tr><td>' + v.name + '</td><td><b>' + (v.dvt || 'Cái') + '</b></td><td class="' + (v.qty <= v.warn ? 'text-danger' : 'text-success') + '" style="font-size:16px; font-weight:bold;">' + formatVN(v.qty) + (v.qty <= v.warn ? ' ⚠ (Sắp hết)' : '') + '</td><td>' + formatVN(v.warn) + '</td></tr>').join('');

    if(!db.lichSuVatTu) db.lichSuVatTu = [];
    let m = document.getElementById('f_month_inventory')?.value || document.getElementById('f_month_tk')?.value || ("0" + (new Date().getMonth() + 1)).slice(-2);
    let y = document.getElementById('f_year_inventory')?.value || document.getElementById('f_year_tk')?.value || new Date().getFullYear().toString();
    if (document.getElementById('f_month_tk')) document.getElementById('f_month_tk').value = m;
    if (document.getElementById('f_year_tk')) document.getElementById('f_year_tk').value = y;
    let prefix = y + '-' + m;

    const giaoDichThang = db.lichSuVatTu.filter(tk => (tk.date || '').startsWith(prefix));
    const tongNhap = giaoDichThang.filter(t => t.type === 'NHẬP').reduce((sum, t) => sum + Number(t.qty || 0), 0);
    const tongXuat = giaoDichThang.filter(t => t.type !== 'NHẬP').reduce((sum, t) => sum + Number(t.qty || 0), 0);
    const xuatBan = (db.banHang || []).filter(b => (b.date || '').startsWith(prefix));
    const soLuongBan = xuatBan.reduce((sum, b) => sum + Number(b.sl || 0), 0);
    const doanhThuBan = xuatBan.reduce((sum, b) => sum + Number(b.tienThuVat || b.tien || 0), 0);
    const vatTuBox = document.getElementById('inventory_material_summary');
    const anPhamBox = document.getElementById('inventory_product_summary');
    if (vatTuBox) vatTuBox.innerHTML = `<div class="detail-box"><b>VẬT TƯ ${m}/${y}</b><p style="margin-top:10px;color:#1e8e3e">Nhập: ${formatVN(tongNhap)}</p><p style="color:#d93025">Xuất: ${formatVN(tongXuat)}</p><small>${giaoDichThang.length} phiếu kho trong tháng</small></div>`;
    if (anPhamBox) anPhamBox.innerHTML = `<div class="detail-box"><b>THÀNH PHẨM ${m}/${y}</b><p style="margin-top:10px;color:#d93025">Xuất bán: ${formatVN(soLuongBan)} SP</p><p style="color:#1a73e8">Doanh thu: ${formatVN(doanhThuBan)} đ</p><small>${xuatBan.length} đơn bán trong tháng</small></div>`;

    // Danh sách tổng hợp theo tháng: gồm biến động vật tư và thành phẩm đã xuất bán.
    const monthlyRows = [
        ...giaoDichThang.map(tk => ({ date: tk.date, type: tk.type === 'NHẬP' ? 'NHẬP VẬT TƯ' : 'XUẤT VẬT TƯ', name: tk.name, qty: Number(tk.qty || 0), source: tk.note || '', revenue: null, isIn: tk.type === 'NHẬP' })),
        ...xuatBan.map(bh => ({ date: bh.date, type: 'XUẤT BÁN THÀNH PHẨM', name: bh.anPham, qty: Number(bh.sl || 0), source: bh.kh || 'Khách lẻ', revenue: Number(bh.tienThuVat || bh.tien || 0), isIn: false }))
    ].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    const monthlyTable = document.getElementById('table_inventory_monthly');
    const monthlyTitle = document.getElementById('inventory_monthly_list_title');
    if (monthlyTitle) monthlyTitle.textContent = `Danh sách biến động kho tháng ${m}/${y}`;
    if (monthlyTable) monthlyTable.innerHTML = monthlyRows.map(item => {
        const color = item.isIn ? '#1e8e3e' : '#d93025';
        return `<tr><td>${item.date || ''}</td><td><span class="badge" style="background:${color}; color:#fff;">${item.type}</span></td><td><b>${item.name || ''}</b></td><td style="color:${color}; font-weight:bold;">${item.isIn ? '+' : '-'}${formatVN(item.qty)}</td><td>${item.source || '—'}</td><td>${item.revenue === null ? '—' : formatVN(item.revenue) + ' đ'}</td></tr>`;
    }).join('') || '<tr><td colspan="6" style="text-align:center">Chưa có biến động kho trong tháng này</td></tr>';

    let htmlLichSu = db.lichSuVatTu.filter(tk => (tk.date || '').startsWith(prefix)).sort((a,b) => new Date(b.date) - new Date(a.date)).map(tk => {
        let color = tk.type === 'NHẬP' ? '#1e8e3e' : '#d93025';
        let dau = tk.type === 'NHẬP' ? '+' : '-';
        let dvtText = tk.dvt ? ` ${tk.dvt}` : ''; // Hiển thị ĐVT ở Lịch Sử
        
        let noteHtml = (tk.note || '').replace(/(PT|PC|CK)\d{4}-\d+/g, function(match) {
            return `<span onclick="goToSoQuy('${match}')" style="color:#1a73e8; text-decoration:underline; font-weight:bold; cursor:pointer;" title="Bấm để xem Sổ Quỹ">${match}</span>`;
        });

        return `<tr>
            <td>${tk.date}</td>
            <td><span class="badge" style="background:${color}; color:#fff;">${tk.type}</span></td>
            <td><b>${tk.name}</b></td>
            <td style="color:${color}; font-weight:bold; font-size:15px;">${dau}${formatVN(tk.qty)}${dvtText}</td>
            <td><i style="color:#666; font-size:12px;">${noteHtml}</i></td>
        </tr>`;
    }).join('');

    let tableLichSu = document.getElementById('table_lichsu_vattu');
    if(tableLichSu) tableLichSu.innerHTML = htmlLichSu || '<tr><td colspan="5" style="text-align:center">Chưa có giao dịch nhập/xuất trong tháng này</td></tr>';
}

// Đồng bộ bộ lọc ở đầu báo cáo và Thẻ kho: đổi ở một nơi, toàn bộ danh sách theo tháng đổi theo.
function syncInventoryPeriod(source) {
    const fromMonth = document.getElementById(source === 'ledger' ? 'f_month_tk' : 'f_month_inventory');
    const fromYear = document.getElementById(source === 'ledger' ? 'f_year_tk' : 'f_year_inventory');
    const toMonth = document.getElementById(source === 'ledger' ? 'f_month_inventory' : 'f_month_tk');
    const toYear = document.getElementById(source === 'ledger' ? 'f_year_inventory' : 'f_year_tk');
    if (fromMonth && toMonth) toMonth.value = fromMonth.value;
    if (fromYear && toYear) toYear.value = fromYear.value;
    renderTonKho();
}
        
// --- CẬP NHẬT: XUẤT KHO & THU TIỀN VÀO VÍ ---
function saveBanHang() {
    saveState();
    let kh = document.getElementById('bh_kh').value, anPham = document.getElementById('bh_anpham').value;
    let sl = parseNumber(document.getElementById('bh_sl').value);
    let doanhThuChuaVat = parseNumber(document.getElementById('bh_tien').value);
    let hasVat = document.getElementById('bh_vat') ? document.getElementById('bh_vat').checked : false;
    let wallet = document.getElementById('bh_wallet') ? document.getElementById('bh_wallet').value : 'TIENMAT'; 

    if(!kh || !anPham || sl <= 0) return alert("Sếp vui lòng nhập đủ thông tin và Số lượng > 0!");

    let apKho = db.khoAnPham.find(a => a.name === anPham);
    if(!apKho) return alert("❌ LỖI: Bài in này không tồn tại trong kho!");
    if(apKho.qty < sl) return alert(`❌ TỪ CHỐI XUẤT: Tồn kho chỉ còn ${formatVN(apKho.qty)} SP.`);

    let unitCost = apKho.unitCost || 0;
    let loiNhuan = doanhThuChuaVat - (unitCost * sl);
    let tongThuGomVat = doanhThuChuaVat + (hasVat ? doanhThuChuaVat * 0.08 : 0);

    apKho.qty -= sl; 
    db.banHang.push({ idBH: 'BH-' + Date.now(), date: document.getElementById('bh_ngay').value, kh, anPham, sl, tien: doanhThuChuaVat, tienThuVat: tongThuGomVat, coVat: hasVat, loiNhuan: loiNhuan });
    
    if(!db.giaoDichVi) db.giaoDichVi = [];
    db.giaoDichVi.push({ idGD: 'GD-' + Date.now(), date: document.getElementById('bh_ngay').value || new Date().toISOString().split('T')[0], loai: 'THU', vi: wallet, doiTuong: kh || 'Khách hàng', soTien: tongThuGomVat > 0 ? tongThuGomVat : doanhThuChuaVat, lyDo: 'Xuất bán: ' + anPham, hangMuc: 'Doanh thu' });

    // ---> CAMERA <---
    logActivity("Bán Hàng", `Xuất bán ${formatVN(sl)} SP [${anPham}] cho Khách: ${kh}. Doanh thu: ${formatVN(tongThuGomVat)}đ`);

    alert("✅ Xuất kho và Thu tiền vào ví thành công!"); 
    syncDB();
}
       function hoanTraDonHang(idBH) {
    if(!confirm("Sếp có chắc chắn muốn HOÀN TRẢ đơn hàng này?\n- Số lượng sẽ được cộng lại vào kho.\n- Doanh thu sẽ bị trừ khỏi hệ thống.")) return;
    
    let idx = db.banHang.findIndex(b => b.idBH === idBH);
    if(idx === -1) return alert("Không tìm thấy đơn hàng!");
    
    let donHang = db.banHang[idx];
    let apKho = db.khoAnPham.find(a => a.name === donHang.anPham);
    if(apKho) {
        apKho.qty += donHang.sl; 
    } else {
        db.khoAnPham.push({name: donHang.anPham, qty: donHang.sl, unitCost: (donHang.tien - donHang.loiNhuan)/donHang.sl});
    }
    
    db.banHang.splice(idx, 1); 
    
    // ---> CAMERA <---
    logActivity("Bán Hàng", `Xóa/Hoàn trả đơn hàng của Khách: ${donHang.kh} (Bài in: ${donHang.anPham})`);

    alert("🔄 Đã hoàn trả thành công! Dữ liệu đã được cập nhật lại.");
    syncDB();
}

        function renderBanHang() {
            let m = document.getElementById('f_month_bh').value; let y = document.getElementById('f_year_bh').value; let s = document.getElementById('search_bh').value.toLowerCase();
            
            // Fix dữ liệu cũ chưa có ID
            db.banHang.forEach((b, i) => { if(!b.idBH) b.idBH = 'BH-OLD-' + i; });

            document.getElementById('table_banhang').innerHTML = db.banHang.filter(b => b.kh.toLowerCase().includes(s) && b.date.startsWith(y + '-' + m)).map(b => {
                let lnColor = (b.loiNhuan || 0) >= 0 ? "#1e8e3e" : "#d93025";
                let badge = b.coVat ? '<span class="badge" style="background:#fce8e6; color:#d93025">VAT</span>' : '';
                return `<tr>
                    <td>${b.date}</td><td><b>${b.kh}</b></td><td>${b.anPham}</td><td>${formatVN(b.sl)}</td>
                    <td>${formatVN(b.tien)}</td><td class="text-success" style="font-weight:bold">${formatVN(b.tienThuVat||b.tien)} ${badge}</td>
                    <td style="color:${lnColor}; font-weight:bold">${formatVN(b.loiNhuan||0)}</td>
                    <td><button class="btn-small btn-danger" onclick="hoanTraDonHang('${b.idBH}')">Hoàn trả</button></td>
                </tr>`;
            }).join('') || '<tr><td colspan="8" style="text-align:center">Chưa có giao dịch bán hàng</td></tr>';
        }
        function renderCongNo() {
            const s = document.getElementById('search_cn').value.toLowerCase(); let noNCC = {};
            db.chiTietNo.forEach(n => { if(!noNCC[n.ncc]) noNCC[n.ncc] = { ncc: n.ncc, phatSinh: 0, daTra: 0 }; noNCC[n.ncc].phatSinh += n.tongTien; noNCC[n.ncc].daTra += n.daTra; });
            let html = Object.values(noNCC).filter(c => c.ncc.toLowerCase().includes(s)).map(c => {
                let duNo = c.phatSinh - c.daTra;
                return '<tr class="tr-click" onclick="viewLedgerNCC(\'' + c.ncc + '\')"><td><b>' + c.ncc + '</b></td><td class="' + (duNo > 0 ? 'text-danger' : 'text-success') + '" style="font-size:15px; font-weight:bold">' + formatVN(duNo) + '</td></tr>';
            }).join('');
            document.getElementById('table_congno').innerHTML = html || '<tr><td colspan="2" style="text-align:center">Trống</td></tr>';
        }
        let currentNCC = "";
// ==============================================================
// BỘ BA HÀM CÔNG NỢ XỊN - ĐÃ FIX LỖI F5 KHÔNG LƯU
// ==============================================================
function viewLedgerNCC(ncc) {
    currentNCC = ncc; let noTheoLenh = {}; let tongDuNoNCC = 0;
    db.chiTietNo.filter(d => d.ncc === ncc).forEach(d => {
        if(!noTheoLenh[d.idSX]) noTheoLenh[d.idSX] = { idSX: d.idSX, date: d.date, tienChuaVat: 0, tienVat: 0, tongTien: 0, daTra: 0, khau: [] };
        noTheoLenh[d.idSX].tienChuaVat += d.tienChuaVat; noTheoLenh[d.idSX].tienVat += d.tienVat; 
        noTheoLenh[d.idSX].tongTien += d.tongTien; noTheoLenh[d.idSX].daTra += d.daTra;
        if(!noTheoLenh[d.idSX].khau.includes(d.khau)) noTheoLenh[d.idSX].khau.push(d.khau);
    });
    
    let trHtml = ''; let optMSX = '<option value="">-- Cấn trừ chung (Trả nợ cũ nhất) --</option>';
    Object.values(noTheoLenh).sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(gd => {
        let conNo = gd.tongTien - gd.daTra; 
        tongDuNoNCC += conNo;
        if(conNo > 0) optMSX += '<option value="' + gd.idSX + '">Lệnh ' + gd.idSX + ' (Còn nợ: ' + formatVN(conNo) + ')</option>';
        let payBtn = conNo > 0 ? `<button class="btn-small btn-success" onclick="moFormThanhToan('${gd.idSX}', ${conNo})">Trả</button>` : '<span style="color:#1e8e3e;font-weight:bold">✔ Đã xong</span>';
        
        // Tự động tìm tất cả Mã Phiếu Chi đã thanh toán cho Lệnh này (bỏ qua các data cũ không có idGD)
        let dsPhieuChi = (db.lichSuThanhToan || []).filter(tt => tt.ncc === ncc && tt.idSX === gd.idSX && tt.idGD);
        let linksPC = dsPhieuChi.map(tt => `<div onclick="goToSoQuy('${tt.idGD}')" style="font-size:11px; color:#1a73e8; cursor:pointer; text-decoration:underline; margin-top:4px;" title="Bấm để xem Sổ Quỹ">${tt.idGD}</div>`).join('');

        trHtml += `<tr><td><b>${gd.idSX}</b><br><i style="font-size:10px; color:#666">${gd.date}</i></td><td>${gd.khau.join(', ')}</td><td class="text-right">${formatVN(gd.tienChuaVat)}</td><td class="text-right">${formatVN(gd.tienVat)}</td><td class="text-right" style="font-weight:bold; color:#111">${formatVN(gd.tongTien)}</td><td class="text-right" style="color:#1e8e3e">${formatVN(gd.daTra)}${linksPC}</td><td class="text-right" style="font-weight:bold; color:#d93025">${formatVN(conNo)}</td><td class="text-center">${payBtn}</td></tr>`;
    });
    
    document.getElementById('cn_detail_viewer').innerHTML = `<div class="detail-box" style="padding:15px;"><div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:2px solid #1a73e8; padding-bottom:10px; margin-bottom:15px;"><h2 style="margin:0; color:#1a73e8">CÔNG NỢ CHI TIẾT: <span style="color:#111">${ncc}</span></h2><button class="btn-small btn-success" style="padding:8px 15px; font-size:13px;" onclick="moFormThanhToan('', 0)">💸 Phiếu Chi Nhanh</button></div><div id="box_pay_form" style="display:none; background:#e8f0fe; padding:15px; border-radius:6px; margin-bottom:15px; border:1px solid #8ab4f8;"><div class="grid-3"><div><label>Thanh toán Lệnh SX</label><select id="pay_idSX" style="border-color:#1a73e8; font-weight:bold">${optMSX}</select></div><div><label>Chọn Ví</label><select id="pay_wallet" style="border: 2px solid #1a73e8; font-weight: bold;"><option value="TIENMAT">💵 Tiền Mặt</option><option value="THIENLONG">💳 Bank Thiên Long</option><option value="ACB">💳 Bank ACB</option></select></div><div><label>Ngày trả</label><input type="date" id="pay_date"></div></div><div class="grid-2" style="margin-top:10px;"><div><label>Số tiền trả (VNĐ)</label><input type="text" class="format-number" id="pay_amount"></div><div><label>Ghi chú</label><input type="text" id="pay_note" placeholder="VD: Sếp duyệt chi..."></div></div><div style="margin-top:10px; text-align:right;"><button class="btn-small btn-outline" style="margin:0; width:auto; border-color:#ccc" onclick="document.getElementById('box_pay_form').style.display='none'">Hủy</button><button class="btn-small btn-main" style="margin:0 0 0 10px; width:auto; padding:8px 15px;" onclick="xacNhanTraTien()">Xác Nhận & Trừ Nợ</button></div></div><div style="max-height: 350px; overflow-y:auto; border: 1px solid #ddd;"><table class="ledger-table"><thead><tr><th>Mã SX</th><th>Hạng Mục</th><th class="text-right">Chưa VAT</th><th class="text-right">VAT 8%</th><th class="text-right">Tổng Nợ</th><th class="text-right">Đã Trả</th><th class="text-right">Còn Lại</th><th>Thao Tác</th></tr></thead><tbody>${trHtml || '<tr><td colspan="8" style="text-align:center">Chưa có giao dịch</td></tr>'}</tbody></table></div><div style="text-align:right; font-size:18px; font-weight:bold; margin-top:15px; color:#d93025;">TỔNG DƯ NỢ: ${formatVN(tongDuNoNCC)} đ</div></div>`;
    if(document.getElementById('pay_date')) document.getElementById('pay_date').value = new Date().toISOString().split('T')[0];
}

function moFormThanhToan(idSX, noCon) { 
    document.getElementById('box_pay_form').style.display = 'block'; 
    document.getElementById('pay_idSX').value = idSX; 
    if(noCon > 0) document.getElementById('pay_amount').value = formatVN(noCon); 
}

function xacNhanTraTien() { 
    let date = document.getElementById('pay_date').value; 
    let tien = parseNumber(document.getElementById('pay_amount').value); 
    let note = document.getElementById('pay_note').value.trim() || 'Thanh toán tiền công nợ'; 
    let targetIdSX = document.getElementById('pay_idSX').value;
    let viChon = document.getElementById('pay_wallet') ? document.getElementById('pay_wallet').value : 'TIENMAT'; 

    if(!tien || tien <= 0) return alert("Sếp nhập số tiền hợp lệ nhé!"); 
    saveState(); 
    let tienConLai = tien;

    // Cập nhật trực tiếp vào database gốc để đảm bảo F5 không mất
    db.chiTietNo.forEach((d, i) => {
        if (d.ncc === currentNCC && (d.tongTien - d.daTra) > 0 && tienConLai > 0) {
            if (targetIdSX && d.idSX !== targetIdSX) return;
            let noCon = d.tongTien - d.daTra;
            let tra = Math.min(noCon, tienConLai);
            db.chiTietNo[i].daTra += tra; 
            tienConLai -= tra;
        }
    });

    let maPhieu = genMaPhieu('CHI', date);
    if(!db.lichSuThanhToan) db.lichSuThanhToan = [];
    db.lichSuThanhToan.push({ idTT: 'TT-' + Date.now(), idGD: maPhieu, idSX: targetIdSX || 'Cấn trừ chung', ncc: currentNCC, date: date, amount: tien, note: note });

    if(!db.giaoDichVi) db.giaoDichVi = [];
    db.giaoDichVi.push({ idGD: maPhieu, date: date, loai: 'CHI', vi: viChon, doiTuong: currentNCC, soTien: tien, lyDo: 'Trả nợ NCC (Lệnh: ' + (targetIdSX || 'Chung') + ')', hangMuc: 'Nhập hàng' });

    logActivity("Công Nợ", `Chi trả nợ NCC [${currentNCC}] số tiền ${formatVN(tien)}đ từ ví ${mapViName(viChon)}`);
    alert(`✅ Đã cấn trừ và tạo Phiếu Chi [${maPhieu}].`);
    document.getElementById('box_pay_form').style.display = 'none';
    syncDB(); 
    viewLedgerNCC(currentNCC); 
}
		// === HÀM VẼ LỊCH SỬ THANH TOÁN NHÀ CUNG CẤP ===
function renderLichSuThanhToanNCC() {
    if(!db.lichSuThanhToan) db.lichSuThanhToan = [];
    
    // Lấy bộ lọc Tháng/Năm
    let mSelect = document.getElementById('f_month_cn_hs');
    let ySelect = document.getElementById('f_year_cn_hs');
    let m = mSelect ? mSelect.value : ("0" + (new Date().getMonth() + 1)).slice(-2);
    let y = ySelect ? ySelect.value : new Date().getFullYear().toString();
    let prefix = y + '-' + m;

    // Lọc dữ liệu theo tháng và sắp xếp mới nhất lên đầu
    let html = db.lichSuThanhToan
        .filter(tt => tt.date && tt.date.startsWith(prefix))
        .sort((a,b) => new Date(b.date) - new Date(a.date))
        .map(tt => {
            let d = new Date(tt.date);
            let dateStr = ("0" + d.getDate()).slice(-2) + '/' + ("0" + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
            
            // Link quay lại Sổ Quỹ
            let voucherLink = tt.idGD ? `<span onclick="goToSoQuy('${tt.idGD}')" style="color:#1a73e8; font-family:monospace; font-weight:bold; cursor:pointer; text-decoration:underline;">${tt.idGD}</span>` : 'N/A';

            return `<tr>
                <td style="color:#666; font-size:13px;">${dateStr}</td>
                <td><b onclick="goToCongNo('${tt.ncc}')" style="cursor:pointer; text-decoration:underline;">${tt.ncc}</b></td>
                <td>${voucherLink}</td> <td><span class="badge" style="background:#e8f0fe; color:#1a73e8;">${tt.idSX || 'Chung'}</span></td>
                <td class="text-right" style="color:#1e8e3e; font-weight:bold;">${formatVN(tt.amount)}</td>
                <td><i style="color:#555; font-size:12px;">${tt.note}</i></td>
            </tr>`;
        }).join('');
    
    let tbody = document.getElementById('table_lichsu_thanhtoan_ncc');
    if(tbody) {
        tbody.innerHTML = html || '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">Chưa có lịch sử thanh toán nào trong tháng này</td></tr>';
    }
}
        function moFormNhatKy() { document.getElementById('box_nhatky').style.display = 'block'; }
        function saveNhatKy() {
            let date = document.getElementById('nk_date').value; let ca = document.getElementById('nk_ca').value; let idSX = document.getElementById('nk_idSX').value;
            if(!idSX) return alert("Chưa chọn Lệnh SX!");
            let target = parseNumber(document.getElementById('nk_target').value); let pass = parseNumber(document.getElementById('nk_pass').value); let defect = parseNumber(document.getElementById('nk_defect').value);
            let uptime = parseNumber(document.getElementById('nk_uptime').value); let downtime = parseNumber(document.getElementById('nk_downtime').value); let workers = parseNumber(document.getElementById('nk_workers').value); let ot = parseNumber(document.getElementById('nk_ot').value);
            db.nhatKyCa.push({ id: 'NK-' + Date.now(), date, ca, idSX, target, pass, defect, uptime, downtime, workers, ot });
            document.getElementById('box_nhatky').style.display = 'none'; alert("Lưu Nhật Ký thành công!"); syncDB();
        }
        function renderBaoCao() {
            let m = document.getElementById('f_month_bc').value; let y = document.getElementById('f_year_bc').value; let prefix = y + '-' + m;
            let dsNhatKy = db.nhatKyCa.filter(nk => nk.date.startsWith(prefix));
            let dsLenhThang = db.sanXuat.filter(sx => db.keHoach.find(k => k.idSX === sx.idSX)?.date.startsWith(prefix));
            let totalLenh = dsLenhThang.length; let doneLenh = dsLenhThang.filter(sx => sx.status === 'Hoàn thành').length;
            document.getElementById('kpi_lenh').innerText = doneLenh + ' / ' + totalLenh; document.getElementById('kpi_lenh_bar').style.width = totalLenh ? ((doneLenh/totalLenh)*100) + '%' : '0%';
            let tP=0, tD=0, tU=0, tDown=0;
            dsNhatKy.forEach(nk => { tP+=nk.pass; tD+=nk.defect; tU+=nk.uptime; tDown+=nk.downtime; });
            let tO = tP + tD; let yR = tO ? ((tP / tO) * 100).toFixed(1) : 0; let dR = tO ? ((tD / tO) * 100).toFixed(1) : 0;
            document.getElementById('kpi_yield').innerText = yR + '%'; document.getElementById('kpi_yield_bar').style.width = yR + '%'; document.getElementById('kpi_defect').innerText = dR + '%';
            let tTime = tU + tDown; let oee = tTime ? ((tU / tTime) * 100).toFixed(1) : 0;
            document.getElementById('kpi_oee').innerText = oee + '%'; document.getElementById('kpi_oee_bar').style.width = oee + '%';
            document.getElementById('kpi_wip').innerText = db.sanXuat.filter(sx => sx.status === 'Đang in' || sx.status === 'Đang gia công').length;
            document.getElementById('table_baocao').innerHTML = dsNhatKy.sort((a,b) => new Date(b.date) - new Date(a.date)).map(nk => '<tr><td>' + nk.date + ' (' + nk.ca + ')</td><td><b>' + nk.idSX + '</b></td><td><span style="color:#1e8e3e;font-weight:bold">' + formatVN(nk.pass) + '</span> / ' + formatVN(nk.target) + '</td><td style="color:#d93025;font-weight:bold">' + formatVN(nk.defect) + '</td><td>' + nk.uptime + 'h</td><td>' + nk.workers + ' (OT: ' + nk.ot + 'h)</td></tr>').join('') || '<tr><td colspan="6" style="text-align:center">Chưa có nhật ký</td></tr>';
        }

        // ==================== Báo cáo LƯƠNG NHÂN SỰ ====================
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
    let autoData = getAutoFinData(m, y);
    
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

    let manualData = db.taiChinh.find(t => t.month === m && t.year === y) || {};
    document.getElementById('tc_giamtru').value = formatVN(manualData.giamtru || 0);
    document.getElementById('tc_phaithu').value = formatVN(manualData.phaithu || 0);
}

function saveTaiChinh(closeForm = false) {
    let m = document.getElementById('f_month_tc').value; let y = document.getElementById('f_year_tc').value;
    let autoData = getAutoFinData(m, y);

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

function printReport() { window.print(); }

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
    let autoData = getAutoFinData(m, y);
    let manualData = db.taiChinh.find(t => t.month === m && t.year === y) || { giamtru: 0, cp_banhang: 0, cp_quanly: 0, tien_dautu: 0, tien_dauky: 0, phaithu: 0 };
    let data = { ...autoData, ...manualData, tien_thu: autoData.tienThuVat, tien_luong: autoData.tien_luong, no_daihan: autoData.no_daihan, tien_vay: autoData.tien_vay, taisan_daihan: autoData.taisan_daihan };

    let doanhThuThuan = data.doanhthu - (Number(data.giamtru) || 0);
    let loiNhuanGop = doanhThuThuan - data.giavon;
    let tongChiPhi = (Number(data.cp_banhang) || 0) + (Number(data.cp_quanly) || 0) + (Number(data.khauhao) || 0) + (Number(data.laivay) || 0);
    let loiNhuanRong = loiNhuanGop - tongChiPhi;
    let bienLNgop = doanhThuThuan > 0 ? (loiNhuanGop / doanhThuThuan * 100).toFixed(1) : 0;

    const hasActivity = (db.banHang || []).some(item => (item.date || '').startsWith(`${y}-${m}`)) ||
        (db.giaoDichVi || []).some(item => (item.date || '').startsWith(`${y}-${m}`)) ||
        (db.taiChinh || []).some(item => item.month === m && item.year === y);
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
        document.getElementById('table_lichsu_tc').innerHTML = (db.taiChinh||[]).sort((a,b) => (b.year + b.month).localeCompare(a.year + a.month)).map(t => {
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
// 1. HÀM KIỂM TRA MÃ PIN
const ADMIN_PIN = "741953"; // Sếp đổi mã PIN ở đây nhé

function checkSecurity(actionName, callback) {
    let enteredPin = prompt(`🔐 XÁC MINH QUYỀN SẾP\nThao tác: ${actionName}\nVui lòng nhập mã PIN:`);
    if (enteredPin === ADMIN_PIN) {
        callback(); // Nhập đúng mới cho chạy hàm xóa
    } else if (enteredPin !== null) {
        alert("❌ SAI MÃ PIN! Thao tác bị từ chối.");
    }
}

// 2. HÀM XÓA DỮ LIỆU (PHẢI CÓ HÀM NÀY MỚI CHẠY ĐƯỢC)
async function resetData() {
    if (confirm("⚠️ CẢNH BÁO CAO ĐỘ: Sếp có chắc chắn muốn XÓA VĨNH VIỄN toàn bộ dữ liệu trên cả Máy tính và Cloud (Google Sheet) không?")) {
        
        // 1. Tạo một bộ khung database rỗng chuẩn
        const emptyDB = { 
            keHoach: [], sanXuat: [], khoVatTu: [], khoAnPham: [], 
            banHang: [], chiTietNo: [], hrmContacts: [], lichSuThanhToan: [], 
            nccList: [], nhatKyCa: [], taiChinh: [], nhanSu: [], 
            taiSan: [], khoanVay: [], giaoDichVi: [] 
        };

        try {
            // 2. Ra lệnh cho Google Sheet xóa trắng ô A1 (bằng cách ghi đè data rỗng)
            if (GOOGLE_SHEET_URL && GOOGLE_SHEET_URL.startsWith("https://")) {
                await fetch(GOOGLE_SHEET_URL, {
                    method: 'POST',
                    mode: 'no-cors', 
                    body: JSON.stringify(emptyDB)
                });
                console.log("✅ Đã xóa data trên Cloud.");
            }

            // 3. Xóa data tại trình duyệt (LocalStorage)
            localStorage.removeItem('phamkhoi_db_v11');
            
            alert("✅ ĐÃ XÓA SẠCH HỆ THỐNG! Dữ liệu trên Cloud và Máy tính đã về số 0. ERP sẽ khởi động lại.");
            location.reload();

        } catch (e) {
            alert("❌ Lỗi khi xóa trên Cloud: " + e.toString());
        }
    }
}
// =================================================================
// CÔNG CỤ QUẢN TRỊ CAO CẤP: BACKUP & JSON
// =================================================================

function backupDatabase() {
    checkSecurity("Backup dữ liệu JSON", () => {
        let dataStr = JSON.stringify(db, null, 2);
        let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        let exportFileDefaultName = `BACKUP_ERP_PHAMKHOI_${new Date().toISOString().slice(0,10)}.json`;
        
        let linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        alert("✅ Đã tải file Backup về máy Sếp thành công!");
    });
}

// Hàm hỗ trợ dán dữ liệu từ JSON (Để khôi phục khi đổi máy tính)
function restoreDatabase() {
    checkSecurity("Khôi phục dữ liệu từ file JSON", () => {
        let jsonInput = prompt("Dán toàn bộ nội dung file JSON vào đây:");
        if (jsonInput) {
            try {
                let importedData = JSON.parse(jsonInput);
                db = importedData;
                
                // ---> CAMERA <---
                logActivity("HỆ THỐNG", "Phục hồi dữ liệu từ file JSON Backup");

                syncDB();
                alert("✅ Đã khôi phục dữ liệu thành công! Hệ thống sẽ tải lại.");
                location.reload();
            } catch(e) {
                alert("❌ File JSON không hợp lệ!");
            }
        }
    });
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
    if (!lastState) return;
    
    if (confirm("Sếp muốn khôi phục lại dữ liệu trước thao tác vừa rồi?")) {
        let btn = document.getElementById('btn_undo');
        btn.innerText = "⏳ ĐANG HOÀN TÁC LÊN MÂY...";
        btn.style.opacity = "0.7";
        btn.disabled = true;

        let previousDB = JSON.parse(lastState);

        try {
            if (GOOGLE_SHEET_URL && GOOGLE_SHEET_URL.startsWith("https://")) {
                await fetch(GOOGLE_SHEET_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(previousDB) });
            }

            db = previousDB;
            lastState = null; 
            
            // ---> CAMERA (Ghi đè thẳng vào data vừa được undo) <---
            logActivity("HỆ THỐNG", "Sử dụng tính năng HOÀN TÁC (Undo)");
            
            syncDB();
            
            btn.style.display = 'none'; btn.disabled = false; btn.innerText = "↩️ HOÀN TÁC (UNDO)"; btn.style.opacity = "1";
            alert("✅ Đã hoàn tác và lưu lại vào MySQL.");
        } catch (e) {
            alert("❌ Lỗi mạng: Không thể hoàn tác trên Mây.");
            btn.disabled = false; btn.innerText = "↩️ HOÀN TÁC (UNDO)"; btn.style.opacity = "1";
        }
    }
}
let myChart = null;

function renderCharts(viewType) {
    const ctx = document.getElementById('finChart').getContext('2d');
    if (myChart) myChart.destroy(); // Xóa biểu đồ cũ để vẽ lại

    let labels = [];
    let revenueData = [];
    let profitData = [];
    let currentYear = document.getElementById('f_year_tc').value;

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
                <td class="text-center"><button class="btn-small btn-print" onclick="inPhieuThuChi('${gd.idGD}')">🖨️ In</button>
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
    document.getElementById('prt_title').innerText = gd.loai === 'THU' ? 'PHIẾU THU TIỀN' : 'PHIẾU CHI TIỀN';
    document.getElementById('prt_date').innerText = `Ngày ${("0"+dt.getDate()).slice(-2)} tháng ${("0"+(dt.getMonth()+1)).slice(-2)} năm ${dt.getFullYear()}`;
    document.getElementById('prt_name').innerText = gd.doiTuong;
    document.getElementById('prt_reason').innerText = gd.lyDo;
    document.getElementById('prt_amount').innerText = formatVN(gd.soTien);
    document.getElementById('prt_wallet').innerText = mapViName(gd.vi);
    document.getElementById('prt_category').innerText = gd.hangMuc || 'Khác';
    window.print();
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
