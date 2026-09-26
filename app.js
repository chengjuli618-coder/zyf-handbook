(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const state = {
    tab: "home", cat: "all", productId: null, q: "", searchOn: false,
    orders: JSON.parse(localStorage.getItem("zyf_orders") || "[]"),
  };
  const crumbs = { home: "历史成品图册", list: "图册", detail: "单件", orders: "复刻单", about: "厂号" };
  function saveOrders() { localStorage.setItem("zyf_orders", JSON.stringify(state.orders)); }
  function toast(msg) {
    const el = $("#toast"); el.textContent = msg; el.classList.add("on");
    clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove("on"), 1600);
  }
  function catName(id) { return (ZYF_CATEGORIES.find((c) => c.id === id) || {}).name || id; }
  function count(id) { return ZYF_PRODUCTS.filter((p) => p.cat === id).length; }
  function filtered() {
    const q = state.q.trim();
    return ZYF_PRODUCTS.filter((p) => {
      if (state.cat !== "all" && p.cat !== state.cat) return false;
      if (!q) return true;
      return [p.id, p.name, p.alias, p.role, p.craft, p.year].join(" ").includes(q);
    });
  }
  function ph(p, cls) {
    if (p.cover) return `<div class="${cls}"><img src="${p.cover}" alt=""></div>`;
    return `<div class="${cls}"><span>待补图<br>${p.id}</span></div>`;
  }
  function renderHome() {
    const idx = ["壹", "贰", "叁", "肆", "伍"];
    $("#screen-home").innerHTML = `
      <div class="hero">
        <div class="kicker">${ZYF_META.heritage}</div>
        <h1>${ZYF_META.brand}</h1>
        <div class="sub">${ZYF_META.title}</div>
        <div class="rule"></div>
        <p>${ZYF_META.established}<br>${ZYF_META.subtitle}</p>
        <button class="enter" id="enter">翻开图册</button>
      </div>
      <div class="sec"><h2>按品类</h2><span>${ZYF_PRODUCTS.length} 件框架</span></div>
      <div class="cats">
        ${ZYF_CATEGORIES.map((c, i) => `
          <button class="cat" data-cat="${c.id}">
            <div class="idx">${idx[i]} · ${c.en}</div>
            <div class="nm">${c.name}</div>
            <div class="ht">${c.hint}</div>
            <div class="n">${count(c.id)} 件</div>
          </button>`).join("")}
      </div>`;
    $("#enter").onclick = () => { state.cat = "all"; go("list"); };
    $$(".cat", $("#screen-home")).forEach((el) => { el.onclick = () => { state.cat = el.dataset.cat; go("list"); }; });
  }
  function renderList() {
    const items = filtered();
    $("#screen-list").innerHTML = `
      <div class="chips">
        <button class="chip ${state.cat === "all" ? "on" : ""}" data-cat="all">全部</button>
        ${ZYF_CATEGORIES.map((c) => `<button class="chip ${state.cat === c.id ? "on" : ""}" data-cat="${c.id}">${c.name}</button>`).join("")}
      </div>
      <div class="grid">
        ${items.length ? items.map((p) => `
          <article class="card" data-id="${p.id}">
            ${ph(p, "ph")}
            <div class="body">
              <div class="pid">${p.id} · ${catName(p.cat)}</div>
              <div class="pnm">${p.name}</div>
              <div class="pro">${p.role}</div>
              <span class="tag">${p.status === "draft" ? "资料待补" : "已归档"}</span>
            </div>
          </article>`).join("") : `<div class="empty">没有匹配件</div>`}
      </div>`;
    $$(".chip", $("#screen-list")).forEach((el) => { el.onclick = () => { state.cat = el.dataset.cat; renderList(); }; });
    $$(".card", $("#screen-list")).forEach((el) => { el.onclick = () => { state.productId = el.dataset.id; go("detail"); }; });
  }
  function siblings() {
    const list = filtered();
    const i = list.findIndex((p) => p.id === state.productId);
    return { prev: list[i - 1], next: list[i + 1] };
  }
  function renderDetail() {
    const p = ZYF_PRODUCTS.find((x) => x.id === state.productId);
    if (!p) {
      $("#screen-detail").innerHTML = `<button class="back" id="back">返回图册</button><div class="empty">找不到该件</div>`;
      $("#back").onclick = () => go("list"); return;
    }
    const { prev, next } = siblings();
    const inOrder = state.orders.includes(p.id);
    $("#screen-detail").innerHTML = `
      <button class="back" id="back">返回图册</button>
      <div class="pager">
        <button id="prev" ${prev ? "" : "disabled"}>${prev ? "上一件" : "已是首件"}</button>
        <button id="next" ${next ? "" : "disabled"}>${next ? "下一件" : "已是末件"}</button>
      </div>
      ${ph(p, "frame")}
      <div class="d-id">${p.id} · ${catName(p.cat)}</div>
      <div class="d-nm">${p.name}</div>
      <div class="d-al">${p.alias}</div>
      <div class="kv">
        <div class="row"><b>用</b><div>${p.role}</div></div>
        <div class="row"><b>制</b><div>${p.size}<br>${p.craft}</div></div>
        <div class="row"><b>年</b><div>${p.year}</div></div>
        <div class="row"><b>复刻</b><div>${p.replica}</div></div>
      </div>
      <div class="story">${p.story}</div>
      <div class="cta">
        <button id="copy">抄编号</button>
        <button class="solid" id="order">${inOrder ? "已在复刻单" : "加入复刻单"}</button>
      </div>`;
    $("#back").onclick = () => go("list");
    $("#prev").onclick = () => { if (prev) { state.productId = prev.id; renderDetail(); } };
    $("#next").onclick = () => { if (next) { state.productId = next.id; renderDetail(); } };
    $("#copy").onclick = async () => {
      const text = `${ZYF_META.brand} ${p.id} ${p.name}`;
      try { await navigator.clipboard.writeText(text); toast("编号已复制"); } catch { toast(text); }
    };
    $("#order").onclick = () => {
      if (state.orders.includes(p.id)) { state.orders = state.orders.filter((x) => x !== p.id); toast("已移出复刻单"); }
      else { state.orders.push(p.id); toast("已加入复刻单"); }
      saveOrders(); renderDetail();
    };
  }
  function renderOrders() {
    const rows = state.orders.map((id) => ZYF_PRODUCTS.find((p) => p.id === id)).filter(Boolean);
    $("#screen-orders").innerHTML = `
      <div class="sec"><h2>复刻意向</h2><span>${rows.length} 件</span></div>
      ${rows.length ? rows.map((p) => `
        <div class="oid"><div><div class="pid">${p.id}</div><div class="pnm" style="font-size:16px">${p.name}</div><div class="pro">${p.replica}</div></div>
        <button data-id="${p.id}">移出</button></div>`).join("") + `<div class="cta"><button class="solid" id="export">导出清单</button></div>`
      : `<div class="empty">客人指到哪件，进详情加入。<br>单子只留在这台设备。</div>`}`;
    $$(".oid button", $("#screen-orders")).forEach((el) => {
      el.onclick = () => { state.orders = state.orders.filter((x) => x !== el.dataset.id); saveOrders(); renderOrders(); };
    });
    const exp = $("#export");
    if (exp) exp.onclick = async () => {
      const text = ["状元坊戏服厂 复刻意向", ...rows.map((p) => `${p.id}  ${p.name}  ${p.replica}`)].join("\n");
      try { await navigator.clipboard.writeText(text); toast("清单已复制"); } catch { toast("请长按复制"); }
    };
  }
  function renderAbout() {
    $("#screen-about").innerHTML = `<div class="about"><p>${ZYF_META.brand}，${ZYF_META.established}成形。${ZYF_META.heritage}。</p>
      <p>本册只收历史成品：已做成、厂内可复看或有图可对的旧件。在制单不进这一本。</p>
      <div class="box">现址待确认：${ZYF_META.address}<br>单件六栏：名 / 图 / 用 / 制 / 年 / 复刻。<br>缺项写「待补」，不编年份、不编订户。</div></div>`;
  }
  function go(tab) {
    state.tab = tab;
    $$(".screen").forEach((s) => s.classList.remove("on"));
    const map = { home: "#screen-home", list: "#screen-list", detail: "#screen-detail", orders: "#screen-orders", about: "#screen-about" };
    $(map[tab]).classList.add("on");
    const bar = tab === "detail" ? "list" : tab;
    $$(".tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === bar));
    $("#crumb").textContent = crumbs[tab] || crumbs.home;
    if (tab === "home") renderHome();
    if (tab === "list") renderList();
    if (tab === "detail") renderDetail();
    if (tab === "orders") renderOrders();
    if (tab === "about") renderAbout();
  }
  $$(".tab").forEach((t) => { t.onclick = () => go(t.dataset.tab); });
  $("#btn-home").onclick = () => go("home");
  $("#btn-search").onclick = () => {
    state.searchOn = !state.searchOn;
    $("#search-wrap").classList.toggle("on", state.searchOn);
    if (state.searchOn) { go("list"); $("#q").focus(); }
  };
  $("#q").oninput = (e) => { state.q = e.target.value; if (state.tab !== "list") go("list"); else renderList(); };
  document.addEventListener("keydown", (e) => {
    if (state.tab !== "detail") return;
    if (e.key === "ArrowLeft") $("#prev") && $("#prev").click();
    if (e.key === "ArrowRight") $("#next") && $("#next").click();
  });
  go("home");
})();
