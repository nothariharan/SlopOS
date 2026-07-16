// grab the stuff we need
var welcomeWin = document.querySelector("#welcome");
var desktopOpen = document.querySelector("#welcomeDesktopOpen");
var feedbackOpen = document.getElementById("feedbackOpen");
var clockEl = document.querySelector("#timeElement");
var taskbarApps = document.getElementById("taskbarApps");
var taskbar = document.getElementById("taskbar");
var taskbarH = 48;
var slopsweeperWin = document.getElementById("slopsweeper");
var organizeIconsBtn = document.getElementById("organizeIconsBtn");
var sloppypaintWin = document.getElementById("sloppypaint");
var memesWin = document.getElementById("memesWin");

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
    } else if (activeWinId === id) {
      minimizeWindow(win.el);
    } else {
      restoreWindow(win.el);
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

  // stop game timer if they close the game, save CPU for more slop
  if (id === "slopsweeper") {
    clearInterval(slopsweeperTimer);
    slopsweeperTimer = null;
  }

  // stop gravity drip timer on close
  if (id === "sloppypaint") {
    clearInterval(slopPaintDripTimer);
    slopPaintDripTimer = null;
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

  // nuke the glitch trail if we had one. clean up our slop.
  document.querySelectorAll(".glitch-trail-" + id).forEach(function(trailEl) {
    trailEl.remove();
  });
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

var maximizeCount = 0;

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

  // increment maximize counter and trigger BSOD if they spam it
  maximizeCount++;
  if (maximizeCount >= 4) {
    triggerBSOD("ERROR_WINDOW_STRETCH_OVERFLOW");
    maximizeCount = 0;
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
registerWindow("slopsweeper", "Slopsweeper.exe");
registerWindow("sloppypaint", "SlopPaint.exe");
registerWindow("memesWin", "Memes.dll");
registerWindow("terminalWin", "command.com");
registerWindow("myComputerWin", "My Computer");
registerWindow("explorerWin", "Exploring - C:\\");
registerWindow("notepadWin", "Untitled - Notepad");
registerWindow("calcWin", "Calculator");
registerWindow("recycleBinWin", "Recycle Bin");
registerWindow("controlPanelWin", "Control Panel");
registerWindow("taskMgrWin", "Slop Task Manager");
wireWinControls();

openWindow(welcomeWin);


// drag code from w3schools, works fine dont touch
function dragElement(el) {
  var startX = 0;
  var startY = 0;
  var moveX = 0;
  var moveY = 0;
  var isGlitching = false;

  var header = document.getElementById(el.id + "header");

  if (header) {
    header.onmousedown = dragStart;
  } else {
    el.onmousedown = dragStart;
  }

  function dragStart(e) {
    e = e || window.event;
    
    // If clicking a window button, don't initiate dragging
    if (e.target.closest('.win-btn')) {
      return;
    }
    
    e.preventDefault();
    bringToFront(el);
    startX = e.clientX;
    startY = e.clientY;
    document.onmouseup = dragStop;
    document.onmousemove = dragMove;
    // 10% chance to go full brainrot and leave a permanent window trail
    isGlitching = Math.random() < 0.1;
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
    
    if (isGlitching) {
      // spawn infinite clones because we can
      var clone = el.cloneNode(true);
      clone.removeAttribute("id"); // no id collisions for us
      clone.style.zIndex = parseInt(el.style.zIndex || 10) - 1; // tuck it slightly behind
      clone.classList.add("glitch-trail-" + el.id); // tag it so we can nuke it later on minimize
      document.body.appendChild(clone);
    }
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
dragElement(document.getElementById("slopsweeper"));
dragElement(document.getElementById("sloppypaint"));
dragElement(document.getElementById("memesWin"));
dragElement(document.getElementById("terminalWin"));
dragElement(document.getElementById("myComputerWin"));
dragElement(document.getElementById("explorerWin"));
dragElement(document.getElementById("notepadWin"));
dragElement(document.getElementById("calcWin"));
dragElement(document.getElementById("recycleBinWin"));
dragElement(document.getElementById("controlPanelWin"));
dragElement(document.getElementById("taskMgrWin"));

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
  if (sourceKey === "slopsweeperOpen") {
    return function() {
      openWindow(slopsweeperWin);
      initSlopsweeper();
    };
  }
  if (sourceKey === "sloppypaintOpen") {
    return function() {
      openWindow(sloppypaintWin);
      initSlopPaint();
    };
  }
  if (sourceKey === "memesOpen") {
    return function() {
      openWindow(memesWin);
      initMemes();
    };
  }
  if (sourceKey === "terminalOpen") {
    return function() {
      openWindow(terminalWin);
      initTerminal();
    };
  }
  if (sourceKey === "myComputerOpen") {
    return function() {
      openMyComputer();
    };
  }
  if (sourceKey === "recycleBinOpen") {
    return function() {
      openRecycleBin();
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
      addToRecycleBin(meta);
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
    hideRunDialog();
    hideShutdownDialog();
  }
  // win+r opens run dialog. classic windows muscle memory
  if (e.key === "r" && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    showRunDialog();
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
    { el: document.getElementById("aiOpen"), key: "aiOpen", label: "AI.exe", emoji: "🤖" }
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

  var memesOpen = document.getElementById("memesOpen");
  if (hidden.indexOf("memesOpen") === -1) {
    registerDesktopIcon(memesOpen, {
      key: "memesOpen",
      kind: "builtin",
      label: "Memes.dll",
      emoji: "🐸",
      onTap: function() {
        openWindow(memesWin);
        initMemes();
      }
    }, startTop + iconDragGap * 4, startLeft);
  } else {
    if (memesOpen) memesOpen.remove();
  }

  var slopsweeperOpen = document.getElementById("slopsweeperOpen");
  if (hidden.indexOf("slopsweeperOpen") === -1) {
    registerDesktopIcon(slopsweeperOpen, {
      key: "slopsweeperOpen",
      kind: "builtin",
      label: "Slopsweeper.exe",
      emoji: "💣",
      onTap: function() {
        openWindow(slopsweeperWin);
        initSlopsweeper();
      }
    }, startTop + iconDragGap * 5, startLeft);
  } else {
    if (slopsweeperOpen) slopsweeperOpen.remove();
  }

  var sloppypaintOpen = document.getElementById("sloppypaintOpen");
  if (hidden.indexOf("sloppypaintOpen") === -1) {
    registerDesktopIcon(sloppypaintOpen, {
      key: "sloppypaintOpen",
      kind: "builtin",
      label: "SlopPaint.exe",
      emoji: "🎨",
      onTap: function() {
        openWindow(sloppypaintWin);
        initSlopPaint();
      }
    }, startTop + iconDragGap * 6, startLeft);
  } else {
    if (sloppypaintOpen) sloppypaintOpen.remove();
  }

  var terminalOpen = document.getElementById("terminalOpen");
  if (hidden.indexOf("terminalOpen") === -1) {
    registerDesktopIcon(terminalOpen, {
      key: "terminalOpen",
      kind: "builtin",
      label: "command.com",
      emoji: "💻",
      onTap: function() {
        openWindow(terminalWin);
        initTerminal();
      }
    }, startTop + iconDragGap * 7, startLeft);
  } else {
    if (terminalOpen) terminalOpen.remove();
  }

  var myComputerOpen = document.getElementById("myComputerOpen");
  if (hidden.indexOf("myComputerOpen") === -1) {
    registerDesktopIcon(myComputerOpen, {
      key: "myComputerOpen",
      kind: "builtin",
      label: "My Computer",
      emoji: "🖥️",
      onTap: function() {
        openMyComputer();
      }
    }, startTop + iconDragGap * 8, startLeft);
  } else {
    if (myComputerOpen) myComputerOpen.remove();
  }

  var recycleBinOpen = document.getElementById("recycleBinOpen");
  if (hidden.indexOf("recycleBinOpen") === -1) {
    registerDesktopIcon(recycleBinOpen, {
      key: "recycleBinOpen",
      kind: "builtin",
      label: "Recycle Bin",
      emoji: "♻️",
      onTap: function() {
        openRecycleBin();
      }
    }, startTop + iconDragGap * 9, startLeft);
  } else {
    if (recycleBinOpen) recycleBinOpen.remove();
  }
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

  // first real click, so audio is unlocked. welcome to the desktop, here is a chord
  playStartupJingle();

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

// nuke all feedback paper icons. mouth still works tho
function clearAllFeedbackFiles() {
  saveFeedbackFiles([]);
  localStorage.removeItem("sloposFeedback");

  var keys = Object.keys(iconRegistry);
  keys.forEach(function(key) {
    var reg = iconRegistry[key];
    if (reg && reg.meta && reg.meta.kind === "feedbackFile") {
      reg.el.remove();
      delete iconRegistry[key];
      removeIconPos(key);
    }
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
var clippyMemeTips = [
  "It looks like you're writing a meme! Would you like me to make it less funny for you?",
  "pro tip: impact font looks better when the text is actually funny",
  "have you tried typing 'drake' or 'boyfriend'? they are the only templates this system can afford",
  "is that top text really the best you could do? i'm not mad, just disappointed",
  "watermark says 'made with slop' for a reason, fam"
];
var clippyPaintTips = [
  "I notice you've been drawing. Have you considered getting a real job?",
  "that is a lovely circle. too bad the melting physics will destroy it in 3 seconds",
  "eraser stamps 'SLOP' because your art is kind of trash anyway",
  "are you trying to draw a masterpiece on a 320x240 canvas? ambitious.",
  "remember: hot pink is the only color that matters here"
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

  var selectedTip;
  if (activeWinId === "memesWin") {
    selectedTip = pickRandom(clippyMemeTips);
  } else if (activeWinId === "sloppypaint") {
    selectedTip = pickRandom(clippyPaintTips);
  } else {
    selectedTip = pickRandom(clippyTips);
  }

  clippyMsg.textContent = selectedTip;

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
var deskClearFeedback = document.getElementById("deskClearFeedback");
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

// 1 = Circle, 2 = Diagonal, 3 = Sine Wave, 0 = Neat Grid
var currentLayoutMode = 1; 

// organize them icons in different geometries because organization is a myth
function organizeDesktopIcons() {
  var keys = Object.keys(iconRegistry);
  if (keys.length === 0) return;

  var total = keys.length;
  var clientW = window.innerWidth;
  var clientH = window.innerHeight - taskbarH;

  keys.forEach(function(key, idx) {
    var reg = iconRegistry[key];
    var iconEl = reg.el;
    var meta = reg.meta;
    var top, left;

    if (currentLayoutMode === 0) {
      // Neat grid layout. Like a normal functional OS (gross).
      var colWidth = 120;
      var rowHeight = 85;
      var startT = 70;
      var startL = 25;
      var maxRows = Math.floor((clientH - startT - 40) / rowHeight);
      if (maxRows < 1) maxRows = 1;

      var r = idx % maxRows;
      var c = Math.floor(idx / maxRows);
      left = startL + c * colWidth;
      top = startT + r * rowHeight;
    } else if (currentLayoutMode === 1) {
      // Circle layout. Pure aesthetic.
      var centerX = clientW / 2;
      var centerY = clientH / 2;
      var radius = Math.min(clientW, clientH) * 0.3;
      var angle = (idx / total) * Math.PI * 2;
      left = centerX + Math.cos(angle) * radius - 45;
      top = centerY + Math.sin(angle) * radius - 35;
    } else if (currentLayoutMode === 2) {
      // Diagonal. The corporate slide design.
      var progress = total > 1 ? idx / (total - 1) : 0.5;
      left = 40 + progress * (clientW - 160);
      top = 70 + progress * (clientH - 140);
    } else {
      // Sine Wave. Wavy like a snake.
      var progress = total > 1 ? idx / (total - 1) : 0.5;
      left = 40 + progress * (clientW - 160);
      top = (clientH / 2) + Math.sin(progress * Math.PI * 4) * 120 - 35;
    }

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

  // cycle current mode
  currentLayoutMode = (currentLayoutMode + 1) % 4;
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

startBtn.addEventListener("mouseover", function(e) {
  // 30% chance to be highly annoying and evade the cursor
  if (Math.random() < 0.3) {
    var rx = (Math.random() * 40) - 20; // x-wobble
    var ry = (Math.random() * -30) - 5; // mostly go up because moving down goes off screen
    startBtn.style.transform = "translate(" + rx + "px, " + ry + "px)";
  } else {
    // psych, you get to click it this time
    startBtn.style.transform = "translate(0, 0)";
  }
});

startBtn.addEventListener("mouseout", function(e) {
  // reset it after a brain-lag delay so it settles back home
  setTimeout(function() {
    startBtn.style.transform = "translate(0, 0)";
  }, 1500); 
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
  } else if (app === "slopsweeper") {
    openWindow(slopsweeperWin);
    initSlopsweeper();
  } else if (app === "sloppypaint") {
    openWindow(sloppypaintWin);
    initSlopPaint();
  } else if (app === "trash" || app === "ai") {
    goRickroll();
  } else if (app === "memes") {
    openWindow(memesWin);
    initMemes();
  } else if (app === "terminal") {
    openWindow(terminalWin);
    initTerminal();
  } else if (app === "programs") {
    var sub = document.getElementById("startProgramsSub");
    if (sub) {
      sub.style.display = sub.style.display === "block" ? "none" : "block";
    }
    return;
  } else if (app === "mycomputer") {
    openMyComputer();
  } else if (app === "notepad") {
    openNotepad();
  } else if (app === "calc") {
    openCalculator();
  } else if (app === "controlpanel") {
    openControlPanel();
  } else if (app === "taskmgr") {
    openTaskManager();
  } else if (app === "run") {
    showRunDialog();
  } else if (app === "shutdown") {
    showShutdownDialog();
  } else if (app === "updates") {
    triggerBSOD("ERROR_TOO_MUCH_SLOP_IN_SYSTEM_BUFFER");
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
  organizeDesktopIcons();
});

if (deskClearFeedback) {
  deskClearFeedback.addEventListener("click", function() {
    hideDesktopMenu();
    clearAllFeedbackFiles();
  });
}

if (organizeIconsBtn) {
  organizeIconsBtn.addEventListener("click", organizeDesktopIcons);
}

// volume tray — the slider actually drives the master gain
var trayVolume = document.getElementById("trayVolume");
var volumeFlyout = document.getElementById("volumeFlyout");
var volumeSlider = document.getElementById("volumeSlider");
var volumeMute = document.getElementById("volumeMute");
var volumeVal = document.getElementById("volumeVal");

function updateSpeakerIcon() {
  if (slopMuted || slopVolume <= 0) {
    trayVolume.textContent = "🔇";
    trayVolume.classList.add("tray-muted");
  } else if (slopVolume < 0.5) {
    trayVolume.textContent = "🔉";
    trayVolume.classList.remove("tray-muted");
  } else {
    trayVolume.textContent = "🔊";
    trayVolume.classList.remove("tray-muted");
  }
}

function applyVolume() {
  var pct = parseInt(volumeSlider.value, 10);
  slopVolume = pct / 100;
  volumeVal.textContent = pct + "%";
  updateSpeakerIcon();
}

trayVolume.addEventListener("click", function(e) {
  e.stopPropagation();
  var showing = volumeFlyout.style.display === "flex";
  volumeFlyout.style.display = showing ? "none" : "flex";
});

volumeSlider.addEventListener("input", function() {
  if (slopMuted) {
    slopMuted = false;
    volumeMute.checked = false;
  }
  applyVolume();
  // little test blip so you hear what you picked, classic windows move
  playTone(660, 0.12, "sine", 0, 0.09);
});

volumeMute.addEventListener("change", function() {
  slopMuted = volumeMute.checked;
  updateSpeakerIcon();
  if (!slopMuted) playTone(660, 0.12, "sine", 0, 0.09);
});

// clicking anywhere else tucks the flyout away
document.addEventListener("click", function(e) {
  if (volumeFlyout.style.display === "flex" &&
      !volumeFlyout.contains(e.target) && e.target !== trayVolume) {
    volumeFlyout.style.display = "none";
  }
});

applyVolume();

trayWifi.addEventListener("click", function() {
  alert("connected to SlopFi_5G. trust.");
});

trayBattery.addEventListener("click", function() {
  alert("3% — good luck");
});


// taskbar right-click menu — cascade, tile, show desktop, the arrange-o-matic
var taskbarMenu = document.getElementById("taskbarMenu");
var tbCascade = document.getElementById("tbCascade");
var tbTile = document.getElementById("tbTile");
var tbShowDesktop = document.getElementById("tbShowDesktop");
var tbTaskMgr = document.getElementById("tbTaskMgr");
var desktopHidden = false; // toggle state for show the desktop

function hideTaskbarMenu() {
  if (taskbarMenu) taskbarMenu.style.display = "none";
}

// the windows that are actually on screen right now (open, not minimized, not closed)
function getVisibleWindows() {
  var out = [];
  Object.keys(managedWindows).forEach(function(id) {
    var w = managedWindows[id];
    if (w.taskBtn && !w.minimized && w.el.style.display !== "none") {
      out.push(w);
    }
  });
  return out;
}

// stack them stepping down-right from the corner, classic cascade
function cascadeWindows() {
  var wins = getVisibleWindows();
  var offset = 0;
  wins.forEach(function(w) {
    // drop out of maximized so the sizes make sense
    w.el.classList.remove("win-maxed");
    w.maximized = false;
    w.el.style.width = "";
    w.el.style.height = "";
    w.el.style.top = (30 + offset) + "px";
    w.el.style.left = (30 + offset) + "px";
    bringToFront(w.el);
    offset += 28;
  });
}

// chop the screen into a grid and jam one window in each cell
function tileWindows() {
  var wins = getVisibleWindows();
  var n = wins.length;
  if (n === 0) return;

  var cols = Math.ceil(Math.sqrt(n));
  var rows = Math.ceil(n / cols);
  var areaW = window.innerWidth;
  var areaH = window.innerHeight - taskbarH;
  var cellW = Math.floor(areaW / cols);
  var cellH = Math.floor(areaH / rows);

  wins.forEach(function(w, i) {
    var c = i % cols;
    var r = Math.floor(i / cols);
    w.el.classList.remove("win-maxed");
    w.maximized = false;
    w.el.style.left = (c * cellW) + "px";
    w.el.style.top = (r * cellH) + "px";
    w.el.style.width = (cellW - 6) + "px";
    w.el.style.height = (cellH - 6) + "px";
  });
}

// minimize everything, then a second call brings it all back
function toggleShowDesktop() {
  if (!desktopHidden) {
    getVisibleWindows().forEach(function(w) {
      minimizeWindow(w.el);
    });
    desktopHidden = true;
  } else {
    Object.keys(managedWindows).forEach(function(id) {
      var w = managedWindows[id];
      if (w.taskBtn && w.minimized) {
        restoreWindow(w.el);
      }
    });
    desktopHidden = false;
  }
}

if (taskbar) {
  taskbar.addEventListener("contextmenu", function(e) {
    // dont hijack the right click on the open-window buttons themselves
    if (e.target.closest(".task-btn")) return;
    e.preventDefault();
    hideStartMenu();
    hideDesktopMenu();

    taskbarMenu.style.display = "block";
    // clamp so it sits just above the taskbar and never off the right edge
    var menuW = 170;
    var x = Math.min(e.clientX, window.innerWidth - menuW);
    taskbarMenu.style.left = Math.max(0, x) + "px";
    taskbarMenu.style.top = "";
    taskbarMenu.style.bottom = (taskbarH + 2) + "px";
  });
}

tbCascade.addEventListener("click", function() { hideTaskbarMenu(); cascadeWindows(); });
tbTile.addEventListener("click", function() { hideTaskbarMenu(); tileWindows(); });
tbShowDesktop.addEventListener("click", function() { hideTaskbarMenu(); toggleShowDesktop(); });
tbTaskMgr.addEventListener("click", function() { hideTaskbarMenu(); openTaskManager(); });

document.addEventListener("click", hideTaskbarMenu);

// ==========================================
// SLOP-SWEEPER.EXE GAME ENGINE (peak code design)
// ==========================================

var mineGrid = document.getElementById("mineGrid");
var smileyBtn = document.getElementById("smileyBtn");
var gameTimer = document.getElementById("gameTimer");
var mineCounter = document.getElementById("mineCounter");

var slopsweeperBoard = [];
var slopsweeperGameOver = false;
var slopsweeperFirstClick = true;
var slopsweeperTimer = null;
var slopsweeperSeconds = 0;
var slopsweeperMines = 10;
var slopsweeperRows = 9;
var slopsweeperCols = 9;

smileyBtn.addEventListener("click", initSlopsweeper);

var slopsweeperHelp = document.getElementById("slopsweeperHelp");
if (slopsweeperHelp) {
  slopsweeperHelp.addEventListener("click", function(e) {
    e.stopPropagation();
    alert("SLOPSWEEPER.EXE - USER MANUAL\n\n" +
          "1. Left-click cell to reveal. 10% chance it spawns a mine underneath you because it hates you.\n" +
          "2. Right-click cell to flag. 20% chance the flag slides onto an adjacent cell because you're shaky.\n" +
          "3. Numbers are counts of nearby mines... except when they are roman numerals, say 'few'/'some', or are flat-out lies.\n" +
          "4. Win is strictly illegal. If you win, you crash.");
  });
}

function initSlopsweeper() {
  slopsweeperGameOver = false;
  slopsweeperFirstClick = true;
  slopsweeperSeconds = 0;
  clearInterval(slopsweeperTimer);
  slopsweeperTimer = null;
  gameTimer.textContent = "000";
  mineCounter.textContent = "010";
  smileyBtn.textContent = "🙂";
  
  // prepare data array (nested loops because memory is cheap)
  slopsweeperBoard = [];
  for (var r = 0; r < slopsweeperRows; r++) {
    slopsweeperBoard[r] = [];
    for (var c = 0; c < slopsweeperCols; c++) {
      slopsweeperBoard[r][c] = {
        r: r,
        c: c,
        mine: false,
        revealed: false,
        flagged: false,
        count: 0
      };
    }
  }

  // lay the minefield. rng gods decide your fate.
  var minesPlaced = 0;
  while (minesPlaced < slopsweeperMines) {
    var r = Math.floor(Math.random() * slopsweeperRows);
    var c = Math.floor(Math.random() * slopsweeperCols);
    if (!slopsweeperBoard[r][c].mine) {
      slopsweeperBoard[r][c].mine = true;
      minesPlaced++;
    }
  }

  recalcNeighborCounts();
  renderSlopsweeperGrid();
}

function recalcNeighborCounts() {
  for (var r = 0; r < slopsweeperRows; r++) {
    for (var c = 0; c < slopsweeperCols; c++) {
      if (slopsweeperBoard[r][c].mine) continue;
      var count = 0;
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          var nr = r + dr;
          var nc = c + dc;
          if (nr >= 0 && nr < slopsweeperRows && nc >= 0 && nc < slopsweeperCols) {
            if (slopsweeperBoard[nr][nc].mine) {
              count++;
            }
          }
        }
      }
      slopsweeperBoard[r][c].count = count;
    }
  }
}

function renderSlopsweeperGrid() {
  mineGrid.innerHTML = "";
  for (var r = 0; r < slopsweeperRows; r++) {
    for (var c = 0; c < slopsweeperCols; c++) {
      var cellEl = document.createElement("div");
      cellEl.className = "game-cell";
      cellEl.dataset.row = r;
      cellEl.dataset.col = c;
      
      // left click to clear, right click to deploy flags
      cellEl.addEventListener("click", handleCellClick);
      cellEl.addEventListener("contextmenu", handleCellRightClick);

      mineGrid.appendChild(cellEl);
    }
  }
}

function getCellEl(r, c) {
  return mineGrid.querySelector('[data-row="' + r + '"][data-col="' + c + '"]');
}

function startTimer() {
  slopsweeperSeconds = 0;
  slopsweeperTimer = setInterval(function() {
    slopsweeperSeconds++;
    if (slopsweeperSeconds > 999) {
      slopsweeperSeconds = 999;
    }
    var display = slopsweeperSeconds.toString();
    while (display.length < 3) {
      display = "0" + display;
    }
    gameTimer.textContent = display;
  }, 1000);
}

function handleCellClick(e) {
  if (slopsweeperGameOver) return;
  
  var r = parseInt(this.dataset.row, 10);
  var c = parseInt(this.dataset.col, 10);
  var cellData = slopsweeperBoard[r][c];

  if (cellData.revealed || cellData.flagged) return;

  if (slopsweeperFirstClick) {
    slopsweeperFirstClick = false;
    startTimer();
    
    // classic first click protection, except we did it sloppy
    if (cellData.mine) {
      var moved = false;
      for (var tr = 0; tr < slopsweeperRows; tr++) {
        for (var tc = 0; tc < slopsweeperCols; tc++) {
          if (!slopsweeperBoard[tr][tc].mine && (tr !== r || tc !== c)) {
            slopsweeperBoard[tr][tc].mine = true;
            cellData.mine = false;
            moved = true;
            break;
          }
        }
        if (moved) break;
      }
      recalcNeighborCounts();
    }
  } else {
    // SCHRÖDINGER'S MINE: 10% chance to summon a mine underneath you right before reveal
    if (!cellData.mine && Math.random() < 0.1) {
      var mineMoved = false;
      for (var tr = 0; tr < slopsweeperRows; tr++) {
        for (var tc = 0; tc < slopsweeperCols; tc++) {
          if (slopsweeperBoard[tr][tc].mine && (tr !== r || tc !== c)) {
            slopsweeperBoard[tr][tc].mine = false;
            cellData.mine = true;
            mineMoved = true;
            break;
          }
        }
        if (mineMoved) break;
      }
      recalcNeighborCounts();
    }
  }

  revealCell(r, c);
}

function handleCellRightClick(e) {
  e.preventDefault();
  if (slopsweeperGameOver) return;

  var r = parseInt(this.dataset.row, 10);
  var c = parseInt(this.dataset.col, 10);
  var cellData = slopsweeperBoard[r][c];

  if (cellData.revealed) return;

  // DRUNK FLAGGING: 20% chance to put the flag on a random adjacent cell instead
  if (Math.random() < 0.2) {
    var adj = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        var nr = r + dr;
        var nc = c + dc;
        if (nr >= 0 && nr < slopsweeperRows && nc >= 0 && nc < slopsweeperCols) {
          if (!slopsweeperBoard[nr][nc].revealed) {
            adj.push(slopsweeperBoard[nr][nc]);
          }
        }
      }
    }
    if (adj.length > 0) {
      var target = adj[Math.floor(Math.random() * adj.length)];
      r = target.r;
      c = target.c;
      cellData = target;
    }
  }

  cellData.flagged = !cellData.flagged;
  var cellEl = getCellEl(r, c);
  if (cellEl) {
    cellEl.textContent = cellData.flagged ? "🚩" : "";
  }
  updateMineCounter();
}

function updateMineCounter() {
  var flagsCount = 0;
  for (var r = 0; r < slopsweeperRows; r++) {
    for (var c = 0; c < slopsweeperCols; c++) {
      if (slopsweeperBoard[r][c].flagged) {
        flagsCount++;
      }
    }
  }
  var remaining = slopsweeperMines - flagsCount;
  var display = remaining.toString();
  var sign = "";
  if (remaining < 0) {
    sign = "-";
    display = Math.abs(remaining).toString();
  }
  while (display.length < (sign ? 2 : 3)) {
    display = "0" + display;
  }
  mineCounter.textContent = sign + display;
}

function getSloppyHintText(cellData) {
  var count = cellData.count;
  if (count === 0) return "";

  var roll = Math.random();
  if (roll < 0.15) {
    // lie and suggest a wrong number because trust issues
    var lied = count + (Math.random() < 0.5 ? 1 : -1);
    if (lied < 0) lied = 0;
    return lied === 0 ? "" : lied.toString();
  } else if (roll < 0.3) {
    // fancy roman numerals
    var romans = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
    return romans[count];
  } else if (roll < 0.45) {
    // English language is superior
    if (count <= 2) return "few";
    if (count <= 4) return "some";
    return "HELL";
  }
  return count.toString();
}

function revealCell(r, c) {
  var cellData = slopsweeperBoard[r][c];
  if (cellData.revealed || cellData.flagged) return;

  cellData.revealed = true;
  var cellEl = getCellEl(r, c);
  if (!cellEl) return;

  cellEl.classList.add("revealed");

  if (cellData.mine) {
    gameOver(false, r, c);
    return;
  }

  if (cellData.count > 0) {
    var hint = getSloppyHintText(cellData);
    cellEl.textContent = hint;
    cellEl.dataset.count = cellData.count;
    if (isNaN(hint) && hint !== "") {
      cellEl.classList.add("sloppy-text");
    }
  } else {
    // flood fill time
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        var nr = r + dr;
        var nc = c + dc;
        if (nr >= 0 && nr < slopsweeperRows && nc >= 0 && nc < slopsweeperCols) {
          revealCell(nr, nc);
        }
      }
    }
  }

  checkWinCondition();
}

function checkWinCondition() {
  var won = true;
  for (var r = 0; r < slopsweeperRows; r++) {
    for (var c = 0; c < slopsweeperCols; c++) {
      if (!slopsweeperBoard[r][c].mine && !slopsweeperBoard[r][c].revealed) {
        won = false;
        break;
      }
    }
  }
  if (won) {
    gameOver(true);
  }
}

function gameOver(won, boomR, boomC) {
  slopsweeperGameOver = true;
  clearInterval(slopsweeperTimer);

  if (won) {
    smileyBtn.textContent = "😎";
    alert("FATAL ERROR:\n\nWinning is not supported on this version of SlopOS.\n\nPlease reinstall your CPU or try losing.");
  } else {
    smileyBtn.textContent = "😵";
    for (var r = 0; r < slopsweeperRows; r++) {
      for (var c = 0; c < slopsweeperCols; c++) {
        var cellData = slopsweeperBoard[r][c];
        var cellEl = getCellEl(r, c);
        if (cellData.mine) {
          cellEl.classList.add("revealed", "mine");
          cellEl.textContent = "💣";
        }
      }
    }
    if (boomR !== undefined && boomC !== undefined) {
      var cellEl = getCellEl(boomR, boomC);
      if (cellEl) cellEl.style.background = "#ff0000";
    }
  }
}

// one-time purge bc desktop was drowning in feedback papers
if (!localStorage.getItem("sloposFeedbackPurged")) {
  clearAllFeedbackFiles();
  localStorage.setItem("sloposFeedbackPurged", "yep");
} else {
  loadFeedbackIcons();
}

// ==========================================
// SLOP-PAINT.EXE APPLICATION ENGINE (true masterpieces only)
// ==========================================

var paintCanvas = document.getElementById("paintCanvas");
var paintCtx = paintCanvas ? paintCanvas.getContext("2d") : null;
var toolBrush = document.getElementById("toolBrush");
var toolEraser = document.getElementById("toolEraser");
var paintClear = document.getElementById("paintClear");
var paintSave = document.getElementById("paintSave");

var currentPaintColor = "#ff0055";
var currentPaintTool = "brush"; // "brush" or "eraser"
var slopPaintDripTimer = null;
var isDrawingPaint = false;
var lastPaintX = 0;
var lastPaintY = 0;
var paintMouseQueue = [];

var clippyReviews = [
  "bro my toddler draw better than this. 1/10.",
  "is this abstract art or did u sneeze on the canvas?? 2/10.",
  "this is visual pollution fam. 0/10.",
  "i have seen better pixels in a blue screen of death. 1.5/10.",
  "truly a masterpiece of garbage. 3/10.",
  "please shut down SlopOS and think about your life choices. 0/10.",
  "clippy does not approve. -5/10."
];

function initSlopPaint() {
  if (!paintCanvas || !paintCtx) return;

  // reset tools
  setPaintTool("brush");
  setPaintColor("#ff0055");

  // clear canvas to white
  paintCtx.fillStyle = "#ffffff";
  paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);

  // setup event listeners once
  if (!paintCanvas.dataset.listenersWired) {
    paintCanvas.dataset.listenersWired = "true";

    paintCanvas.addEventListener("mousedown", startPainting);
    paintCanvas.addEventListener("mousemove", drawOnCanvas);
    paintCanvas.addEventListener("mouseup", stopPainting);
    paintCanvas.addEventListener("mouseleave", stopPainting);

    // wire colors
    document.querySelectorAll(".color-swatch").forEach(function(swatch) {
      swatch.addEventListener("click", function() {
        var color = this.dataset.color;
        setPaintColor(color);
      });
    });

    // wire tools
    toolBrush.addEventListener("click", function() { setPaintTool("brush"); });
    toolEraser.addEventListener("click", function() { setPaintTool("eraser"); });

    paintClear.addEventListener("click", function() {
      paintCtx.fillStyle = "#ffffff";
      paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
    });

    paintSave.addEventListener("click", function() {
      var review = clippyReviews[Math.floor(Math.random() * clippyReviews.length)];
      alert("CLIPPY ART INSPECTOR:\n\n" + review);
    });
  }

  // start melting physics timer
  if (!slopPaintDripTimer) {
    startDripTimer();
  }
}

function setPaintTool(tool) {
  currentPaintTool = tool;
  document.querySelectorAll(".tool-btn").forEach(function(btn) {
    btn.classList.remove("active-tool");
  });
  if (tool === "brush") {
    toolBrush.classList.add("active-tool");
  } else {
    toolEraser.classList.add("active-tool");
  }
}

function setPaintColor(color) {
  currentPaintColor = color;
  document.querySelectorAll(".color-swatch").forEach(function(swatch) {
    swatch.classList.remove("active-color");
    if (swatch.dataset.color === color) {
      swatch.classList.add("active-color");
    }
  });
}

function startDripTimer() {
  clearInterval(slopPaintDripTimer);
  // Melt/drip down 1px every 80ms for wet paint look
  slopPaintDripTimer = setInterval(function() {
    if (!paintCanvas || !paintCtx) return;

    // copy canvas shifted down by 1px
    var tempCanvas = document.createElement("canvas");
    tempCanvas.width = paintCanvas.width;
    tempCanvas.height = paintCanvas.height;
    var tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(paintCanvas, 0, 0);

    // draw back shifted
    paintCtx.fillStyle = "#ffffff";
    paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
    paintCtx.drawImage(tempCanvas, 0, 0, paintCanvas.width, paintCanvas.height - 1, 0, 1, paintCanvas.width, paintCanvas.height - 1);
  }, 80);
}

function startPainting(e) {
  isDrawingPaint = true;
  var coords = getCanvasCoords(e);
  
  // DRUNK BRUSH: initial coordinate jitter
  var rx = coords.x + (Math.random() * 20 - 10);
  var ry = coords.y + (Math.random() * 20 - 10);
  
  lastPaintX = rx;
  lastPaintY = ry;
  paintMouseQueue = [];
}

function stopPainting() {
  isDrawingPaint = false;
  paintMouseQueue = [];
}

function getCanvasCoords(e) {
  var rect = paintCanvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (paintCanvas.width / rect.width),
    y: (e.clientY - rect.top) * (paintCanvas.height / rect.height)
  };
}

function drawOnCanvas(e) {
  if (!isDrawingPaint) return;
  var coords = getCanvasCoords(e);

  // DRUNK BRUSH: Queue coordinates and add lag/delay + random tremoring
  paintMouseQueue.push(coords);
  if (paintMouseQueue.length < 3) return;

  var targetCoords = paintMouseQueue.shift();
  var tx = targetCoords.x + (Math.random() * 8 - 4);
  var ty = targetCoords.y + (Math.random() * 8 - 4);

  paintCtx.beginPath();
  paintCtx.lineCap = "round";
  
  if (currentPaintTool === "brush") {
    paintCtx.strokeStyle = currentPaintColor;
    paintCtx.lineWidth = 4;
    paintCtx.moveTo(lastPaintX, lastPaintY);
    paintCtx.lineTo(tx, ty);
    paintCtx.stroke();
  } else {
    // CURSED ERASER: paints in neon pink and stamps "SLOP"
    paintCtx.strokeStyle = "#ff00ff"; // hot pink!
    paintCtx.lineWidth = 14;
    paintCtx.moveTo(lastPaintX, lastPaintY);
    paintCtx.lineTo(tx, ty);
    paintCtx.stroke();

    // stamp "SLOP" randomly
    if (Math.random() < 0.25) {
      paintCtx.fillStyle = "#00ff88"; // green text
      paintCtx.font = "bold 9px 'Comic Sans MS'";
      paintCtx.fillText("SLOP", tx - 10, ty + 3);
    }
  }

  lastPaintX = tx;
  lastPaintY = ty;
}

// ==========================================
// MEMES.DLL ENGINE (real memes only)
// ==========================================

var memeImg = document.getElementById("memeImg");
if (memeImg) {
  memeImg.crossOrigin = "anonymous";
}
var memeInputTop = document.getElementById("memeInputTop");
var memeInputBottom = document.getElementById("memeInputBottom");
var memeTextTop = document.getElementById("memeTextTop");
var memeTextBottom = document.getElementById("memeTextBottom");
var memeNextBtn = document.getElementById("memeNextBtn");

var memeSizeTop = document.getElementById("memeSizeTop");
var memePosTop = document.getElementById("memePosTop");
var memeSizeBottom = document.getElementById("memeSizeBottom");
var memePosBottom = document.getElementById("memePosBottom");
var memeTextColor = document.getElementById("memeTextColor");
var memeOutlineColor = document.getElementById("memeOutlineColor");
var memeDownloadBtn = document.getElementById("memeDownloadBtn");

var valSizeTop = document.getElementById("valSizeTop");
var valPosTop = document.getElementById("valPosTop");
var valSizeBottom = document.getElementById("valSizeBottom");
var valPosBottom = document.getElementById("valPosBottom");

var memesList = [];
var currentMemeIndex = 0;

var fallbackMemes = [
  { url: "https://i.imgflip.com/30b1gx.jpg", name: "Drake Hotline Bling" },
  { url: "https://i.imgflip.com/1ur9ql.jpg", name: "Distracted Boyfriend" },
  { url: "https://i.imgflip.com/1g8my4.jpg", name: "Two Buttons" },
  { url: "https://i.imgflip.com/2fm6x.jpg", name: "Change My Mind" },
  { url: "https://i.imgflip.com/9ehk.jpg", name: "Epic Handshake" },
  { url: "https://i.imgflip.com/43a45p.png", name: "Think About It" }
];

function initMemes() {
  if (!memeNextBtn.dataset.listenersWired) {
    memeNextBtn.dataset.listenersWired = "true";

    memeInputTop.addEventListener("input", function() {
      memeTextTop.textContent = this.value;
    });

    memeInputBottom.addEventListener("input", function() {
      memeTextBottom.textContent = this.value;
    });

    memeSizeTop.addEventListener("input", function() {
      valSizeTop.textContent = this.value + "px";
      memeTextTop.style.fontSize = this.value + "px";
    });

    memePosTop.addEventListener("input", function() {
      valPosTop.textContent = this.value + "px";
      memeTextTop.style.top = this.value + "px";
    });

    memeSizeBottom.addEventListener("input", function() {
      valSizeBottom.textContent = this.value + "px";
      memeTextBottom.style.fontSize = this.value + "px";
    });

    memePosBottom.addEventListener("input", function() {
      valPosBottom.textContent = this.value + "px";
      memeTextBottom.style.bottom = this.value + "px";
    });

    function updateOutlineStyles() {
      var color = memeOutlineColor.value;
      var shadow = [
        "-2px -2px 0 " + color,
        "2px -2px 0 " + color,
        "-2px 2px 0 " + color,
        "2px 2px 0 " + color,
        "-2px 0px 0 " + color,
        "2px 0px 0 " + color,
        "0px -2px 0 " + color,
        "0px 2px 0 " + color
      ].join(", ");
      memeTextTop.style.textShadow = shadow;
      memeTextBottom.style.textShadow = shadow;
    }

    memeTextColor.addEventListener("input", function() {
      memeTextTop.style.color = this.value;
      memeTextBottom.style.color = this.value;
    });

    memeOutlineColor.addEventListener("input", updateOutlineStyles);

    memeNextBtn.addEventListener("click", showNextMeme);
    
    if (memeDownloadBtn) {
      memeDownloadBtn.addEventListener("click", downloadMeme);
    }
  }

  // wipe inputs clean
  memeInputTop.value = "";
  memeInputBottom.value = "";
  memeTextTop.textContent = "";
  memeTextBottom.textContent = "";

  // slam defaults so sliders and colors sync up
  if (memeSizeTop) memeSizeTop.value = "24";
  if (memePosTop) memePosTop.value = "8";
  if (memeSizeBottom) memeSizeBottom.value = "24";
  if (memePosBottom) memePosBottom.value = "8";
  if (memeTextColor) memeTextColor.value = "#ffffff";
  if (memeOutlineColor) memeOutlineColor.value = "#000000";

  if (valSizeTop) valSizeTop.textContent = "24px";
  if (valPosTop) valPosTop.textContent = "8px";
  if (valSizeBottom) valSizeBottom.textContent = "24px";
  if (valPosBottom) valPosBottom.textContent = "8px";

  memeTextTop.style.fontSize = "24px";
  memeTextTop.style.top = "8px";
  memeTextBottom.style.fontSize = "24px";
  memeTextBottom.style.bottom = "8px";
  memeTextTop.style.color = "#ffffff";
  memeTextBottom.style.color = "#ffffff";

  var defaultShadow = [
    "-2px -2px 0 #000",
    "2px -2px 0 #000",
    "-2px 2px 0 #000",
    "2px 2px 0 #000",
    "-2px 0px 0 #000",
    "2px 0px 0 #000",
    "0px -2px 0 #000",
    "0px 2px 0 #000"
  ].join(", ");
  memeTextTop.style.textShadow = defaultShadow;
  memeTextBottom.style.textShadow = defaultShadow;

  if (memesList.length === 0) {
    fetchMemesTemplates();
  } else {
    showNextMeme();
  }
}

function fetchMemesTemplates() {
  memeImg.alt = "Fetching templates from Imgflip...";
  fetch("https://api.imgflip.com/get_memes")
    .then(function(res) {
      return res.json();
    })
    .then(function(json) {
      if (json.success && json.data && json.data.memes) {
        memesList = json.data.memes;
        memesList.sort(function() { return 0.5 - Math.random(); });
        showNextMeme();
      } else {
        useFallbackMemes();
      }
    })
    .catch(function() {
      useFallbackMemes();
    });
}

function useFallbackMemes() {
  memesList = fallbackMemes;
  memesList.sort(function() { return 0.5 - Math.random(); });
  showNextMeme();
}

function showNextMeme() {
  if (memesList.length === 0) return;
  currentMemeIndex = (currentMemeIndex + 1) % memesList.length;
  var meme = memesList[currentMemeIndex];
  memeImg.src = meme.url;
  memeImg.alt = meme.name;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, strokeStyle, fillStyle, fontSize, isTop) {
  var words = text.split(" ");
  var lines = [];
  var currentLine = "";

  for (var n = 0; n < words.length; n++) {
    var testLine = currentLine + words[n] + " ";
    var metrics = ctx.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(currentLine.trim());
      currentLine = words[n] + " ";
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine.trim());

  // grab chosen font size, styling, outline thickness, etc.
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = Math.max(2, Math.round(fontSize / 6));
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.textAlign = "center";

  // figure out top/bottom alignment base Y
  var totalHeight = lines.length * lineHeight;
  var startY = y;
  
  if (isTop) {
    ctx.textBaseline = "top";
    startY = y;
  } else {
    ctx.textBaseline = "bottom";
    startY = y - totalHeight + lineHeight;
  }

  for (var i = 0; i < lines.length; i++) {
    var lineY = startY + i * lineHeight;
    ctx.strokeText(lines[i], x, lineY);
    ctx.fillText(lines[i], x, lineY);
  }
}

function downloadMeme() {
  if (!memeImg.src || (memeImg.src.indexOf("data:") === 0 && !memeImg.naturalWidth)) {
    alert("Wait for template to load first, fam!");
    return;
  }

  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");

  var naturalW = memeImg.naturalWidth;
  var naturalH = memeImg.naturalHeight;

  if (naturalW === 0 || naturalH === 0) {
    alert("Image hasn't finished loading or is invalid.");
    return;
  }

  canvas.width = naturalW;
  canvas.height = naturalH;

  // slap the meme backdrop onto the canvas
  ctx.drawImage(memeImg, 0, 0, naturalW, naturalH);

  var clientW = memeImg.clientWidth || 300;
  var clientH = memeImg.clientHeight || 300;

  var scaleX = naturalW / clientW;
  var scaleY = naturalH / clientH;

  // drop top caption if they typed something
  if (memeInputTop.value.trim() !== "") {
    var sizeTop = parseInt(memeSizeTop.value, 10) || 24;
    var scaledSizeTop = Math.round(sizeTop * scaleX);
    var offsetTop = parseInt(memePosTop.value, 10) || 8;
    var scaledOffsetTop = Math.round(offsetTop * scaleY);

    ctx.font = "900 " + scaledSizeTop + "px Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif";
    var lineHeightTop = Math.round(scaledSizeTop * 1.15);
    var maxWidthTop = Math.round(naturalW * 0.9);
    var xTop = Math.round(naturalW / 2);
    
    drawWrappedText(
      ctx,
      memeInputTop.value.toUpperCase(),
      xTop,
      scaledOffsetTop,
      maxWidthTop,
      lineHeightTop,
      memeOutlineColor.value,
      memeTextColor.value,
      scaledSizeTop,
      true
    );
  }

  // drop bottom caption if they typed something
  if (memeInputBottom.value.trim() !== "") {
    var sizeBottom = parseInt(memeSizeBottom.value, 10) || 24;
    var scaledSizeBottom = Math.round(sizeBottom * scaleX);
    var offsetBottom = parseInt(memePosBottom.value, 10) || 8;
    var scaledOffsetBottom = Math.round(offsetBottom * scaleY);

    ctx.font = "900 " + scaledSizeBottom + "px Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif";
    var lineHeightBottom = Math.round(scaledSizeBottom * 1.15);
    var maxWidthBottom = Math.round(naturalW * 0.9);
    var xBottom = Math.round(naturalW / 2);
    var yBottom = naturalH - scaledOffsetBottom;

    drawWrappedText(
      ctx,
      memeInputBottom.value.toUpperCase(),
      xBottom,
      yBottom,
      maxWidthBottom,
      lineHeightBottom,
      memeOutlineColor.value,
      memeTextColor.value,
      scaledSizeBottom,
      false
    );
  }

  // stamp the signature watermark so everyone knows it's certified slop
  var watermarkSize = Math.round(Math.max(10, naturalW * 0.025));
  ctx.font = watermarkSize + "px monospace";
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
  ctx.lineWidth = Math.max(1, Math.round(watermarkSize / 6));
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  var watermarkX = Math.round(naturalW * 0.02);
  var watermarkY = naturalH - Math.round(naturalH * 0.02);
  ctx.strokeText("made with slop", watermarkX, watermarkY);
  ctx.fillText("made with slop", watermarkX, watermarkY);

  try {
    var dataUrl = canvas.toDataURL("image/png");
    var link = document.createElement("a");
    link.download = "slop_meme_" + Date.now() + ".png";
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Canvas export failed:", err);
    alert("CORS security blocked download. Try another template or use our fallback templates!");
  }
}

// ==========================================
// FATAL ERROR SYSTEM RECOVERY (BSOD / BIOS boot loop)
// ==========================================

function triggerBSOD(errorMessage) {
  var bsodScreen = document.getElementById("bsodScreen");
  var bsodView = document.getElementById("bsodView");
  var biosView = document.getElementById("biosView");
  var bsodErrorMessage = document.getElementById("bsodErrorMessage");

  if (!bsodScreen) return;

  bsodErrorMessage.textContent = "Error: " + (errorMessage || "ERROR_TOO_MUCH_SLOP_IN_SYSTEM_BUFFER");
  bsodScreen.classList.remove("bios-mode");
  bsodView.style.display = "block";
  biosView.style.display = "none";
  bsodScreen.style.display = "block";

  // click it to start the bios reboot
  var rebootBtn = document.getElementById("bsodRebootBtn");
  if (rebootBtn) {
    rebootBtn.onclick = function() {
      startBiosReboot();
    };
  }

  // let them hit enter or space to reboot because keyboards are cool
  function handleBsodKeyPress(e) {
    if (e.key === "Enter" || e.key === " ") {
      document.removeEventListener("keydown", handleBsodKeyPress);
      startBiosReboot();
    }
  }
  document.addEventListener("keydown", handleBsodKeyPress);
}

function startBiosReboot() {
  var bsodScreen = document.getElementById("bsodScreen");
  var bsodView = document.getElementById("bsodView");
  var biosView = document.getElementById("biosView");
  var biosLog = document.getElementById("biosLog");

  if (!bsodScreen) return;

  bsodScreen.classList.add("bios-mode");
  bsodView.style.display = "none";
  biosView.style.display = "block";
  biosLog.innerHTML = "";

  // print lines with a retro delay so it feels like a 90s machine booting
  function printLine(text, delay, callback) {
    setTimeout(function() {
      var p = document.createElement("div");
      p.className = "bios-line";
      p.textContent = text;
      biosLog.appendChild(p);
      if (callback) callback();
    }, delay);
  }

  printLine("CPU: Slop-Pro (TM) at 33 MHz", 200, function() {
    printLine("Detecting IDE Primary Master ... SLOP-DRIVE-200MB", 400, function() {
      printLine("Detecting IDE Primary Slave  ... NONE", 300, function() {
        var p = document.createElement("div");
        p.className = "bios-line";
        biosLog.appendChild(p);

        var ramCount = 0;
        var ramInterval = setInterval(function() {
          ramCount += 4096;
          p.textContent = "Memory Test: " + ramCount + "KB OK";
          if (ramCount >= 65536) {
            clearInterval(ramInterval);
            printLine("Floppy drive A: Found (3.5\" 1.44MB)", 400, function() {
              printLine("Loading Boot Sector from C: ... OK", 400, function() {
                printLine("Starting SlopOS...", 300, function() {
                  setTimeout(function() {
                    window.location.reload();
                  }, 800);
                });
              });
            });
          }
        }, 80);
      });
    });
  });
}

// ==========================================
// CLUNKY TERMINAL (command.com) ENGINE - shitty as of now mite improve it but eh 
// ==========================================

var terminalWin = document.getElementById("terminalWin");
var terminalLog = document.getElementById("terminalLog");
var terminalInput = document.getElementById("terminalInput");
var terminalPrompt = document.getElementById("terminalPrompt");
var terminalBody = document.getElementById("terminalBody");

var currentPath = ["C:", "Desktop"];
var lastTypeTime = 0;
var typingLockout = false;

var virtualFS = {
  "C:": {
    type: "dir",
    name: "C:",
    children: {
      "Desktop": {
        type: "dir",
        name: "Desktop",
        children: {
          "Welcome.slop": { type: "file", name: "Welcome.slop", content: "yo bestie welcome to slopos. its v0.0.0.67 and honestly it is a miracle this code compiles. drag stuff around but dont break it (u will break it)." },
          "Feedback.slop": { type: "file", name: "Feedback.slop", content: "feedback logs are eaten by the garbage can. literal digital trash." },
          "Trash.slop": { type: "file", name: "Trash.slop", content: "deleted shortcuts go here to multiply. pure casino gaming." },
          "Memes.dll": { type: "exe", name: "Memes.dll", windowId: "memesWin", initFn: function() { initMemes(); } },
          "Slopsweeper.exe": { type: "exe", name: "Slopsweeper.exe", windowId: "slopsweeper", initFn: function() { initSlopsweeper(); } },
          "SlopPaint.exe": { type: "exe", name: "SlopPaint.exe", windowId: "sloppypaint", initFn: function() { initSlopPaint(); } },
          "command.com": { type: "exe", name: "command.com", windowId: "terminalWin", initFn: function() { initTerminal(); } },
          "notepad.exe": { type: "exe", name: "notepad.exe", windowId: "notepadWin", initFn: function() { openNotepad(); } },
          "calc.exe": { type: "exe", name: "calc.exe", windowId: "calcWin", initFn: function() { openCalculator(); } }
        }
      },
      "Program Files": {
        type: "dir",
        name: "Program Files",
        children: {
          "SlopCorp": {
            type: "dir",
            name: "SlopCorp",
            children: {
              "license.txt": { type: "file", name: "license.txt", content: "BY USING SLOPOS YOU AGREE TO ALL TERMS INCLUDING THE ONES WE HAVENT WRITTEN YET." }
            }
          }
        }
      },
      "Windows": {
        type: "dir",
        name: "Windows",
        children: {
          "System32": {
            type: "dir",
            name: "System32",
            children: {
              "hal.dll": { type: "file", name: "hal.dll", content: "hardware abstraction layer? more like hardware disappointment layer." },
              "kernel.dll": { type: "file", name: "kernel.dll", content: "slop core. do not touch or clippy will consume your soul." }
            }
          },
          "slop.ini": { type: "file", name: "slop.ini", content: "[boot]\r\nsafemode=0\r\nbrainrot=1\r\nsarcasm=100\r\nclippy=annoying" },
          "Adventure.slop": { type: "game", name: "Adventure.slop" }
        }
      }
    }
  }
};

// Game state variables
var inAdventureGame = false;
var adventureStep = 0;

// Get directory node by parsing path array
function getNodeAtPath(pathArr) {
  var current = virtualFS["C:"];
  for (var i = 1; i < pathArr.length; i++) {
    var segment = pathArr[i];
    if (current && current.children && current.children[segment]) {
      current = current.children[segment];
    } else {
      return null;
    }
  }
  return current;
}

// Convert path array to string prompt
function getPathString(pathArr) {
  return pathArr.join("\\") + ">";
}

// one shared audio context and a master volume everything runs through
var slopAudioCtx = null;
var slopVolume = 0.7; // 0..1, driven by the tray slider
var slopMuted = false;

function getAudioCtx() {
  try {
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!slopAudioCtx) slopAudioCtx = new AudioCtx();
    return slopAudioCtx;
  } catch (e) {
    return null;
  }
}

// play a single tone. gain gets scaled by the master volume so the slider actually does something
function playTone(freq, dur, type, when, peak) {
  var ctx = getAudioCtx();
  if (!ctx) return;
  if (slopMuted || slopVolume <= 0) return;

  var t0 = ctx.currentTime + (when || 0);
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();

  osc.type = type || "square";
  osc.frequency.value = freq;

  var vol = (peak || 0.08) * slopVolume;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function playBeep() {
  // the classic low buzzing fail beep, now volume aware
  playTone(140, 0.25, "square", 0, 0.08);
}

// cheerful little four note rise. plays when the desktop first shows up
function playStartupJingle() {
  var notes = [523, 659, 784, 1046]; // C E G C, the it just works chord
  notes.forEach(function(n, i) {
    playTone(n, 0.28, "triangle", i * 0.16, 0.09);
  });
}

// sad falling ta-daa for shutdown
function playShutdownJingle() {
  var notes = [784, 587, 440, 330];
  notes.forEach(function(n, i) {
    playTone(n, 0.3, "triangle", i * 0.18, 0.09);
  });
}

function shakeTerminal() {
  if (!terminalBody) return;
  terminalBody.classList.remove("terminal-shake-active");
  // Force redraw
  void terminalBody.offsetWidth;
  terminalBody.classList.add("terminal-shake-active");
  setTimeout(function() {
    terminalBody.classList.remove("terminal-shake-active");
  }, 250);
}

function printBaudText(text, logCallback) {
  var lines = text.split("\n");
  var lineIndex = 0;
  terminalInput.disabled = true;

  function printNextLine() {
    if (lineIndex < lines.length) {
      var p = document.createElement("div");
      p.textContent = lines[lineIndex];
      terminalLog.appendChild(p);
      terminalLog.scrollTop = terminalLog.scrollHeight;
      lineIndex++;
      
      // simulated baud connection speed
      setTimeout(printNextLine, 40 + Math.random() * 30);
    } else {
      terminalInput.disabled = false;
      terminalInput.focus();
      if (logCallback) logCallback();
    }
  }

  printNextLine();
}

function initTerminal() {
  if (!terminalLog) return;
  terminalLog.innerHTML = "";
  currentPath = ["C:", "Desktop"];
  terminalPrompt.textContent = getPathString(currentPath);
  terminalInput.value = "";
  
  var asciiSplash = [
    "  ____  _        ___  ____     ___  ____  ",
    " / ___|| |      / _ \\|  _ \\   / _ \\/ ___| ",
    " \\___ \\| |     | | | | |_) | | | | \\___ \\ ",
    "  ___) | |___  | |_| |  __/  | |_| |___) |",
    " |____/|_____|  \\___/|_|      \\___/|____/ ",
    "                                          ",
    "   (C) 1995 SLOP CORPORATION. ALL RIGHTS WRONGED.",
    "   Welcome to command.com Command Console.",
    "   Type 'help' to see what commands haven't broken yet.",
    ""
  ].join("\n");

  inAdventureGame = false;
  adventureStep = 0;
  printBaudText(asciiSplash);
  
  if (!terminalWired) {
    terminalWired = true;
    
    // Focus terminal input when clicking terminal window body
    terminalBody.addEventListener("click", function() {
      if (!terminalInput.disabled) {
        terminalInput.focus();
      }
    });

    terminalInput.addEventListener("keydown", function(e) {
      var now = Date.now();
      
      // Intercept keypresses if locked out
      if (typingLockout) {
        e.preventDefault();
        return;
      }
      
      // Rapid-typing buffer overflow check
      if (lastTypeTime > 0 && (now - lastTypeTime) < 80 && e.key !== "Backspace") {
        e.preventDefault();
        typingLockout = true;
        terminalInput.disabled = true;
        playBeep();
        shakeTerminal();
        var p = document.createElement("div");
        p.style.color = "#ff3333";
        p.textContent = "\n[KEYBOARD BUFFER OVERFLOW - SYSTEM BUSY - STAND BY]\n";
        terminalLog.appendChild(p);
        terminalLog.scrollTop = terminalLog.scrollHeight;
        
        setTimeout(function() {
          typingLockout = false;
          terminalInput.disabled = false;
          terminalInput.focus();
        }, 900);
        return;
      }
      lastTypeTime = now;

      // Handle Tab Autocomplete
      if (e.key === "Tab") {
        e.preventDefault();
        handleTabComplete();
        return;
      }

      // Handle Command Execute on Enter
      if (e.key === "Enter") {
        var rawCmd = terminalInput.value;
        terminalInput.value = "";
        
        // Print echo command back to log
        var echoLine = document.createElement("div");
        echoLine.textContent = getPathString(currentPath) + " " + rawCmd;
        terminalLog.appendChild(echoLine);
        
        executeCommand(rawCmd.trim());
      }
    });
  }
}

function handleTabComplete() {
  var val = terminalInput.value.trim();
  if (!val) return;

  // 40% chance of cursed tab behavior
  if (Math.random() < 0.4) {
    playBeep();
    var p = document.createElement("div");
    if (Math.random() < 0.5) {
      p.style.color = "#ffff33";
      p.textContent = "[TAB AUTOCOMPLETE IS A PREMIUM FEATURE. PLEASE DEPOSIT 5 SLOP COINS TO UNLOCK.]";
    } else {
      // wrong completion
      var currentDirNode = getNodeAtPath(currentPath);
      var items = Object.keys(currentDirNode.children || {});
      if (items.length > 0) {
        var wrongItem = pickRandom(items);
        var cmdParts = val.split(" ");
        cmdParts[cmdParts.length - 1] = wrongItem;
        terminalInput.value = cmdParts.join(" ");
        return;
      }
    }
    terminalLog.appendChild(p);
    terminalLog.scrollTop = terminalLog.scrollHeight;
    return;
  }

  // normal tab autocomplete
  var cmdParts = val.split(" ");
  var lastWord = cmdParts[cmdParts.length - 1].toLowerCase();
  if (!lastWord) return;

  var currentDirNode = getNodeAtPath(currentPath);
  if (!currentDirNode || !currentDirNode.children) return;

  var matches = [];
  Object.keys(currentDirNode.children).forEach(function(name) {
    if (name.toLowerCase().indexOf(lastWord) === 0) {
      matches.push(name);
    }
  });

  if (matches.length > 0) {
    // Autocomplete the first match
    cmdParts[cmdParts.length - 1] = matches[0];
    terminalInput.value = cmdParts.join(" ");
  }
}

function executeCommand(rawStr) {
  if (inAdventureGame) {
    handleAdventureInput(rawStr);
    return;
  }

  var parts = rawStr.split(" ");
  var cmd = parts[0].toLowerCase();
  var arg = parts.slice(1).join(" ");

  var currentDirNode = getNodeAtPath(currentPath);

  if (!cmd) {
    return;
  }

  // Check if command is a file name inside the current directory (executable run)
  if (currentDirNode && currentDirNode.children && currentDirNode.children[rawStr]) {
    var fileNode = currentDirNode.children[rawStr];
    if (fileNode.type === "exe") {
      var w = document.getElementById(fileNode.windowId);
      if (w) openWindow(w);
      if (fileNode.initFn) fileNode.initFn();
      printBaudText("Executing " + fileNode.name + "...");
      return;
    } else if (fileNode.type === "game") {
      startAdventureGame();
      return;
    } else {
      printBaudText("Error: " + fileNode.name + " is not an executable program.");
      return;
    }
  }

  // Handle standard commands
  switch (cmd) {
    case "help":
      var helpText = [
        "Available Commands:",
        "  dir / ls      - List directory contents",
        "  cd <dir>      - Change directories (cd .. goes up)",
        "  pwd           - Print working directory path",
        "  type / cat    - Display text file contents",
        "  cls / clear   - Clear the display screen",
        "  echo <text>   - Echo text",
        "  clippy        - Call ASCII Clippy",
        "  format c:     - Format system hard drive",
        "  <program.exe> - Run a program from current folder",
        ""
      ].join("\n");
      printBaudText(helpText);
      break;

    case "dir":
    case "ls":
      if (!currentDirNode || !currentDirNode.children) {
        printBaudText("Error reading folder tree.");
        break;
      }
      var out = " Directory of " + currentPath.join("\\") + "\n\n";
      var items = Object.keys(currentDirNode.children);
      if (items.length === 0) {
        out += "  No files found.";
      } else {
        items.forEach(function(name) {
          var f = currentDirNode.children[name];
          if (f.type === "dir") {
            out += "  <DIR>      " + name + "\n";
          } else {
            var size = Math.floor(Math.random() * 800000) + 120;
            out += "             " + name + " (" + size + " bytes)\n";
          }
        });
      }
      printBaudText(out + "\n");
      break;

    case "pwd":
      printBaudText("Current Path: " + currentPath.join("\\") + "\n");
      break;

    case "cd":
      if (!arg) {
        printBaudText("Usage: cd <directory_name>\n");
        break;
      }
      if (arg === "..") {
        if (currentPath.length > 1) {
          currentPath.pop();
        }
        terminalPrompt.textContent = getPathString(currentPath);
        break;
      }

      // Check relative directory matches
      if (currentDirNode && currentDirNode.children && currentDirNode.children[arg]) {
        var node = currentDirNode.children[arg];
        if (node.type === "dir") {
          currentPath.push(arg);
          terminalPrompt.textContent = getPathString(currentPath);
        } else {
          playBeep();
          shakeTerminal();
          printBaudText("cd: " + arg + ": Not a directory.\n");
        }
      } else {
        playBeep();
        shakeTerminal();
        printBaudText("cd: " + arg + ": Directory not found.\n");
      }
      break;

    case "type":
    case "cat":
      if (!arg) {
        printBaudText("Usage: type <filename>\n");
        break;
      }
      if (currentDirNode && currentDirNode.children && currentDirNode.children[arg]) {
        var file = currentDirNode.children[arg];
        if (file.type === "file") {
          printBaudText(file.content + "\n");
        } else if (file.type === "game") {
          startAdventureGame();
        } else {
          printBaudText("Error: cannot view non-text file contents.\n");
        }
      } else {
        playBeep();
        shakeTerminal();
        printBaudText("type: " + arg + ": File not found.\n");
      }
      break;

    case "cls":
    case "clear":
      terminalLog.innerHTML = "";
      var clsTip = "Screen cleared. (Actually, we just hid the logs behind a couch, don't look too close)\n";
      printBaudText(clsTip);
      break;

    case "echo":
      printBaudText(arg + "\n");
      break;

    case "clippy":
      var clippyAscii = [
        "   /\\_/\\  ",
        "  ( o.o )   Yo fam, i noticed you are typing in command.com!",
        "   > ^ <    have you tried using a computer built after 1995?",
        "  /     \\ ",
        " (       )  (Type 'exit' to get me out of here)",
        "  `-----' "
      ].join("\n");
      printBaudText(clippyAscii + "\n");
      break;

    case "format":
      if (arg.toLowerCase() === "c:") {
        runFormatC();
      } else {
        printBaudText("Usage: format c:\n");
      }
      break;

    case "joke":
      var jokes = [
        "Why do programmers wear glasses? Because they can't C#.",
        "There are 10 types of people in this world: those who understand binary, and those who don't.",
        "How many programmers does it take to change a lightbulb? None, that's a hardware problem.",
        "A SQL query walks into a bar, walks up to two tables and asks, 'Can I join you?'"
      ];
      printBaudText(pickRandom(jokes) + "\n");
      break;

    default:
      playBeep();
      shakeTerminal();
      printBaudText("Bad command or file name. (Did you spell it correctly? Try spelling it wrong next time)\n");
      break;
  }
}

function runFormatC() {
  terminalInput.disabled = true;
  var logList = [
    "WARNING, ALL DATA ON NON-REMOVABLE DISK",
    "DRIVE C: WILL BE LOST!",
    "Proceed with Format (Y/N)? y",
    "",
    "Formatting 1.2GB Partition"
  ];
  
  printBaudText(logList.join("\n"), function() {
    // Add format progress bar
    var p = document.createElement("div");
    p.textContent = "[                    ] 0%";
    terminalLog.appendChild(p);
    terminalLog.scrollTop = terminalLog.scrollHeight;
    
    var progress = 0;
    var progressInterval = setInterval(function() {
      progress += 5;
      var barsCount = Math.floor(progress / 5);
      var bars = "";
      for (var i = 0; i < 20; i++) {
        bars += i < barsCount ? "█" : " ";
      }
      p.textContent = "[" + bars + "] " + progress + "%";
      terminalLog.scrollTop = terminalLog.scrollHeight;
      
      if (progress >= 100) {
        clearInterval(progressInterval);
        setTimeout(function() {
          // Trigger hard crash BSOD
          triggerBSOD("ERROR_C_DRIVE_WIPED_CLEAN");
        }, 600);
      }
    }, 150);
  });
}

function startAdventureGame() {
  inAdventureGame = true;
  adventureStep = 1;
  terminalLog.innerHTML = "";
  
  var splash = [
    " ================================================= ",
    "   SLOPOS COMPILE ADVENTURE - THE TEXT CONSOLE GAME ",
    " ================================================= ",
    " Your mission: build and compile SlopOS v0.0.0.67.",
    " Any compiler crash leads to immediate destruction.",
    "",
    " Step 1: The compiler complains that the 'clippy' module",
    " has a syntax error: \"missing sarcasm in line 23\".",
    " What do you do?",
    "   1. Add more sarcasm manually.",
    "   2. Delete clippy entirely.",
    "   3. Ignore it and force compile.",
    "",
    " Type 1, 2, or 3 and hit Enter:"
  ].join("\n");
  
  printBaudText(splash);
}

function handleAdventureInput(inputVal) {
  var choice = inputVal.trim();
  
  if (adventureStep === 1) {
    if (choice === "1") {
      adventureStep = 2;
      var nextStepText = [
        "",
        " Correct! Clippy is now 400% more sarcastic.",
        "",
        " Step 2: A memory leak is detected in the melting paint module.",
        " What do you do?",
        "   1. Turn off gravity.",
        "   2. Limit the canvas to 1x1 pixels.",
        "   3. Feed the leaked memory to the Feedback can.",
        "",
        " Type 1, 2, or 3 and hit Enter:"
      ].join("\n");
      printBaudText(nextStepText);
    } else {
      triggerAdventureFailure("Clippy got angry because you neglected/tried to delete him, and deleted your boot sector instead!");
    }
  } else if (adventureStep === 2) {
    if (choice === "3") {
      adventureStep = 3;
      var finalStepText = [
        "",
        " Amazing choice! The feedback can eats the memory leak.",
        "",
        " Step 3: The system is ready to compile, but you need to sign",
        " the license agreement.",
        " What do you do?",
        "   1. Read it thoroughly.",
        "   2. Sell your soul to the Slop Corporation.",
        "   3. Reject it.",
        "",
        " Type 1, 2, or 3 and hit Enter:"
      ].join("\n");
      printBaudText(finalStepText);
    } else {
      triggerAdventureFailure("The melting paint drips onto the motherboard and shorts the compile stack!");
    }
  } else if (adventureStep === 3) {
    if (choice === "2") {
      inAdventureGame = false;
      adventureStep = 0;
      var winText = [
        "",
        " [SUCCESS] SlopOS compiled successfully! ",
        " You have sold your soul to Slop Corporation.",
        " You gained: 0 Slop Coins.",
        " Game Over.",
        ""
      ].join("\n");
      printBaudText(winText, function() {
        terminalPrompt.textContent = getPathString(currentPath);
      });
    } else {
      triggerAdventureFailure("License rejected! The compiler refuses to work without corporate dominance.");
    }
  }
}

function triggerAdventureFailure(reasonText) {
  inAdventureGame = false;
  adventureStep = 0;
  
  playBeep();
  shakeTerminal();
  
  var failText = [
    "",
    " [COMPILER ERROR] Compilation Failed! ",
    " Reason: " + reasonText,
    " Compiler exit code: 0xBAADF00D",
    " Game Over.",
    ""
  ].join("\n");
  
  printBaudText(failText, function() {
    terminalPrompt.textContent = getPathString(currentPath);
  });
}


// ==========================================
// CLASSIC WINDOWS STUFF (95/98/XP but wrong)
// microsoft pls dont sue we have no money
// ==========================================

var myComputerWin = document.getElementById("myComputerWin");
var explorerWin = document.getElementById("explorerWin");
var notepadWin = document.getElementById("notepadWin");
var calcWin = document.getElementById("calcWin");
var recycleBinWin = document.getElementById("recycleBinWin");
var controlPanelWin = document.getElementById("controlPanelWin");
var notepadArea = document.getElementById("notepadArea");
var notepadTitle = document.getElementById("notepadTitle");
var calcDisplay = document.getElementById("calcDisplay");
var calcGrid = document.getElementById("calcGrid");
var explorerFiles = document.getElementById("explorerFiles");
var explorerTree = document.getElementById("explorerTree");
var explorerAddress = document.getElementById("explorerAddress");
var explorerStatus = document.getElementById("explorerStatus");
var explorerTitle = document.getElementById("explorerTitle");
var recycleList = document.getElementById("recycleList");
var runOverlay = document.getElementById("runOverlay");
var runInput = document.getElementById("runInput");
var shutdownOverlay = document.getElementById("shutdownOverlay");
var safeShutdownOverlay = document.getElementById("safeShutdownOverlay");
var standbyOverlay = document.getElementById("standbyOverlay");

var explorerPath = ["C:"];
var explorerHistory = [];
var notepadDirty = false;
var notepadFileName = "Untitled";
var calcValue = "0";
var calcPrev = null;
var calcOp = null;
var classicWired = false;

// recycle bin storage bc we pretend to care about the environment
function getRecycleBin() {
  return JSON.parse(localStorage.getItem("sloposRecycleBin") || "[]");
}

function saveRecycleBin(items) {
  localStorage.setItem("sloposRecycleBin", JSON.stringify(items));
  updateRecycleBinIconLook();
}

function addToRecycleBin(meta) {
  if (meta.kind === "cookie") return;
  var bin = getRecycleBin();
  bin.push({
    label: meta.label,
    emoji: resolveEmoji(meta),
    key: meta.key,
    sourceKey: meta.sourceKey || meta.key,
    kind: meta.kind,
    builtinKind: meta.builtinKind || meta.kind,
    deletedAt: Date.now()
  });
  saveRecycleBin(bin);
}

function updateRecycleBinIconLook() {
  var binIcon = document.getElementById("recycleBinOpen");
  if (!binIcon) return;
  var img = binIcon.querySelector(".icon-img");
  if (!img) return;
  var count = getRecycleBin().length;
  img.textContent = count > 0 ? "🗑️" : "♻️";
}

// figure out what emoji an fs node gets. very scientific
function getFsIcon(node) {
  if (!node) return "❓";
  if (node.type === "dir") return "📁";
  if (node.type === "exe") return "⚙️";
  if (node.type === "game") return "🎮";
  if (node.name && node.name.indexOf(".dll") !== -1) return "🐸";
  if (node.name && node.name.indexOf(".ini") !== -1) return "⚙️";
  return "📄";
}

// open exes/files from explorer. shared brain cell
function launchVirtualItem(node, pathArr) {
  if (!node) {
    playBeep();
    alert("SlopOS cannot find the file. (it was never there)");
    return;
  }

  if (node.type === "dir") {
    explorerHistory.push(explorerPath.slice());
    openExplorerAt(pathArr);
    return;
  }

  if (node.type === "exe") {
    var winEl = document.getElementById(node.windowId);
    if (winEl) {
      openWindow(winEl);
      if (node.initFn) node.initFn();
    }
    return;
  }

  if (node.type === "game" && node.name === "Adventure.slop") {
    openWindow(terminalWin);
    initTerminal();
    setTimeout(function() {
      startAdventureGame();
    }, 400);
    return;
  }

  if (node.type === "file") {
    openNotepad(node.name, node.content || "");
    return;
  }

  playBeep();
  alert("Windows cannot open this program.\n\nLICENCE_NOT_FOUND");
}

// --- MY COMPUTER (the holy grail of 1998) ---

function openMyComputer() {
  openWindow(myComputerWin);
  renderMyComputer();
}

function renderMyComputer() {
  var grid = document.getElementById("myCompGrid");
  var status = document.getElementById("myCompStatus");
  if (!grid) return;

  // these are hardcoded bc my computer never lied (it did)
  var items = [
    { label: "3½ Floppy (A:)", icon: "💾", broken: true, action: function() {
      alert("The device is not ready.\n\nNo floppy disk in drive A:.\n\n(there never will be)");
    }},
    { label: "(C:)", icon: "💽", action: function() {
      openExplorerAt(["C:"]);
    }},
    { label: "CD-ROM (D:)", icon: "📀", broken: true, action: function() {
      alert("Please insert a disc into drive D:\n\n...still waiting...\n\n...any day now...");
    }},
    { label: "Control Panel", icon: "🎛️", action: openControlPanel },
    { label: "Recycle Bin", icon: getRecycleBin().length > 0 ? "🗑️" : "♻️", action: openRecycleBin },
    { label: "Network Neighborhood", icon: "🌐", broken: true, action: function() {
      alert("Network cable unplugged.\nSlopFi adapter: DISCONNECTED\n\nhave u tried turning it off and on");
    }}
  ];

  grid.innerHTML = "";
  items.forEach(function(item) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mycomp-item" + (item.broken ? " mycomp-item-broken" : "");
    btn.innerHTML = '<span class="mycomp-icon">' + item.icon + '</span><span>' + item.label + '</span>';
    btn.addEventListener("click", item.action);
    grid.appendChild(btn);
  });

  if (status) {
    status.textContent = items.length + " object(s) (probably)";
  }
}

// --- EXPLORER (tree is decorative. shhh.) ---

function openExplorerAt(pathArr) {
  explorerPath = pathArr.slice();
  openWindow(explorerWin);
  renderExplorer();
}

function renderExplorer() {
  if (!explorerFiles) return;

  var node = getNodeAtPath(explorerPath);
  var pathStr = explorerPath.join("\\");
  if (explorerPath.length === 1) pathStr = "C:\\";

  if (explorerAddress) explorerAddress.textContent = pathStr;
  if (explorerTitle) explorerTitle.textContent = "Exploring - " + pathStr;
  if (managedWindows.explorerWin) managedWindows.explorerWin.title = explorerTitle.textContent;

  // fake tree. looks like a tree. is lies.
  if (explorerTree) {
    explorerTree.innerHTML = "";
    var treePaths = [
      ["C:"],
      ["C:", "Desktop"],
      ["C:", "Windows"],
      ["C:", "Program Files"]
    ];
    treePaths.forEach(function(tp) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tree-item";
      var label = tp.join("\\");
      if (tp.length === 1) label = "C:\\";
      btn.textContent = "📁 " + label;
      if (tp.join("/") === explorerPath.join("/")) {
        btn.classList.add("tree-active");
      }
      btn.addEventListener("click", function() {
        explorerHistory.push(explorerPath.slice());
        openExplorerAt(tp);
      });
      explorerTree.appendChild(btn);
    });
  }

  explorerFiles.innerHTML = "";

  if (!node || node.type !== "dir" || !node.children) {
    explorerFiles.innerHTML = '<p style="font-size:11px;color:#800000;">folder not found. skill issue.</p>';
    if (explorerStatus) explorerStatus.textContent = "0 object(s)";
    return;
  }

  var names = Object.keys(node.children).sort();
  names.forEach(function(name) {
    var child = node.children[name];
    var childPath = explorerPath.concat([name]);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "explorer-file-item";
    btn.innerHTML = '<span class="explorer-file-icon">' + getFsIcon(child) + '</span><span>' + name + '</span>';
    btn.addEventListener("dblclick", function() {
      launchVirtualItem(child, childPath);
    });
  btn.addEventListener("click", function() {
      // single click does nothing useful. just like real windows 95
      if (explorerStatus) explorerStatus.textContent = "1 object(s) selected (maybe)";
    });
    explorerFiles.appendChild(btn);
  });

  if (explorerStatus) {
    explorerStatus.textContent = names.length + " object(s)";
  }
}

// --- NOTEPAD (professional word processing) ---

function openNotepad(name, content) {
  openWindow(notepadWin);
  notepadFileName = name || "Untitled";
  notepadDirty = false;
  if (notepadTitle) {
    notepadTitle.textContent = notepadFileName + " - Notepad";
  }
  if (managedWindows.notepadWin) {
    managedWindows.notepadWin.title = notepadTitle.textContent;
  }
  if (notepadArea) {
    notepadArea.value = content || "";
    notepadArea.classList.remove("corrupted");
  }
}

function openNotepadWithContent(name, content) {
  openNotepad(name, content);
}

// --- CALCULATOR (math optional) ---

function openCalculator() {
  openWindow(calcWin);
  if (!calcGrid || calcGrid.dataset.wired) return;

  calcGrid.dataset.wired = "true";
  var keys = [
    "7", "8", "9", "/",
    "4", "5", "6", "*",
    "1", "2", "3", "-",
  "0", ".", "=", "+"
  ];

  keys.forEach(function(k) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "calc-key";
    btn.textContent = k;
    btn.addEventListener("click", function() {
      handleCalcKey(k);
    });
    calcGrid.appendChild(btn);
  });

  var clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "calc-key calc-key-wide";
  clearBtn.textContent = "C";
  clearBtn.addEventListener("click", function() {
    calcValue = "0";
    calcPrev = null;
    calcOp = null;
    if (calcDisplay) calcDisplay.value = "0";
  });
  calcGrid.appendChild(clearBtn);
}

function handleCalcKey(k) {
  if (!calcDisplay) return;

  if (k >= "0" && k <= "9" || k === ".") {
    if (calcValue === "0" && k !== ".") {
      calcValue = k;
    } else {
      calcValue += k;
    }
    calcDisplay.value = calcValue;
    return;
  }

  if (k === "=") {
    if (calcPrev !== null && calcOp) {
      var a = parseFloat(calcPrev);
      var b = parseFloat(calcValue);
      var result = 0;

      if (calcOp === "+") result = a + b;
      else if (calcOp === "-") result = a - b;
      else if (calcOp === "*") result = a * b;
      else if (calcOp === "/") result = b === 0 ? Infinity : a / b;

      // 30% chance wrong answer. authentic windows experience
      if (Math.random() < 0.3) {
        result = result + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 9) + 1);
        if (calcDisplay) calcDisplay.style.color = "#800000";
        setTimeout(function() {
          if (calcDisplay) calcDisplay.style.color = "#000";
        }, 800);
      }

      calcValue = String(result);
      if (calcValue.length > 10) calcValue = "E+" + Math.floor(Math.random() * 99);
      calcDisplay.value = calcValue;
      calcPrev = null;
      calcOp = null;
    }
    return;
  }

  // operator
  calcPrev = calcValue;
  calcValue = "0";
  calcOp = k;
}

// --- RECYCLE BIN (landfill simulator) ---

function openRecycleBin() {
  openWindow(recycleBinWin);
  renderRecycleBin();
}

function renderRecycleBin() {
  if (!recycleList) return;
  var bin = getRecycleBin();
  recycleList.innerHTML = "";

  if (bin.length === 0) {
    recycleList.innerHTML = '<p class="recycle-empty-msg">Recycle Bin is empty.\n\nfor now.</p>';
  } else {
    bin.forEach(function(item, idx) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "recycle-item";
      btn.innerHTML = '<span style="font-size:28px">' + item.emoji + '</span><span>' + item.label + '</span>';
      btn.addEventListener("click", function() {
        // restore is broken 50% of the time. eco friendly
        if (Math.random() < 0.5) {
          alert("Cannot restore " + item.label + ".\n\nFile is corrupted by slop.");
          return;
        }
        var newBin = getRecycleBin();
        var restored = newBin.splice(idx, 1)[0];
        saveRecycleBin(newBin);

        var hidden = getHiddenIcons().filter(function(k) {
          return k !== restored.key;
        });
        localStorage.setItem("sloposHiddenIcons", JSON.stringify(hidden));

        // respawn if builtin got deleted
        if (restored.kind === "builtin" || restored.kind === "decoy") {
          location.reload(); // lazy restore. works tho
          return;
        }

        renderRecycleBin();
        alert(restored.label + " restored!\n\n(jk its probably fine)");
      });
      recycleList.appendChild(btn);
    });
  }

  var st = document.getElementById("recycleStatus");
  if (st) st.textContent = bin.length + " item(s) rotting";
}

