document.addEventListener("DOMContentLoaded", () => {
    // Mobile menu toggle
    const menuToggle = document.querySelector(".menu-toggle")
    const navList = document.querySelector(".nav-list")
  
    if (menuToggle) {
      menuToggle.addEventListener("click", () => {
        navList.classList.toggle("active")
      })
    }
  
    // Product quantity buttons
    const quantityInputs = document.querySelectorAll(".quantity-input input")
  
    quantityInputs.forEach((input) => {
      const minusBtn = input.parentElement.querySelector(".minus")
      const plusBtn = input.parentElement.querySelector(".plus")
  
      if (minusBtn) {
        minusBtn.addEventListener("click", () => {
          const currentValue = Number.parseInt(input.value)
          if (currentValue > 1) {
            input.value = currentValue - 1
          }
        })
      }
  
      if (plusBtn) {
        plusBtn.addEventListener("click", () => {
          const currentValue = Number.parseInt(input.value)
          const maxValue = input.hasAttribute("max") ? Number.parseInt(input.getAttribute("max")) : 99
  
          if (currentValue < maxValue) {
            input.value = currentValue + 1
          }
        })
      }
    })
  
    // Payment method toggle
    const paymentMethods = document.querySelectorAll(".payment-method")
    const creditCardForm = document.querySelector(".credit-card-form")
  
    if (paymentMethods.length > 0 && creditCardForm) {
      paymentMethods.forEach((method) => {
        const radio = method.querySelector('input[type="radio"]')
  
        method.addEventListener("click", () => {
          radio.checked = true
  
          if (radio.value === "credit-card") {
            creditCardForm.style.display = "block"
          } else {
            creditCardForm.style.display = "none"
          }
        })
      })
    }
  })  