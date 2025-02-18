// Import Firebase configurations and methods
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import {
  firebaseConfig,
  updateActiveQRUrl,
  getActiveQRUrl,
} from "./firebase.config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
function getCurrentDomain() {
  return window.location.origin;
}
// DOM Elements
const loginForm = document.getElementById("loginForm");
const loginContainer = document.getElementById("loginContainer");
const dashboardContainer = document.getElementById("dashboardContainer");
const loginError = document.getElementById("loginError");
const searchInput = document.getElementById("searchInput");
const recordsTableBody = document.getElementById("recordsTableBody");
const recordModal = document.getElementById("recordModal");
const recordForm = document.getElementById("recordForm");

// Admin credentials (in production, this should be handled server-side)
const CREDENTIALS = {
  username: "azeem_don",
  password: "iambondi",
};

// Global state
let records = [];

// Toast notification function
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Authentication functions
function showError(message) {
  loginError.textContent = message;
  loginError.classList.add("show");
  setTimeout(() => {
    loginError.classList.remove("show");
  }, 3000);
}

function showDashboard() {
  loginContainer.classList.add("hidden");
  dashboardContainer.classList.remove("hidden");
  loadRecords();
}

function checkLoginStatus() {
  const isLoggedIn = sessionStorage.getItem("isLoggedIn");
  if (isLoggedIn === "true") {
    showDashboard();
  }
}

function logout() {
  sessionStorage.removeItem("isLoggedIn");
  location.reload();
}

// Record management functions
async function loadRecords() {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, "signin-records"), orderBy("signedInAt", "desc"))
    );
    records = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    renderRecords(records);
  } catch (error) {
    console.error("Error loading records:", error);
    showToast("Error loading records", "error");
  }
}

function renderRecords(recordsToRender) {
  recordsTableBody.innerHTML = recordsToRender
    .map(
      (record) => `
        <tr>
    <td>${
      record.signedInAt?.toDate?.().toLocaleString() ||
      new Date().toLocaleString()
    }</td>
    <td>${record.fullName}</td>
    <td>${record.storeNumber}</td>
    <td class="table-actions">
        <button class="edit-btn" onclick="editRecord('${
          record.id
        }')">Edit</button>
        <button class="delete-btn" onclick="deleteRecord('${
          record.id
        }')">Delete</button>
    </td>
</tr>
    `
    )
    .join("");
}

function openAddModal() {
  document.getElementById("modalTitle").textContent = "Add Record";
  recordForm.reset();
  document.getElementById("recordId").value = "";
  recordModal.style.display = "flex";
}

async function editRecord(recordId) {
  const record = records.find((r) => r.id === recordId);
  if (record) {
    document.getElementById("modalTitle").textContent = "Edit Record";
    document.getElementById("recordId").value = recordId;
    document.getElementById("fullName").value = record.fullName;
    document.getElementById("storeNumber").value = record.storeNumber;
    recordModal.style.display = "flex";
  }
}

async function deleteRecord(recordId) {
  try {
    await deleteDoc(doc(db, "signin-records", recordId));
    showToast("Record deleted successfully");
    await loadRecords();
  } catch (error) {
    console.error("Error deleting record:", error);
    showToast("Error deleting record", "error");
  }
}

function closeModal() {
  recordModal.style.display = "none";
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const recordData = {
    fullName: document.getElementById("fullName").value,
    storeNumber: document.getElementById("storeNumber").value,
  };

  const recordId = document.getElementById("recordId").value;

  try {
    if (recordId) {
      await updateDoc(doc(db, "signin-records", recordId), recordData);
      showToast("Record updated successfully");
    } else {
      recordData.signedInAt = serverTimestamp();
      await addDoc(collection(db, "signin-records"), recordData);
      showToast("Record added successfully");
    }
    closeModal();
    await loadRecords();
  } catch (error) {
    console.error("Error saving record:", error);
    showToast("Error saving record", "error");
  }
}

// PDF Export function
function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.autoTable({
    head: [["Date & Time", "Full Name", "Store Number"]],
    body: records.map((record) => [
      record.signedInAt?.toDate?.().toLocaleString() ||
        new Date().toLocaleString(),
      record.fullName,
      record.storeNumber,
    ]),
  });

  doc.save("records.pdf");
}
// QR Code Management
let qrcode;

async function initQRCode() {
  const qrcodeContainer = document.getElementById("qrcode");
  if (!qrcodeContainer) return;

  // Clear existing QR code
  qrcodeContainer.innerHTML = "";

  try {
    // Get current active QR config
    const activeConfig = await getActiveQRUrl();
    const currentTimestamp =
      activeConfig?.activeTimestamp || new Date().toISOString();

    // Use dynamic domain
    const currentDomain = getCurrentDomain();
    const url = `${currentDomain}/signin.html?t=${currentTimestamp}`;

    qrcode = new QRCode(qrcodeContainer, {
      text: url,
      width: 128,
      height: 128,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });

    updateUrlDisplay(url);
    updateLastUpdated(activeConfig?.updatedAt);
  } catch (error) {
    console.error("Error initializing QR code:", error);
    showToast("Error loading QR code", "error");
  }
}

function updateUrlDisplay(url) {
    const urlDisplay = document.getElementById("currentUrl");
    if (urlDisplay) {
        urlDisplay.textContent = `Active URL: ${url}`;
    }
}

function updateLastUpdated(timestamp) {
    const lastUpdated = document.getElementById("lastUpdated");
    if (lastUpdated && timestamp) {
        const date = timestamp.toDate();
        lastUpdated.textContent = `Last updated: ${date.toLocaleString()}`;
    }
}

async function regenerateQR() {
    try {
        const timestamp = new Date().toISOString();
        const result = await updateActiveQRUrl(timestamp);

        if (result.success) {
            await initQRCode();
            showToast("QR Code updated successfully");
        } else {
            throw new Error("Failed to update QR Code");
        }
    } catch (error) {
        console.error("Error regenerating QR code:", error);
        showToast("Failed to update QR Code", "error");
    }
}
// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
      showError("Please enter both username and password");
      return;
    }

    if (
      username === CREDENTIALS.username &&
      password === CREDENTIALS.password
    ) {
      sessionStorage.setItem("isLoggedIn", "true");
      showDashboard();
    } else {
      showError("Invalid username or password");
      loginForm.reset();
    }
  });

  recordForm.addEventListener("submit", handleFormSubmit);

  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredRecords = records.filter(
      (record) =>
        record.fullName.toLowerCase().includes(searchTerm) ||
        record.storeNumber.toLowerCase().includes(searchTerm)
    );
    renderRecords(filteredRecords);
  });
   if (sessionStorage.getItem("isLoggedIn") === "true") {
     initQRCode();
   }
});

// Export functions for global access
window.regenerateQR = regenerateQR;
window.openAddModal = openAddModal;
window.editRecord = editRecord;
window.deleteRecord = deleteRecord;
window.closeModal = closeModal;
window.logout = logout;
window.exportToPDF = exportToPDF;