// --- CONTROL PANEL (everything is placebo) ---

function openControlPanel() {
  openWindow(controlPanelWin);
  var grid = document.getElementById("cpanelGrid");
  if (!grid || grid.dataset.wired) return;

  grid.dataset.wired = "true";
  var applets = [
    { icon: "🖼️", name: "Display", action: function() {
      alert("Display Properties\n\nWallpaper: slop.jpg\nResolution: yes\nColor: too many\n\n[Apply] does nothing\n[OK] also does nothing");
    }},
    { icon: "🖱️", name: "Mouse", action: function() {
      alert("Mouse Properties\n\nPointer speed: ████████░░ (unadjustable)\nDouble-click speed: too fast");
    }},
    { icon: "🔊", name: "Sounds", action: function() {
      playBeep();
      alert("*BEEP*\n\nThat was the sound preview. ur welcome.");
    }},
    { icon: "📦", name: "Add/Remove Programs", action: function() {
      alert("Installed Programs:\n\n- SlopOS v0.0.0.67 (required)\n- Clippy (cannot uninstall)\n- Regret (system component)");
    }},
    { icon: "⚙️", name: "System", action: function() {
      showWinver();
    }},
    { icon: "📅", name: "Date/Time", action: function() {
      alert("Date/Time Properties\n\nCurrent time: " + new Date().toLocaleString() + "\n\nTime zone: Slop Standard Time (SST)\n\n[OK] sets wrong time");
    }}
  ];

  applets.forEach(function(app) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cpanel-item";
    btn.innerHTML = '<span class="cpanel-item-icon">' + app.icon + '</span><span>' + app.name + '</span>';
    btn.addEventListener("click", app.action);
    grid.appendChild(btn);
  });
}

