let studentsData = JSON.parse(localStorage.getItem('tutor_app_students')) || [];
let currentStudentId = studentsData.length > 0 ? studentsData[0].id : null;

const studentSelector = document.getElementById('studentSelector');
const studentNameDisplay = document.getElementById('studentNameDisplay');
const teacherDisplay = document.getElementById('teacherDisplay');
const feeDisplay = document.getElementById('feeDisplay');
const totalSessionsEl = document.getElementById('totalSessions');
const totalFeeDisplay = document.getElementById('totalFeeDisplay');
const sessionTableBody = document.getElementById('sessionTableBody');
const testGallery = document.getElementById('testGallery');
const sessionForm = document.getElementById('sessionForm');

function initStudentSelector() {
    studentSelector.innerHTML = '';
    
    if (studentsData.length === 0) {
        let opt = document.createElement('option');
        opt.value = "";
        opt.textContent = "-- Chưa có lớp học nào, hãy thêm mới! --";
        studentSelector.appendChild(opt);
        currentStudentId = null;
        return;
    }

    if (!studentsData.some(s => s.id === currentStudentId)) {
        currentStudentId = studentsData[0].id;
    }

    studentsData.forEach(student => {
        let opt = document.createElement('option');
        opt.value = student.id;
        opt.textContent = student.name;
        if(student.id === currentStudentId) opt.selected = true;
        studentSelector.appendChild(opt);
    });
}

function getCurrentStudent() {
    return studentsData.find(s => s.id === currentStudentId);
}

function renderApp() {
    initStudentSelector();
    const student = getCurrentStudent();
    
    if (!student) {
        studentNameDisplay.innerText = "Chưa chọn lớp học";
        teacherDisplay.innerText = "-";
        feeDisplay.innerText = "-";
        totalSessionsEl.innerText = "0 buổi";
        totalFeeDisplay.innerText = "0 đ";
        sessionTableBody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-slate-400 text-xs">Chưa có dữ liệu lớp học. Vui lòng bấm nút "Thêm lớp mới" ở phía trên!</td></tr>`;
        testGallery.innerHTML = `<p class="text-xs text-slate-400 col-span-full">Chưa có bài test nào.</p>`;
        return;
    }
    
    studentNameDisplay.innerText = student.name;
    teacherDisplay.innerText = student.teacher || "Chưa có";
    feeDisplay.innerText = (student.feePerSession || 0).toLocaleString('vi-VN') + " đ / buổi";
    
    const totalSessions = student.sessions ? student.sessions.length : 0;
    totalSessionsEl.innerText = totalSessions + " buổi";
    const totalMoney = totalSessions * (student.feePerSession || 0);
    totalFeeDisplay.innerText = totalMoney.toLocaleString('vi-VN') + " đ";

    renderSessionTable();
}

