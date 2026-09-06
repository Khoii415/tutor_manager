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

// Hàm bật/tắt ô nhập tùy chỉnh Tinh thần học tập
function handleThaiDoChange(select) {
    const customInput = document.getElementById('customThaiDoInput');
    if (select.value === 'Custom') {
        customInput.classList.remove('hidden');
        customInput.focus();
    } else {
        customInput.classList.add('hidden');
    }
}

// Khởi tạo danh sách dropdown chọn học sinh
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

    // Cập nhật các option lọc tháng/năm dựa trên dữ liệu thật của học sinh
    updateFilterDropdowns(student);
    renderSessionTable();
}

// Tự động quét các tháng và năm xuất hiện trong chuỗi ngày học để đưa vào bộ lọc
function updateFilterDropdowns(student) {
    const monthSelect = document.getElementById('filterMonth');
    const yearSelect = document.getElementById('filterYear');
    if (!monthSelect || !yearSelect) return;

    const currentMonthVal = monthSelect.value;
    const currentYearVal = yearSelect.value;

    const monthsSet = new Set();
    const yearsSet = new Set();

    if (student.sessions) {
        student.sessions.forEach(s => {
            // Quét định dạng dạng DD/MM/YYYY hoặc MM/YYYY hoặc MM-YYYY
            const matches = s.buoi.match(/(\d{1,2})[\/\-](\d{4})/);
            if (matches) {
                monthsSet.add(matches[1].padStart(2, '0'));
                yearsSet.add(matches[2]);
            } else {
                // Thử quét năm riêng lẻ 4 chữ số
                const yearMatch = s.buoi.match(/\b(20\d{2})\b/);
                if (yearMatch) yearsSet.add(yearMatch[1]);
            }
        });
    }

    // Đổ lại dữ liệu cho bộ lọc Tháng
    monthSelect.innerHTML = `<option value="all">Tất cả tháng</option>`;
    Array.from(monthsSet).sort().forEach(m => {
        monthSelect.innerHTML += `<option value="${m}">Tháng ${m}</option>`;
    });

    // Đổ lại dữ liệu cho bộ lọc Năm
    yearSelect.innerHTML = `<option value="all">Tất cả năm</option>`;
    Array.from(yearsSet).sort().forEach(y => {
        yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
    });

    // Giữ nguyên lựa chọn cũ nếu nó vẫn hợp lệ
    if ([...monthSelect.options].some(o => o.value === currentMonthVal)) monthSelect.value = currentMonthVal;
    if ([...yearSelect.options].some(o => o.value === currentYearVal)) yearSelect.value = currentYearVal;
}

