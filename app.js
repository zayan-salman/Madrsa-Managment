
const STUDENTS_KEY = "faizanMustafaStudents";
const ATTENDANCE_KEY = "faizanMustafaAttendance";

const teachers = ["Zayan", "Asad", "Usaid", "Zohaib"];

const $ = (selector) => document.querySelector(selector);

function readStorage(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function getStudents() {
  return readStorage(STUDENTS_KEY);
}

function getAttendance() {
  return readStorage(ATTENDANCE_KEY);
}

function saveStudents(students) {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

function saveAttendanceRecords(records) {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
}

function todayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function formatDate(value) {
  if (!value) return "—";
  const parts = value.split("-");
  if (parts.length !== 3) return escapeHTML(value);
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

function showPage(pageId) {
  const target = document.getElementById(pageId);
  if (!target || !target.classList.contains("page")) return;

  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("active-page", page.id === pageId);
  });

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  const headings = {
    dashboard: "Dashboard",
    students: "All Students",
    admission: "Student Registration",
    attendance: "Daily Attendance",
    teachers: "Qari Sahiban"
  };

  $("#page-heading").textContent = headings[pageId] || "Madrasa Management";
}

document.querySelectorAll(".nav-btn").forEach((button) => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

document.querySelectorAll("[data-goto]").forEach((button) => {
  button.addEventListener("click", () => showPage(button.dataset.goto));
});

function renderStudentTable(list, container, emptyMessage) {
  if (!list.length) {
    container.innerHTML = `<div class="empty-state">${escapeHTML(emptyMessage)}</div>`;
    return;
  }

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Student</th>
          <th>Father Name</th>
          <th>Class</th>
          <th>Admission Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${list.map((student) => `
          <tr>
            <td>
              <span class="student-name-cell">${escapeHTML(student.name)}</span>
              <span class="sub-cell">${escapeHTML(student.phone || "No phone")}</span>
            </td>
            <td>${escapeHTML(student.father || "—")}</td>
            <td><span class="class-tag">${escapeHTML(student.teacher || "—")}</span></td>
            <td>${formatDate(student.admissionDate)}</td>
            <td>
              <button class="action-btn" data-view="${escapeHTML(student.id)}">View</button>
              <button class="action-btn delete" data-delete="${escapeHTML(student.id)}">Delete</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  container.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => viewStudent(button.dataset.view));
  });

  container.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteStudent(button.dataset.delete));
  });
}

function renderStudents() {
  const students = getStudents();

  const search = ($("#student-search")?.value || "").trim().toLowerCase();

  const filtered = students.filter((student) => {
    const name = String(student.name || "").toLowerCase();
    const father = String(student.father || "").toLowerCase();
    const phone = String(student.phone || "").toLowerCase();

    return name.includes(search) || father.includes(search) || phone.includes(search);
  });

  renderStudentTable(filtered, $("#students-list"), "Abhi koi student register nahi hua.");

  const recent = [...students]
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, 5);

  renderStudentTable(recent, $("#recent-students"), "Abhi koi student record mojood nahi.");

  teachers.forEach((teacher) => {
    const counter = document.getElementById(`count-${teacher}`);
    if (counter) {
      counter.textContent = students.filter((student) => student.teacher === teacher).length;
    }
  });

  updateDashboard();
}

function updateDashboard() {
  const today = todayString();
  const students = getStudents();
  const records = getAttendance().filter((record) => record.date === today);

  $("#total-students").textContent = students.length;
  $("#present-count").textContent = records.filter((record) => record.status === "Present").length;
  $("#absent-count").textContent = records.filter((record) => record.status === "Absent").length;
  $("#leave-count").textContent = records.filter((record) => record.status === "Leave").length;
}

function viewStudent(id) {
  const student = getStudents().find((item) => item.id === id);
  if (!student) {
    showToast("Student record nahi mila.");
    return;
  }

  const fields = [
    ["Student Name", student.name],
    ["Father Name", student.father],
    ["Date of Birth", formatDate(student.dob)],
    ["Admission Date", formatDate(student.admissionDate)],
    ["Phone", student.phone],
    ["Class / Qari Sahab", student.teacher],
    ["Address", student.address],
    ["Previous Madrasa", student.previousMadrasa],
    ["Registration Type", student.registrationType],
    ["Additional Notes", student.notes]
  ];

  $("#modal-content").innerHTML = `
    <p class="eyebrow">STUDENT DETAILS</p>
    <h2>${escapeHTML(student.name)}</h2>
    <div class="detail-grid">
      ${fields.map(([label, value]) => `
        <div class="detail-item">
          <span>${escapeHTML(label)}</span>
          <strong>${escapeHTML(value || "—")}</strong>
        </div>
      `).join("")}
    </div>
  `;

  $("#modal").hidden = false;
}

function deleteStudent(id) {
  const student = getStudents().find((item) => item.id === id);
  if (!student) return;

  const confirmed = confirm(
    `Kya aap "${student.name}" ka record delete karna chahte hain?`
  );

  if (!confirmed) return;

  saveStudents(getStudents().filter((item) => item.id !== id));

  // Is student ki attendance history bhi remove hogi.
  saveAttendanceRecords(getAttendance().filter((record) => record.studentId !== id));

  renderStudents();
  renderAttendance();
  showToast("Student record delete ho gaya.");
}

$("#student-search").addEventListener("input", renderStudents);

$("#admission-date").value = todayString();

$("#admission-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const data = new FormData(form);

  const student = {
    id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    name: String(data.get("name") || "").trim(),
    father: String(data.get("father") || "").trim(),
    dob: String(data.get("dob") || ""),
    admissionDate: String(data.get("admissionDate") || ""),
    phone: String(data.get("phone") || "").trim(),
    teacher: String(data.get("teacher") || ""),
    address: String(data.get("address") || "").trim(),
    previousMadrasa: String(data.get("previousMadrasa") || "").trim(),
    registrationType: String(data.get("registrationType") || "Existing Student"),
    notes: String(data.get("notes") || "").trim(),
    createdAt: new Date().toISOString()
  };

  if (!student.name || !student.father || !student.admissionDate || !student.teacher) {
    showToast("Naam, walid, admission date aur class bharna zaroori hai.");
    return;
  }

  if (!teachers.includes(student.teacher)) {
    showToast("Meherbani karke sahi class select karein.");
    return;
  }

  const students = getStudents();

  // Same naam aur father name wali entry par warning.
  const duplicate = students.some((item) =>
    item.name.trim().toLowerCase() === student.name.toLowerCase() &&
    item.father.trim().toLowerCase() === student.father.toLowerCase()
  );

  if (duplicate) {
    const proceed = confirm(
      "Isi naam aur walid ke naam ka student mojood hai. Kya phir bhi entry save karni hai?"
    );
    if (!proceed) return;
  }

  students.push(student);
  saveStudents(students);

  form.reset();
  $("#admission-date").value = todayString();
  renderStudents();
  showPage("students");
  showToast("Student ka record kamyabi se save ho gaya!");
});

$("#close-modal").addEventListener("click", () => {
  $("#modal").hidden = true;
});

$("#modal").addEventListener("click", (event) => {
  if (event.target === $("#modal")) {
    $("#modal").hidden = true;
  }
});

function renderAttendance() {
  const students = getStudents();
  const date = $("#attendance-date").value || todayString();
  const selectedTeacher = $("#attendance-teacher").value || "All";
  const records = getAttendance();

  const classStudents = students.filter((student) =>
    selectedTeacher === "All" || student.teacher === selectedTeacher
  );

  if (!classStudents.length) {
    $("#attendance-list").innerHTML =
      '<div class="empty-state">Is class mein abhi student register nahi hua. Pehle Add Student se entry karein.</div>';
    return;
  }

  $("#attendance-list").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Student Name</th>
          <th>Class</th>
          <th>Attendance</th>
        </tr>
      </thead>
      <tbody>
        ${classStudents.map((student) => {
          const record = records.find((item) =>
            item.studentId === student.id && item.date === date
          );

          const status = record ? record.status : "";

          return `
            <tr>
              <td>
                <span class="student-name-cell">${escapeHTML(student.name)}</span>
                <span class="sub-cell">${escapeHTML(student.father || "")}</span>
              </td>
              <td>${escapeHTML(student.teacher)}</td>
              <td>
                <select class="attendance-status" data-attendance-id="${escapeHTML(student.id)}">
                  <option value="" ${status === "" ? "selected" : ""}>Select Status</option>
                  <option value="Present" ${status === "Present" ? "selected" : ""}>Present</option>
                  <option value="Absent" ${status === "Absent" ? "selected" : ""}>Absent</option>
                  <option value="Leave" ${status === "Leave" ? "selected" : ""}>Leave</option>
                </select>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

$("#attendance-date").value = todayString();

$("#attendance-date").addEventListener("change", renderAttendance);
$("#attendance-teacher").addEventListener("change", renderAttendance);

$("#save-attendance").addEventListener("click", () => {
  const date = $("#attendance-date").value;

  if (!date) {
    showToast("Pehle attendance ki date select karein.");
    return;
  }

  const students = getStudents();
  const records = getAttendance();
  const selections = [...document.querySelectorAll("[data-attendance-id]")];

  let updated = 0;
  let incomplete = 0;

  selections.forEach((select) => {
    const studentId = select.dataset.attendanceId;
    const status = select.value;

    const existingIndex = records.findIndex((record) =>
      record.studentId === studentId && record.date === date
    );

    if (!status) {
      incomplete++;
      if (existingIndex !== -1) records.splice(existingIndex, 1);
      return;
    }

    const student = students.find((item) => item.id === studentId);
    if (!student) return;

    const record = {
      studentId,
      studentName: student.name,
      teacher: student.teacher,
      date,
      status
    };

    if (existingIndex !== -1) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }

    updated++;
  });

  saveAttendanceRecords(records);
  updateDashboard();

  $("#attendance-message").textContent =
    `${updated} students ki attendance save ho gayi.` +
    (incomplete ? ` ${incomplete} students ka status select nahi tha.` : "");

  showToast("Attendance save ho gayi.");
});

document.querySelectorAll("[data-teacher]").forEach((button) => {
  button.addEventListener("click", () => {
    $("#student-search").value = "";
    showPage("students");

    const teacher = button.dataset.teacher;
    const list = getStudents().filter((student) => student.teacher === teacher);

    renderStudentTable(
      list,
      $("#students-list"),
      `Qari ${teacher} ki class mein abhi koi student register nahi.`
    );
  });
});

function init() {
  $("#today-date").textContent = new Date().toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  renderStudents();
  renderAttendance();
  updateDashboard();
}

init();
