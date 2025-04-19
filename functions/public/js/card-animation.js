function initCardAnimations() {
    // Seleccionar todas las tarjetas con la clase 'animated-card'
    const cards = document.querySelectorAll('.animated-card');
    
    cards.forEach(card => {
      const hoverEffect = card.dataset.hoverEffect || 'tilt';
      const enterAnimation = card.dataset.enterAnimation || 'fade';
      
      // Animación de entrada
      if (enterAnimation !== 'none') {
        let animation = {};
        
        switch(enterAnimation) {
          case 'fade':
            animation = {
              opacity: [0, 1],
              duration: 800,
              easing: 'easeOutExpo'
            };
            break;
          case 'slide':
            animation = {
              translateY: [50, 0],
              opacity: [0, 1],
              duration: 800,
              easing: 'easeOutExpo'
            };
            break;
          case 'zoom':
            animation = {
              scale: [0.9, 1],
              opacity: [0, 1],
              duration: 800,
              easing: 'easeOutExpo'
            };
            break;
        }
        
        anime({
          targets: card,
          ...animation
        });
      }
      
      // Efectos al hacer hover
      if (hoverEffect === 'tilt') {
        card.addEventListener('mousemove', function(e) {
          const rect = this.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          
          const rotateX = (y - centerY) / 10;
          const rotateY = (centerX - x) / 10;
          
          anime({
            targets: this,
            rotateX: rotateX,
            rotateY: rotateY,
            duration: 400,
            easing: 'easeOutElastic(1, .6)'
          });
        });
        
        card.addEventListener('mouseleave', function() {
          anime({
            targets: this,
            rotateX: 0,
            rotateY: 0,
            duration: 400,
            easing: 'easeOutElastic(1, .6)'
          });
        });
      } else if (hoverEffect === 'scale') {
        card.addEventListener('mouseenter', function() {
          anime({
            targets: this,
            scale: 1.05,
            duration: 300,
            easing: 'easeOutQuad'
          });
        });
        
        card.addEventListener('mouseleave', function() {
          anime({
            targets: this,
            scale: 1,
            duration: 300,
            easing: 'easeOutQuad'
          });
        });
      } else if (hoverEffect === 'glow') {
        card.addEventListener('mouseenter', function() {
          this.classList.add('card-glow');
        });
        
        card.addEventListener('mouseleave', function() {
          this.classList.remove('card-glow');
        });
      } else if (hoverEffect === 'lift') {
        card.addEventListener('mouseenter', function() {
          anime({
            targets: this,
            translateY: -10,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            duration: 300,
            easing: 'easeOutQuad'
          });
        });
        
        card.addEventListener('mouseleave', function() {
          anime({
            targets: this,
            translateY: 0,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            duration: 300,
            easing: 'easeOutQuad'
          });
        });
      }
    });
  }