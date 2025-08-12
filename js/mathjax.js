// docs/js/mathjax.js
window.MathJax = {
  tex: {
    inlineMath: [['\\(', '\\)']],
    displayMath: [['\\[', '\\]'], ['$$', '$$']],
    processEscapes: true,
    tags: 'ams'
  },
  options: {
    // Process entire page except these tags
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
  }
};

// IMPORTANT: MkDocs Material SPA hook
document$.subscribe(() => {
  if (window.MathJax?.typesetPromise) MathJax.typesetPromise();
});