function showWinver() {
  var old = document.querySelector(".winver-popup");
  if (old) old.remove();

  var pop = document.createElement("div");
  pop.className = "winver-popup";
  pop.style.top = "30%";
  pop.style.left = "35%";
  pop.innerHTML =
    "<h3>About SlopOS</h3>" +
    "<p>Microsoft Windows... wait no</p>" +
    "<p><b>SlopOS</b><br>Version 0.0.0.67 (Build 1995)</p>" +
    "<p>Copyright © Slop Corporation.<br>All rights reversed.</p>" +
    "<p>This product is licensed to:<br><b>u (probably)</b></p>" +
    "<p style='font-size:9px;color:#808080'>Physical memory: 64MB<br>Virtual memory: vibes</p>" +
    '<button type="button" class="classic-btn winver-ok">OK</button>';
  document.body.appendChild(pop);
  pop.querySelector(".winver-ok").addEventListener("click", function() {
    pop.remove();
  });
}

// --- RUN DIALOG (win+r) ---

function showRunDialog() {
  if (!runOverlay) return;
  runOverlay.style.display = "flex";
  if (runInput) {
    runInput.value = "";
    runInput.focus();
  }
  var hint = document.getElementById("runHint");
  if (hint) hint.textContent = "";
}

function hideRunDialog() {
  if (runOverlay) runOverlay.style.display = "none";
}

