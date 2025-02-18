import {
    firebaseConfig,
    getActiveQRUrl
} from './firebase.config.js';

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";

import {
    getFirestore,
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let qrcode;

function getCurrentDomain() {
    return window.location.origin;
}

async function initQRCode() {
    const qrcodeContainer = document.getElementById("qrcode");
    if (!qrcodeContainer) return;

    // Clear existing QR code
    qrcodeContainer.innerHTML = '';

    try {
        // Get current active QR config
        const activeConfig = await getActiveQRUrl();
        const currentTimestamp = activeConfig?.activeTimestamp || new Date().toISOString();

        // Use dynamic domain
        const currentDomain = getCurrentDomain();
        const url = `${currentDomain}/signin.html?t=${currentTimestamp}`;

        // Create new QR code
        qrcode = new QRCode(qrcodeContainer, {
            text: url,
            width: 256,
            height: 256,
            colorDark: "#1a1a1a",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    } catch (error) {
        console.error("Error initializing QR code:", error);
    }
}

// Listen for real-time updates to QR configuration
function listenToQRUpdates() {
    const unsubscribe = onSnapshot(doc(db, "system-config", "qr-config"), (doc) => {
        if (doc.exists()) {
            initQRCode();
        }
    });
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initQRCode();
    listenToQRUpdates();
});