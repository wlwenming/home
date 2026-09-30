(function () {
  "use strict";

  var repo = "wlwenming/home";
  var branch = "main";
  var latestPath = "assets/data/ai-hot-latest.js";
  var historyPath = "assets/data/ai-hot-history.js";
  var latest = window.AI_HOT_LATEST;
  var history = Array.isArray(window.AI_HOT_HISTORY) ? window.AI_HOT_HISTORY : [];
  var button = document.querySelector("[data-update-start]");
  var tokenInput = document.querySelector("#github-token");
  var status = document.querySelector("[data-update-status]");

  function setStatus(message) {
    status.textContent = message;
  }

  function validData(data) {
    return data && /^\d{4}-\d{2}-\d{2}$/.test(data.date) && data.overview &&
      Array.isArray(data.items) && data.items.length >= 5 && data.items.length <= 10 &&
      data.items.every(function (item) {
        return item.topic && item.progress && Array.isArray(item.refs) && item.refs.length > 0 &&
          item.refs.every(function (ref) {
            return ref.name && /^https?:\/\/[^\s]+$/.test(ref.url);
          });
      });
  }

  function uniqueUrls(data) {
    var urls = [];
    data.items.forEach(function (item) {
      item.refs.forEach(function (ref) {
        if (urls.indexOf(ref.url) === -1) urls.push(ref.url);
      });
    });
    return urls;
  }

  function probeSources(data) {
    if (!window.fetch) return Promise.resolve(false);
    return Promise.all(uniqueUrls(data).map(function (url) {
      return window.fetch(url, { method: "HEAD", mode: "no-cors", cache: "no-store" });
    })).then(function () {
      return true;
    }).catch(function () {
      return false;
    });
  }

  function encode(content) {
    var bytes = new TextEncoder().encode(content);
    var binary = "";
    bytes.forEach(function (byte) { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  function sourceFile(variable, data) {
    return "window." + variable + " = " + JSON.stringify(data, null, 2) + ";\n";
  }

  function download(name, content) {
    var blob = new Blob([content], { type: "text/javascript;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    window.setTimeout(function () {
      URL.revokeObjectURL(link.href);
    }, 1000);
  }

  function api(path, token, options) {
    var headers = {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + token,
      "X-GitHub-Api-Version": "2022-11-28"
    };
    var query = options && options.method === "PUT" ? "" : "?ref=" + branch;
    return fetch("https://api.github.com/repos/" + repo + "/contents/" + path + query, {
      method: options && options.method || "GET",
      headers: headers,
      body: options && options.body
    }).then(function (response) {
      return response.text().then(function (text) {
        var body = {};
        try {
          body = text ? JSON.parse(text) : {};
        } catch (error) {
          body = {};
        }
        if (!response.ok) {
          throw new Error("GitHub API " + response.status + (body.message ? ": " + body.message : ""));
        }
        return body;
      });
    });
  }

  function commitFile(path, content, message, token, sha) {
    return api(path, token, {
      method: "PUT",
      body: JSON.stringify({
        message: message,
        content: encode(content),
        branch: branch,
        sha: sha
      })
    });
  }

  function commitToGithub(nextLatest, nextHistory, token) {
    return Promise.all([
      api(latestPath, token),
      api(historyPath, token)
    ]).then(function (files) {
      return commitFile(historyPath, sourceFile("AI_HOT_HISTORY", nextHistory), "chore: archive AI hot data", token, files[1].sha)
        .then(function () {
          return commitFile(latestPath, sourceFile("AI_HOT_LATEST", nextLatest), "chore: update latest AI hot data", token, files[0].sha);
        });
    });
  }

  if (!button || !validData(latest)) return;
  button.addEventListener("click", function () {
    button.disabled = true;
    setStatus("正在探测来源并整理资讯……");
    var oldLatest = JSON.parse(JSON.stringify(latest));
    var nextHistory = [oldLatest].concat(history);
    probeSources(latest).then(function (reached) {
      var latestContent = sourceFile("AI_HOT_LATEST", latest);
      var historyContent = sourceFile("AI_HOT_HISTORY", nextHistory);
      download("ai-hot-latest.js", latestContent);
      download("ai-hot-history.js", historyContent);
      var token = tokenInput.value.trim();
      if (!token) {
        setStatus((reached ? "采集完成" : "来源探测受跨域限制") + "，已下载最新文件和历史文件；填写 Token 后可自动提交 GitHub。 ");
        button.disabled = false;
        return;
      }
      setStatus("文件已生成，正在提交 GitHub……");
      commitToGithub(latest, nextHistory, token).then(function () {
        tokenInput.value = "";
        setStatus("采集完成，最新数据已提交到 GitHub，旧数据已归档。");
        button.disabled = false;
      }).catch(function (error) {
        setStatus("本地文件已生成，但 GitHub 提交失败：" + error.message);
        button.disabled = false;
      });
    });
  });
})();