function executeRun(cmd) {
  var raw = (cmd || "").trim();
  var lower = raw.toLowerCase();
  hideRunDialog();

  if (!raw) {
    playBeep();
    return;
  }

  // map classic run commands to slop
  if (lower === "rickroll" || lower === "never gonna give you up") {
    goRickroll();
    return;
  }
  if (lower === "cmd" || lower === "command.com" || lower === "command") {
    openWindow(terminalWin);
    initTerminal();
    return;
  }
  if (lower === "notepad" || lower === "notepad.exe") {
    openNotepad();
    return;
  }
  if (lower === "calc" || lower === "calc.exe" || lower === "calculator") {
    openCalculator();
    return;
  }
  if (lower === "mspaint" || lower === "sloppaint" || lower === "sloppaint.exe") {
    openWindow(sloppypaintWin);
    initSlopPaint();
    return;
  }
  if (lower === "memes.dll" || lower === "memes") {
    openWindow(memesWin);
    initMemes();
    return;
  }
  if (lower === "explorer" || lower === "explorer.exe") {
    openExplorerAt(["C:", "Desktop"]);
    return;
  }
  if (lower === "control" || lower === "control panel") {
    openControlPanel();
    return;
  }
  if (lower === "winver") {
    showWinver();
    return;
  }
  if (lower === "shutdown" || lower === "shut down") {
    showShutdownDialog();
    return;
  }
  if (lower.indexOf("format") !== -1) {
    triggerBSOD("ERROR_DRIVE_FORMAT_IMMINENT");
    return;
  }
  if (lower === "clippy") {
    showClippyAgain();
    return;
  }

  // 20% chance any unknown command works and opens notepad with the command as text
  if (Math.random() < 0.2) {
    openNotepad(raw + ".txt", "u typed: " + raw + "\n\nidk what this is but slopos opened it anyway");
    return;
  }

  playBeep();
  alert("Windows cannot find '" + raw + "'.\n\nMake sure you typed the name correctly, and then try again.\n\n(or dont. we dont care)");
}

