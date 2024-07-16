// CONSOLES
fetch('/Json/Products.json')
  .then(response => response.json())
  .then(data => {
    const contenedor_tarjeta = document.getElementById('betterPro');

    data.consoles.forEach(function(producto) {
      const tarjeta = document.createElement('div');
      tarjeta.classList.add('product');

      const imagen = document.createElement('img');
      imagen.classList.add('img_product');
      imagen.src = producto.imagen;
      imagen.alt = producto.producto;

      const nombre_producto = document.createElement('h4');
      nombre_producto.classList.add('name_product');
      nombre_producto.textContent = `${producto.producto}`;

      const precio_producto = document.createElement('p');
      precio_producto.classList.add('price');
      precio_producto.textContent = `${producto.precio}`;

      const boton_comprar = document.createElement('button');
      boton_comprar.classList.add('buy_button');
      boton_comprar.textContent = '🛒 ADD TO CART';

      boton_comprar.addEventListener('click', function() {
        console.log(`Comprar ${producto.producto}`);
      });

      tarjeta.appendChild(imagen);
      tarjeta.appendChild(nombre_producto);
      tarjeta.appendChild(precio_producto);
      tarjeta.appendChild(boton_comprar); 

      contenedor_tarjeta.appendChild(tarjeta);
    });
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });