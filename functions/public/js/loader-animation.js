function initLoaders() {
    // Seleccionar todos los loaders
    const loaders = document.querySelectorAll('.animated-loader');
    
    loaders.forEach(loader => {
      const type = loader.dataset.type || 'dots';
      
      switch(type) {
        case 'dots':
          animateDotsLoader(loader);
          break;
        case 'circle':
          animateCircleLoader(loader);
          break;
        case 'bars':
          animateBarsLoader(loader);
          break;
        case 'pulse':
          animatePulseLoader(loader);
          break;
      }
    });
  }
  
  function animateDotsLoader(loader) {
    anime({
      targets: loader.querySelectorAll('.dot'),
      translateY: [0, -15, 0],
      delay: anime.stagger(100),
      loop: true,
      duration: 600,
      easing: 'easeInOutSine'
    });
  }
  
  function animateCircleLoader(loader) {
    anime({
      targets: loader.querySelector('.circle'),
      rotate: 360,
      easing: 'linear',
      loop: true,
      duration: 1000
    });
  }
  
  function animateBarsLoader(loader) {
    anime({
      targets: loader.querySelectorAll('.bar'),
      height: (el, i) => [5, 30, 5],
      delay: anime.stagger(100),
      loop: true,
      duration: 600,
      easing: 'easeInOutSine'
    });
  }
  
  function animatePulseLoader(loader) {
    anime({
      targets: loader.querySelector('.pulse'),
      scale: [0, 1],
      opacity: [1, 0],
      easing: 'easeInOutSine',
      loop: true,
      duration: 1500
    });
  }