function renderSessionTable() {
    const student = getCurrentStudent();
    const tbody = document.getElementById('sessionTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    testGallery.innerHTML = '';
    let hasImages = false;

    if (!student || !student.sessions || student.sessions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-slate-400 text-xs">Chưa có nhật ký buổi học nào cho lớp này.</td></tr>`;
        testGallery.innerHTML = `<p class="text-xs text-slate-400 col-span-full">Chưa có bài test nào được tải lên cho học sinh này.</p>`;
        return;
    }

    const selectedMonth = document.getElementById('filterMonth')?.value || 'all';
    const selectedYear = document.getElementById('filterYear')?.value || 'all';

    const filteredSessions = student.sessions.filter(s => {
        let matchMonth = true;
        let matchYear = true;
        let parts = s.buoi ? s.buoi.split('-') : [];

        if (selectedMonth !== 'all') {
            matchMonth = parts.length === 3 ? (parts[1] === selectedMonth) : s.buoi.includes(`-${selectedMonth}-`);
        }
        if (selectedYear !== 'all') {
            matchYear = parts.length === 3 ? (parts[0] === selectedYear) : s.buoi.startsWith(selectedYear);
        }

        return matchMonth && matchYear;
    });

    if (filteredSessions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-slate-400 italic text-xs">Không có buổi học nào trong khoảng thời gian này.</td></tr>`;
        testGallery.innerHTML = `<p class="text-xs text-slate-400 col-span-full">Không có bài test trong khoảng thời gian này.</p>`;
        return;
    }

    filteredSessions.forEach((item) => {
        const originalIndex = student.sessions.indexOf(item);

        let btvnBadge = `<span class="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-xs font-semibold">${item.btvn}%</span>`;
        if(item.btvn < 50) {
            btvnBadge = `<span class="bg-rose-50 text-rose-600 px-2 py-0.5 rounded text-xs font-semibold">${item.btvn}%</span>`;
        }
        
        let displayBuoi = '';
        if (item.buoi && item.buoi.split('-').length === 3) {
            let parts = item.buoi.split('-');
            displayBuoi = `${item.tenBuoi || 'Buổi'} (${parts[2]}/${parts[1]}/${parts[0]})`;
        } else {
            displayBuoi = `${item.tenBuoi || ''} - ${item.buoi || ''}`;
        }

        let row = `
            <tr class="hover:bg-slate-50/50">
                <td class="py-3 px-4 font-medium text-slate-900">${displayBuoi}</td>
                <td class="py-3 px-4 text-slate-600">${item.noiDung}</td>
                <td class="py-3 px-4">${item.btvn !== '' ? btvnBadge : '-'}</td>
                <td class="py-3 px-4"><span class="font-medium ${item.thaiDo && item.thaiDo.includes('Tốt') ? 'text-emerald-600' : 'text-amber-600'}">${item.thaiDo || '-'}</span></td>
                <td class="py-3 px-4 text-xs text-slate-500">${item.nhanXet || 'Không có'}</td>
                <td class="py-3 px-4 text-center flex items-center justify-center gap-3">
                    ${item.image ? `<a href="${item.image}" target="_blank" class="text-sky-600 font-medium text-xs hover:underline">Xem ảnh</a>` : '<span class="text-xs text-slate-400">Không có</span>'}
                    <button onclick="deleteSession(${originalIndex})" class="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer" title="Xóa buổi học này">🗑️ Xóa</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;

        if(item.image) {
            hasImages = true;
            let imgCard = `
                <div class="border border-emerald-200 rounded-2xl overflow-hidden group relative bg-emerald-50/50 shadow-xs">
                    <img src="${item.image}" alt="Bài test đã chấm" class="w-full h-32 object-cover group-hover:scale-105 transition duration-300">
                    <div class="p-2 text-xs font-medium text-slate-700 truncate bg-white border-t border-emerald-100">${displayBuoi}</div>
                </div>
            `;
            testGallery.innerHTML += imgCard;
        }
    });

    if (!hasImages) {
        testGallery.innerHTML = `<p class="text-xs text-slate-400 col-span-full">Chưa có bài test nào được tải lên cho khoảng thời gian này.</p>`;
    }
}

studentSelector.addEventListener('change', function(e) {
    currentStudentId = e.target.value;
    renderApp();
});

function addNewClass() {
    const className = prompt("Nhập tên lớp học / học sinh mới (Ví dụ: Lan Anh - Tiếng Anh):");
    if (!className) return;

    const teacherName = prompt("Nhập tên giáo viên hướng dẫn:", "ANONYMOUS");
    const fee = prompt("Nhập học phí cơ bản 1 buổi (VNĐ):", "200000");

    const newStudent = {
        id: "HS_" + Date.now(),
        name: className,
        teacher: teacherName || "ANONYMOUS",
        feePerSession: parseInt(fee) || 0,
        sessions: []
    };

    studentsData.push(newStudent);
    currentStudentId = newStudent.id;
    
    localStorage.setItem('tutor_app_students', JSON.stringify(studentsData));
    renderApp();
}

function deleteCurrentClass() {
    const student = getCurrentStudent();
    if (!student) {
        alert("Không có lớp nào để xóa!");
        return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn lớp "${student.name}" và toàn bộ dữ liệu của nó không?`)) {
        studentsData = studentsData.filter(s => s.id !== currentStudentId);
        currentStudentId = studentsData.length > 0 ? studentsData[0].id : null;
        
        localStorage.setItem('tutor_app_students', JSON.stringify(studentsData));
        renderApp();
    }
}

function deleteSession(index) {
    const student = getCurrentStudent();
    if (!student || !student.sessions[index]) return;

    if (confirm(`Bạn có chắc chắn muốn xóa buổi học này không?`)) {
        student.sessions.splice(index, 1);
        localStorage.setItem('tutor_app_students', JSON.stringify(studentsData));
        renderApp();
    }
}

sessionForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const student = getCurrentStudent();
    if (!student) {
        alert("Vui lòng tạo hoặc chọn một lớp học trước khi thêm nhật ký!");
        return;
    }

    const tenBuoi = document.getElementById('buoiSo').value;
    const ngayHoc = document.getElementById('ngayHoc').value;
    const noiDung = document.getElementById('noiDung').value;
    const btvn = document.getElementById('btvn').value;
    const thaiDo = document.getElementById('thaiDo').value;
    const nhanXet = document.getElementById('nhanXet').value;
    const imageFile = document.getElementById('testImage').files[0];

    if(imageFile) {
        const reader = new FileReader();
        reader.onload = function(uploadEvent) {
            saveNewSession(student, tenBuoi, ngayHoc, noiDung, btvn, thaiDo, nhanXet, uploadEvent.target.result);
        };
        reader.readAsDataURL(imageFile);
    } else {
        saveNewSession(student, tenBuoi, ngayHoc, noiDung, btvn, thaiDo, nhanXet, null);
    }
});

