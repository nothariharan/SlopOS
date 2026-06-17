// grab the stuff we need
var welcomeWin = document.querySelector("#welcome");
var desktopOpen = document.querySelector("#welcomeDesktopOpen");
var feedbackOpen = document.getElementById("feedbackOpen");
var clockEl = document.querySelector("#timeElement");
var taskbarApps = document.getElementById("taskbarApps");
var taskbarH = 48;

// leftover from when we tried lucide icons lol
var iconToEmoji = {
  save: "💾",
  "message-square": "👄",
  "trash-2": "🗑️",
  bot: "🤖",
  laugh: "🐸",
  "file-text": "📄",
  cookie: "🍪",
  "link-2": "🔗"
};

function resolveEmoji(meta) {
  if (meta.emoji) return meta.emoji;
  if (meta.icon && iconToEmoji[meta.icon]) return iconToEmoji[meta.icon];
  return "📄";
}


function updateTime() {
  clockEl.textContent = new Date().toLocaleString();
}

updateTime();
setInterval(updateTime, 1000);



var cookieBox = document.getElementById("cookieBox");
var cookieYes = document.getElementById("cookieYes");
var cookieNo = document.getElementById("cookieNo");
var yesText = "yeah ofc";
var noHoverText = "no";

if (localStorage.getItem("sloposCookies") === "ok") {
  cookieBox.style.display = "none";
}

function hideCookieBox() {
  cookieBox.style.display = "none";
  localStorage.setItem("sloposCookies", "ok");
}

cookieYes.addEventListener("mouseenter", function() {
  cookieYes.textContent = noHoverText;
});

cookieYes.addEventListener("mouseleave", function() {
  cookieYes.textContent = yesText;
});

cookieYes.addEventListener("click", function() {
  hideCookieBox();
  spawnCookieIcon();
});

cookieNo.addEventListener("click", function() {
  hideCookieBox();
});


// yes on cookies spawns a cookie icon. click it it crumbles
function crumbleCookie(iconEl, meta) {
  if (iconEl.classList.contains("crumbing")) return;

  iconEl.classList.add("crumbing");

  setTimeout(function() {
    iconEl.remove();
    delete iconRegistry[meta.key];
    removeIconPos(meta.key);
  }, 700);
}

function spawnCookieIconAt(top, left) {
  var key = "cookie_" + Date.now();

  var meta = {
    key: key,
    kind: "cookie",
    label: "cookie.slop",
    emoji: "🍪",
    onTap: function() {
      var reg = iconRegistry[key];
      if (reg) crumbleCookie(reg.el, reg.meta);
    }
  };

  spawnIconElement(meta, top, left);
}

function spawnCookieIcon() {
  var top = 120 + Math.floor(Math.random() * 220);
  var left = 60 + Math.floor(Math.random() * Math.max(120, window.innerWidth - 160));
  spawnCookieIconAt(top, left);
}


// windows + taskbar
var managedWindows = {};
var activeWinId = null;

function getWinId(el) {
  return el.id;
}

function registerWindow(id, title) {
  managedWindows[id] = {
    el: document.getElementById(id),
    title: title,
    taskBtn: null,
    minimized: false,
    maximized: false,
    savedW: "",
    savedH: "",
    savedTop: "",
    savedLeft: ""
  };
}

function getTaskbarLabel(title) {
  if (Math.random() < 0.2 && title.indexOf("Welcome") !== -1) {
    return title.replace("Welcome", "Welcom");
  }
  return title;
}

function ensureTaskbarBtn(id) {
  var win = managedWindows[id];
  if (!win) return;

  if (win.taskBtn) {
    win.taskBtn.textContent = win.title;
    return;
  }

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "task-btn";
  btn.dataset.win = id;
  btn.textContent = getTaskbarLabel(win.title);

  btn.addEventListener("click", function() {
    if (win.minimized) {
      restoreWindow(win.el);
    } else {
      bringToFront(win.el);
      setActiveWin(id);
    }
  });

  win.taskBtn = btn;
  taskbarApps.appendChild(btn);
}

function removeTaskbarBtn(id) {
  var win = managedWindows[id];
  if (!win || !win.taskBtn) return;

  win.taskBtn.remove();
  win.taskBtn = null;
  win.minimized = false;
  win.maximized = false;

  if (activeWinId === id) {
    activeWinId = null;
  }
}

function setActiveWin(id) {
  activeWinId = id;

  Object.keys(managedWindows).forEach(function(wid) {
    var w = managedWindows[wid];
    if (!w.taskBtn) return;

    w.taskBtn.classList.remove("task-pressed");

    if (wid === id && !w.minimized) {
      w.taskBtn.classList.add("task-pressed");
    }
  });
}

function syncTaskbarState(id) {
  var win = managedWindows[id];
  if (!win || !win.taskBtn) return;

  if (win.minimized) {
    win.taskBtn.classList.add("task-active");
    win.taskBtn.classList.remove("task-pressed");
  } else {
    win.taskBtn.classList.remove("task-active");
  }
}

function closeWindow(el) {
  var id = getWinId(el);
  el.style.display = "none";
  el.classList.remove("win-maxed");
  removeTaskbarBtn(id);

  var win = managedWindows[id];
  if (win) {
    win.maximized = false;
  }
}