// Render bảng nhật ký học tập (có hỗ trợ lọc theo tháng và năm)
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

        if (selectedMonth !== 'all') {
            matchMonth = s.buoi.includes(`/${selectedMonth}/`) || s.buoi.includes(`-${selectedMonth}-`) || s.buoi.includes(`/${selectedMonth}`);
        }
        if (selectedYear !== 'all') {
            matchYear = s.buoi.includes(selectedYear);
        }

        return (selectedMonth === 'all' || matchMonth) && (selectedYear === 'all' || matchYear);
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
        
        let row = `
            <tr class="hover:bg-slate-50/50">
                <td class="py-3 px-4 font-medium text-slate-900">${item.buoi}</td>
                <td class="py-3 px-4 text-slate-600">${item.noiDung}</td>
                <td class="py-3 px-4">${item.btvn ? btvnBadge : '-'}</td>
                <td class="py-3 px-4"><span class="font-medium ${item.thaiDo === 'Tốt' ? 'text-emerald-600' : 'text-amber-600'}">${item.thaiDo}</span></td>
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
                    <div class="p-2 text-xs font-medium text-slate-700 truncate bg-white border-t border-emerald-100">${item.buoi}</div>
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

    const sessionName = student.sessions[index].buoi;
    if (confirm(`Bạn có chắc chắn muốn xóa ngày học "${sessionName}" không?`)) {
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

    const buoi = document.getElementById('buoiSo').value;
    const noiDung = document.getElementById('noiDung').value;
    const btvn = document.getElementById('btvn').value;
    
    // Lấy giá trị tinh thần học tập: nếu chọn Custom thì lấy từ ô input tùy chỉnh
    let thaiDo = document.getElementById('thaiDo').value;
    if (thaiDo === 'Custom') {
        thaiDo = document.getElementById('customThaiDoInput').value.trim() || 'Tự do';
    }

    const nhanXet = document.getElementById('nhanXet').value;
    const imageFile = document.getElementById('testImage').files[0];

    if(imageFile) {
        const reader = new FileReader();
        reader.onload = function(uploadEvent) {
            saveNewSession(student, buoi, noiDung, btvn, thaiDo, nhanXet, uploadEvent.target.result);
        };
        reader.readAsDataURL(imageFile);
    } else {
        saveNewSession(student, buoi, noiDung, btvn, thaiDo, nhanXet, null);
    }
});

function saveNewSession(student, buoi, noiDung, btvn, thaiDo, nhanXet, imageUrl) {
    if (!student.sessions) student.sessions = [];
    
    student.sessions.push({
        buoi,
        noiDung,
        btvn,
        thaiDo,
        nhanXet,
        image: imageUrl
    });
    
    localStorage.setItem('tutor_app_students', JSON.stringify(studentsData));
    
    // Reset form và ẩn lại ô custom input
    sessionForm.reset();
    document.getElementById('customThaiDoInput').classList.add('hidden');
    
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
        let matchMonth = selectedMonth === 'all' || s.buoi.includes(`/${selectedMonth}/`) || s.buoi.includes(`-${selectedMonth}-`) || s.buoi.includes(`/${selectedMonth}`);
        let matchYear = selectedYear === 'all' || s.buoi.includes(selectedYear);
        return matchMonth && matchYear;
    });

    const element = document.createElement('div');
    element.style.padding = '20px';
    element.style.fontFamily = 'Roboto, sans-serif';
    element.style.color = '#1e293b';
    element.style.backgroundColor = '#ffffff';

    let sessionsHtml = '';
    if (filteredSessions.length > 0) {
        filteredSessions.forEach((item) => {
            sessionsHtml += `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px; font-weight: 500;">${item.buoi}</td>
                    <td style="padding: 10px;">${item.noiDung}</td>
                    <td style="padding: 10px; text-align: center;">${item.btvn ? item.btvn + '%' : '-'}</td>
                    <td style="padding: 10px;">${item.thaiDo}</td>
                    <td style="padding: 10px; font-size: 12px; color: #475569;">${item.nhanXet || 'Không có'}</td>
                </tr>
            `;
        });
    } else {
        sessionsHtml = `<tr><td colspan="5" style="text-align: center; padding: 15px; color: #94a3b8;">Không có nhật ký buổi học trong khoảng thời gian này.</td></tr>`;
    }

    const totalMoney = filteredSessions.length * (student.feePerSession || 0);

    element.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #065f46; padding-bottom: 15px;">
            <h1 style="color: #065f46; font-size: 24px; margin: 0 0 5px 0;">BÁO CÁO HỌC TẬP</h1>
            <p style="font-size: 14px; color: #475569; margin: 0;">Lớp: <strong>${student.name}</strong></p>
            <p style="font-size: 12px; color: #0284c7; margin-top: 5px;">Thời gian lọc: ${selectedMonth === 'all' ? 'Tất cả các tháng' : 'Tháng ' + selectedMonth} ${selectedYear === 'all' ? '' : 'Năm ' + selectedYear}</p>
        </div>
        
        <div style="margin-bottom: 20px; font-size: 14px; background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0;">
            <p style="margin: 5px 0;"><strong> Người dạy học:</strong> ${student.teacher || 'Chưa có'}</p>
            <p style="margin: 5px 0;"><strong> Học phí/buổi:</strong> ${(student.feePerSession || 0).toLocaleString('vi-VN')} đ</p>
            <p style="margin: 5px 0;"><strong> Tổng số buổi hiển thị:</strong> ${filteredSessions.length} buổi</p>
            <p style="margin: 5px 0; font-size: 16px; color: #0369a1;"><strong> Tổng học phí lọc:</strong> ${totalMoney.toLocaleString('vi-VN')} đ</p>
        </div>

        <h3 style="color: #065f46; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Nhật ký hành trình học tập</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px;">
            <thead>
                <tr style="background-color: #065f46; color: white;">
                    <th style="padding: 10px; text-align: left;">Buổi / Ngày</th>
                    <th style="padding: 10px; text-align: left;">Nội dung</th>
                    <th style="padding: 10px; text-align: center;">BTVN</th>
                    <th style="padding: 10px; text-align: left;">Tinh thần</th>
                    <th style="padding: 10px; text-align: left;">Nhận xét</th>
                </tr>
            </thead>
            <tbody>
                ${sessionsHtml}
            </tbody>
        </table>

        <div style="margin-top: 40px; text-align: right; font-size: 12px; color: #64748b;">
            <p>Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}</p>
            <p style="margin-top: 30px; font-weight: bold; color: #065f46;">(Ký và ghi rõ họ tên)</p>
        </div>
    `;

    const opt = {
        margin:       10,
        filename:     `Bao-Cao-${student.name.replace(/\s+/g, '_')}_${selectedMonth}_${selectedYear}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save();
}

function openEditClassModal() {
    const student = getCurrentStudent();
    if (!student) {
        alert("Không có lớp học nào để chỉnh sửa!");
        return;
    }

    const newName = prompt("Nhập tên lớp học / học sinh mới:", student.name);
    if (newName === null) return;

    const newTeacher = prompt("Nhập tên giáo viên hướng dẫn mới:", student.teacher || "");
    if (newTeacher === null) return;

    const newFee = prompt("Nhập học phí cơ bản 1 buổi mới (VNĐ):", student.feePerSession || 0);
    if (newFee === null) return;

    student.name = newName.trim() || student.name;
    student.teacher = newTeacher.trim() || "ANONYMOUS";
    student.feePerSession = parseInt(newFee) || 0;

    localStorage.setItem('tutor_app_students', JSON.stringify(studentsData));
    renderApp();
    alert("Đã cập nhật thông tin lớp học thành công!");
}

renderApp();