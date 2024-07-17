// SLIDER
document.addEventListener('DOMContentLoaded', function () {
    const totalSlides = slides.length;
    const slideWidth = slides[0].clientWidth;
  
    let currentIndex = 0;
  
    function goToSlide(index) {
      if (index < 0) {
        index = totalSlides - 1;
      } else if (index >= totalSlides) {
        index = 0;
      }
      currentIndex = index;
      const offset = -currentIndex * slideWidth;
      slider.style.transform = `translateX(${offset}px)`;
    }
  
    setInterval(() => {
      currentIndex++;
      goToSlide(currentIndex);
    }, 3000);
  });

// BARRA DE NAVEGACION
fetch('/html/nav.html')
.then(response => response.text())
.then(data => {
    document.getElementById('nav').innerHTML = data;
});

// FOOTER
fetch('/html/footer.html')
.then(response => response.text())
.then(data => {
    document.getElementById('footer').innerHTML = data;
});

//LOADER
fetch('html/loader.html')
.then(response => response.text())
.then(data => {
    document.getElementById('cont-loader').innerHTML = data;
});

window.addEventListener('load', ()=>{
    const loader = document.querySelector('.cont-loader');
        loader.style.opacity = 0;
        loader.style.visibility = 'hidden';
})