function openWindow(el, titleOverride) {
  var id = getWinId(el);
  var win = managedWindows[id];

  if (titleOverride && win) {
    win.title = titleOverride;
  }

  el.style.display = "flex";
  bringToFront(el);

  if (win) {
    win.minimized = false;
    syncTaskbarState(id);
  }

  ensureTaskbarBtn(id);
  setActiveWin(id);
}

function minimizeWindow(el) {
  var id = getWinId(el);
  var win = managedWindows[id];
  if (!win) return;

  el.style.display = "none";
  win.minimized = true;
  ensureTaskbarBtn(id);
  syncTaskbarState(id);

  if (activeWinId === id) {
    activeWinId = null;
  }
}

function restoreWindow(el) {
  var id = getWinId(el);
  var win = managedWindows[id];
  if (!win) return;

  el.style.display = "flex";
  win.minimized = false;
  bringToFront(el);
  syncTaskbarState(id);
  setActiveWin(id);
}

function maximizeWindow(el) {
  var id = getWinId(el);
  var win = managedWindows[id];
  if (!win) return;

  if (win.maximized) {
    el.style.width = win.savedW;
    el.style.height = win.savedH;
    el.style.top = win.savedTop;
    el.style.left = win.savedLeft;
    el.classList.remove("win-maxed");
    win.maximized = false;
    return;
  }

  win.savedW = el.style.width || "";
  win.savedH = el.style.height || "";
  win.savedTop = el.style.top || "";
  win.savedLeft = el.style.left || "";

  var w = el.offsetWidth;
  var h = el.offsetHeight;
  var top = parseInt(el.style.top, 10) || 80;
  var left = parseInt(el.style.left, 10) || 100;
  var jitterX = Math.floor(Math.random() * 40) - 20;
  var jitterY = Math.floor(Math.random() * 40) - 20;

  el.style.width = Math.round(w * 1.15) + "px";
  el.style.height = Math.round(h * 1.12) + "px";
  el.style.top = (top + jitterY) + "px";
  el.style.left = (left + jitterX) + "px";
  el.classList.add("win-maxed");
  win.maximized = true;
  bringToFront(el);
}

function bringToFront(el) {
  document.querySelectorAll(".window").forEach(function(w) {
    w.style.zIndex = "10";
  });
  el.style.zIndex = "20";
  setActiveWin(getWinId(el));
}

function wireWinControls() {
  document.querySelectorAll(".win-btn").forEach(function(btn) {
    btn.addEventListener("click", function(e) {
      e.stopPropagation();

      var id = btn.dataset.win;
      var win = managedWindows[id];
      if (!win) return;

      if (btn.classList.contains("win-close")) {
        closeWindow(win.el);
      } else if (btn.classList.contains("win-min")) {
        minimizeWindow(win.el);
      } else if (btn.classList.contains("win-max")) {
        maximizeWindow(win.el);
      }
    });
  });
}

registerWindow("welcome", "Welcome.slop");
registerWindow("feedback", "Feedback.slop");
registerWindow("paperWin", "feedback1");
wireWinControls();

openWindow(welcomeWin);


