function initCounters() {
  const counters = document.querySelectorAll('.animated-counter');

  counters.forEach(counter => {
    const start = parseFloat(counter.dataset.start || 0);
    const end = parseFloat(counter.dataset.end || 0);
    const duration = parseInt(counter.dataset.duration || 2000);
    const easing = counter.dataset.easing || 'easeInOutExpo';
    const delay = parseInt(counter.dataset.delay || 0);
    const format = counter.dataset.format || 'fixed-2';

    const obj = { value: start };

    anime({
      targets: obj,
      value: end,
      easing: easing,
      duration: duration,
      delay: delay,
      update: function() {
        const val = obj.value;

        switch (format) {
          case 'currency':
            counter.innerHTML = 'S/ ' + parseFloat(val).toFixed(2);
            break;
          case 'integer':
            counter.innerHTML = Math.round(val);
            break;
          case 'percentage':
            counter.innerHTML = Math.round(val) + '%';
            break;
          case 'fixed-2':
            counter.innerHTML = parseFloat(val).toFixed(2);
            break;
          default:
            counter.innerHTML = val;
        }
      }
    });
  });
}