// grab the stuff we need
var welcomeWin = document.querySelector("#welcome");
var desktopOpen = document.querySelector("#welcomeDesktopOpen");
var feedbackOpen = document.getElementById("feedbackOpen");
var clockEl = document.querySelector("#timeElement");
var taskbarApps = document.getElementById("taskbarApps");
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

if (organizeIconsBtn) {
  organizeIconsBtn.addEventListener("click", organizeDesktopIcons);
}

trayWifi.addEventListener("click", function() {
  alert("connected to SlopFi_5G. trust.");
});

trayBattery.addEventListener("click", function() {
  alert("3% — good luck");
});

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

migrateOldFeedback();
loadFeedbackIcons();

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
        // tick up the RAM slowly for maximum suspense
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
                    // hard refresh to clear the slop and start fresh
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