// drag code from w3schools, works fine dont touch
function dragElement(el) {
  var startX = 0;
  var startY = 0;
  var moveX = 0;
  var moveY = 0;

  var header = document.getElementById(el.id + "header");

  if (header) {
    header.onmousedown = dragStart;
  } else {
    el.onmousedown = dragStart;
  }

  function dragStart(e) {
    e = e || window.event;
    e.preventDefault();
    bringToFront(el);
    startX = e.clientX;
    startY = e.clientY;
    document.onmouseup = dragStop;
    document.onmousemove = dragMove;
  }

  function dragMove(e) {
    e = e || window.event;
    e.preventDefault();
    moveX = startX - e.clientX;
    moveY = startY - e.clientY;
    startX = e.clientX;
    startY = e.clientY;
    el.style.top = (el.offsetTop - moveY) + "px";
    el.style.left = (el.offsetLeft - moveX) + "px";
  }

  function dragStop() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

dragElement(document.getElementById("welcome"));
dragElement(document.getElementById("feedback"));

var paperWin = document.getElementById("paperWin");
var paperWinTitle = document.getElementById("paperWinTitle");
var paperWinText = document.getElementById("paperWinText");
var iconsContainer = document.getElementById("icons");

dragElement(paperWin);

// desktop icons drag delete spin wheel gamble

var rickrollUrl = "https://youtu.be/QDia3e12czc?si=0fxJ3dg8Y3aRXPEv";
var iconDragGap = 64;
var iconDragPad = 5;
var iconMenu = document.getElementById("iconMenu");
var iconMenuDelete = document.getElementById("iconMenuDelete");
var spinOverlay = document.getElementById("spinOverlay");
var spinWheel = document.getElementById("spinWheel");
var spinResult = document.getElementById("spinResult");
var iconRegistry = {};
var selectedIconMeta = null;
var selectedIconEl = null;
var spinBusy = false;
var wheelRotation = 0;

function goRickroll() {
  window.location.href = rickrollUrl;
}

function getHiddenIcons() {
  return JSON.parse(localStorage.getItem("sloposHiddenIcons") || "[]");
}

function getExtraIcons() {
  return JSON.parse(localStorage.getItem("sloposExtraIcons") || "[]");
}

function saveExtraIcons(extras) {
  localStorage.setItem("sloposExtraIcons", JSON.stringify(extras));
}

function saveIconPosByKey(key, iconEl) {
  var positions = JSON.parse(localStorage.getItem("sloposIconPos") || "{}");
  positions[key] = {
    top: iconEl.style.top,
    left: iconEl.style.left
  };
  localStorage.setItem("sloposIconPos", JSON.stringify(positions));
}

function removeIconPos(key) {
  var positions = JSON.parse(localStorage.getItem("sloposIconPos") || "{}");
  delete positions[key];
  localStorage.setItem("sloposIconPos", JSON.stringify(positions));
}

function loadIconPosByKey(iconEl, key, top, left) {
  var positions = JSON.parse(localStorage.getItem("sloposIconPos") || "{}");
  if (positions[key]) {
    iconEl.style.top = positions[key].top;
    iconEl.style.left = positions[key].left;
  } else {
    iconEl.style.top = top + "px";
    iconEl.style.left = left + "px";
  }
}

function clampIconPos(iconEl) {
  var pad = 10;
  var topMin = 10;
  var maxX = window.innerWidth - iconEl.offsetWidth - pad;
  var maxY = window.innerHeight - iconEl.offsetHeight - pad - taskbarH;
  var x = parseInt(iconEl.style.left, 10) || 0;
  var y = parseInt(iconEl.style.top, 10) || 0;

  if (x < pad) x = pad;
  if (y < topMin) y = topMin;
  if (x > maxX) x = maxX;
  if (y > maxY) y = maxY;

  iconEl.style.left = x + "px";
  iconEl.style.top = y + "px";
}

function tapForSource(sourceKey) {
  if (sourceKey === "welcomeDesktopOpen") {
    return function() {
      openWindow(welcomeWin);
    };
  }
  if (sourceKey === "feedbackOpen") {
    return function() {
      openWindow(feedbackWin);
    };
  }
  return goRickroll;
}

function dragDesktopIcon(iconEl, meta) {
  var startX = 0;
  var startY = 0;
  var startLeft = 0;
  var startTop = 0;
  var didDrag = false;

  iconEl.addEventListener("mousedown", function(e) {
    if (e.button !== 0) return;

    e.preventDefault();
    hideIconMenu();
    didDrag = false;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseInt(iconEl.style.left, 10) || 0;
    startTop = parseInt(iconEl.style.top, 10) || 0;

    function onMove(ev) {
      var dx = ev.clientX - startX;
      var dy = ev.clientY - startY;

      if (Math.abs(dx) > iconDragPad || Math.abs(dy) > iconDragPad) {
        didDrag = true;
      }

      iconEl.style.left = (startLeft + dx) + "px";
      iconEl.style.top = (startTop + dy) + "px";
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      clampIconPos(iconEl);
      saveIconPosByKey(meta.key, iconEl);

      if (meta.kind === "extra") {
        var extras = getExtraIcons();
        extras.forEach(function(ex) {
          if (ex.key === meta.key) {
            ex.top = iconEl.style.top;
            ex.left = iconEl.style.left;
          }
        });
        saveExtraIcons(extras);
      }

      if (!didDrag && meta.onTap) {
        meta.onTap();
      }
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
}

function attachIconContextMenu(iconEl, meta) {
  iconEl.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    selectedIconEl = iconEl;
    selectedIconMeta = meta;
    iconMenu.style.display = "block";
    iconMenu.style.left = e.clientX + "px";
    iconMenu.style.top = e.clientY + "px";
  });
}

function hideIconMenu() {
  iconMenu.style.display = "none";
  selectedIconEl = null;
  selectedIconMeta = null;
}

function registerDesktopIcon(iconEl, meta, top, left) {
  iconEl.dataset.iconKey = meta.key;
  iconRegistry[meta.key] = { el: iconEl, meta: meta };
  loadIconPosByKey(iconEl, meta.key, top, left);
  clampIconPos(iconEl);
  dragDesktopIcon(iconEl, meta);
  attachIconContextMenu(iconEl, meta);
}

function spawnIconElement(meta, top, left) {
  var icon = document.createElement("div");
  icon.className = "icon";

  if (meta.kind === "decoy") {
    icon.classList.add("decoy-icon");
  }
  if (meta.kind === "feedbackFile") {
    icon.classList.add("feedback-file-icon");
    icon.dataset.feedbackName = meta.file.name;
  }
  if (meta.kind === "cookie") {
    icon.classList.add("cookie-icon");
  }

  icon.innerHTML =
    '<div class="icon-box">' +
    '<div class="icon-img">' + resolveEmoji(meta) + "</div>" +
    '<p class="icon-text">' + meta.label + "</p>" +
    "</div>";

  iconsContainer.appendChild(icon);
  registerDesktopIcon(icon, meta, top, left);
  return icon;
}

function deleteIcon(iconEl, meta) {
  var key = meta.key;

  iconEl.remove();
  delete iconRegistry[key];
  removeIconPos(key);

  if (meta.kind === "feedbackFile" && meta.file) {
    var files = getFeedbackFiles().filter(function(f) {
      return f.name !== meta.file.name;
    });
    saveFeedbackFiles(files);
  } else if (meta.kind === "extra") {
    var extras = getExtraIcons().filter(function(ex) {
      return ex.key !== key;
    });
    saveExtraIcons(extras);
  } else if (meta.kind === "cookie") {
    // bye cookie
  } else {
    var hidden = getHiddenIcons();
    if (hidden.indexOf(key) === -1) {
      hidden.push(key);
      localStorage.setItem("sloposHiddenIcons", JSON.stringify(hidden));
    }
  }
}

function duplicateIcon(iconEl, meta) {
  var left = parseInt(iconEl.style.left, 10) || 20;
  var top = parseInt(iconEl.style.top, 10) || 70;
  var newLeft = left + 40;
  var newTop = top + 40;

  if (meta.kind === "feedbackFile" && meta.file) {
    var files = getFeedbackFiles();
    var copy = {
      name: getNextFeedbackName(files),
      text: meta.file.text
    };
    files.push(copy);
    saveFeedbackFiles(files);

    var copyMeta = {
      key: copy.name,
      kind: "feedbackFile",
      label: copy.name,
      emoji: "📄",
      file: copy,
      onTap: function() {
        openFeedbackPaper(copy.name, copy.text);
      }
    };
    spawnIconElement(copyMeta, newTop, newLeft);
    return;
  }

  if (meta.kind === "cookie") {
    spawnCookieIconAt(newTop, newLeft);
    return;
  }

  var newKey = meta.key + "_dup_" + Date.now();
  var sourceKey = meta.sourceKey || meta.key;
  var extraMeta = {
    key: newKey,
    kind: "extra",
    sourceKey: sourceKey,
    builtinKind: meta.kind === "extra" ? meta.builtinKind : meta.kind,
    label: meta.label,
    emoji: resolveEmoji(meta),
    onTap: tapForSource(sourceKey)
  };

  var extras = getExtraIcons();
  extras.push({
    key: newKey,
    sourceKey: sourceKey,
    builtinKind: extraMeta.builtinKind,
    label: meta.label,
    emoji: extraMeta.emoji,
    top: newTop + "px",
    left: newLeft + "px"
  });
  saveExtraIcons(extras);
  spawnIconElement(extraMeta, newTop, newLeft);
}

function startDeleteSpin(iconEl, meta) {
  if (spinBusy) return;
  spinBusy = true;

  spinOverlay.style.display = "flex";
  spinResult.textContent = "spinning...";
  spinWheel.style.transition = "none";
  spinWheel.style.transform = "rotate(" + wheelRotation + "deg)";

  var result = Math.random() < 0.5 ? "yes" : "no";
  var spins = (4 + Math.floor(Math.random() * 3)) * 360;
  var jitter = Math.floor(Math.random() * 40) - 20;
  var targetHalf = result === "yes" ? 0 : 180;
  wheelRotation = wheelRotation + spins + targetHalf + jitter;

  setTimeout(function() {
    spinWheel.style.transition = "transform 2.5s cubic-bezier(0.2, 0.8, 0.2, 1)";
    spinWheel.style.transform = "rotate(" + wheelRotation + "deg)";
  }, 50);

  var spinDone = false;

  function finishSpin() {
    if (spinDone) return;
    spinDone = true;

    if (result === "yes") {
      spinResult.textContent = "yes — deleted lol";
      deleteIcon(iconEl, meta);
    } else {
      spinResult.textContent = "no — duplicated instead hehe";
      duplicateIcon(iconEl, meta);
    }

    setTimeout(function() {
      spinOverlay.style.display = "none";
      spinResult.textContent = "";
      spinBusy = false;
    }, 1400);
  }

  spinWheel.addEventListener("transitionend", function onSpinDone(e) {
    if (e.propertyName !== "transform") return;
    spinWheel.removeEventListener("transitionend", onSpinDone);
    finishSpin();
  });

  setTimeout(finishSpin, 2700);
}

iconMenuDelete.addEventListener("click", function() {
  if (!selectedIconEl || !selectedIconMeta) return;
  var iconEl = selectedIconEl;
  var meta = selectedIconMeta;
  hideIconMenu();
  startDeleteSpin(iconEl, meta);
});

document.addEventListener("click", function(e) {
  if (!iconMenu.contains(e.target)) {
    hideIconMenu();
  }
  if (desktopMenu && !desktopMenu.contains(e.target)) {
    hideDesktopMenu();
  }
  if (startMenu && !startMenu.contains(e.target) && e.target !== startBtn) {
    hideStartMenu();
  }
});

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    hideIconMenu();
    hideDesktopMenu();
    hideStartMenu();
  }
});

