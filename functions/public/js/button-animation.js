function initButtonAnimations() {
    // Seleccionar todos los botones con la clase 'animated-button'
    const buttons = document.querySelectorAll('.animated-button');
    
    buttons.forEach(button => {
      const animationType = button.dataset.animationType || 'ripple';
      
      button.addEventListener('click', function(e) {
        switch(animationType) {
          case 'ripple':
            createRippleEffect(e, this);
            break;
          case 'pulse':
            createPulseEffect(this);
            break;
          case 'shake':
            createShakeEffect(this);
            break;
          case 'bounce':
            createBounceEffect(this);
            break;
        }
      });
    });
  }
  
  function createRippleEffect(e, button) {
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    button.appendChild(ripple);
    
    anime({
      targets: ripple,
      scale: [0, 3],
      opacity: [1, 0],
      translateX: [0, -100],
      translateY: [0, -100],
      duration: 600,
      easing: 'easeOutExpo',
      complete: function() {
        ripple.remove();
      }
    });
  }
  
  function createPulseEffect(button) {
    anime({
      targets: button,
      scale: [1, 1.05, 1],
      duration: 300,
      easing: 'easeInOutQuad'
    });
  }
  
  function createShakeEffect(button) {
    anime({
      targets: button,
      translateX: [0, -10, 10, -10, 10, 0],
      duration: 500,
      easing: 'easeInOutSine'
    });
  }
  
  function createBounceEffect(button) {
    anime({
      targets: button,
      translateY: [0, -10, 0],
      duration: 500,
      easing: 'spring(1, 80, 10, 0)'
    });
  }