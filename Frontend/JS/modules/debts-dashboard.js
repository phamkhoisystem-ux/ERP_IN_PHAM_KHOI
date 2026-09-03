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