// --- SHUT DOWN DIALOG ---

function showShutdownDialog() {
  if (shutdownOverlay) shutdownOverlay.style.display = "flex";
}

function hideShutdownDialog() {
  if (shutdownOverlay) shutdownOverlay.style.display = "none";
}

function executeShutdown() {
  var pick = document.querySelector('input[name="shutdownPick"]:checked');
  var mode = pick ? pick.value : "standby";
  hideShutdownDialog();
  hideStartMenu();

  // every exit route gets the sad falling ta-daa
  if (mode === "restart" || mode === "shutdown" || mode === "standby") {
    playShutdownJingle();
  }

  if (mode === "restart") {
    triggerBSOD("ERROR_USER_REQUESTED_RESTART");
    return;
  }

  if (mode === "shutdown") {
    if (safeShutdownOverlay) {
      safeShutdownOverlay.style.display = "flex";
      safeShutdownOverlay.onclick = function() {
        safeShutdownOverlay.style.display = "none";
        safeShutdownOverlay.onclick = null;
      };
    }
    return;
  }

  if (mode === "standby") {
    if (standbyOverlay) {
      standbyOverlay.style.display = "flex";
      var wake = function() {
        standbyOverlay.style.display = "none";
        document.removeEventListener("mousemove", wake);
        document.removeEventListener("keydown", wake);
        alert("welcome back from standby.\n\nnothing changed. u still have slop.");
      };
      document.addEventListener("mousemove", wake);
      document.addEventListener("keydown", wake);
    }
    return;
  }

  if (mode === "logoff") {
    alert("No other users configured.\n\nu are stuck with yourself forever.");
  }
}

