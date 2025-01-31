fetch('Json/Products.json')
  .then(response => response.json())
  .then(data => {
    const contenedor_tarjeta = document.getElementById('betterPro');

    data.bestSellerProducts.forEach(function(producto) {
      // Verificar si los datos esenciales existen antes de crear la tarjeta
      if (!producto.imagen || !producto.producto) {
        return; // Ignora este producto si falta un dato importante
      }

      const tarjeta = document.createElement('div');
      tarjeta.classList.add('product', 'fade-in');

      // Imagen del producto
      const imagen = document.createElement('img');
      imagen.classList.add('img_product', 'img', 'img-fluid', 'mx-auto');
      imagen.src = producto.imagen;
      imagen.alt = producto.producto;
      tarjeta.appendChild(imagen);

      // Marca del producto (si existe)
      if (producto.marca) {
        const marca_producto = document.createElement('h4');
        marca_producto.classList.add('brand_product');
        marca_producto.textContent = producto.marca;
        tarjeta.appendChild(marca_producto);
      }

      // Nombre del producto
      const nombre_producto = document.createElement('h4');
      nombre_producto.classList.add('name_product');
      nombre_producto.textContent = producto.producto;
      tarjeta.appendChild(nombre_producto);

      // Imagen método de pago
      const met_pago = document.createElement('img');
      met_pago.classList.add('met_pago');
      met_pago.src = '/imgs/met_pago.png';
      tarjeta.appendChild(met_pago);

      // Precio de oferta (si existe)
      if (producto.oferta) {
        const precio_oferta = document.createElement('span');
        precio_oferta.classList.add('ofert');
        precio_oferta.textContent = producto.oferta;
        tarjeta.appendChild(precio_oferta);
      }

      // Descuento (si existe)
      if (producto.descuento) {
        const discount = document.createElement('span');
        discount.classList.add('discount');
        discount.textContent = producto.descuento;
        tarjeta.appendChild(discount);
      }

      // Precio del producto
      const precio_producto = document.createElement('p');
      precio_producto.classList.add('price');
      precio_producto.textContent = producto.precio;
      tarjeta.appendChild(precio_producto);

      // Botón de compra
      const boton_comprar = document.createElement('div');
      boton_comprar.classList.add('buy_button', 'rounded-pill', 'text-uppercase');
      boton_comprar.textContent = '🛒 see product';

      boton_comprar.addEventListener('click', function() {
        console.log(`Comprar ${producto.producto}`);
      });

      tarjeta.appendChild(boton_comprar);
      contenedor_tarjeta.appendChild(tarjeta);
    });
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });

//LOADER
fetch('/html/loader.html')
.then(response => response.text())
.then(data => {
    document.getElementById('cont-loader').innerHTML = data;
});

window.addEventListener('load', ()=>{
    const loader = document.querySelector('.cont-loader');
        loader.style.opacity = 0;
        loader.style.visibility = 'hidden';
})