function setupBuiltInIcons() {
  var startTop = 70;
  var startLeft = 20;
  var hidden = getHiddenIcons();

  if (hidden.indexOf("welcomeDesktopOpen") === -1) {
    registerDesktopIcon(desktopOpen, {
      key: "welcomeDesktopOpen",
      kind: "builtin",
      label: "Welcome.slop",
      emoji: "💾",
      onTap: function() {
        openWindow(welcomeWin);
      }
    }, startTop, startLeft);
  } else {
    desktopOpen.remove();
  }

  if (hidden.indexOf("feedbackOpen") === -1) {
    registerDesktopIcon(feedbackOpen, {
      key: "feedbackOpen",
      kind: "builtin",
      label: "Feedback.slop",
      emoji: "👄",
      onTap: function() {
        openWindow(feedbackWin);
      }
    }, startTop + iconDragGap, startLeft);
  } else {
    feedbackOpen.remove();
  }

  var decoyList = [
    { el: document.getElementById("trashOpen"), key: "trashOpen", label: "Trash.slop", emoji: "🗑️" },
    { el: document.getElementById("aiOpen"), key: "aiOpen", label: "AI.exe", emoji: "🤖" },
    { el: document.getElementById("memesOpen"), key: "memesOpen", label: "Memes.dll", emoji: "🐸" }
  ];

  decoyList.forEach(function(d, i) {
    if (hidden.indexOf(d.key) !== -1) {
      d.el.remove();
      return;
    }
    registerDesktopIcon(d.el, {
      key: d.key,
      kind: "decoy",
      label: d.label,
      emoji: d.emoji,
      onTap: goRickroll
    }, startTop + iconDragGap * (i + 2), startLeft);
  });
}