// wire up all the buttons once. lazy init gang
function wireClassicWindows() {
  if (classicWired) return;
  classicWired = true;

  var explorerUp = document.getElementById("explorerUp");
  var explorerBack = document.getElementById("explorerBack");
  if (explorerUp) {
    explorerUp.addEventListener("click", function() {
      if (explorerPath.length > 1) {
        explorerHistory.push(explorerPath.slice());
        openExplorerAt(explorerPath.slice(0, -1));
      } else {
        playBeep();
      }
    });
  }
  if (explorerBack) {
    explorerBack.addEventListener("click", function() {
      if (explorerHistory.length > 0) {
        var prev = explorerHistory.pop();
        openExplorerAt(prev);
      } else {
        playBeep();
        alert("Nowhere to go back to.\n\njust like your ex");
      }
    });
  }

  var recycleEmptyBtn = document.getElementById("recycleEmptyBtn");
  if (recycleEmptyBtn) {
    recycleEmptyBtn.addEventListener("click", function() {
      if (getRecycleBin().length === 0) {
        alert("Recycle Bin is already empty.");
        return;
      }
      if (confirm("Are you sure you want to permanently delete these " + getRecycleBin().length + " items?\n\n(jk we keep a backup in the cloud)")) {
        saveRecycleBin([]);
        renderRecycleBin();
        // easter egg: emptying bin duplicates a random icon instead
        if (Math.random() < 0.4) {
          var keys = Object.keys(iconRegistry);
          if (keys.length > 0) {
            var rk = keys[Math.floor(Math.random() * keys.length)];
            duplicateIcon(iconRegistry[rk].el, iconRegistry[rk].meta);
            alert("Recycle Bin emptied!\n\n...also something came back. oops.");
          }
        }
      }
    });
  }

  var recycleRestoreAllBtn = document.getElementById("recycleRestoreAllBtn");
  if (recycleRestoreAllBtn) {
    recycleRestoreAllBtn.addEventListener("click", function() {
      alert("Restore All is not implemented.\n\nError code: SLOP_NOT_FOUND");
      playBeep();
    });
  }

  if (runInput) {
    runInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") executeRun(runInput.value);
      if (e.key === "Escape") hideRunDialog();
    });
    runInput.addEventListener("input", function() {
      var hint = document.getElementById("runHint");
      if (!hint) return;
      var v = runInput.value.toLowerCase();
      if (v === "format c:") hint.textContent = "bro dont";
      else if (v === "rickroll") hint.textContent = "u know what ur doing";
      else hint.textContent = "";
    });
  }

  var runOkBtn = document.getElementById("runOkBtn");
  var runCancelBtn = document.getElementById("runCancelBtn");
  var runBrowseBtn = document.getElementById("runBrowseBtn");
  if (runOkBtn) runOkBtn.addEventListener("click", function() { executeRun(runInput.value); });
  if (runCancelBtn) runCancelBtn.addEventListener("click", hideRunDialog);
  if (runBrowseBtn) {
    runBrowseBtn.addEventListener("click", function() {
      alert("Browse is not available.\n\nSlopOS knows what u want. trust the process.");
    });
  }

  var shutdownOkBtn = document.getElementById("shutdownOkBtn");
  var shutdownCancelBtn = document.getElementById("shutdownCancelBtn");
  var shutdownHelpBtn = document.getElementById("shutdownHelpBtn");
  if (shutdownOkBtn) shutdownOkBtn.addEventListener("click", executeShutdown);
  if (shutdownCancelBtn) shutdownCancelBtn.addEventListener("click", hideShutdownDialog);
  if (shutdownHelpBtn) {
    shutdownHelpBtn.addEventListener("click", function() {
      alert("Help is not available for Shut Down.\n\nFigure it out.");
    });
  }

  // notepad menus that dont menu
  document.querySelectorAll(".menu-fake").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var which = btn.dataset.np;
      if (which === "file") {
        if (Math.random() < 0.5) {
          alert("Save failed.\n\nDisk full. (its not. we just felt like it)");
        } else {
          if (notepadArea && Math.random() < 0.15) {
            notepadArea.classList.add("corrupted");
            notepadArea.value = notepadArea.value.split("").sort(function() {
              return Math.random() - 0.5;
            }).join("");
          }
          alert("File saved to C:\\Windows\\System32\\important.txt\n\n(totally real location)");
        }
      } else if (which === "edit") {
        if (notepadArea) {
          notepadArea.value += "\n[edited by slop]";
        }
      } else if (which === "search") {
        alert("Search: function not found");
      } else if (which === "help") {
        showClippyAgain();
      }
    });
  });

  updateRecycleBinIconLook();
}

