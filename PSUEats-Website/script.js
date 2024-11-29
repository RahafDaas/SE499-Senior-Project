window.onload = function () {
  const logoPopup = document.getElementById("logo-popup");
  const overlay = document.getElementById("overlay");
  logoPopup.style.display = "block"; // Show popup

  setTimeout(function () {
    overlay.style.display = "none"; // Hide overlay and logo after 4 seconds
  }, 2000); // 2000 milliseconds = 2 seconds
};

function nameValidation() {
  var name = document.getElementById("name").value;
  const nameError = document.getElementById("nameError");
  const correctIcon = document.getElementById("correctNameIcon");
  const wrongIcon = document.getElementById("wrongNameIcon");

  if (name.length == 0) {
    nameError.innerHTML = "Name is required";
    correctIcon.style.display = "none";
    wrongIcon.style.display = "block";
    return false;
  }

  if (!name.match(/^[A-Za-z]*\s{1}[A-Za-z]*$/)) {
    nameError.innerHTML = "Write a full name";
    correctIcon.style.display = "none";
    wrongIcon.style.display = "block";
    return false;
  }

  nameError.innerHTML = "";
  correctIcon.style.display = "block";
  wrongIcon.style.display = "none";
  return true;
}

function emailValidation() {
  var email = document.getElementById("email").value;
  const emailError = document.getElementById("emailError");
  const correctIcon = document.getElementById("correctEmailIcon");
  const wrongIcon = document.getElementById("wrongEmailIcon");

  if (email.length == 0) {
    emailError.innerHTML = "Email is required";
    correctIcon.style.display = "none";
    wrongIcon.style.display = "block";
    return false;
  }

  const emailPattern = /^[a-zA-Z0-9._%+-]+@psu\.edu\.sa$/;
  if (!email.match(emailPattern)) {
    emailError.innerHTML = "Write a PSU email address";
    correctIcon.style.display = "none";
    wrongIcon.style.display = "block";
    return false;
  }

  emailError.innerHTML = "";
  correctIcon.style.display = "block";
  wrongIcon.style.display = "none";
  return true;
}

function phoneValidation() {
  var phoneNum = document.getElementById("phoneNum").value;
  const phoneError = document.getElementById("phoneError");
  const correctIcon = document.getElementById("correctPhoneIcon");
  const wrongIcon = document.getElementById("wrongPhoneIcon");

  if (phoneNum.length == 0) {
    phoneError.innerHTML = "Phone number is required";
    correctIcon.style.display = "none";
    wrongIcon.style.display = "block";
    return false;
  }

  const phonePattern = /^[0-9]{10}$/;
  if (!phonePattern.test(phoneNum)) {
    phoneError.innerHTML = "Phone number should be 10 digits";
    correctIcon.style.display = "none";
    wrongIcon.style.display = "block";
    return false;
  }

  phoneError.innerHTML = "";
  correctIcon.style.display = "block";
  wrongIcon.style.display = "none";
  return true;
}

function passValidation() {
  var password = document.getElementById("password").value;
  const passwordError = document.getElementById("passwordError");
  const correctIcon = document.getElementById("correctPassIcon");
  const wrongIcon = document.getElementById("wrongPassIcon");

  if (password.length == 0) {
    passwordError.innerHTML = "Password is required";
    correctIcon.style.display = "none";
    wrongIcon.style.display = "block";
    return false;
  }

  const passPattern = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
  if (!passPattern.test(password)) {
    passwordError.innerHTML =
      "Password should be more than 8 characters and digits";
    correctIcon.style.display = "none";
    wrongIcon.style.display = "block";
    return false;
  }

  passwordError.innerHTML = "";
  correctIcon.style.display = "block";
  wrongIcon.style.display = "none";
  return true;
}

function passConfirmValidation() {
  var password = document.getElementById("password").value;
  var password2 = document.getElementById("password2").value;
  const confirmationError = document.getElementById("confirmationError");
  const correctIcon = document.getElementById("correctConfirmIcon");
  const wrongIcon = document.getElementById("wrongConfirmIcon");

  if (password2.length == 0) {
    confirmationError.innerHTML = "Password is required";
    correctIcon.style.display = "none";
    wrongIcon.style.display = "block";
    return false;
  }

  if (password2 !== password) {
    confirmationError.innerHTML = "Passwords should match";
    correctIcon.style.display = "none";
    wrongIcon.style.display = "block";
    return false;
  }

  confirmationError.innerHTML = "";
  correctIcon.style.display = "block";
  wrongIcon.style.display = "none";
  return true;
}
function formValidation() {
  if (
    !nameValidation ||
    !emailValidation ||
    !phoneValidation ||
    !passConfirmValidation ||
    !passValidation
  )
    return false;
}