function loadExtraIcons() {
  var extras = getExtraIcons();
  extras.forEach(function(ex) {
    var top = parseInt(ex.top, 10) || 200;
    var left = parseInt(ex.left, 10) || 60;
    spawnIconElement({
      key: ex.key,
      kind: "extra",
      sourceKey: ex.sourceKey,
      builtinKind: ex.builtinKind,
      label: ex.label,
      emoji: resolveEmoji(ex),
      onTap: tapForSource(ex.sourceKey)
    }, top, left);
  });
}

var feedbackWin = document.getElementById("feedback");

setupBuiltInIcons();
loadExtraIcons();


// name entry slider bar thing

var caps = "ABCDEFGHIJKLMNOPQRSTUVWXYZ ";
var nums = "0123456789";
var letters = caps;
var usingNumbers = false;

var typedName = "";
var maxLen = 14;

var letterBar = document.getElementById("letterBar");
var letterPreview = document.getElementById("letterPreview");
var charsetBtn = document.getElementById("charsetBtn");
var sliderStart = document.getElementById("sliderStart");
var sliderMid = document.getElementById("sliderMid");
var sliderEnd = document.getElementById("sliderEnd");
var nameSoFar = document.getElementById("nameSoFar");
var addBtn = document.getElementById("addLetterBtn");
var undoBtn = document.getElementById("undoLetterBtn");
var bootBtn = document.getElementById("bootBtn");
var entryBox = document.getElementById("nameEntryBit");
var doneBox = document.getElementById("nameDoneBit");
var finalName = document.getElementById("finalNameShow");

function showLetterPreview() {
  var i = parseInt(letterBar.value);
  var ch = letters.charAt(i);

  if (ch === " ") {
    letterPreview.textContent = "space";
    letterPreview.className = "letter-big space";
  } else {
    letterPreview.textContent = ch;
    letterPreview.className = "letter-big";
  }
}

function switchToCaps() {
  letters = caps;
  usingNumbers = false;
  letterBar.max = caps.length - 1;
  letterBar.value = 0;
  charsetBtn.textContent = "lower case";
  sliderStart.textContent = "A";
  sliderMid.textContent = "space";
  sliderEnd.textContent = "Z";
  showLetterPreview();
}

function switchToNumbers() {
  letters = nums;
  usingNumbers = true;
  letterBar.max = nums.length - 1;
  letterBar.value = 0;
  charsetBtn.textContent = "numbers";
  sliderStart.textContent = "0";
  sliderMid.textContent = "5";
  sliderEnd.textContent = "9";
  showLetterPreview();
}

charsetBtn.addEventListener("click", function() {
  if (usingNumbers) {
    switchToCaps();
  } else {
    switchToNumbers();
  }
});

letterBar.addEventListener("input", showLetterPreview);

addBtn.addEventListener("click", function() {
  if (typedName.length >= maxLen) return;

  var i = parseInt(letterBar.value);
  typedName += letters.charAt(i);

  nameSoFar.textContent = typedName.trim().length === 0 ? "_" : typedName;
  bootBtn.disabled = typedName.trim().length === 0;
});

undoBtn.addEventListener("click", function() {
  if (typedName.length === 0) return;

  typedName = typedName.slice(0, -1);
  nameSoFar.textContent = typedName.length === 0 ? "_" : typedName;
  bootBtn.disabled = typedName.trim().length === 0;
});

bootBtn.addEventListener("click", function() {
  var name = typedName.trim();
  if (name.length === 0) return;

  finalName.textContent = name;
  entryBox.style.display = "none";
  doneBox.style.display = "block";

  localStorage.setItem("sloposUser", name);
});


// change bg button. fake. click 5 times suffer

var changeBgBtn = document.getElementById("changeBgBtn");
var bgErrOverlay = document.getElementById("bgErrOverlay");
var errBox = document.getElementById("errBox");
var errMsg = document.getElementById("errMsg");
var errOkBtn = document.getElementById("errOkBtn");
var errCloseX = document.getElementById("errCloseX");

