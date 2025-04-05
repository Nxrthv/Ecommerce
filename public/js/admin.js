document.addEventListener("DOMContentLoaded", () => {
    // Image preview for product form
    const imageUrlInput = document.getElementById("image")
  
    if (imageUrlInput) {
      imageUrlInput.addEventListener("blur", function () {
        const imageUrl = this.value.trim()
        let imagePreview = document.querySelector(".image-preview")
  
        if (!imagePreview) {
          imagePreview = document.createElement("div")
          imagePreview.className = "image-preview"
          this.parentNode.appendChild(imagePreview)
        }
  
        if (imageUrl) {
          imagePreview.innerHTML = `<img src="${imageUrl}" alt="Preview">`
        } else {
          imagePreview.innerHTML = ""
        }
      })
    }
  
    // Confirm delete
    const deleteButtons = document.querySelectorAll(".btn-danger")
  
    deleteButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        if (!confirm("Are you sure you want to delete this item?")) {
          e.preventDefault()
        }
      })
    })
  })  