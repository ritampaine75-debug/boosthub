(function () {
  "use strict";

  /*=============================================================================
   * FIREBASE CONFIG — BoostHub Realtime Database
   *===========================================================================*/
  const firebaseConfig = {
    apiKey: "AIzaSyCChxWVg-w1TiertkXlUrfUgcC19y-CPNw",
    authDomain: "hiiii-72d78.firebaseapp.com",
    databaseURL: "https://hiiii-72d78-default-rtdb.firebaseio.com",
    projectId: "hiiii-72d78",
    storageBucket: "hiiii-72d78.firebasestorage.app",
    messagingSenderId: "560685164053",
    appId: "1:560685164053:web:7f672f7503160ec868901c"
  };

  /*=============================================================================
   * LOCAL STORAGE KEYS
   *===========================================================================*/
  var KEYS = {
    UID: "boosthub_uid",
    WALLET: "boosthub_wallet",
    ORDERS: "boosthub_orders",
    TXNS: "boosthub_txns",
    THEME: "boosthub_theme",
    DARK: "boosthub_dark",
    LAST_SPIN: "boosthub_last_spin",
    CHAT: "boosthub_chat",
    ADMIN: "boosthub_admin",
    PAYZAPI_KEY: "boosthub_payzapi_key",
    PAYZAPI_WEBHOOK_SECRET: "boosthub_payzapi_webhook_secret"
  };

  /*=============================================================================
   * PAYZAPI PAYMENT GATEWAY INTEGRATION
   * Docs: https://payzapi.in/docs
   * Base URL: https://payzapi.in/api/v1
   *===========================================================================*/
  var PAYZAPI_BASE = "https://payzapi.in/api/v1";

  function getPayzapiKey() {
    return localStorage.getItem(KEYS.PAYZAPI_KEY) || "";
  }

  function setPayzapiKey(key) {
    localStorage.setItem(KEYS.PAYZAPI_KEY, key);
  }

  function createPayzapiOrder(amount, options) {
    var key = getPayzapiKey();
    if (!key) {
      return Promise.reject(new Error("PayZAPI API key not configured. Please set it in Admin Panel → Payment Settings."));
    }

    var uid = localStorage.getItem(KEYS.UID) || "BH-unknown";
    var payload = {
      amount: parseFloat(amount),
      payment_provider: (options && options.payment_provider) || "fampay",
      client_order_id: (options && options.client_order_id) || "INV-" + uid + "-" + Date.now(),
      customer_name: (options && options.customer_name) || "BoostHub User",
      customer_email: (options && options.customer_email) || "",
      redirect_url: (options && options.redirect_url) || (location.origin + "/addfunds/?status=success"),
      expiry_minutes: (options && options.expiry_minutes) || 15
    };

    return fetch(PAYZAPI_BASE + "/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key
      },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (txt) { throw new Error("PayZAPI error (" + res.status + "): " + txt); });
      }
      return res.json();
    });
  }

  function checkPayzapiOrder(orderId) {
    var key = getPayzapiKey();
    if (!key) {
      return Promise.reject(new Error("PayZAPI API key not configured."));
    }
    return fetch(PAYZAPI_BASE + "/check?order_id=" + encodeURIComponent(orderId), {
      method: "GET",
      headers: {
        "x-api-key": key
      }
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (txt) { throw new Error("PayZAPI check error (" + res.status + "): " + txt); });
      }
      return res.json();
    });
  }

  /*=============================================================================
   * ADMIN CONTROL (Creator Premium)
   *===========================================================================*/

  var REWARDS = [
    { label: "₹5", amount: 5, color: "#2563eb" },
    { label: "₹10", amount: 10, color: "#10b981" },
    { label: "₹2", amount: 2, color: "#f59e0b" },
    { label: "₹25", amount: 25, color: "#7c3aed" },
    { label: "₹0", amount: 0, color: "#64748b" },
    { label: "₹15", amount: 15, color: "#ec4899" },
    { label: "₹1", amount: 1, color: "#0ea5e9" },
    { label: "₹50", amount: 50, color: "#ef4444" }
  ];

  /*=============================================================================
   * FIREBASE REALTIME DATABASE (lazy init)
   *===========================================================================*/
  var firebase = null;
  var fbDb = null;
  var fbReady = false;

  function initFirebase() {
    if (typeof window.firebase === "undefined" || fbReady) return;
    firebase = window.firebase;
    try {
      firebase.initializeApp(firebaseConfig);
      fbDb = firebase.database();
      fbReady = true;
      console.log("[BoostHub] Firebase Realtime Database initialized");
    } catch (e) {
      console.error("[BoostHub] Firebase init error:", e);
    }
  }

  function fbPath(key) {
    return "boosthub/" + key;
  }

  function fbSet(path, val) {
    if (!fbReady) return Promise.resolve();
    return fbDb.ref(fbPath(path)).set(val);
  }

  function fbGet(path) {
    if (!fbReady) return Promise.resolve(null);
    return fbDb.ref(fbPath(path)).once("value").then(function (snap) {
      return snap.val();
    });
  }

  function fbPush(path, val) {
    if (!fbReady) return Promise.resolve();
    return fbDb.ref(fbPath(path)).push(val);
  }

  /*=============================================================================
   * LOCAL STORAGE HELPERS
   *===========================================================================*/
  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  function ensureUserId() {
    var uid = localStorage.getItem(KEYS.UID);
    if (!uid) {
      uid = "BH-" + Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem(KEYS.UID, uid);
    }
    try {
      var req = indexedDB.open("boosthub_db", 1);
      req.onupgradeneeded = function (ev) {
        var db = ev.target.result;
        if (!db.objectStoreNames.contains("profile")) {
          db.createObjectStore("profile");
        }
      };
      req.onsuccess = function (ev) {
        try {
          var tx = ev.target.result.transaction("profile", "readwrite");
          tx.objectStore("profile").put({ uid: uid, updatedAt: Date.now() }, "account");
        } catch (err) {}
      };
    } catch (e) {}
    // Sync to Firebase
    fbSet("users/" + uid, { uid: uid, createdAt: Date.now(), updatedAt: Date.now() });
    return uid;
  }

  function getBalance() {
    var n = parseFloat(localStorage.getItem(KEYS.WALLET) || "0");
    return isNaN(n) ? 0 : Math.max(0, n);
  }

  function setBalance(val) {
    var clean = Math.max(0, Math.round(Number(val) * 100) / 100);
    localStorage.setItem(KEYS.WALLET, clean.toFixed(2));
    syncWalletUI();
    var uid = localStorage.getItem(KEYS.UID);
    if (uid) fbSet("users/" + uid + "/wallet", { balance: clean, updatedAt: Date.now() });
    return clean;
  }

  function addTransaction(type, title, amount) {
    var txns = readJSON(KEYS.TXNS, []);
    txns.unshift({
      id: "TXN-" + Date.now().toString().slice(-6),
      type: type,
      title: title,
      amount: Number(amount),
      createdAt: new Date().toLocaleString()
    });
    writeJSON(KEYS.TXNS, txns.slice(0, 40));
    var uid = localStorage.getItem(KEYS.UID);
    if (uid) fbPush("transactions/" + uid, { type: type, title: title, amount: Number(amount), createdAt: new Date().toISOString() });
  }

  function formatINR(num) {
    return "₹" + Number(num || 0).toFixed(2);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function syncWalletUI() {
    var bal = formatINR(getBalance());
    var els = document.querySelectorAll("[data-wallet-balance]");
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = bal;
    }
  }

  /*=============================================================================
   * ADMIN CONTROL (Creator Premium)
   *===========================================================================*/
  function isAdmin() {
    return localStorage.getItem(KEYS.ADMIN) === "true";
  }

  function setAdmin(val) {
    localStorage.setItem(KEYS.ADMIN, val === true ? "true" : "false");
  }

  function adminLogin(password) {
    // Creator premium admin code — change this in production
    if (password === "boosthub_admin_2026") {
      setAdmin(true);
      fbSet("admin/sessions/" + Date.now(), { uid: localStorage.getItem(KEYS.UID), action: "login", at: new Date().toISOString() });
      return true;
    }
    return false;
  }

  function adminLogout() {
    setAdmin(false);
  }

  /*=============================================================================
   * THEME
   *===========================================================================*/
  function applyTheme(themeName, isDark) {
    var body = document.body;
    body.classList.remove("theme-blue", "theme-green", "theme-red", "theme-yellow", "theme-purple");
    if (themeName && themeName !== "blue") {
      body.classList.add("theme-" + themeName);
    }
    if (isDark) {
      body.classList.add("dark-theme");
    } else {
      body.classList.remove("dark-theme");
    }
    var swatches = document.querySelectorAll("[data-set-theme]");
    for (var i = 0; i < swatches.length; i++) {
      var t = swatches[i].getAttribute("data-set-theme");
      swatches[i].classList.toggle("active", !isDark && t === (themeName || "blue"));
    }
    var darkBtn = document.querySelector("[data-toggle-dark]");
    if (darkBtn) {
      darkBtn.classList.toggle("active", !!isDark);
    }
  }

  function initTheme() {
    var theme = localStorage.getItem(KEYS.THEME) || "blue";
    var dark = localStorage.getItem(KEYS.DARK) === "true";
    applyTheme(theme, dark);

    var swatches = document.querySelectorAll("[data-set-theme]");
    for (var i = 0; i < swatches.length; i++) {
      swatches[i].addEventListener("click", function () {
        var next = this.getAttribute("data-set-theme");
        localStorage.setItem(KEYS.THEME, next);
        localStorage.setItem(KEYS.DARK, "false");
        applyTheme(next, false);
        showToast("Theme updated: " + next.charAt(0).toUpperCase() + next.slice(1));
      });
    }

    var darkBtn = document.querySelector("[data-toggle-dark]");
    if (darkBtn) {
      darkBtn.addEventListener("click", function () {
        var nextDark = !(localStorage.getItem(KEYS.DARK) === "true");
        localStorage.setItem(KEYS.DARK, nextDark ? "true" : "false");
        applyTheme(localStorage.getItem(KEYS.THEME) || "blue", nextDark);
        showToast(nextDark ? "Dark mode enabled" : "Light mode enabled");
      });
    }
  }

  /*=============================================================================
   * TOAST
   *===========================================================================*/
  function showToast(message) {
    var el = document.getElementById("bh-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "bh-toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(function () {
      el.classList.remove("show");
    }, 2600);
  }

  /*=============================================================================
   * DEMO TICKER
   *===========================================================================*/
  function initTicker() {
    var tickerEl = document.getElementById("demo-ticker-text");
    if (!tickerEl) return;
    var items = [
      "Sample: Aarav S. ordered 500 Instagram Reels Views",
      "Sample: Priya K. ordered 250 Instagram Post Likes",
      "Sample: Kabir M. ordered 1,000 YouTube Video Views",
      "Sample: Neha R. ordered 200 Facebook Page Followers",
      "Sample: Rohan D. claimed ₹15 Daily Spin Bonus"
    ];
    var idx = 0;
    setInterval(function () {
      idx = (idx + 1) % items.length;
      tickerEl.textContent = items[idx];
    }, 3500);
  }

  /*=============================================================================
   * SPIN WHEEL
   *===========================================================================*/
  function buildWheelSVG() {
    var n = REWARDS.length;
    var cx = 120;
    var cy = 120;
    var r = 120;
    var sliceDeg = 360 / n;
    var svgParts = ['<svg viewBox="0 0 240 240" width="100%" height="100%">'];
    for (var i = 0; i < n; i++) {
      var startDeg = i * sliceDeg - 90;
      var endDeg = startDeg + sliceDeg;
      var startRad = (startDeg * Math.PI) / 180;
      var endRad = (endDeg * Math.PI) / 180;
      var x1 = cx + r * Math.cos(startRad);
      var y1 = cy + r * Math.sin(startRad);
      var x2 = cx + r * Math.cos(endRad);
      var y2 = cy + r * Math.sin(endRad);
      svgParts.push(
        '<path d="M' + cx + "," + cy + " L" + x1.toFixed(2) + "," + y1.toFixed(2) +
        " A" + r + "," + r + " 0 0,1 " + x2.toFixed(2) + "," + y2.toFixed(2) +
        ' Z" fill="' + REWARDS[i].color + '" stroke="#ffffff" stroke-width="2"/>'
      );
      var midDeg = startDeg + sliceDeg / 2;
      var midRad = (midDeg * Math.PI) / 180;
      var tx = cx + (r * 0.65) * Math.cos(midRad);
      var ty = cy + (r * 0.65) * Math.sin(midRad);
      svgParts.push(
        '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) +
        '" fill="#ffffff" font-size="14" font-weight="800" text-anchor="middle" dominant-baseline="middle" transform="rotate(' +
        (midDeg + 90).toFixed(1) + " " + tx.toFixed(1) + " " + ty.toFixed(1) + ')">' +
        REWARDS[i].label + "</text>"
      );
    }
    svgParts.push('<circle cx="120" cy="120" r="20" fill="#ffffff" stroke="#1e293b" stroke-width="4"/>');
    svgParts.push("</svg>");
    return svgParts.join("");
  }

  function initSpinModal() {
    var triggers = document.querySelectorAll("[data-open-spin]");
    if (!triggers.length) return;

    var modal = document.getElementById("spin-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "spin-modal";
      modal.className = "modal-backdrop";
      modal.innerHTML =
        '<div class="modal-card">' +
        '<button class="modal-close" type="button" aria-label="Close" data-close-spin>&times;</button>' +
        '<h3 style="margin:0 0 4px;font-size:1.25rem;">Daily Reward Wheel</h3>' +
        '<p style="margin:0;font-size:0.85rem;color:var(--muted);">Spin once per day to add a demo bonus to your wallet.</p>' +
        '<div class="wheel-wrap">' +
        '<div class="wheel-pointer"></div>' +
        '<div class="wheel-disc" id="spin-wheel-disc">' + buildWheelSVG() + "</div>" +
        "</div>" +
        '<p id="spin-status-text" style="margin:0 0 12px;font-weight:700;font-size:0.92rem;min-height:22px;"></p>' +
        '<button class="btn-primary" type="button" id="spin-now-btn">Spin Now</button>' +
        "</div>";
      document.body.appendChild(modal);
    }

    var disc = document.getElementById("spin-wheel-disc");
    var spinBtn = document.getElementById("spin-now-btn");
    var statusText = document.getElementById("spin-status-text");
    var currentRotation = 0;
    var spinning = false;

    function checkCooldown() {
      var last = parseInt(localStorage.getItem(KEYS.LAST_SPIN) || "0", 10);
      var diff = Date.now() - last;
      var dayMs = 86400000;
      if (last && diff < dayMs) {
        var hrs = Math.ceil((dayMs - diff) / 3600000);
        spinBtn.disabled = true;
        spinBtn.textContent = "Come Back in " + hrs + "h";
        statusText.textContent = "Daily bonus already claimed today (can reset in Menu).";
        return false;
      }
      spinBtn.disabled = false;
      spinBtn.textContent = "Spin Now";
      statusText.textContent = "Ready to spin!";
      return true;
    }

    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener("click", function () {
        checkCooldown();
        modal.classList.add("open");
      });
    }

    modal.addEventListener("click", function (e) {
      if (e.target === modal || e.target.hasAttribute("data-close-spin")) {
        modal.classList.remove("open");
      }
    });

    spinBtn.addEventListener("click", function () {
      if (spinning || !checkCooldown()) return;
      spinning = true;
      spinBtn.disabled = true;
      spinBtn.textContent = "Spinning...";
      statusText.textContent = "Good luck...";

      var winIndex = Math.floor(Math.random() * REWARDS.length);
      var sliceDeg = 360 / REWARDS.length;
      var targetAngle = 360 - (winIndex * sliceDeg + sliceDeg / 2);
      var jitter = (Math.random() - 0.5) * (sliceDeg * 0.5);
      currentRotation += 1800 + ((targetAngle - (currentRotation % 360) + 360) % 360) + jitter;
      disc.style.transform = "rotate(" + currentRotation + "deg)";

      setTimeout(function () {
        spinning = false;
        var reward = REWARDS[winIndex];
        localStorage.setItem(KEYS.LAST_SPIN, String(Date.now()));
        if (reward.amount > 0) {
          setBalance(getBalance() + reward.amount);
          addTransaction("bonus", "Daily Spin Reward", reward.amount);
          statusText.textContent = "You won " + reward.label + "! Added to your wallet.";
          showToast("Won " + reward.label + " bonus!");
        } else {
          statusText.textContent = "So close! Won ₹0 today — try again tomorrow.";
        }
        checkCooldown();
      }, 3950);
    });
  }

  /*=============================================================================
   * BOTTOM NAV
   *===========================================================================*/
  function highlightBottomNav() {
    var path = window.location.pathname.replace(/\/index\.html$/, "/");
    var links = document.querySelectorAll(".bottom-nav .nav-item");
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute("href");
      var active = false;
      if (href === "/" && (path === "/" || path.indexOf("/instagram/") === 0 || path.indexOf("/facebook/") === 0 || path.indexOf("/youtube/") === 0 || path === "/order/")) {
        active = true;
      } else if (href !== "/" && path.indexOf(href.replace(/\/$/, "")) === 0) {
        active = true;
      }
      links[i].classList.toggle("active", active);
    }
  }

  /*=============================================================================
   * INIT
   *===========================================================================*/
  document.addEventListener("DOMContentLoaded", function () {
    initFirebase();
    ensureUserId();
    syncWalletUI();
    initTheme();
    initTicker();
    initSpinModal();
    highlightBottomNav();
  });

  window.BoostHub = {
    KEYS: KEYS,
    ensureUserId: ensureUserId,
    getBalance: getBalance,
    setBalance: setBalance,
    addTransaction: addTransaction,
    readJSON: readJSON,
    writeJSON: writeJSON,
    formatINR: formatINR,
    escapeHtml: escapeHtml,
    toast: showToast,
    firebase: firebase,
    fbDb: fbDb,
    fbReady: fbReady,
    fbSet: fbSet,
    fbGet: fbGet,
    fbPush: fbPush,
    isAdmin: isAdmin,
    setAdmin: setAdmin,
    adminLogin: adminLogin,
    adminLogout: adminLogout,
    /* PayZAPI */
    getPayzapiKey: getPayzapiKey,
    setPayzapiKey: setPayzapiKey,
    createPayzapiOrder: createPayzapiOrder,
    checkPayzapiOrder: checkPayzapiOrder,
    PAYZAPI_BASE: PAYZAPI_BASE
  };
})();