var bgClicks = 0;
var bgErrShown = false;
var errJumps = 0;
var errCanClose = false;
var errMsgNormal = "bro enough it doesnt work 🥀";

function centerErrBox() {
  var x = (window.innerWidth - errBox.offsetWidth) / 2;
  var y = (window.innerHeight - errBox.offsetHeight) / 2;
  errBox.style.left = x + "px";
  errBox.style.top = y + "px";
}

function jumpErrBox() {
  var pad = 20;
  var maxX = window.innerWidth - errBox.offsetWidth - pad;
  var maxY = window.innerHeight - errBox.offsetHeight - pad;

  var x = pad + Math.random() * (maxX - pad);
  var y = pad + Math.random() * (maxY - pad);

  errBox.style.left = x + "px";
  errBox.style.top = y + "px";
}

function resetErrBox() {
  errJumps = 0;
  errCanClose = false;
  errMsg.textContent = errMsgNormal;
}

function showBgError() {
  if (bgErrShown) return;
  bgErrShown = true;
  resetErrBox();
  bgErrOverlay.style.display = "block";
  centerErrBox();
}

function hideBgError() {
  bgErrOverlay.style.display = "none";
  bgErrShown = false;
  bgClicks = 0;
  resetErrBox();
}

changeBgBtn.addEventListener("click", function() {
  if (bgErrShown) return;

  bgClicks++;

  if (bgClicks >= 5) {
    showBgError();
  }
});

// ok btn runs away on hover lol
errOkBtn.addEventListener("mouseenter", function() {
  if (errCanClose) return;

  errJumps++;
  jumpErrBox();

  if (errJumps >= 10) {
    errCanClose = true;
    errMsg.textContent = "ok fine hehehee";
  }
});

errOkBtn.addEventListener("click", function() {
  if (!errCanClose) return;
  hideBgError();
});

errCloseX.addEventListener("click", function() {
  if (!errCanClose) return;
  hideBgError();
});


// feedback mouth

var mouth = document.getElementById("mouth");
var mouthHole = document.getElementById("mouthHole");
var mouthHint = document.getElementById("mouthHint");
var feedbackText = document.getElementById("feedbackText");
var feedBtn = document.getElementById("feedBtn");
var feedDone = document.getElementById("feedDone");
var mouthNameBubble = document.getElementById("mouthNameBubble");
var mouthNameInput = document.getElementById("mouthNameInput");
var mouthNameSave = document.getElementById("mouthNameSave");

var mouthOpen = false;
var isChewing = false;
var isNaming = false;
var pendingFeedbackText = "";
var jumpTimer = null;

function startMouthJump() {
  jumpTimer = setInterval(function() {
    var x = Math.floor(Math.random() * 50) - 25;
    var y = Math.floor(Math.random() * 50) - 25;
    mouth.style.transform = "translate(" + x + "px, " + y + "px)";
  }, 70);
}

function stopMouthJump() {
  clearInterval(jumpTimer);
  mouth.style.transform = "";
}

mouthHole.addEventListener("click", function(e) {
  if (isChewing || isNaming) return;
  if (mouthOpen) return;

  mouthOpen = true;
  mouth.classList.add("open");
  feedBtn.style.display = "block";
  feedbackText.focus();
});

// stop textarea click opening mouth again
feedbackText.addEventListener("click", function(e) {
  e.stopPropagation();
});

// chew then ask what to name the food
feedBtn.addEventListener("click", function() {
  var text = feedbackText.value.trim();
  if (text.length === 0 || isChewing || isNaming) return;

  isChewing = true;
  feedBtn.style.display = "none";
  feedbackText.style.display = "none";
  mouth.classList.add("chewing");
  startMouthJump();

  setTimeout(function() {
    stopMouthJump();
    mouth.classList.remove("chewing");
    mouth.classList.remove("open");
    pendingFeedbackText = text;
    isChewing = false;
    isNaming = true;
    mouthNameBubble.style.display = "block";
    mouthNameInput.value = "";
    mouthNameInput.focus();
  }, 1800);
});

function resetMouthForm() {
  mouthNameBubble.style.display = "none";
  mouthNameInput.value = "";
  pendingFeedbackText = "";
  isNaming = false;
  isChewing = false;
  mouthOpen = false;
  feedbackText.value = "";
  feedbackText.style.display = "";
  feedBtn.style.display = "none";
  mouthHint.style.display = "block";
}

function saveFoodName() {
  if (!isNaming || pendingFeedbackText.length === 0) return;

  var name = mouthNameInput.value.trim();
  addFeedbackToDesktop(pendingFeedbackText, name);
  resetMouthForm();
}

mouthNameSave.addEventListener("click", saveFoodName);

mouthNameInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    saveFoodName();
  }
});

mouthNameInput.addEventListener("click", function(e) {
  e.stopPropagation();
});


// feedback files on desktop

