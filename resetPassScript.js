// Function to generate a random OTP of specified length
function generateOTP(length = 6) {
  let otp = "";
  const characters = "0123456789";
  for (let i = 0; i < length; i++) {
    otp += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return otp;
}

// Placeholder for the OTP value (simulates OTP sent to user)
let sentOTP = "";

// Function to show/hide sections
function toggleSection(showSectionId) {
  document.getElementById("phone-section").style.display = "none";
  document.getElementById("otp-section").style.display = "none";
  document.getElementById("reset-password-section").style.display = "none";
  document.getElementById(showSectionId).style.display = "block";
}

// Event listener for sending OTP
document.getElementById("send-otp-btn").addEventListener("click", function () {
  const phoneNumber = document.getElementById("phone-number").value;
  if (phoneNumber) {
    // Generate a random OTP and store it
    sentOTP = generateOTP(6); // Generate a 6-digit OTP
    alert(`OTP sent to your phone number: ${sentOTP}`); // In real implementation, send this OTP via SMS

    toggleSection("otp-section");
  } else {
    document.getElementById("message").innerText =
      "Please enter a valid phone number.";
  }
});

// Event listener for verifying OTP
document
  .getElementById("verify-otp-btn")
  .addEventListener("click", function () {
    const enteredOTP = document.getElementById("otp-code").value;
    if (enteredOTP === sentOTP) {
      alert("OTP verified successfully.");
      toggleSection("reset-password-section");
    } else {
      document.getElementById("message").innerText =
        "Invalid OTP. Please try again.";
    }
  });

// Event listener for resetting password
document
  .getElementById("reset-password-btn")
  .addEventListener("click", function () {
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (newPassword && confirmPassword) {
      if (newPassword === confirmPassword) {
        alert("Password reset successfully.");
        document.getElementById("message").innerText = "";
      } else {
        document.getElementById("message").innerText =
          "Passwords do not match.";
      }
    } else {
      document.getElementById("message").innerText =
        "Please enter and confirm the new password.";
    }
  });
