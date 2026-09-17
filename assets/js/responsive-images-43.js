/* Use supplied native resolution; never synthesize photographic detail. */
(() => {
  const root = document.documentElement;
  const density = () => root.style.setProperty('--image-density', String(Math.max(1, window.devicePixelRatio || 1)));
  density();
  window.addEventListener('resize', density, {passive:true});
  const sources = {'explorer-offshore-fallback':[410,820], 'explorer-onshore-fallback':[410,820], 'offshore-removal-transport':[360,531], 'mooring-anchor-recovery':[360,540], 'onshore-demolition-disposal':[360,571]};
  for (const id of ['assetFallbackImage','photoDialogImage']) {
    const image = document.getElementById(id);
    if (!image) continue;
    const update = () => {
      const src = image.getAttribute('src');
      const name = src && Object.keys(sources).find(name => src.includes('/'+name));
      if (!name) return;
      const widths = sources[name], largest = widths.at(-1);
      const srcset = widths.map(w=>`assets/img/${name}-43-${w}.webp ${w}w`).join(', ');
      if (image.getAttribute('srcset') !== srcset) image.setAttribute('srcset',srcset);
      image.sizes = `(max-width:700px) calc(100vw - 48px), ${largest}px`;
      if (id === 'photoDialogImage') image.style.setProperty('--photo-native-width',largest+'px');
    };
    new MutationObserver(update).observe(image,{attributes:true,attributeFilter:['src']});
    update();
  }
})();
