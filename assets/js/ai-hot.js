(function () {
  "use strict";

  function getData() {
    return Array.isArray(window.__AI_HOT_DATA__) ? window.__AI_HOT_DATA__ : null;
  }

  function byDateDesc(a, b) {
    if (a.date < b.date) return 1;
    if (a.date > b.date) return -1;
    return 0;
  }

  function escapeText(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function buildRefs(refs) {
    if (!refs || !refs.length) return "";
    return refs.map(function (r) {
      return '<a href="' + escapeText(r.url) + '" target="_blank" rel="noopener noreferrer">' +
        escapeText(r.name) + "</a>";
    }).join("");
  }

  function buildCard(item) {
    return '<article class="ai-hot-card-item">' +
      '<h3 class="ai-hot-card-topic">' + escapeText(item.topic) + "</h3>" +
      '<p class="ai-hot-card-progress">' + escapeText(item.progress) + "</p>" +
      '<div class="ai-hot-card-refs">' + buildRefs(item.refs) + "</div>" +
      "</article>";
  }

  function buildCardList(day) {
    if (!day.items || !day.items.length) {
      return '<p class="ai-hot-empty">当日暂无条目。</p>';
    }
    var cards = day.items.map(buildCard).join("");
    return '<div class="ai-hot-cards">' + cards + "</div>";
  }

  function buildDayBlock(day) {
    return '<div class="ai-hot-day">' +
      '<div class="ai-hot-date">' + escapeText(day.date) + "</div>" +
      '<p class="ai-hot-overview">' + escapeText(day.overview || "") + "</p>" +
      buildCardList(day) +
      "</div>";
  }

  function buildArchiveBlock(days) {
    if (!days.length) {
      return '<p class="ai-hot-empty">暂无历史记录。</p>';
    }
    var items = days.map(function (day) {
      return '<details class="ai-hot-archive-item">' +
        '<summary>' + escapeText(day.date) + "</summary>" +
        '<p class="ai-hot-overview">' + escapeText(day.overview || "") + "</p>" +
        buildCardList(day) +
        "</details>";
    }).join("");
    return '<div class="ai-hot-archive">' + items + "</div>";
  }

  function renderApp(root, data) {
    if (!data || !data.length) {
      root.innerHTML = '<p class="ai-hot-empty">暂无热点数据。</p>';
      return;
    }
    var sorted = data.slice().sort(byDateDesc);
    var today = sorted[0];
    var rest = sorted.slice(1);

    root.innerHTML =
      '<h2 class="ai-hot-section-title">今日热点</h2>' +
      buildDayBlock(today) +
      '<h2 class="ai-hot-section-title">历史归档</h2>' +
      buildArchiveBlock(rest);
  }

  function renderSummary(root, data) {
    if (!data || !data.length) {
      root.innerHTML = '<p class="ai-hot-empty">暂无热点数据。</p>';
      return;
    }
    var sorted = data.slice().sort(byDateDesc);
    var today = sorted[0];
    var count = today.items ? today.items.length : 0;
    root.innerHTML =
      '<div class="ai-hot-summary-head">' +
        '<span class="ai-hot-summary-label">今日 AI 热点</span>' +
        '<span class="ai-hot-summary-date">' + escapeText(today.date) + "</span>" +
      "</div>" +
      '<p class="ai-hot-summary-overview">' + escapeText(today.overview || "") + "</p>" +
      '<div class="ai-hot-summary-foot">' +
        "<span>共 " + count + " 条 · 五个方向</span>" +
        '<a href="ai-hot.html" class="ai-hot-summary-link">查看全部 →</a>' +
      "</div>";
  }

  function failback(root, msg) {
    root.innerHTML = '<p class="ai-hot-empty">' + escapeText(msg) + "</p>";
  }

  function init() {
    var app = document.querySelector("[data-ai-hot-app]");
    var summary = document.querySelector("[data-ai-hot-summary]");
    if (!app && !summary) return;

    var data = getData();
    if (!data) {
      var msg = "热点数据加载失败，请稍后刷新页面再试。";
      if (app) failback(app, msg);
      if (summary) failback(summary, msg);
      if (window.console) console.warn("[ai-hot] data not found on window.__AI_HOT_DATA__");
      return;
    }
    if (app) renderApp(app, data);
    if (summary) renderSummary(summary, data);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
