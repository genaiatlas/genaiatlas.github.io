window.MathJax = {
    tex: {
      inlineMath: [['\\(', '\\)']],         // Inline equations
      displayMath: [['\\[', '\\]'], ['$$','$$']], // Display equations
      processEscapes: true,
      tags: 'ams'                           // Numbered equations if needed
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
      renderActions: {
        addMenu: [0, '', '']                // Remove context menu if not needed
      }
    }
  };