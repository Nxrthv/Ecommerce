// Funciones de utilidad comunes para animaciones
const animationUtils = {
    // Formatear tiempo para contadores
    formatTime: function(time) {
      const minutes = Math.floor(time / 60000);
      const seconds = Math.floor((time % 60000) / 1000);
      const milliseconds = Math.floor((time % 1000) / 10);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }
  };
  
  // Inicializar todas las animaciones cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', function() {
    // Inicializar animaciones de texto
    initTextAnimations();
    
    // Inicializar animaciones de botones
    initButtonAnimations();
    
    // Inicializar animaciones de tarjetas
    initCardAnimations();
    
    // Inicializar loaders
    initLoaders();
    
    // Inicializar contadores
    initCounters();
    
    // // Inicializar transiciones de página
    // initPageTransitions();
  });