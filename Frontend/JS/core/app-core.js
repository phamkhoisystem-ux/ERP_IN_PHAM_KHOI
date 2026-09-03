
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

        window.initializeFrontendDefaults = function initializeFrontendDefaults() {
            const today = new Date();
            const yyyy = today.getFullYear().toString();
            const mm = ("0" + (today.getMonth() + 1)).slice(-2);
            const todayStr = yyyy + '-' + mm + '-' + ("0" + today.getDate()).slice(-2);
            document.querySelectorAll('input[type="date"]').forEach(el => el.value = todayStr);
            ['kh', 'sx', 'bh', 'bc', 'tc', 'ns', 'inventory', 'tk', 'sq', 'cn_hs'].forEach(pfx => {
                const monthSelect = document.getElementById('f_month_' + pfx);
                const yearSelect = document.getElementById('f_year_' + pfx);
                if (monthSelect) monthSelect.value = mm;
                if (yearSelect) {
                    if (![...yearSelect.options].some(option => option.value === yyyy)) yearSelect.add(new Option(yyyy, yyyy));
                    yearSelect.value = yyyy;
                }
            });
            
            // Render selects cho form Lương
            document.getElementById('ns_level').innerHTML = nsLevels.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
            document.getElementById('ns_position').innerHTML = nsPositions.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
            
            addGiaCongRow(); renderAll();
            toggleFormLuong();
			// THÊM ĐOẠN NÀY VÀO CUỐI: Đọc bộ nhớ xem trước khi F5 đang ở Tab nào
    let savedTab = localStorage.getItem('current_tab_phamkhoi') || 'tab-kehoach';
    openTab(null, savedTab);
        };

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