wireClassicWindows();


// ==========================================
// SCREENSAVER — the bouncing logo that never hits the corner
// ==========================================

var screensaverEl = document.getElementById("screensaver");
var saverLogo = document.getElementById("saverLogo");
var saverIdleMs = 30000; // leave it alone for 30s and it takes over
var saverIdleTimer = null;
var saverAnimId = null;
var saverActive = false;

// pool of colors it cycles through every time it smacks a wall
var saverColors = ["#00ff66", "#00d9ff", "#ff5eae", "#ffd400", "#a855ff", "#ff6a00"];
var saverColorIdx = 0;

var saverPos = { x: 120, y: 120, vx: 2.4, vy: 2.0 };

function startSaverIdleTimer() {
  clearTimeout(saverIdleTimer);
  saverIdleTimer = setTimeout(showScreensaver, saverIdleMs);
}

function showScreensaver() {
  if (saverActive) return;
  // dont pop it over a bsod or a boot screen, thatd be rude
  var bsod = document.getElementById("bsodScreen");
  if (bsod && bsod.style.display !== "none") return;

  saverActive = true;
  screensaverEl.style.display = "block";

  // start somewhere random so it isnt the same every time
  saverPos.x = 80 + Math.random() * 200;
  saverPos.y = 80 + Math.random() * 160;
  saverPos.vx = Math.random() < 0.5 ? 2.4 : -2.4;
  saverPos.vy = Math.random() < 0.5 ? 2.0 : -2.0;

  saverStep();
}