function getFeedbackFiles() {
  var raw = localStorage.getItem("sloposFeedbackFiles");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveFeedbackFiles(files) {
  localStorage.setItem("sloposFeedbackFiles", JSON.stringify(files));
}

function getNextFeedbackName(files) {
  return "feedback" + (files.length + 1);
}

function openFeedbackPaper(name, text) {
  paperWinTitle.textContent = name;
  paperWinText.textContent = text;
  openWindow(paperWin, name);
}

function createFeedbackIcon(file, index) {
  var meta = {
    key: file.name,
    kind: "feedbackFile",
    label: file.name,
    emoji: "📄",
    file: file,
    onTap: function() {
      openFeedbackPaper(file.name, file.text);
    }
  };
  spawnIconElement(meta, 70 + iconDragGap * (5 + index), 20);
}

function makeUniqueFeedbackName(wanted, files) {
  var base = wanted.trim();
  if (base.length === 0) {
    return getNextFeedbackName(files);
  }

  base = base.slice(0, 24).replace(/[<>:"/\\|?*]/g, "");
  if (base.length === 0) {
    return getNextFeedbackName(files);
  }

  var name = base;
  var n = 2;
  while (files.some(function(f) {
    return f.name === name;
  })) {
    name = base + n;
    n++;
  }

  return name;
}

function addFeedbackToDesktop(text, customName) {
  var files = getFeedbackFiles();
  var file = {
    name: makeUniqueFeedbackName(customName || "", files),
    text: text
  };

  files.push(file);
  saveFeedbackFiles(files);
  createFeedbackIcon(file, files.length - 1);
}

function loadFeedbackIcons() {
  var files = getFeedbackFiles();
  files.forEach(function(file, i) {
    createFeedbackIcon(file, i);
  });
}

function migrateOldFeedback() {
  var oldText = localStorage.getItem("sloposFeedback");
  if (!oldText) return;
  if (getFeedbackFiles().length > 0) return;

  addFeedbackToDesktop(oldText);
  localStorage.removeItem("sloposFeedback");
}


// slop clippy. looks smart. is not

var clippyBox = document.getElementById("clippyBox");
var clippyMsg = document.getElementById("clippyMsg");
var clippyAsk = document.getElementById("clippyAsk");
var clippyInput = document.getElementById("clippyInput");
var clippyBtn = document.getElementById("clippyBtn");
var clippyImg = document.getElementById("clippyImg");

var clippyFrames = [
  "images/frames/c1.png",
  "images/frames/c2.png",
  "images/frames/c3.png",
  "images/frames/c4.png",
  "images/frames/c5.png"
];
var clippyGreeting = "yo any doubt? ask me fam!";
var clippyTips = [
  "it looks like youre failing. want help failing faster?",
  "nice desktop layout. very unemployed of you",
  "writing feedback?? bold for someone who cant change the background",
  "pro tip: clicking stuff usually does something. usually.",
  "i noticed you havent rickrolled yourself yet. want help?"
];
var clippyCompliments = [
  "wow what a question. still idk lol",
  "youre so smart bestie. anyway no clue",
  "love the confidence. zero answers tho hehe",
  "great ask fam. my brain left the chat tho",
  "so thoughtful of you. idk lol"
];
var clippyFrameMs = 1000;
var clippyHideMs = 180000;
var clippyThinking = false;
var clippyShowingTip = false;
var clippyFrameTimer = null;
var clippyHideTimer = null;
var clippyTipTimer = null;
var clippyFrameIndex = 0;

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resetClippyBubble() {
  clippyMsg.textContent = clippyGreeting;
  clippyAsk.style.display = "flex";
  clippyShowingTip = false;
}

function showClippyTip() {
  if (clippyThinking || clippyBox.classList.contains("hidden") || clippyShowingTip) return;

  clippyShowingTip = true;
  clippyAsk.style.display = "none";
  clippyMsg.textContent = pickRandom(clippyTips);

  setTimeout(function() {
    if (clippyThinking || clippyBox.classList.contains("hidden")) {
      clippyShowingTip = false;
      return;
    }
    resetClippyBubble();
  }, 5500);
}

function scheduleClippyTip() {
  var wait = 22000 + Math.floor(Math.random() * 28000);

  clippyTipTimer = setTimeout(function() {
    showClippyTip();
    scheduleClippyTip();
  }, wait);
}

function startClippyFrames() {
  if (clippyFrameTimer) return;

  clippyFrameTimer = setInterval(function() {
    if (clippyThinking || clippyBox.classList.contains("hidden")) return;

    clippyFrameIndex = (clippyFrameIndex + 1) % clippyFrames.length;
    clippyImg.src = clippyFrames[clippyFrameIndex];
  }, clippyFrameMs);
}

function stopClippyFrames() {
  clearInterval(clippyFrameTimer);
  clippyFrameTimer = null;
}

function showClippyAgain() {
  clippyBox.classList.remove("hidden");
  clippyShowingTip = false;
  clippyMsg.textContent = clippyGreeting;
  clippyAsk.style.display = "flex";
  clippyInput.value = "";
  clippyThinking = false;
  clippyFrameIndex = 0;
  clippyImg.src = clippyFrames[0];
  startClippyFrames();
}

function askClippy() {
  if (clippyThinking) return;
  if (clippyInput.value.trim().length === 0) return;

  clippyThinking = true;
  clippyShowingTip = false;
  stopClippyFrames();
  clippyAsk.style.display = "none";

  clippyMsg.textContent = "uhhh";

  setTimeout(function() {
    clippyMsg.textContent = "hummhmmm";
  }, 1200);

  setTimeout(function() {
    clippyMsg.textContent = pickRandom(clippyCompliments);
  }, 2400);

  setTimeout(function() {
    clippyBox.classList.add("hidden");
    clippyHideTimer = setTimeout(showClippyAgain, clippyHideMs);
  }, 3600);
}

clippyBtn.addEventListener("click", askClippy);

clippyInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    askClippy();
  }
});

