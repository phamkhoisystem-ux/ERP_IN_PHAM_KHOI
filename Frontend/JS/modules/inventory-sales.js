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
