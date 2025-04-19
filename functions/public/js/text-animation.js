function initTextAnimations() {
  const textElements = document.querySelectorAll('.animated-text');

  textElements.forEach(element => {
    const text = element.textContent.trim();
    const delay = parseInt(element.dataset.delay || 0);
    const duration = parseInt(element.dataset.duration || 600);
    const easing = element.dataset.easing || 'easeOutCubic';
    const staggerDelay = parseInt(element.dataset.staggerDelay || 30);
    const direction = element.dataset.direction || 'normal';

    element.textContent = '';

    text.split('').forEach(letter => {
      const span = document.createElement('span');
      span.className = 'letter';
      span.style.opacity = '0';
      span.style.display = 'inline-block';
      span.style.transform = 'translateY(10px)';
      span.textContent = letter === ' ' ? '\u00A0' : letter;
      element.appendChild(span);
    });

    anime({
      targets: element.querySelectorAll('.letter'),
      opacity: [0, 1],
      translateY: [10, 0],
      duration: duration,
      delay: anime.stagger(staggerDelay, {start: delay}),
      easing: easing,
      direction: direction,
      loop: false
    });
  });
}
