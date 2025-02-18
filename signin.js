// // // signin.js
// import { addSignInRecord, getActiveQRUrl } from "./firebase.config.js";

// async function validateTimestamp() {
//   const urlParams = new URLSearchParams(window.location.search);
//   const timestamp = urlParams.get("t");

//   if (!timestamp) {
//     alert("Invalid access. Please scan the QR code to sign in.");
//     window.location.href = "index.html";
//     return false;
//   }

//   try {
//     // Get the current active QR timestamp from Firebase
//     const activeConfig = await getActiveQRUrl();
//     const activeTimestamp = activeConfig?.activeTimestamp;

//     if (!activeTimestamp || timestamp !== activeTimestamp) {
//       alert(
//         "This QR code has expired. Please scan the latest QR code to sign in."
//       );
//       window.location.href = "index.html";
//       return false;
//     }

//     return true;
//   } catch (error) {
//     console.error("Error validating timestamp:", error);
//     alert("An error occurred. Please try again.");
//     window.location.href = "index.html";
//     return false;
//   }
// }

// // Get form elements
// const form = document.getElementById("registerForm");
// const inputs = form.querySelectorAll(".input");
// const termsCheckbox = document.getElementById("terms");
// const submitButton = document.querySelector(".submit");

// // Validate input fields
// function validateInput(input) {
//   const isValid = input.checkValidity();
//   const errorMessage = input.nextElementSibling;

//   if (!isValid) {
//     input.classList.add("error");
//     errorMessage.classList.add("visible");
//   } else {
//     input.classList.remove("error");
//     errorMessage.classList.remove("visible");
//   }

//   return isValid;
// }

// // Check all form validations
// function validateForm() {
//   let isValid = true;
//   inputs.forEach((input) => {
//     if (!validateInput(input)) {
//       isValid = false;
//     }
//   });
//   return isValid && termsCheckbox.checked;
// }

// // Add input event listeners
// inputs.forEach((input) => {
//   input.addEventListener("input", () => {
//     validateInput(input);
//     submitButton.disabled = !validateForm();
//   });
// });

// // Add checkbox event listener
// termsCheckbox.addEventListener("change", () => {
//   submitButton.disabled = !validateForm();
// });

// // Enable submit button initially if form is valid
// submitButton.disabled = !validateForm();

// // Form submission handler
// form.addEventListener("submit", async (e) => {
//   e.preventDefault();

//   // Revalidate timestamp before submission
//   if (!(await validateTimestamp())) {
//     return;
//   }

//   if (!validateForm()) {
//     return;
//   }

//   submitButton.disabled = true;
//   submitButton.classList.add("loading");

//   try {
//     // Prepare record data
//     const recordData = {
//       fullName: form.querySelector('[name="fullname"]').value,
//       storeNumber: form.querySelector('[name="storenumber"]').value,
//     };

//     // Add record to database
//     const result = await addSignInRecord(recordData);

//     if (result.success) {
//       window.location.href = "success.html";
//     } else {
//       throw new Error("Failed to add record");
//     }
//   } catch (error) {
//     console.error("Error:", error);
//     alert("An error occurred while signing in. Please try again.");
//     submitButton.disabled = false;
//     submitButton.classList.remove("loading");
//   }
// });

// // Validate timestamp when page loads
// document.addEventListener("DOMContentLoaded", async () => {
//   await validateTimestamp();
// });



// delete below if not needed

// signin.js
import { addSignInRecord, getActiveQRUrl } from "./firebase.config.js";

async function validateTimestamp() {
  const urlParams = new URLSearchParams(window.location.search);
  const timestamp = urlParams.get("t");

  if (!timestamp) {
    window.location.href = "expired.html";
    return false;
  }

  try {
    // Get the current active QR timestamp from Firebase
    const activeConfig = await getActiveQRUrl();
    const activeTimestamp = activeConfig?.activeTimestamp;

    if (!activeTimestamp || timestamp !== activeTimestamp) {
      window.location.href = "expired.html";
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating timestamp:", error);
    window.location.href = "expired.html";
    return false;
  }
}

// Get form elements
const form = document.getElementById("registerForm");
const inputs = form.querySelectorAll(".input");
const termsCheckbox = document.getElementById("terms");
const submitButton = document.querySelector(".submit");
const storeNumberInput = document.getElementById("storenumber");

// Initialize store number input with prefix
const storePrefix = "274";
storeNumberInput.value = storePrefix;

// Handle store number input focus
storeNumberInput.addEventListener('focus', function(e) {
    if (this.value === storePrefix) {
        // Set cursor position after prefix
        this.setSelectionRange(storePrefix.length, storePrefix.length);
    }
});

// Prevent deletion of prefix
storeNumberInput.addEventListener('input', function(e) {
    if (!this.value.startsWith(storePrefix)) {
        this.value = storePrefix + this.value.replace(storePrefix, '');
    }
});

// Prevent cursor placement before prefix
storeNumberInput.addEventListener('keydown', function(e) {
    const cursorPosition = this.selectionStart;
    if (cursorPosition < storePrefix.length &&
        e.key !== 'ArrowRight' &&
        e.key !== 'ArrowDown' &&
        e.key !== 'ArrowUp' &&
        e.key !== 'End' &&
        e.key !== 'Tab') {
        e.preventDefault();
    }
});

// Validate input fields
function validateInput(input) {
  const isValid = input.checkValidity();
  const errorMessage = input.nextElementSibling;

  if (input.id === 'storenumber') {
    // Additional validation for store number
    if (!input.value.startsWith(storePrefix)) {
      input.classList.add("error");
      errorMessage.classList.add("visible");
      return false;
    }
  }

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