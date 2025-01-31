// BARRA DE NAVEGACION
fetch('/Views/nav.html')
.then(response => response.text())
.then(data => {
    document.getElementById('nav').innerHTML = data;
});

// FOOTER
fetch('/Views/footer.html')
.then(response => response.text())
.then(data => {
    document.getElementById('footer').innerHTML = data;
});

//LOADER
fetch('Views/loader.html')
.then(response => response.text())
.then(data => {
    document.getElementById('cont-loader').innerHTML = data;
});

window.addEventListener('load', ()=>{
    const loader = document.querySelector('.cont-loader');
        loader.style.opacity = 0;
        loader.style.visibility = 'hidden';
})