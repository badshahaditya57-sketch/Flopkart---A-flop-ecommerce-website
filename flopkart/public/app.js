// ---- Firebase (optional: site works without it via localStorage) ----
const FB = window.FB_CONFIG || {}; // set in firebase-config.js
let db = null;
try { if (FB.apiKey) { firebase.initializeApp(FB); db = firebase.firestore(); } } catch (e) { console.warn(e); }

const $ = s => document.querySelector(s);
const rnd = a => a[Math.floor(Math.random() * a.length)];
const roman = n => ["","I","II","III","IV","V","VI","VII","VIII","IX","X"][n] || "TOO MANY";
let cart = JSON.parse(localStorage.getItem("fk_cart") || "[]");
const dodges = {};

function toast(t) { const el = $("#toast"); el.textContent = t; el.style.display = "block"; clearTimeout(toast.t); toast.t = setTimeout(() => el.style.display = "none", 2600); }
function show(html) { $("#dlgBody").innerHTML = html; $("#dlg").showModal(); }
$("#dlgClose").onclick = () => $("#dlg").close();

function render(list = PRODUCTS) {
  $("#grid").innerHTML = list.map(p => `<article class="card" style="--r:${(p.id % 5) - 2}deg">
    <div class="pic">${p.emoji}</div><h3>${p.name}</h3><p class="lie">${p.tag}</p>
    ${p.col?'<p class="price">Price: depends on your mood</p>':`<p><s>₹${p.mrp}</s> <b class="price" data-p="${p.id}">₹${p.price}</b></p>`}
    ${p.fake?`<p class="seller">Sold by <b>${p.seller}</b> (fictional seller) · <a href="${p.url}" target="_blank" rel="noopener">Real listing on Flipkart ↗</a></p>`:`<p class="seller">Sold by <a href="${p.url}" target="_blank" rel="noopener">${p.seller}</a> on Flipkart</p>`}
    ${rev(p)}<p class="seller">👀 ${Math.ceil(Math.random() * 40)} people are viewing this (all of them are you)</p>
    ${p.col?`<a class="btn" href="${p.url}" target="_blank" rel="noopener">Browse on Flipkart ↗</a>`:`<button class="add" data-id="${p.id}">Add to cart</button>`}</article>`).join("");
}
render();

// Add-to-cart button runs away 3 times, then gives in
$("#grid").addEventListener("mouseover", e => {
  const b = e.target.closest(".add"); if (!b) return;
  const id = b.dataset.id; dodges[id] = dodges[id] || 0;
  if (dodges[id] < 3) { dodges[id]++; b.style.transform = `translate(${(Math.random() - .5) * 160}px,${(Math.random() - .5) * 60}px)`; }
  else b.style.transform = "none";
});
$("#grid").addEventListener("click", e => {
  const b = e.target.closest(".add"); if (!b) return;
  const id = +b.dataset.id, q = Math.ceil(Math.random() * 7);
  const item = cart.find(c => c.id === id);
  if (item) item.q = q; else cart.push({id, q});
  save(); toast(`Added ${q} of them. You're welcome.`);
});

// Prices only go up
setInterval(() => {
  PRODUCTS.forEach(p => { p.price += Math.ceil(p.price * .01); const el = document.querySelector(`[data-p="${p.id}"]`); if (el) el.textContent = "₹" + p.price; });
}, 2500);

// Search returns random stuff
$("#search").onsubmit = e => {
  e.preventDefault(); const q = $("#q").value || "nothing";
  render([...PRODUCTS].sort(() => Math.random() - .5).slice(0, 1 + Math.floor(Math.random() * 5)));
  $("#msg").textContent = `Results for "${rnd(["banana","your ex","tax refund",q])}" (you typed "${q}", we heard something else)`;
};
$("#logo").onclick = () => { render(); $("#msg").textContent = "Home. Still here."; };

