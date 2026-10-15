
"use strict";

const scanButton = document.getElementById("scan");
const output = document.getElementById("out");
const status = document.getElementById("status");

// Lưu dữ liệu câu hỏi trong lúc popup còn mở.
let savedQuestions = new Map();

scanButton.addEventListener("click", async () => {
  scanButton.disabled = true;
  status.textContent = "Đang quét nội dung...";

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab?.id || !/^https?:/.test(tab.url || "")) {
      throw new Error("Hãy mở trang LMS360 trước.");
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const reports = [];
        const visited = new WeakSet();

        function clean(el) {
          return (el?.innerText || el?.textContent || "")
            .replace(/\s+/g, " ")
            .trim();
        }

        function inspect(doc) {
          if (!doc || visited.has(doc)) return;
          visited.add(doc);

          const elements = [
            ...doc.querySelectorAll(".h5p-sc-question")
          ];

          const questions = elements.map((el, index) => {
            let options = [
              ...el.querySelectorAll(".h5p-sc-alternative")
            ];

            if (!options.length && el.parentElement) {
              options = [
                ...el.parentElement.querySelectorAll(
                  ".h5p-sc-alternative"
                )
              ];
            }

            return {
              number: index + 1,
              question: clean(el),
              alternatives: [...new Set(options)].map(option => ({
                text: clean(option),
                isCorrect: option.classList.contains(
                  "h5p-sc-is-correct"
                ),
                isWrong: option.classList.contains(
                  "h5p-sc-is-wrong"
                )
              }))
            };
          });

          reports.push({ questions });

          for (const frame of doc.querySelectorAll("iframe")) {
            try {
              if (frame.contentDocument) {
                inspect(frame.contentDocument);
              }
            } catch (_) {
              // Bỏ qua iframe không thể truy cập.
            }
          }
        }

        inspect(document);
        return reports;
      }
    });

    const reports = results.flatMap(
      result => result.result || []
    );

    // Cập nhật dữ liệu đã quét.
    for (const report of reports) {
      for (const q of report.questions || []) {
        const key = q.question;
        const old = savedQuestions.get(key);
        const oldOptions = old?.alternatives || [];

        const alternatives = q.alternatives.map(option => {
          const previous = oldOptions.find(
            item => item.text === option.text
          );

          return {
            ...option,
            isCorrect:
              option.isCorrect || previous?.isCorrect || false
          };
        });

        savedQuestions.set(key, {
          number: q.number,
          question: q.question,
          alternatives: alternatives.length
            ? alternatives
            : oldOptions
        });
      }
    }

    // Chọn câu hỏi đầu tiên tìm thấy có phương án.
    const currentQuestions = reports.flatMap(
      report => report.questions || []
    );

    const currentQuestion = currentQuestions.find(
      q => q.alternatives.length > 0
    );

    if (!currentQuestion) {
      output.textContent = "Chưa tìm thấy câu hỏi hiện tại.";
    } else {
      const saved = savedQuestions.get(currentQuestion.question);

      const optionsToShow = saved?.alternatives || [];

      const correctOptions = optionsToShow.filter(
        option => option.isCorrect === true
      );

      output.textContent = correctOptions.length
        ? correctOptions.map(option => option.text).join("\n")
        : "H5P chưa xác nhận đáp án đúng của câu hỏi hiện tại.";
    }

    status.textContent = "Đã quét xong.";
  } catch (error) {
    status.textContent = "Quét thất bại.";
    output.textContent =
      "Lỗi: " + (error?.message || String(error));
  } finally {
    scanButton.disabled = false;
  }
});
