
(() => {
  if (window.__h5pAuditInstalled) return;
  window.__h5pAuditInstalled = true;

  function scanH5P() {
    const selectors = [
      ".h5p-sc-alternative",
      ".h5p-multichoice-answer"
    ];

    const elements = [
      ...document.querySelectorAll(selectors.join(","))
    ];

    const items = elements.map((el, index) => {
      const classes = [...el.classList];

      return {
        index: index + 1,
        text: (el.innerText || el.textContent || "").trim(),
        classes,
        correctMarker:
          classes.includes("h5p-sc-is-correct") ||
          classes.includes("h5p-is-correct"),
        wrongMarker:
          classes.includes("h5p-sc-is-wrong") ||
          classes.includes("h5p-is-wrong")
      };
    });

    return {
      url: location.href,
      timestamp: new Date().toISOString(),
      title: document.title,
      itemCount: items.length,
      correctMarkers: items.filter(x => x.correctMarker).length,
      wrongMarkers: items.filter(x => x.wrongMarker).length,
      items
    };
  }

  // Chỉ xuất kết quả trong console để phục vụ kiểm thử.
  window.h5pAuditScan = scanH5P;

  console.info(
    "[H5P Audit] Đã sẵn sàng. Chạy h5pAuditScan() để kiểm tra."
  );
})();