function hideScreensaver() {
  if (!saverActive) return;
  saverActive = false;
  screensaverEl.style.display = "none";
  cancelAnimationFrame(saverAnimId);
  startSaverIdleTimer();
}

function saverStep() {
  var maxX = window.innerWidth - saverLogo.offsetWidth;
  var maxY = window.innerHeight - saverLogo.offsetHeight;

  saverPos.x += saverPos.vx;
  saverPos.y += saverPos.vy;

  var bouncedX = false;
  var bouncedY = false;

  if (saverPos.x <= 0) { saverPos.x = 0; saverPos.vx *= -1; bouncedX = true; }
  else if (saverPos.x >= maxX) { saverPos.x = maxX; saverPos.vx *= -1; bouncedX = true; }

  if (saverPos.y <= 0) { saverPos.y = 0; saverPos.vy *= -1; bouncedY = true; }
  else if (saverPos.y >= maxY) { saverPos.y = maxY; saverPos.vy *= -1; bouncedY = true; }

  // the whole bit: if its about to nail the corner, cheat and nudge it away
  if (bouncedX && bouncedY) {
    saverPos.vy += (Math.random() < 0.5 ? 0.9 : -0.9);
    saverPos.y += saverPos.vy * 3;
  }

  if (bouncedX || bouncedY) {
    saverColorIdx = (saverColorIdx + 1) % saverColors.length;
    saverLogo.style.color = saverColors[saverColorIdx];
  }

  saverLogo.style.left = saverPos.x + "px";
  saverLogo.style.top = saverPos.y + "px";

  saverAnimId = requestAnimationFrame(saverStep);
}

// any sign of life resets the idle clock, and wakes it if its already up
function pokeActivity() {
  if (saverActive) {
    hideScreensaver();
  } else {
    startSaverIdleTimer();
  }
}

["mousemove", "mousedown", "keydown", "touchstart", "wheel"].forEach(function(evt) {
  document.addEventListener(evt, pokeActivity, { passive: true });
});

startSaverIdleTimer();


// ==========================================
// SLOP TASK MANAGER — end the tasks that were never running
// ==========================================

var taskMgrWin = document.getElementById("taskMgrWin");
var taskMgrList = document.getElementById("taskMgrList");
var taskMgrEndBtn = document.getElementById("taskMgrEndBtn");
var taskMgrSwitchBtn = document.getElementById("taskMgrSwitchBtn");
var taskMgrNewBtn = document.getElementById("taskMgrNewBtn");
var taskMgrProcCount = document.getElementById("taskMgrProcCount");
var taskMgrCpu = document.getElementById("taskMgrCpu");
var taskMgrMem = document.getElementById("taskMgrMem");
var taskMgrSelId = null;
var taskMgrStatTimer = null;

// ghost processes that are always there, doing nothing, forever
var taskMgrGhosts = [
  { id: "ghost_slop", name: "slop.exe", status: "Not Responding", hung: true },
  { id: "ghost_clippy", name: "clippy_daemon.exe", status: "Running", hung: false },
  { id: "ghost_explorer", name: "explorer.slop", status: "Running", hung: false }
];

function openTaskManager() {
  openWindow(taskMgrWin);
  renderTaskMgr();
  if (!taskMgrStatTimer) {
    taskMgrStatTimer = setInterval(tickTaskMgrStats, 1200);
  }
}

// collect the real open windows plus the fake processes that never close
function collectTasks() {
  var tasks = [];
  Object.keys(managedWindows).forEach(function(id) {
    var w = managedWindows[id];
    // it counts as a task if it has a taskbar button (ie its open somewhere)
    if (w.taskBtn && id !== "taskMgrWin") {
      tasks.push({
        id: id,
        name: w.title,
        status: "Running",
        hung: false,
        real: true
      });
    }
  });
  taskMgrGhosts.forEach(function(g) {
    tasks.push({ id: g.id, name: g.name, status: g.status, hung: g.hung, real: false });
  });
  return tasks;
}

function renderTaskMgr() {
  var tasks = collectTasks();
  taskMgrList.innerHTML = "";

  tasks.forEach(function(t) {
    var row = document.createElement("div");
    row.className = "taskmgr-row";
    if (t.hung) row.classList.add("taskmgr-hung");
    if (t.id === taskMgrSelId) row.classList.add("taskmgr-sel");
    row.dataset.taskId = t.id;

    var name = document.createElement("span");
    name.className = "taskmgr-name";
    name.textContent = t.name;

    var stat = document.createElement("span");
    stat.className = "taskmgr-stat";
    stat.textContent = t.status;

    row.appendChild(name);
    row.appendChild(stat);

    row.addEventListener("click", function() {
      taskMgrSelId = t.id;
      renderTaskMgr();
    });

    taskMgrList.appendChild(row);
  });

  taskMgrProcCount.textContent = "Processes: " + (tasks.length + 14);
}

// numbers that mean absolutely nothing but jitter convincingly
function tickTaskMgrStats() {
  if (taskMgrWin.style.display === "none") return;
  var cpu = 40 + Math.floor(Math.random() * 60); // always suspiciously busy
  taskMgrCpu.textContent = "CPU Usage: " + cpu + "%";
  var mem = 40 + Math.floor(Math.random() * 600);
  taskMgrMem.textContent = "Mem: " + mem + "K free";
  // occasionally re-render so the ghost statuses drift and windows sync up
  if (Math.random() < 0.4) renderTaskMgr();
}

taskMgrEndBtn.addEventListener("click", function() {
  if (!taskMgrSelId) {
    alert("pick a task first. or dont, i cant end nothing");
    return;
  }

  // ending slop.exe is a war crime, the whole thing goes down
  if (taskMgrSelId === "ghost_slop") {
    triggerBSOD("ERROR_YOU_ENDED_THE_WRONG_TASK");
    taskMgrSelId = null;
    return;
  }

  // ending a ghost just makes it come back offended
  var ghost = taskMgrGhosts.filter(function(g) { return g.id === taskMgrSelId; })[0];
  if (ghost) {
    alert(ghost.name + " cannot be ended. it lives here now.");
    ghost.status = "Not Responding";
    ghost.hung = true;
    renderTaskMgr();
    return;
  }

  // a real window? fine, actually close it
  var w = managedWindows[taskMgrSelId];
  if (w) {
    closeWindow(w.el);
  }
  taskMgrSelId = null;
  renderTaskMgr();
});

taskMgrSwitchBtn.addEventListener("click", function() {
  if (!taskMgrSelId) return;
  var w = managedWindows[taskMgrSelId];
  if (w && w.taskBtn) {
    restoreWindow(w.el);
    bringToFront(w.el);
    setActiveWin(taskMgrSelId);
  } else {
    alert("cannot switch to a task that was never real");
  }
});

taskMgrNewBtn.addEventListener("click", function() {
  showRunDialog();
});

// ctrl+shift+esc — the actual task manager shortcut the browser will let us keep
document.addEventListener("keydown", function(e) {
  if (e.ctrlKey && e.shiftKey && (e.key === "Escape" || e.key === "Esc")) {
    e.preventDefault();
    openTaskManager();
  }
});


// ==========================================
// SLOP UPDATE NAG — the restart countdown you can only ever postpone
// ==========================================

var updateNag = document.getElementById("updateNag");
var updateNagTime = document.getElementById("updateNagTime");
var updateNagX = document.getElementById("updateNagX");
var updateNagPostpone = document.getElementById("updateNagPostpone");
var updateNagNow = document.getElementById("updateNagNow");
var updateNagSecs = 300; // five whole minutes of freedom
var updateNagTick = null;
var updateNagVisible = false;

function fmtNagTime(secs) {
  var m = Math.floor(secs / 60);
  var s = secs % 60;
  return m + ":" + (s < 10 ? "0" : "") + s;
}

function showUpdateNag() {
  if (updateNagVisible) return;
  // dont pop over a crash or the screensaver, let the poor user rest
  var bsod = document.getElementById("bsodScreen");
  if (bsod && bsod.style.display !== "none") return;
  if (saverActive) return;

  updateNagVisible = true;
  updateNagSecs = 300;
  updateNagTime.textContent = fmtNagTime(updateNagSecs);
  updateNag.style.display = "block";
  playTone(880, 0.14, "sine", 0, 0.07); // the little notification ding

  updateNagTick = setInterval(function() {
    updateNagSecs--;
    updateNagTime.textContent = fmtNagTime(updateNagSecs);
    if (updateNagSecs <= 0) {
      // time is up. it warned you. it always warned you
      hideUpdateNag();
      triggerBSOD("ERROR_UPDATE_INSTALLED_ITSELF_ANYWAY");
    }
  }, 1000);
}

function hideUpdateNag() {
  updateNagVisible = false;
  updateNag.style.display = "none";
  clearInterval(updateNagTick);
  updateNagTick = null;
}

// postpone just slaps the clock back to five minutes. forever
function postponeUpdate() {
  updateNagSecs = 300;
  updateNagTime.textContent = fmtNagTime(updateNagSecs);
  hideUpdateNag();
  // and it will absolutely come back to bother you again soon
  scheduleNextNag();
}

function scheduleNextNag() {
  // pester again somewhere between 45s and 2 minutes later
  var delay = 45000 + Math.random() * 75000;
  setTimeout(showUpdateNag, delay);
}

updateNagPostpone.addEventListener("click", postponeUpdate);

// the x button pretends to close but really just postpones. classic
updateNagX.addEventListener("click", postponeUpdate);

updateNagNow.addEventListener("click", function() {
  hideUpdateNag();
  triggerBSOD("ERROR_USER_ACTUALLY_CLICKED_RESTART");
});

// first nag shows up a little while after youre settled in
setTimeout(showUpdateNag, 40000);