// Cart
function save() { localStorage.setItem("fk_cart", JSON.stringify(cart)); drawCart(); }
function drawCart() {
  $("#count").textContent = roman(cart.length);
  $("#cartList").innerHTML = cart.map(c => { const p = PRODUCTS.find(x => x.id === c.id);
    return `<li><span>${p.emoji} ${p.name} ×${c.q}</span><button data-rm="${c.id}">Remove</button></li>`; }).join("") || "<li>Empty. Like your wallet soon.</li>";
  $("#total").textContent = "Total: ₹" + cart.reduce((s, c) => s + c.q * PRODUCTS.find(x => x.id === c.id).price, 0) + " (+ ₹49 convenience for the inconvenience)";
}
const rmTries = {};
$("#cartList").addEventListener("click", e => {
  const id = e.target.dataset.rm; if (!id) return;
  rmTries[id] = (rmTries[id] || 0) + 1;
  const msgs = ["Are you sure? It misses you.", "Really sure? It has feelings.", "Last chance. It's crying."];
  if (rmTries[id] <= 3) return toast(msgs[rmTries[id] - 1]);
  cart = cart.filter(c => c.id != id); save();
});
$("#cartBtn").onclick = () => { $("#drawer").hidden = false; drawCart(); };
$("#closeCart").onclick = () => $("#drawer").hidden = true;

// Checkout: fake loading captcha, then guaranteed rejection from the backend
$("#checkout").onclick = () => {
  if (!cart.length) return toast("Add something first. Or don't. We're not your mom.");
  show(`<h2>Prove you're human</h2><p>Select all feelings that are not sadness.</p>
    <label><input type="checkbox"> I am not a robot</label>
    <p>Verifying… <span id="pct">0</span>%</p><div class="progress"><i id="bar"></i></div>`);
  let n = 0; const t = setInterval(() => { n += Math.random() * 14; if (n > 99 && Math.random() < .7) n = 12; if (n >= 100) { clearInterval(t); place(); } $("#pct").textContent = Math.floor(Math.min(n, 100)); $("#bar").style.width = Math.min(n, 100) + "%"; }, 350);
};
var place = async function () {
  let r;
  try { const res = await fetch("/api/checkout", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({items: cart})}); r = await res.json(); }
  catch { r = {code: 418, reason: rnd(["Your cart is too optimistic.", "Server is on chai break.", "Mercury is in retrograde."]), certificate: "FK-" + Math.floor(Math.random() * 1e6)}; }
  show(`<h2>Order failed successfully 🎉</h2><p>Error ${r.code}: ${r.reason}</p><p>Certificate of Suffering №${r.certificate}</p><p>Please tell the Hall of Regret how you feel.</p>`);
  location.hash = "regret";
}

