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
            let printButton = ' <button class="btn-small btn-print" onclick="inPhieuKeHoach(\'' + kh.idSX + '\')">🖨 In phiếu</button>';
            let html = '<div class="detail-box"><div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding-bottom:10px; margin-bottom:10px;"><h2 style="color:#1a73e8; margin:0">' + kh.idSX + '</h2><div> <button class="btn-small btn-warning" onclick="loadEditPlan(\'' + kh.idSX + '\')">✏️ Sửa Lệnh</button>' + printButton + '</div></div><p><b>Bài in sinh ra:</b> <span style="color:#1e8e3e; font-weight:bold">' + kh.baiIn + '</span></p><p><b>Loại phiếu:</b> ' + kh.type + '</p><h3 style="font-size:15px; margin-top:20px;">Chi tiết Bóc Tách:</h3><table style="font-size:13px; margin-top:5px;"><tr style="background:#f1f3f4"><th>Khâu</th><th>NCC</th><th>Thông tin</th><th>Tổng Tiền</th></tr>';
            kh.details.forEach(dt => { html += '<tr><td><b>' + dt.khau + '</b></td><td>' + dt.ncc + '</td><td>' + dt.thongtin + '</td><td style="color:#d93025; font-weight:bold">' + formatVN(dt.tien) + '</td></tr>'; });
            html += '</table><div style="text-align:right; font-size:18px; font-weight:bold; margin-top:15px;">TỔNG: <span style="color:#d93025">' + formatVN(kh.tongTien) + ' đ</span></div></div>';
            document.getElementById('kh_detail_viewer').innerHTML = html;
        }

        function inPhieuKeHoach(idSX) {
            const kh = db.keHoach.find(item => item.idSX === idSX);
            if (!kh) return alert('Không tìm thấy phiếu cần in.');
            const safe = value => typeof escapeHtml === 'function' ? escapeHtml(String(value || '')) : String(value || '');
            const formatDate = value => value ? String(value).split('-').reverse().join('/') : '................................';
            const title = kh.type === 'Thương Mại' ? 'PHIẾU THƯƠNG MẠI' : 'PHIẾU SẢN XUẤT';
            const detailTitle = kh.type === 'Thương Mại' ? 'CHI TIẾT MUA HÀNG' : 'CHI TIẾT SẢN XUẤT';
            const details = (kh.details || []).map(item => '<tr><td style="padding:8px;border:1px solid #999;">' + safe(item.khau) + '</td><td style="padding:8px;border:1px solid #999;">' + safe(item.ncc) + '</td><td style="padding:8px;border:1px solid #999;">' + safe(item.thongtin) + '</td><td style="padding:8px;border:1px solid #999;text-align:right;">' + formatVN(item.tien) + '</td></tr>').join('');
            const tm = kh.rawData?.tm || {};
            const sx = kh.rawData?.sx;
            const amountWithVat = item => {
                const amount = parseNumber(item?.sl || 0) * parseNumber(item?.gia || 0);
                return amount * (item?.vat ? 1.08 : 1);
            };
            const hasProductionData = item => Boolean(item && (String(item.ncc || '').trim() || String(item.loai || '').trim() || String(item.kho || '').trim() || parseNumber(item.sl || 0) || parseNumber(item.gia || 0)));
            const hasGiaCongData = item => Boolean(item && (String(item.ncc || '').trim() || String(item.subKhac || '').trim() || String(item.subMangLoai || '').trim() || String(item.subBeNcc || '').trim() || parseNumber(item.sl || 0) || parseNumber(item.gia || 0) || parseNumber(item.subMangHao || 0) || parseNumber(item.subBeTien || 0)));
            const productionRows = sx ? [
                hasProductionData(sx.giay) ? { stage: 'Vật tư giấy', supplier: sx.giay.ncc, info: `${sx.giay.loai || '—'}${sx.giay.kho ? ` · Khổ ${sx.giay.kho}` : ''}`, quantity: sx.giay.sl, price: sx.giay.gia, vat: sx.giay.vat, total: amountWithVat(sx.giay) } : null,
                hasProductionData(sx.in) ? { stage: 'Máy in', supplier: sx.in.ncc, info: `${sx.in.may || '—'}${sx.in.kho ? ` · Khổ ${sx.in.kho}` : ''}`, quantity: sx.in.sl, price: sx.in.gia, vat: sx.in.vat, total: amountWithVat(sx.in) } : null,
                ...(sx.gc || []).filter(hasGiaCongData).map(item => ({ stage: 'Gia công sau in', supplier: item.ncc, info: item.loai === 'Khác' ? (item.subKhac || 'Khác') : item.loai, quantity: item.sl, price: item.gia, vat: item.vat, total: amountWithVat(item) + (item.loai === 'Bế' && item.subBeLoai === 'Mới' ? amountWithVat({ sl: 1, gia: item.subBeTien, vat: item.vat }) : 0) }))
            ].filter(Boolean) : [];
            const productionDetail = productionRows.length
                ? '<table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr><th style="padding:8px;border:1px solid #999;text-align:left;background:#eee;">Công đoạn</th><th style="padding:8px;border:1px solid #999;text-align:left;background:#eee;">Nhà cung cấp</th><th style="padding:8px;border:1px solid #999;text-align:left;background:#eee;">Thông tin</th><th style="padding:8px;border:1px solid #999;text-align:right;background:#eee;">Số lượng</th><th style="padding:8px;border:1px solid #999;text-align:right;background:#eee;">Đơn giá</th><th style="padding:8px;border:1px solid #999;text-align:center;background:#eee;">VAT</th><th style="padding:8px;border:1px solid #999;text-align:right;background:#eee;">Thành tiền</th></tr></thead><tbody>' + productionRows.map(item => '<tr><td style="padding:8px;border:1px solid #999;">' + safe(item.stage) + '</td><td style="padding:8px;border:1px solid #999;">' + safe(item.supplier || '—') + '</td><td style="padding:8px;border:1px solid #999;">' + safe(item.info || '—') + '</td><td style="padding:8px;border:1px solid #999;text-align:right;">' + safe(item.quantity || '0') + '</td><td style="padding:8px;border:1px solid #999;text-align:right;">' + formatVN(parseNumber(item.price || 0)) + '</td><td style="padding:8px;border:1px solid #999;text-align:center;">' + (item.vat ? '8%' : 'Không') + '</td><td style="padding:8px;border:1px solid #999;text-align:right;font-weight:bold;">' + formatVN(item.total) + '</td></tr>').join('') + '</tbody></table>'
                : (sx ? '<p style="margin:0;color:#666;">Chưa có thông tin vật tư, in hoặc gia công để in.</p>' : '<table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr><th style="padding:8px;border:1px solid #999;text-align:left;background:#eee;">Công đoạn</th><th style="padding:8px;border:1px solid #999;text-align:left;background:#eee;">Nhà cung cấp</th><th style="padding:8px;border:1px solid #999;text-align:left;background:#eee;">Thông tin</th><th style="padding:8px;border:1px solid #999;text-align:right;background:#eee;">Thành tiền</th></tr></thead><tbody>' + details + '</tbody></table>');
            const commercialDetail = kh.type === 'Thương Mại'
                ? '<table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr><th style="padding:8px;border:1px solid #999;text-align:left;background:#eee;">Nhà cung cấp</th><th style="padding:8px;border:1px solid #999;text-align:right;background:#eee;">Số lượng nhập</th><th style="padding:8px;border:1px solid #999;text-align:right;background:#eee;">Đơn giá (chưa VAT)</th><th style="padding:8px;border:1px solid #999;text-align:center;background:#eee;">VAT</th><th style="padding:8px;border:1px solid #999;text-align:right;background:#eee;">Tổng tiền</th></tr></thead><tbody><tr><td style="padding:8px;border:1px solid #999;">' + safe(tm.ncc || kh.details?.[0]?.ncc || '—') + '</td><td style="padding:8px;border:1px solid #999;text-align:right;">' + safe(tm.sl || '0') + '</td><td style="padding:8px;border:1px solid #999;text-align:right;">' + formatVN(parseNumber(tm.gia || 0)) + '</td><td style="padding:8px;border:1px solid #999;text-align:center;">' + (tm.vat ? '8%' : 'Không') + '</td><td style="padding:8px;border:1px solid #999;text-align:right;font-weight:bold;">' + formatVN(kh.tongTien) + '</td></tr></tbody></table><p style="text-align:right;font-size:17px;font-weight:bold;margin:16px 0;">TỔNG NỢ PHẢI TRẢ NCC (ĐÃ GỒM VAT): ' + formatVN(kh.tongTien) + ' VNĐ</p>'
                : productionDetail + '<p style="text-align:right;font-size:17px;font-weight:bold;margin:16px 0;">TỔNG: ' + formatVN(kh.tongTien) + ' VNĐ</p>';
            const host = document.getElementById('print_production_area');
            host.innerHTML = '<div style="text-align:center;margin-bottom:22px;"><h2 style="margin:0;text-transform:uppercase;">' + title + '</h2><p style="margin:5px 0;">Mã phiếu: <b>' + safe(kh.idSX) + '</b></p></div><table style="width:100%;border-collapse:collapse;margin-bottom:18px;"><tr><td style="padding:6px;width:24%;"><b>Ngày lập:</b></td><td style="padding:6px;">' + formatDate(kh.date) + '</td><td style="padding:6px;width:20%;"><b>Hạn giao:</b></td><td style="padding:6px;">' + formatDate(kh.deadline) + '</td></tr><tr><td style="padding:6px;"><b>Tên đơn hàng:</b></td><td colspan="3" style="padding:6px;font-weight:bold;">' + safe(kh.baiIn) + '</td></tr><tr><td style="padding:6px;"><b>Ghi chú:</b></td><td colspan="3" style="padding:6px;">' + safe(kh.ten || '—') + '</td></tr></table><h3 style="margin:12px 0 8px;">' + detailTitle + '</h3>' + commercialDetail + '<div style="display:flex;justify-content:space-between;margin-top:55px;text-align:center;"><div style="width:30%;"><b>Người lập phiếu</b><br><i style="font-size:12px;">(Ký, họ tên)</i></div><div style="width:30%;"><b>Phụ trách</b><br><i style="font-size:12px;">(Ký, họ tên)</i></div><div style="width:30%;"><b>Giám đốc</b><br><i style="font-size:12px;">(Ký, họ tên)</i></div></div>';
            document.body.classList.remove('print-receipt', 'print-report');
            document.body.classList.add('print-production');
            const previousTitle = document.title; document.title = title.charAt(0) + title.slice(1).toLowerCase() + ' ' + kh.idSX + ' - Phạm Khôi ERP';
            setTimeout(() => { window.print(); document.title = previousTitle; }, 80);
        }
        window.addEventListener('afterprint', () => document.body.classList.remove('print-production'));
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
