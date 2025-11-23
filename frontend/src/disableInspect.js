const disableInspect = () => {
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('keydown', (e) => {

    if (e.key === 'F12') e.preventDefault();

    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'K')) {
      e.preventDefault();
    }

    if (e.ctrlKey && e.key === 'u') e.preventDefault();

    if (e.ctrlKey && e.key === 's') e.preventDefault();
  });

  const devtools = {
    open: false,
    orientation: null
  };

  const threshold = 160;
  setInterval(() => {
    if (
      window.outerHeight - window.innerHeight > threshold ||
      window.outerWidth - window.innerWidth > threshold
    ) {
      if (!devtools.open) {
        devtools.open = true;
        document.body.innerHTML = '<h1 style="text-align:center;margin-top:100px;color:red;">Developer tools are not allowed!</h1>';
      }
    } else {
      devtools.open = false;
    }
  }, 500);
};

export default disableInspect;