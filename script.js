// grab the stuff we need
var welcomeWin = document.querySelector("#welcome");
var closeBtn = document.querySelector("#welcomeclose");
var openBtn = document.querySelector("#welcomeopen");
var desktopOpen = document.querySelector("#welcomeDesktopOpen");
var feedbackOpen = document.getElementById("feedbackOpen");
var clockEl = document.querySelector("#timeElement");

// clock - updates every second
function updateTime() {
  clockEl.textContent = new Date().toLocaleString();
}

updateTime();
setInterval(updateTime, 1000);


// cookie banner on load
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
});

cookieNo.addEventListener("click", function() {
  hideCookieBox();
});


// open / close windows
function closeWindow(el) {
  el.style.display = "none";
}

function openWindow(el) {
  el.style.display = "flex";
  bringToFront(el);
}

function bringToFront(el) {
  document.querySelectorAll(".window").forEach(function(w) {
    w.style.zIndex = "10";
  });
  el.style.zIndex = "20";
}


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
var paperWinClose = document.getElementById("paperWinclose");
var iconsContainer = document.getElementById("icons");

dragElement(paperWin);

paperWinClose.addEventListener("click", function() {
  closeWindow(paperWin);
});

// --- desktop icons. drag anywhere, right-click delete, spin wheel ---

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
  var headerH = 50;
  var maxX = window.innerWidth - iconEl.offsetWidth - pad;
  var maxY = window.innerHeight - iconEl.offsetHeight - pad;
  var x = parseInt(iconEl.style.left, 10) || 0;
  var y = parseInt(iconEl.style.top, 10) || 0;

  if (x < pad) x = pad;
  if (y < headerH) y = headerH;
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

  icon.innerHTML =
    '<div class="icon-img">' + meta.emoji + "</div>" +
    '<p class="icon-text">' + meta.label + "</p>";

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

  var newKey = meta.key + "_dup_" + Date.now();
  var sourceKey = meta.sourceKey || meta.key;
  var extraMeta = {
    key: newKey,
    kind: "extra",
    sourceKey: sourceKey,
    builtinKind: meta.kind === "extra" ? meta.builtinKind : meta.kind,
    label: meta.label,
    emoji: meta.emoji,
    onTap: tapForSource(sourceKey)
  };

  var extras = getExtraIcons();
  extras.push({
    key: newKey,
    sourceKey: sourceKey,
    builtinKind: extraMeta.builtinKind,
    label: meta.label,
    emoji: meta.emoji,
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
});

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    hideIconMenu();
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
      emoji: ex.emoji,
      onTap: tapForSource(ex.sourceKey)
    }, top, left);
  });
}

// feedback app window
var feedbackWin = document.getElementById("feedback");
var feedbackClose = document.getElementById("feedbackclose");

setupBuiltInIcons();
loadExtraIcons();

closeBtn.addEventListener("click", function() {
  closeWindow(welcomeWin);
});

openBtn.addEventListener("click", function() {
  openWindow(welcomeWin);
});

feedbackClose.addEventListener("click", function() {
  closeWindow(feedbackWin);
});


// --- name typing with the slider bar ---

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

// add letter to name
addBtn.addEventListener("click", function() {
  if (typedName.length >= maxLen) return;

  var i = parseInt(letterBar.value);
  typedName += letters.charAt(i);

  nameSoFar.textContent = typedName.trim().length === 0 ? "_" : typedName;
  bootBtn.disabled = typedName.trim().length === 0;
});

// remove last letter
undoBtn.addEventListener("click", function() {
  if (typedName.length === 0) return;

  typedName = typedName.slice(0, -1);
  nameSoFar.textContent = typedName.length === 0 ? "_" : typedName;
  bootBtn.disabled = typedName.trim().length === 0;
});

// done, hide the form show welcome msg
bootBtn.addEventListener("click", function() {
  var name = typedName.trim();
  if (name.length === 0) return;

  finalName.textContent = name;
  entryBox.style.display = "none";
  doneBox.style.display = "block";

  localStorage.setItem("sloposUser", name);
});


// --- change background button (fake) ---
// does nothing until they click 5 times then error

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

// ok button runs away when you hover it
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


// --- feedback app. mouth eats your text ---

var mouth = document.getElementById("mouth");
var mouthHole = document.getElementById("mouthHole");
var mouthHint = document.getElementById("mouthHint");
var feedbackText = document.getElementById("feedbackText");
var feedBtn = document.getElementById("feedBtn");
var feedDone = document.getElementById("feedDone");

var mouthOpen = false;
var isChewing = false;
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

// click mouth to open it and type
mouthHole.addEventListener("click", function(e) {
  if (isChewing) return;
  if (mouthOpen) return;

  mouthOpen = true;
  mouth.classList.add("open");
  feedBtn.style.display = "block";
  feedbackText.focus();
});

// dont bubble clicks from textarea
feedbackText.addEventListener("click", function(e) {
  e.stopPropagation();
});

// feed button - chew then done
feedBtn.addEventListener("click", function() {
  var text = feedbackText.value.trim();
  if (text.length === 0 || isChewing) return;

  isChewing = true;
  feedBtn.style.display = "none";
  feedbackText.style.display = "none";
  mouth.classList.add("chewing");
  startMouthJump();

  // chomp for a bit then show eaten msg
  setTimeout(function() {
    stopMouthJump();
    mouth.classList.remove("chewing");
    mouth.classList.remove("open");
    feedDone.style.display = "block";

    // spit feedback out as a desktop file icon
    addFeedbackToDesktop(text);

    // reset after a few sec so they can feed again
    setTimeout(function() {
      feedDone.style.display = "none";
      feedbackText.value = "";
      feedbackText.style.display = "";
      mouthOpen = false;
      isChewing = false;
      mouthHint.style.display = "block";
    }, 3000);
  }, 1800);
});


// --- feedback files on desktop. mouth was just the delivery guy ---

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
  openWindow(paperWin);
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

function addFeedbackToDesktop(text) {
  var files = getFeedbackFiles();
  var file = {
    name: getNextFeedbackName(files),
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


// --- slop clippy. looks smart. is not ---

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
var clippyFrameMs = 1000;
var clippyHideMs = 180000;
var clippyThinking = false;
var clippyFrameTimer = null;
var clippyHideTimer = null;
var clippyFrameIndex = 0;

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
  stopClippyFrames();
  clippyAsk.style.display = "none";

  clippyMsg.textContent = "uhhh";

  setTimeout(function() {
    clippyMsg.textContent = "hummhmmm";
  }, 1200);

  setTimeout(function() {
    clippyMsg.textContent = "idk  lol";
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

migrateOldFeedback();
loadFeedbackIcons();