function saveNewSession(student, tenBuoi, ngayHoc, noiDung, btvn, thaiDo, nhanXet, imageUrl) {
    if (!student.sessions) student.sessions = [];
    
    student.sessions.push({
        tenBuoi,
        buoi: ngayHoc,
        noiDung,
        btvn,
        thaiDo,
        nhanXet,
        image: imageUrl
    });
    
    localStorage.setItem('tutor_app_students', JSON.stringify(studentsData));
    
    sessionForm.reset();
    renderApp();
    alert('Đã lưu nhật ký thành công cho ' + student.name + '!');
}

function exportToPDF() {
    const student = getCurrentStudent();
    if (!student) {
        alert("Không có dữ liệu lớp học để xuất PDF!");
        return;
    }

    const selectedMonth = document.getElementById('filterMonth')?.value || 'all';
    const selectedYear = document.getElementById('filterYear')?.value || 'all';

    const filteredSessions = (student.sessions || []).filter(s => {
        let matchMonth = true;
        let matchYear = true;
        let parts = s.buoi ? s.buoi.split('-') : [];

        if (selectedMonth !== 'all') {
            matchMonth = parts.length === 3 ? (parts[1] === selectedMonth) : s.buoi.includes(`-${selectedMonth}-`);
        }
        if (selectedYear !== 'all') {
            matchYear = parts.length === 3 ? (parts[0] === selectedYear) : s.buoi.startsWith(selectedYear);
        }

        return matchMonth && matchYear;
    });

    let sessionsHtml = '';
    if (filteredSessions.length > 0) {
        filteredSessions.forEach((item) => {
            let displayBuoi = '';
            if (item.buoi && item.buoi.split('-').length === 3) {
                let parts = item.buoi.split('-');
                displayBuoi = `${item.tenBuoi || 'Buổi'} (${parts[2]}/${parts[1]}/${parts[0]})`;
            } else {
                displayBuoi = `${item.tenBuoi || ''} - ${item.buoi || ''}`;
            }

            sessionsHtml += `
                <tr>
                    <td style="font-weight: 500;">${displayBuoi}</td>
                    <td>${item.noiDung}</td>
                    <td style="text-align: center;">${item.btvn !== '' ? item.btvn + '%' : '-'}</td>
                    <td>${item.thaiDo || '-'}</td>
                    <td style="font-size: 12px; color: #475569;">${item.nhanXet || 'Không có'}</td>
                </tr>
            `;
        });
    } else {
        sessionsHtml = `<tr><td colspan="5" style="text-align: center; padding: 15px; color: #94a3b8;">Không có nhật ký buổi học trong khoảng thời gian này.</td></tr>`;
    }

    const totalMoney = filteredSessions.length * (student.feePerSession || 0);

    let titleTimeStr = "";
    if (selectedMonth !== 'all' && selectedYear !== 'all') {
        titleTimeStr = `THÁNG ${selectedMonth} / ${selectedYear}`;
    } else if (selectedMonth !== 'all' && selectedYear === 'all') {
        titleTimeStr = `THÁNG ${selectedMonth}`;
    } else if (selectedMonth === 'all' && selectedYear !== 'all') {
        titleTimeStr = `NĂM ${selectedYear}`;
    } else {
        titleTimeStr = `TẤT CẢ CÁC THÁNG`;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Bao-Cao-${student.name}</title>
            <style>
                body { font-family: 'Roboto', sans-serif; color: #1e293b; padding: 20px; margin: 0; }
                h1 { color: #065f46; font-size: 20px; text-align: center; margin-bottom: 5px; }
                .header-box { background: #f0fdf4; padding: 12px; border-radius: 8px; border: 1px solid #bbf7d0; margin-bottom: 20px; font-size: 13px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
                th { background-color: #065f46; color: white; padding: 8px; text-align: left; }
                td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
                .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #64748b; }
            </style>
        </head>
        <body>
            <div style="text-align: center; border-bottom: 2px solid #065f46; padding-bottom: 10px; margin-bottom: 15px;">
                <h1>BÁO CÁO HỌC TẬP ${titleTimeStr}</h1>
                <p style="font-size: 13px; color: #475569; margin: 0;">Lớp: <strong>${student.name}</strong></p>
            </div>
            
            <div class="header-box">
                <p style="margin: 4px 0;"><strong> Người dạy học:</strong> ${student.teacher || 'Chưa có'}</p>
                <p style="margin: 4px 0;"><strong> Học phí/buổi:</strong> ${(student.feePerSession || 0).toLocaleString('vi-VN')} đ</p>
                <p style="margin: 4px 0;"><strong> Tổng số buổi:</strong> ${filteredSessions.length} buổi</p>
                <p style="margin: 4px 0; font-size: 15px; color: #0369a1;"><strong> Tổng học phí:</strong> ${totalMoney.toLocaleString('vi-VN')} đ</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Buổi / Ngày</th>
                        <th>Nội dung</th>
                        <th style="text-align: center;">BTVN</th>
                        <th>Tinh thần</th>
                        <th>Nhận xét</th>
                    </tr>
                </thead>
                <tbody>
                    ${sessionsHtml}
                </tbody>
            </table>

            <div class="footer">
                <p>Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}</p>
                <p style="margin-top: 25px; font-weight: bold; color: #065f46;">(Ký và ghi rõ họ tên)</p>
            </div>
        </body>
        </html>
    `;

    // Sử dụng Blob URL giúp trình duyệt xử lý trang in như một tệp độc lập hoàn toàn, không gây nghẽn luồng chính
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
        printWindow.onload = function() {
            printWindow.print();
        };
    } else {
        alert("Trình duyệt đang chặn cửa sổ bật lên (Pop-up blocker). Vui lòng cho phép popup cho trang web này!");
    }
}

document.addEventListener('DOMContentLoaded', function() {
    renderApp();
    
    // Đảm bảo khi thay đổi bộ lọc tháng/năm thì bảng cũng tự cập nhật lại
    document.getElementById('filterMonth')?.addEventListener('change', renderSessionTable);
    document.getElementById('filterYear')?.addEventListener('change', renderSessionTable);
});
