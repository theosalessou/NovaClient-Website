// Keep downloads current; the bundled release remains available if GitHub is unreachable.
fetch('https://api.github.com/repos/theosalessou/NovaClient-Dist/releases?per_page=10', {signal: AbortSignal.timeout(6000)})
  .then(response => { if (!response.ok) throw new Error('Release unavailable'); return response.json(); })
  .then(releases => {
    const release = releases.find(item => !item.draft && item.assets?.some(asset => /^NovaClient-.*-win64\.zip$/.test(asset.name)));
    if (!release) return;
    const asset = release.assets.find(item => /^NovaClient-.*-win64\.zip$/.test(item.name));
    if (!asset.browser_download_url.startsWith('https://github.com/theosalessou/NovaClient-Dist/releases/download/')) return;
    document.querySelectorAll('[data-download]').forEach(link => link.href = asset.browser_download_url);
    // The update section describes this release, so its version stays tied to its notes.
    document.querySelectorAll('.download-meta [data-version], .download-action [data-version]').forEach(label => label.textContent = release.tag_name);
  }).catch(() => {});
