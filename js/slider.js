document.addEventListener('DOMContentLoaded', function () {
    // const slider = document.querySelector('.slides');
    // const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    const slideWidth = slides[0].clientWidth; // Ancho de cada slide
  
    let currentIndex = 0;
  
    function goToSlide(index) {
      if (index < 0) {
        index = totalSlides - 1; // Si el índice es menor que cero, vuelve al último slide
      } else if (index >= totalSlides) {
        index = 0; // Si el índice es mayor o igual al número total de slides, vuelve al primer slide
      }
      currentIndex = index;
      const offset = -currentIndex * slideWidth;
      slider.style.transform = `translateX(${offset}px)`;
    }
  
    setInterval(() => {
      currentIndex++;
      goToSlide(currentIndex);
    }, 3000); // Cambia el slide cada 3 segundos (ajusta según tus necesidades)
  });
