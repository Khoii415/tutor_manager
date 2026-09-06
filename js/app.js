// Lấy dữ liệu từ LocalStorage, nếu chưa có thì để mảng trống [] hoàn toàn
let studentsData = JSON.parse(localStorage.getItem('tutor_app_students')) || [];
let currentStudentId = studentsData.length > 0 ? studentsData[0].id : null;

// DOM Elements
const studentSelector = document.getElementById('studentSelector');
const studentNameDisplay = document.getElementById('studentNameDisplay');
const teacherDisplay = document.getElementById('teacherDisplay');
const feeDisplay = document.getElementById('feeDisplay');
const totalSessionsEl = document.getElementById('totalSessions');
const totalFeeDisplay = document.getElementById('totalFeeDisplay');
const sessionTableBody = document.getElementById('sessionTableBody');
const testGallery = document.getElementById('testGallery');
const sessionForm = document.getElementById('sessionForm');

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

    // Đảm bảo currentStudentId hợp lệ
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

// Lấy thông tin học sinh đang được chọn
function getCurrentStudent() {
    return studentsData.find(s => s.id === currentStudentId);
}

// Render toàn bộ giao diện theo học sinh hiện tại
function renderApp() {
    initStudentSelector();
    const student = getCurrentStudent();
    
    // Nếu chưa có học sinh nào trong hệ thống
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
    
    // Cập nhật thông tin thẻ tổng quan
    studentNameDisplay.innerText = student.name;
    teacherDisplay.innerText = student.teacher || "Chưa có";
    feeDisplay.innerText = (student.feePerSession || 0).toLocaleString('vi-VN') + " đ / buổi";
    
    const totalSessions = student.sessions ? student.sessions.length : 0;
    totalSessionsEl.innerText = totalSessions + " buổi";
    const totalMoney = totalSessions * (student.feePerSession || 0);
    totalFeeDisplay.innerText = totalMoney.toLocaleString('vi-VN') + " đ";

    // Render bảng nhật ký học tập
    sessionTableBody.innerHTML = '';
    testGallery.innerHTML = '';
    let hasImages = false;

    if(totalSessions === 0) {
        sessionTableBody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-slate-400 text-xs">Chưa có nhật ký buổi học nào cho lớp này.</td></tr>`;
    } else {
        student.sessions.forEach((item, index) => {
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
                        <button onclick="deleteSession(${index})" class="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer" title="Xóa buổi học này">🗑️ Xóa</button>
                    </td>
                </tr>
            `;
            sessionTableBody.innerHTML += row;

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
    }

    if (!hasImages) {
        testGallery.innerHTML = `<p class="text-xs text-slate-400 col-span-full">Chưa có bài test nào được tải lên cho học sinh này.</p>`;
    }
}

// Khi đổi học sinh trên Dropdown
studentSelector.addEventListener('change', function(e) {
    currentStudentId = e.target.value;
    renderApp();
});

// Hàm tạo lớp học mới
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

// Hàm xóa lớp học đang được chọn
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

// Hàm xóa một buổi học cụ thể theo chỉ mục (index)
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

// Xử lý submit form thêm buổi học mới
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
    const thaiDo = document.getElementById('thaiDo').value;
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
    renderApp();
    sessionForm.reset();
    alert('Đã lưu nhật ký thành công cho ' + student.name + '!');
}

// Chạy khởi tạo ứng dụng khi load trang lần đầu
renderApp();