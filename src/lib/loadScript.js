export function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-arqon-src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve(existing);
        return;
      }
      existing.addEventListener('load', () => resolve(existing), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error(`Failed to load ${src}`)),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.arqonSrc = src;
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true';
        resolve(script);
      },
      { once: true },
    );
    script.addEventListener(
      'error',
      () => reject(new Error(`Failed to load ${src}`)),
      { once: true },
    );
    document.body.appendChild(script);
  });
}
