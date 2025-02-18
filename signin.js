// // signin.js
import { addSignInRecord, getActiveQRUrl } from "./firebase.config.js";

async function validateTimestamp() {
  const urlParams = new URLSearchParams(window.location.search);
  const timestamp = urlParams.get("t");

  if (!timestamp) {
    alert("Invalid access. Please scan the QR code to sign in.");
    window.location.href = "index.html";
    return false;
  }

  try {
    // Get the current active QR timestamp from Firebase
    const activeConfig = await getActiveQRUrl();
    const activeTimestamp = activeConfig?.activeTimestamp;

    if (!activeTimestamp || timestamp !== activeTimestamp) {
      alert(
        "This QR code has expired. Please scan the latest QR code to sign in."
      );
      window.location.href = "index.html";
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating timestamp:", error);
    alert("An error occurred. Please try again.");
    window.location.href = "index.html";
    return false;
  }
}

// Get form elements
const form = document.getElementById("registerForm");
const inputs = form.querySelectorAll(".input");
const termsCheckbox = document.getElementById("terms");
const submitButton = document.querySelector(".submit");

// Validate input fields
function validateInput(input) {
  const isValid = input.checkValidity();
  const errorMessage = input.nextElementSibling;

  if (!isValid) {
    input.classList.add("error");
    errorMessage.classList.add("visible");
  } else {
    input.classList.remove("error");
    errorMessage.classList.remove("visible");
  }

  return isValid;
}

// Check all form validations
function validateForm() {
  let isValid = true;
  inputs.forEach((input) => {
    if (!validateInput(input)) {
      isValid = false;
    }
  });
  return isValid && termsCheckbox.checked;
}

// Add input event listeners
inputs.forEach((input) => {
  input.addEventListener("input", () => {
    validateInput(input);
    submitButton.disabled = !validateForm();
  });
});

// Add checkbox event listener
termsCheckbox.addEventListener("change", () => {
  submitButton.disabled = !validateForm();
});

// Enable submit button initially if form is valid
submitButton.disabled = !validateForm();

// Form submission handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Revalidate timestamp before submission
  if (!(await validateTimestamp())) {
    return;
  }

  if (!validateForm()) {
    return;
  }

  submitButton.disabled = true;
  submitButton.classList.add("loading");

  try {
    // Prepare record data
    const recordData = {
      fullName: form.querySelector('[name="fullname"]').value,
      storeNumber: form.querySelector('[name="storenumber"]').value,
    };

    // Add record to database
    const result = await addSignInRecord(recordData);

    if (result.success) {
      window.location.href = "success.html";
    } else {
      throw new Error("Failed to add record");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred while signing in. Please try again.");
    submitButton.disabled = false;
    submitButton.classList.remove("loading");
  }
});

// Validate timestamp when page loads
document.addEventListener("DOMContentLoaded", async () => {
  await validateTimestamp();
});




