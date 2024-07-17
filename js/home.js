// SLIDER
const slider = document.getElementById("slider");
let sliderSection = document.querySelectorAll(".slider_img");
let sliderSectionLast = sliderSection[sliderSection.length -1];

const btnRight = document.getElementById("btn_right");
const btnLeft = document.getElementById("btn_left");

function next() {
    let sliderSectionFirst = document.querySelectorAll(".slider_img")[0];

    slider.style.marginLeft = "-200%";
    slider.style.transition = "margin-left 1s";
    setTimeout(() => {
        slider.style.transition = "none";
        slider.insertAdjacentElement("beforeend", sliderSectionFirst)
        slider.style.marginLeft = "-100%"
    }, 1000);
}

function prev() {
    let sliderSection = document.querySelectorAll(".slider_img");
    let sliderSectionLast = sliderSection[sliderSection.length -1];
    slider.style.marginLeft = "0";
    slider.style.transition = "margin-left 1s";
    setTimeout(() => {
        slider.style.transition = "none";
        slider.insertAdjacentElement("afterbegin", sliderSectionLast)
        slider.style.marginLeft = "-100%"
    }, 1000);

}

btnRight.addEventListener("click", function () {
    next();
})

btnLeft.addEventListener("click", function () {
    prev()
})

setInterval(() => {
    next()
}, 4000);

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