// Hall of Regret (Firestore or localStorage)
async function loadRegrets() {
  let rows = [];
  if (db) { try { const s = await db.collection("regrets").orderBy("ts", "desc").limit(10).get(); rows = s.docs.map(d => d.data()); } catch (e) { console.warn(e); } }
  else rows = JSON.parse(localStorage.getItem("fk_regrets") || "[]");
  $("#regrets").innerHTML = rows.map(r => `<li><b>${esc(r.who)}</b>: ${esc(r.text)}</li>`).join("") || "<li>No regrets yet. Give it time.</li>";
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
$("#regretForm").onsubmit = async e => {
  e.preventDefault();
  const row = {who: ($("#who").value || "Anonymous").slice(0, 30), text: $("#regret").value.slice(0, 240)};
  if (db) { try { await db.collection("regrets").add({...row, ts: firebase.firestore.FieldValue.serverTimestamp()}); } catch (x) { toast("Even our database refused."); } }
  else { const a = JSON.parse(localStorage.getItem("fk_regrets") || "[]"); a.unshift(row); localStorage.setItem("fk_regrets", JSON.stringify(a.slice(0, 10))); }
  e.target.reset(); loadRegrets();
};
loadRegrets();

// Misc nonsense
$("#acc").onclick = () => $("#cookie").remove();
$("#dec").onclick = () => toast("Declining cookies is unavailable in your region (Earth).");
$("#bot").onclick = () => show(`<h2>Bholu Support 🐶</h2><p>${rnd(["Have you tried turning your order off and on?","Your call is important to the next customer.","Bholu is typing… Bholu is a dog.","Please hold. Forever."])}</p>`);
const title = document.title; document.addEventListener("visibilitychange", () => document.title = document.hidden ? "Come back 😢 your cart is lonely" : title);

// ================= v2 extras =================
function rev(p){const r=REVIEWS[p.id%REVIEWS.length];return `<p class="seller">⭐ ${r[0]}/5 – "${r[1]}"</p>`;}

// Sorting that makes no sense
$("#sort").onchange = e => {
  const v = e.target.value; let l = [...PRODUCTS];
  if (v === "up") l.sort((a, b) => b.price - a.price);
  else if (v === "rnd") l.sort(() => Math.random() - .5);
  else if (v === "mood") l.sort((a, b) => (a.name.length * 7 % 5) - (b.name.length * 7 % 5));
  else l.sort((a, b) => a.price - b.price).reverse();
  render(l); $("#msg").textContent = "Sorted. We think.";
};

// Spin to win: every prize makes things pricier
$("#spin").onclick = () => {
  show(`<h2>🎰 Spin to WIN!</h2><p id="wheel" style="font-size:4rem;text-align:center">🎡</p><button id="go">SPIN</button><p id="prize"></p>`);
  $("#go").onclick = () => {
    let i = 0; const t = setInterval(() => { $("#wheel").textContent = rnd(["🍌","💀","💸","🐄","🪙","🎃"]); if (++i > 14) { clearInterval(t); const w = rnd([["-100% OFF*",25],["FREE SHIPPING*",15],["MYSTERY DISCOUNT*",40]]);
      PRODUCTS.forEach(p => p.price = Math.ceil(p.price * (1 + w[1] / 100))); render();
      $("#prize").innerHTML = `You won <b>${w[0]}</b><br><small>*applies to your dreams. All prices +${w[1]}%.</small>`; } }, 120);
  };
};

// Order tracking that goes nowhere
$("#track").onclick = () => show(`<h2>📦 Track Order</h2><ol><li>Packed ✅</li><li>Handed to a very confident pigeon 🕊️</li><li>Held up by a cow on the highway 🐄</li><li>Delivered to your neighbour's neighbour ❓</li></ol><p><b>ETA: Never™</b></p>`);

// Global "failed shoppers" counter (Firestore live, else localStorage)
function showStat(n) { $("#stat").textContent = `🚨 ${n} shoppers have failed to buy anything here. You're next.`; }
if (db) db.doc("stats/global").onSnapshot(d => showStat(d.exists ? d.data().fails : 0), () => showStat("???"));
else showStat(+localStorage.getItem("fk_fails") || 0);
const _place = place;
place = async function () {
  await _place();
  if (db) db.doc("stats/global").set({fails: firebase.firestore.FieldValue.increment(1)}, {merge: true}).catch(() => {});
  else { const n = (+localStorage.getItem("fk_fails") || 0) + 1; localStorage.setItem("fk_fails", n); showStat(n); }
};

// Support bot you can actually type to
$("#bot").onclick = () => {
  show(`<h2>Bholu Support 🐶</h2><p id="bsay">Woof. How can I ignore you today?</p><input id="bin" placeholder="Type your problem" style="width:100%"><button id="bsend">Send</button><p><small>Hint: type "dark" anywhere for dark mode.</small></p>`);
  $("#bsend").onclick = () => { $("#bsay").textContent = rnd(["Have you tried turning your order off and on?","Your call is important to the next customer.","Bholu is a dog. Bholu cannot help.","Escalating to a higher dog.","Ticket closed because of your tone."]); $("#bin").value = ""; };
};

// Dark mode = flashbang. Type "dark".
let keys = ""; addEventListener("keydown", e => { if (e.target.matches("input,textarea")) return; keys = (keys + e.key).slice(-4); if (keys === "dark") { document.body.classList.toggle("dark"); toast("Dark mode enabled. You're welcome."); } });

// Cursor trail
if (!matchMedia("(prefers-reduced-motion:reduce)").matches) {
  let last = 0; addEventListener("mousemove", e => { if (Date.now() - last < 90) return; last = Date.now();
    const s = document.createElement("span"); s.className = "trail"; s.textContent = rnd(["💸","😭","🐄","🍌"]); s.style.left = e.pageX + "px"; s.style.top = e.pageY + "px";
    document.body.appendChild(s); setTimeout(() => s.remove(), 700); });
}

// ================= v3: popup blast + roast =================
// Change these two lines if you want a family-friendly version for judges.
const ROAST = {title: "FUCK YOU", sub: "Thanks for shopping at FlopKart. Please never come back."};

const POPS = ["🎉 Congratulations! You are the 1,000,000th visitor! Prize: more popups.","⚠️ Your cart has a virus. It's called hope.","💊 Doctors hate this one weird trick: closing this popup.","📢 Hot singles in your area want to sell you a phone charger.","🍌 Free banana! Just pay ₹499 shipping.","🔔 Allow notifications? [Yes] [Yes, but louder]","🧾 You have 1 unread receipt for something you never bought.","🐄 A cow has blocked your delivery. Pay ₹200 for the cow's feelings.","📉 Your patience dropped 42%. Update now.","🕵️ We know what you added to cart last summer."];
let blasting = false;

function blast() {
  if (blasting) return; blasting = true;
  $("#dlg").open && $("#dlg").close(); $("#drawer").hidden = true;
  playBlast();
  let n = 0;
  const t = setInterval(() => {
    const d = document.createElement("div"); d.className = "pop";
    d.style.left = Math.random() * (innerWidth - 260) + "px"; d.style.top = Math.random() * (innerHeight - 140) + "px";
    d.innerHTML = '<div class="pophead"><span>⚠ Alert</span><button aria-label="Close popup">✖</button></div><p></p>';
    d.querySelector("p").textContent = rnd(POPS);
    d.querySelector("button").onclick = () => d.remove();
    document.body.appendChild(d);
    if (++n >= 16) { clearInterval(t); setTimeout(() => crash(roast), 3500); }
  }, 180);
}
function roast() {
  document.querySelectorAll(".pop").forEach(x => x.remove());
  const o = document.createElement("div"); o.className = "roast"; o.setAttribute("role", "dialog"); o.setAttribute("aria-label", "Roast");
  o.innerHTML = '<div><h2></h2><div class="finger">🖕</div><p></p><button>Fine, I will behave</button></div>';
  o.querySelector("h2").textContent = ROAST.title; o.querySelector("p").textContent = ROAST.sub;
  o.querySelector("button").onclick = () => { stopBlast(); o.remove(); blasting = false; rage = 0; $("#rage").value = 0; };
  document.body.appendChild(o); o.querySelector("button").focus();
}
$("#dontpress").onclick = blast;

// Auto-trigger after the 3rd failed checkout
let failCount = 0; const _p3 = place;
place = async function () { await _p3(); if (++failCount === 3) setTimeout(blast, 3000); };

// Fake countdown that always resets
const cd = document.createElement("p"); cd.className = "note"; cd.id = "cd"; $("#stat").before(cd);
let left = 10; setInterval(() => { left--; if (left < 0) left = 5 + Math.floor(Math.random() * 20); cd.textContent = `⏰ Offer ends in 00:${String(left).padStart(2, "0")} (resets whenever you blink)`; }, 1000);

// Rage meter: click too fast and the site punishes you
const rg = document.createElement("label"); rg.innerHTML = '😡 Rage <progress id="rage" max="25" value="0"></progress>'; rg.style.color = "#fff"; document.querySelector("header").appendChild(rg);
let rage = 0;
addEventListener("click", () => { if (blasting) return; $("#rage").value = ++rage; if (rage >= 25) blast(); });
setInterval(() => { if (!blasting && rage > 0) $("#rage").value = --rage; }, 1500);

// Live feed of other people's failure
const live = document.createElement("div"); live.id = "live"; document.body.appendChild(live);
setInterval(() => {
  const p = rnd(PRODUCTS);
  live.textContent = `${rnd(["Ramesh from Mars","Priya from Narnia","Sharmaji's son","A suspicious pigeon","Your future self"])} just failed to buy ${p.emoji} ${p.name.split("(")[0].trim()}`;
  live.style.display = "block"; setTimeout(() => live.style.display = "none", 3500);
}, 9000);

// ================= v4: "quick poll" on every order click =================
const POLLS = [["Chai ☕","Coffee 🥤"],["Cat 🐱","Dog 🐶"],["Pineapple pizza 🍍🍕","Normal person 🙂"],["Android 🤖","iPhone 🍎"],["Biryani 🍛","More biryani 🍛"],["Sleep 😴","Also sleep 😴"]];
let pollOpen = false;
document.addEventListener("click", e => {
  if (pollOpen || !e.target.closest(".add, #checkout")) return;
  pollOpen = true;
  const [a, b] = rnd(POLLS), box = document.createElement("div"); box.className = "poll"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Quick poll");
  box.innerHTML = '<h3>🗳️ Quick poll before you buy!</h3><p class="pq"></p><button></button> <button></button>';
  box.querySelector(".pq").textContent = "Which one are you?";
  const [b1, b2] = box.querySelectorAll("button"); b1.textContent = a; b2.textContent = b;
  const done = msg => { clearTimeout(timer); box.querySelector(".pq").textContent = msg; b1.remove(); b2.remove(); setTimeout(() => { box.remove(); pollOpen = false; }, 2200); };
  b1.onclick = b2.onclick = () => done(rnd(["Wrong answer 😈 Noted.","Interesting. We're telling your mom.","Bold choice. Added to your permanent record."]));
  const timer = setTimeout(() => done("Too slow! You are officially a slowpoke 🐌"), 8000);
  document.body.appendChild(box);
}, true);

// ================= v4: "Before moving forward" gate =================
// Family-friendly version for judges? Edit q, a and b here.
const GATE = {q: "Before moving forward: are you an asshole 😈 or a bitch 🤬?", a: "😈 Asshole", b: "🤬 Bitch",
  ra: "Honesty! We respect that. Proceeding.", rb: "Respect. We knew it. Proceeding.", wait: 8000};
let gateOpen = false, passOnce = false;

document.addEventListener("click", e => {
  const t = e.target.closest(".add, .btn, #checkout, #grid a");
  if (!t || passOnce || gateOpen || blasting) return;
  e.preventDefault(); e.stopImmediatePropagation(); openGate(t);
}, true);

function openGate(target) {
  gateOpen = true;
  const g = document.createElement("div"); g.className = "gate"; g.setAttribute("role", "dialog"); g.setAttribute("aria-modal", "true");
  g.innerHTML = '<div><div class="gemoji">🤨</div><h2></h2><p class="gnote">Choose carefully. Or don\'t. We are watching.</p><button id="ga"></button> <button id="gb"></button></div>';
  g.querySelector("h2").textContent = GATE.q;
  g.querySelector("#ga").textContent = GATE.a; g.querySelector("#gb").textContent = GATE.b;
  document.body.appendChild(g); g.querySelector("#ga").focus(); playBlast();
  let madTimer, blastTimer;
  const done = msg => {
    stopBlast(); clearTimeout(madTimer); clearTimeout(blastTimer); g.remove(); gateOpen = false; toast(msg);
    passOnce = true; target.click(); passOnce = false;
  };
  g.querySelector("#ga").onclick = () => done(GATE.ra);
  g.querySelector("#gb").onclick = () => done(GATE.rb);
  // Nobody pressed anything → he is mad
  madTimer = setTimeout(() => {
    g.classList.add("mad"); g.querySelector(".gemoji").textContent = "😡";
    g.querySelector("h2").textContent = "YOU DIDN'T PRESS ANYTHING?! HE IS MAD! 😡";
    g.querySelector(".gnote").textContent = "Press a button before he does something.";
    blastTimer = setTimeout(() => { g.remove(); gateOpen = false; blast(); }, 6000);
  }, GATE.wait);
}


// Blast sound (public/blast.mp3). Plays when popups start (blast) and when the gate question appears.
const blastSnd = new Audio(window.BLAST_DATA || "blast.mp3"); blastSnd.preload = "auto"; blastSnd.volume = 1;
let soundWanted = false;
function tryPlay() {
  try { blastSnd.muted = false; const pr = blastSnd.play(); if (pr) pr.catch(() => { soundWanted = true; console.warn("Sound blocked; will play after next click/key."); }); } catch (e) {}
}
function playBlast() { soundWanted = false; try { blastSnd.currentTime = 0; } catch (e) {} tryPlay(); }
function stopBlast() { soundWanted = false; try { blastSnd.pause(); blastSnd.currentTime = 0; } catch (e) {} }
// If the browser blocked the sound, play it on the next interaction while popups are still up
["pointerdown", "keydown"].forEach(ev => addEventListener(ev, () => { if (soundWanted && (blasting || gateOpen)) playBlast(); }, true));

// ================= v5: fake crash (shake everything) before the roast =================
function crash(next) {
  document.querySelectorAll(".pop").forEach(x => x.remove());
  const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const r = n => (Math.random() - .5) * 2 * n;
  const els = [...document.querySelectorAll(".marquee, header, .note, main .card, .wall, footer")];
  document.body.classList.add("crashing");
  let t = null;
  if (!calm) t = setInterval(() => els.forEach(el => { el.style.transform = `translate(${r(70)}px,${r(50)}px) rotate(${r(8)}deg)`; }), 70);
  setTimeout(() => {
    clearInterval(t); els.forEach(el => el.style.transform = ""); document.body.classList.remove("crashing");
    const c = document.createElement("div"); c.className = "crashscr";
    c.innerHTML = "<div><h2>💥 FlopKart has stopped working</h2><p>Error 0xDEADBEEF: too many popups, too little dignity.</p><p>Restarting your disappointment…</p></div>";
    document.body.appendChild(c);
    setTimeout(() => { c.remove(); next(); }, 1600);
  }, calm ? 800 : 3200);
}
