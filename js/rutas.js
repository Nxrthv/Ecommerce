function home(){
  window.location.href = '/index.html'
}
function headPhones() {
  window.location.href = 'Views/headPhones.html';
}
function smartWatch() {
  window.location.href = 'Views/smartWatch.html';
}
function laptops() {
  window.location.href = 'Views/laptops.html';
}
function consoles() {
  window.location.href = 'Views/consoles.html';
}
function cellPhones() {
  window.location.href = 'Views/cellPhones.html';
}
function airPods() {
  window.location.href = 'Views/airPods.html';
}

// Loading Animation
window.addEventListener("load", () => {
  const contenedor_loader = document.querySelector(".content_loader");
  contenedor_loader.style.opacity = 0;
  contenedor_loader.style.visibility = "hidden";
});

// Cargar Popper.js
var popperScript = document.createElement("script");
popperScript.src =
  "https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js";
popperScript.type = "text/javascript";
document.head.appendChild(popperScript);

// Cargar Bootstrap.js
var bootstrapScript = document.createElement("script");
bootstrapScript.src =
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js";
bootstrapScript.type = "text/javascript";
document.head.appendChild(bootstrapScript);

// Cargar Bootstrap Icons
var bootstrapIconsLink = document.createElement("link");
bootstrapIconsLink.href =
  "https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css";
bootstrapIconsLink.rel = "stylesheet";
document.head.appendChild(bootstrapIconsLink);

// Cargar jQuery
var jqueryScript = document.createElement("script");
jqueryScript.src = "https://code.jquery.com/jquery-3.5.1.slim.min.js";
jqueryScript.type = "text/javascript";
document.head.appendChild(jqueryScript);

//Efecto de Aparicion
function applyScrollEffect() {
  const elements = document.querySelectorAll('.fade-in');

  const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
          }
      });
  }, {
      threshold: 0.5
  });

  elements.forEach(element => {
      observer.observe(element);
  });
}
applyScrollEffect();