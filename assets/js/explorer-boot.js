/* Homepage: user requested. Dedicated explorer: automatic, except data saver. */
(() => {
  'use strict';
  const stage = document.getElementById('assetStage');
  const panel = document.querySelector('[data-explorer-state]');
  const button = document.getElementById('startExplorer');
  const status = document.getElementById('explorerStartStatus');
  if (!stage || !panel || !button) return;
  const image = document.getElementById('assetFallbackImage');
  const label = document.getElementById('activeAssetLabel');
  const params = new URLSearchParams(location.search);
  let pending;
  let focusRequested = false;
  stage.removeAttribute('tabindex');
  stage.setAttribute('aria-label', 'Static asset preview. Start the explorer to use the model and evidence domains.');
  function selectAsset(asset) {
    if (!['offshore', 'onshore'].includes(asset)) return;
    stage.dataset.defaultAsset = asset;
    document.querySelectorAll('[data-asset]').forEach(item => {
      const selected = item.dataset.asset === asset;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    if (image) {
      image.src = `assets/img/explorer-${asset}-fallback-43-820.webp`;
      image.alt = `Static view of the illustrative ${asset === 'offshore' ? 'offshore platform' : 'onshore plant'} model`;
    }
    if (label) label.textContent = asset === 'offshore' ? 'Offshore platform' : 'Onshore plant';
  }
  selectAsset(params.get('asset'));
  function ready() {
    if (panel.dataset.explorerState === 'active') return;
    panel.dataset.explorerState = 'active';
    if (status) status.textContent = '';
    document.dispatchEvent(new CustomEvent('endura:explorer-ready'));
    if (focusRequested) document.querySelector('#explorerDomainList button[aria-selected="true"]')?.focus();
  }
  function activate(fromButton = false) {
    focusRequested ||= fromButton;
    if (panel.dataset.explorerState === 'active') return Promise.resolve();
    if (stage.dataset.explorerInitialised === 'true') { ready(); return Promise.resolve(); }
    if (pending) return pending;
    panel.dataset.explorerState = 'loading';
    button.disabled = true;
    if (status) status.textContent = 'Loading the interactive model. The static view remains available.';
    pending = Promise.resolve().then(() => window.EnduraEvidence.load()).then(() => new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'assets/js/explorer.js?v=4.5.1';
      script.async = true;
      const timer = setTimeout(() => { script.remove(); reject(Error('timeout')); }, 20000);
      script.onload = () => {
        clearTimeout(timer);
        if (stage.dataset.explorerInitialised === 'true') { ready(); resolve(); }
        else reject(Error('initialisation'));
      };
      script.onerror = () => { clearTimeout(timer); script.remove(); reject(Error('load')); };
      document.head.appendChild(script);
    })).catch(() => {
      if (stage.dataset.explorerInitialised === 'true') { ready(); return; }
      panel.dataset.explorerState = 'idle';
      if (status) status.textContent = 'The explorer could not load. The static preview remains available. Select the start button to retry.';
      button.disabled = false;
      pending = null;
    });
    return pending;
  }
  window.EnduraExplorerBoot = { activate: () => activate() };
  button.addEventListener('click', () => activate(true));
  document.querySelectorAll('[data-asset]').forEach(item => item.addEventListener('click', () => {
    if (panel.dataset.explorerState !== 'active') { selectAsset(item.dataset.asset); activate(); }
  }));
  if (document.body.hasAttribute('data-explorer-page') && !navigator.connection?.saveData) activate();
})();
