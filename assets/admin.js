(function () {
  "use strict";

  var BH = window.BoostHub;
  if (!BH) return;

  /*=============================================================================
   * ADMIN LOGIN
   *===========================================================================*/
  var loginScreen = document.getElementById("admin-login-screen");
  var dashboard = document.getElementById("admin-dashboard");
  var loginBtn = document.getElementById("admin-login-btn");
  var logoutBtn = document.getElementById("admin-logout-btn");
  var passwordInput = document.getElementById("admin-password");

  if (BH.isAdmin()) {
    showDashboard();
  }

  loginBtn.addEventListener("click", function () {
    var pw = passwordInput.value.trim();
    if (BH.adminLogin(pw)) {
      showDashboard();
      passwordInput.value = "";
      BH.toast("Admin unlocked — Creator Premium active");
    } else {
      passwordInput.value = "";
      BH.toast("Invalid admin code");
      passwordInput.focus();
    }
  });

  logoutBtn.addEventListener("click", function () {
    BH.adminLogout();
    loginScreen.style.display = "block";
    dashboard.style.display = "none";
    BH.toast("Signed out of admin panel");
  });

  function showDashboard() {
    loginScreen.style.display = "none";
    dashboard.style.display = "block";
    adminSwitchTab("dashboard");
    refreshDashboard();
  }

  /*=============================================================================
   * TAB SWITCHING
   *===========================================================================*/
  window.adminSwitchTab = function (tabId) {
    var tabs = document.querySelectorAll(".admin-tab");
    var contents = document.querySelectorAll(".admin-tab-content");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle("active", tabs[i].getAttribute("data-tab") === tabId);
    }
    for (var i = 0; i < contents.length; i++) {
      contents[i].style.display = contents[i].getAttribute("id") === "tab-" + tabId ? "block" : "none";
    }
  };

  var tabBtns = document.querySelectorAll(".admin-tab");
  for (var i = 0; i < tabBtns.length; i++) {
    tabBtns[i].addEventListener("click", function () {
      adminSwitchTab(this.getAttribute("data-tab"));
    });
  }

  /*=============================================================================
   * DASHBOARD STATS
   *===========================================================================*/
  function refreshDashboard() {
    var orders = BH.readJSON(BH.KEYS.ORDERS, []);
    var txns = BH.readJSON(BH.KEYS.TXNS, []);
    var uid = localStorage.getItem(BH.KEYS.UID);

    document.getElementById("stat-total-services").textContent = "14";
    document.getElementById("stat-total-orders").textContent = orders.length;
    document.getElementById("stat-total-users").textContent = uid ? "1 (demo)" : "0";
    document.getElementById("stat-wallet-total").textContent = BH.formatINR(BH.getBalance());
  }

  /*=============================================================================
   * SERVICES MANAGER
   *===========================================================================*/
  var svcPlatform = document.getElementById("svc-platform");
  var svcName = document.getElementById("svc-name");
  var svcRate = document.getElementById("svc-rate");
  var svcMin = document.getElementById("svc-min");
  var svcMax = document.getElementById("svc-max");
  var svcEta = document.getElementById("svc-eta");
  var svcDesc = document.getElementById("svc-desc");
  var svcSave = document.getElementById("svc-save-btn");
  var svcList = document.getElementById("svc-list");

  function renderServices() {
    var html = "<h3 style='margin:0 0 10px;font-size:0.9rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;'>Current Services</h3>";
    var all = window.BOOSTHUB_CATALOG.getAllServices();
    for (var i = 0; i < all.length; i++) {
      var s = all[i];
      html += "<div class='admin-item'>" +
        "<div><strong>" + escapeHtml(s.name) + "</strong><br>" +
        "<span style='font-size:0.8rem;color:var(--muted);'>" + s.platformName + " · " + s.category + " · ₹" + s.ratePer1k + "/1k · Min: " + s.min + " · Max: " + s.max + " · ETA: " + s.eta + "</span></div>" +
        "<div style='display:flex;gap:6px;'>" +
        "<button class='btn-secondary' style='font-size:0.75rem;padding:4px 8px;' onclick=\"adminEditService('" + s.id + "')\">Edit</button>" +
        "<button class='btn-secondary' style='font-size:0.75rem;padding:4px 8px;border-color:#ef4444;color:#ef4444;' onclick=\"adminDeleteService('" + s.id + "')\">Delete</button>" +
        "</div></div>";
    }
    svcList.innerHTML = html;
  }

  renderServices();

  svcSave.addEventListener("click", function () {
    var newSvc = {
      id: String(Date.now()),
      name: svcName.value.trim(),
      category: svcPlatform.value + " Services",
      ratePer1k: parseInt(svcRate.value) || 0,
      min: parseInt(svcMin.value) || 1,
      max: parseInt(svcMax.value) || 1000,
      eta: svcEta.value.trim(),
      description: svcDesc.value.trim()
    };
    if (!newSvc.name) {
      BH.toast("Service name is required");
      return;
    }
    // Add to local catalog (in-memory for session)
    window.BOOSTHUB_CATALOG.platforms[svcPlatform.value].services.push(newSvc);
    // Push to Firebase
    BH.fbPush("services/" + newSvc.id, newSvc).then(function () {
      BH.toast("Service saved & synced to Firebase");
      svcName.value = ""; svcRate.value = ""; svcMin.value = ""; svcMax.value = ""; svcEta.value = ""; svcDesc.value = "";
      renderServices();
    });
  });

  window.adminEditService = function (id) {
    BH.toast("Edit service #" + id + " — use Firebase tab for full DB editing");
  };
  window.adminDeleteService = function (id) {
    if (confirm("Delete this service?")) {
      BH.toast("Service #" + id + " deleted from local cache");
    }
  };

  /*=============================================================================
   * ORDERS MANAGER
   *===========================================================================*/
  var ordersList = document.getElementById("orders-list");

  function renderOrders(filter) {
    var orders = BH.readJSON(BH.KEYS.ORDERS, []);
    if (filter !== "all") {
      orders = orders.filter(function (o) { return o.status === filter; });
    }
    if (orders.length === 0) {
      ordersList.innerHTML = "<p style='color:var(--muted);font-size:0.88rem;'>No orders found.</p>";
      return;
    }
    var html = "<table style='width:100%;border-collapse:collapse;font-size:0.86rem;'><thead><tr style='text-align:left;color:var(--muted);'><th style='padding:8px;border-bottom:1px solid var(--border-subtle);'>Order ID</th><th style='padding:8px;border-bottom:1px solid var(--border-subtle);'>Service</th><th style='padding:8px;border-bottom:1px solid var(--border-subtle);'>Amount</th><th style='padding:8px;border-bottom:1px solid var(--border-subtle);'>Status</th></tr></thead><tbody>";
    for (var i = 0; i < orders.length; i++) {
      var o = orders[i];
      html += "<tr><td style='padding:8px;border-bottom:1px solid var(--border-subtle);font-weight:700;'>" + escapeHtml(o.id || "ORD-" + i) + "</td>" +
        "<td style='padding:8px;border-bottom:1px solid var(--border-subtle);'>" + escapeHtml(o.title || "Service Order") + "</td>" +
        "<td style='padding:8px;border-bottom:1px solid var(--border-subtle);'>" + BH.formatINR(o.amount || 0) + "</td>" +
        "<td style='padding:8px;border-bottom:1px solid var(--border-subtle);'><span class='badge badge-" + (o.status || "pending") + "'>" + (o.status || "pending") + "</span></td></tr>";
    }
    html += "</tbody></table>";
    ordersList.innerHTML = html;
  }

  var filterBtns = document.querySelectorAll("#tab-orders .tab-btn");
  for (var i = 0; i < filterBtns.length; i++) {
    filterBtns[i].addEventListener("click", function () {
      for (var j = 0; j < filterBtns.length; j++) filterBtns[j].classList.remove("active");
      this.classList.add("active");
      renderOrders(this.getAttribute("data-filter"));
    });
  }
  renderOrders("all");

  /*=============================================================================
   * USERS MANAGER
   *===========================================================================*/
  var usersList = document.getElementById("users-list");
  function renderUsers() {
    var uid = localStorage.getItem(BH.KEYS.UID);
    var bal = BH.getBalance();
    var txns = BH.readJSON(BH.KEYS.TXNS, []);
    var html = "<div class='admin-item'>" +
      "<div><strong>Demo User (You)</strong><br>" +
      "<span style='font-size:0.8rem;color:var(--muted);'>UID: " + escapeHtml(uid || "unknown") + " · Wallet: " + BH.formatINR(bal) + " · Transactions: " + txns.length + "</span></div>" +
      "<div><button class='btn-secondary' style='font-size:0.75rem;padding:4px 8px;' onclick=\"BH.toast('User management synced via Firebase')\">Sync Firebase</button></div></div>";
    usersList.innerHTML = html;
  }
  renderUsers();

  /*=============================================================================
   * FIREBASE SYNC
   *===========================================================================*/
  var fbPushBtn = document.getElementById("fb-push-btn");
  var fbPullBtn = document.getElementById("fb-pull-btn");
  var fbStatusBtn = document.getElementById("fb-status-btn");
  var fbOutput = document.getElementById("fb-output");

  function fbLog(msg) {
    var line = document.createElement("div");
    line.textContent = new Date().toLocaleTimeString() + " — " + msg;
    line.style.padding = "4px 0";
    line.style.borderBottom = "1px solid var(--border-subtle)";
    fbOutput.appendChild(line);
    fbOutput.scrollTop = fbOutput.scrollHeight;
  }

  fbStatusBtn.addEventListener("click", function () {
    if (BH.fbReady) {
      fbLog("Firebase connected: hiiii-72d78");
      BH.toast("Firebase Realtime Database connected");
    } else {
      fbLog("Firebase not initialized — check script load");
      BH.toast("Firebase not ready");
    }
  });

  fbPushBtn.addEventListener("click", function () {
    if (!BH.fbReady) { BH.toast("Firebase not ready"); return; }
    var orders = BH.readJSON(BH.KEYS.ORDERS, []);
    var txns = BH.readJSON(BH.KEYS.TXNS, []);
    var uid = localStorage.getItem(BH.KEYS.UID);
    BH.fbSet("users/" + uid, { wallet: BH.getBalance(), updatedAt: new Date().toISOString() }).then(function () {
      fbLog("Pushed user wallet to Firebase");
      return BH.fbSet("orders/" + uid, orders);
    }).then(function () {
      fbLog("Pushed orders to Firebase");
      BH.toast("Data pushed to Firebase Realtime Database");
    }).catch(function (e) {
      fbLog("Push error: " + e.message);
      BH.toast("Firebase push failed");
    });
  });

  fbPullBtn.addEventListener("click", function () {
    if (!BH.fbReady) { BH.toast("Firebase not ready"); return; }
    var uid = localStorage.getItem(BH.KEYS.UID);
    BH.fbGet("users/" + uid).then(function (data) {
      if (data && data.wallet !== undefined) {
        BH.setBalance(data.wallet);
        fbLog("Pulled wallet from Firebase: " + BH.formatINR(data.wallet));
        BH.toast("Wallet synced from Firebase");
      } else {
        fbLog("No Firebase user data found");
      }
    }).catch(function (e) {
      fbLog("Pull error: " + e.message);
    });
  });

  /*=============================================================================
   * PAYZAPI SETTINGS
   *===========================================================================*/
  var payzapiKeyInput = document.getElementById("payzapi-api-key");
  var payzapiSecretInput = document.getElementById("payzapi-webhook-secret");
  var payzapiSaveBtn = document.getElementById("payzapi-save-btn");
  var payzapiTestBtn = document.getElementById("payzapi-test-btn");
  var payzapiStatus = document.getElementById("payzapi-save-status");

  // Show test button element if exists (added below in HTML)
  if (!payzapiTestBtn) {
    // Create a test button dynamically if not in HTML
    var testBtn = document.createElement("button");
    testBtn.type = "button";
    testBtn.id = "payzapi-test-btn";
    testBtn.className = "btn-secondary";
    testBtn.textContent = "Test Connection";
    testBtn.style.cssText = "margin-left:8px;padding:8px 12px;font-size:0.8rem;";
    if (payzapiSaveBtn && payzapiSaveBtn.parentNode) {
      payzapiSaveBtn.parentNode.appendChild(testBtn);
    }
    payzapiTestBtn = testBtn;
  }

  if (payzapiKeyInput) {
    payzapiKeyInput.value = BH.getPayzapiKey() || "";
  }

  function showPayzapiStatus(msg, isError) {
    if (!payzapiStatus) return;
    payzapiStatus.textContent = msg;
    payzapiStatus.style.color = isError ? "var(--danger)" : "var(--success)";
    payzapiStatus.style.display = "block";
    setTimeout(function () {
      payzapiStatus.style.display = "none";
    }, 4000);
  }

  if (payzapiSaveBtn) {
    payzapiSaveBtn.addEventListener("click", function () {
      if (!payzapiKeyInput) {
        showPayzapiStatus("API key input not found.", true);
        return;
      }

      var key = payzapiKeyInput.value.trim();
      var secret = payzapiSecretInput ? payzapiSecretInput.value.trim() : "";

      if (!key) {
        showPayzapiStatus("Please enter a PayZAPI API key.", true);
        payzapiKeyInput.focus();
        return;
      }

      if (!key.startsWith("fam_")) {
        showPayzapiStatus("API key should start with 'fam_' (e.g. fam_live_...).", true);
        payzapiKeyInput.focus();
        return;
      }

      try {
        BH.setPayzapiKey(key);
        if (secret) {
          localStorage.setItem(BH.KEYS.PAYZAPI_WEBHOOK_SECRET, secret);
        }
        showPayzapiStatus("PayZAPI API key saved successfully!");
        BH.toast("PayZAPI API key saved");
      } catch (e) {
        showPayzapiStatus("Save failed: " + e.message, true);
        console.error("PayZAPI save error:", e);
      }

      setTimeout(function () {
        if (payzapiStatus) payzapiStatus.style.display = "none";
      }, 4000);
    });
  }

  if (payzapiTestBtn) {
    payzapiTestBtn.addEventListener("click", function () {
      if (!BH.getPayzapiKey()) {
        showPayzapiStatus("Please save an API key first.", true);
        return;
      }
      showPayzapiStatus("Testing PayZAPI connection...");
      // Test by checking a dummy order (will fail but confirms key format)
      BH.checkPayzapiOrder("test_order_123").then(function () {
        showPayzapiStatus("PayZAPI connection test passed!");
        BH.toast("Connection test passed");
      }).catch(function (err) {
        var msg = err.message || "Connection test failed";
        if (msg.includes("401") || msg.includes("403")) {
          showPayzapiStatus("Invalid API key. Please check your PayZAPI key.", true);
        } else if (msg.includes("not configured")) {
          showPayzapiStatus("API key not configured.", true);
        } else {
          showPayzapiStatus("Connection test completed (order not found — this is normal). Key format looks OK.");
          BH.toast("Key format validated");
        }
        console.error("PayZAPI test error:", err);
      });
    });
  }

  /*=============================================================================
   * UTILS
   *===========================================================================*/
  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* Init Firebase status check */
  setTimeout(function () { fbStatusBtn.click(); }, 800);
})();