startClippyFrames();
scheduleClippyTip();


// taskbar start menu tray desktop menu

var startBtn = document.getElementById("startBtn");
var startMenu = document.getElementById("startMenu");
var startMenuList = document.getElementById("startMenuList");
var desktopMenu = document.getElementById("desktopMenu");
var deskRefresh = document.getElementById("deskRefresh");
var deskNewShortcut = document.getElementById("deskNewShortcut");
var deskSort = document.getElementById("deskSort");
var trayWifi = document.getElementById("trayWifi");
var trayBattery = document.getElementById("trayBattery");

function hideStartMenu() {
  if (!startMenu) return;
  startMenu.style.display = "none";
  startBtn.classList.remove("start-open");
}

function showStartMenu() {
  shuffleStartMenu();
  startMenu.style.display = "block";
  startBtn.classList.add("start-open");
}

function toggleStartMenu() {
  if (startMenu.style.display === "block") {
    hideStartMenu();
  } else {
    showStartMenu();
  }
}

function shuffleStartMenu() {
  var items = Array.prototype.slice.call(startMenuList.children);
  items.sort(function() {
    return Math.random() - 0.5;
  });
  items.forEach(function(item) {
    startMenuList.appendChild(item);
  });
}

function hideDesktopMenu() {
  if (!desktopMenu) return;
  desktopMenu.style.display = "none";
}

function scatterDesktopIcons() {
  Object.keys(iconRegistry).forEach(function(key) {
    var reg = iconRegistry[key];
    var iconEl = reg.el;
    var meta = reg.meta;
    var top = 20 + Math.floor(Math.random() * Math.max(80, window.innerHeight - taskbarH - 120));
    var left = 20 + Math.floor(Math.random() * Math.max(80, window.innerWidth - 100));

    iconEl.style.top = top + "px";
    iconEl.style.left = left + "px";
    clampIconPos(iconEl);
    saveIconPosByKey(meta.key, iconEl);

    if (meta.kind === "extra") {
      var extras = getExtraIcons();
      extras.forEach(function(ex) {
        if (ex.key === meta.key) {
          ex.top = iconEl.style.top;
          ex.left = iconEl.style.left;
        }
      });
      saveExtraIcons(extras);
    }
  });
}

function spawnShortcutIcon() {
  var key = "shortcut_" + Date.now();
  var top = 100 + Math.floor(Math.random() * 180);
  var left = 80 + Math.floor(Math.random() * Math.max(100, window.innerWidth - 180));

  spawnIconElement({
    key: key,
    kind: "extra",
    sourceKey: "aiOpen",
    label: "Shortcut_to_nowhere.slop",
    emoji: "🔗",
    onTap: goRickroll
  }, top, left);

  var extras = getExtraIcons();
  extras.push({
    key: key,
    sourceKey: "aiOpen",
    label: "Shortcut_to_nowhere.slop",
    emoji: "🔗",
    top: top + "px",
    left: left + "px"
  });
  saveExtraIcons(extras);
}

startBtn.addEventListener("click", function(e) {
  e.stopPropagation();
  toggleStartMenu();
});

startMenuList.addEventListener("click", function(e) {
  var btn = e.target.closest(".start-item");
  if (!btn) return;

  var app = btn.dataset.app;
  hideStartMenu();

  if (app === "welcome") {
    openWindow(welcomeWin);
  } else if (app === "feedback") {
    openWindow(feedbackWin);
  } else if (app === "trash" || app === "ai" || app === "memes") {
    goRickroll();
  } else if (app === "updates") {
    alert("no updates lol u already have peak slop");
  }
});

document.addEventListener("contextmenu", function(e) {
  if (e.target.closest(".icon")) return;
  if (e.target.closest(".window")) return;
  if (e.target.closest(".taskbar")) return;
  if (e.target.closest(".start-menu")) return;

  e.preventDefault();
  hideIconMenu();
  desktopMenu.style.display = "block";
  desktopMenu.style.left = e.clientX + "px";
  desktopMenu.style.top = e.clientY + "px";
});

deskRefresh.addEventListener("click", function() {
  hideDesktopMenu();
  scatterDesktopIcons();
});

deskNewShortcut.addEventListener("click", function() {
  hideDesktopMenu();
  spawnShortcutIcon();
});

deskSort.addEventListener("click", function() {
  hideDesktopMenu();
  scatterDesktopIcons();
});

trayWifi.addEventListener("click", function() {
  alert("connected to SlopFi_5G. trust.");
});

trayBattery.addEventListener("click", function() {
  alert("3% — good luck");
});

migrateOldFeedback();
loadFeedbackIcons();

