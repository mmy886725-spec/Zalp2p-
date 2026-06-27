/* =========================
   SUPABASE INIT
========================= */
const SUPABASE_URL = "https://ocrkyftwzsqumkebythf.supabase.co";
const SUPABASE_KEY = "sb_publishable_bpdYGWB-ijZStcFYuprIYA_Lp2-Y8kn";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let currentUser = null;
let balance = 0;
let ads = [];
let referrals = [];


/* =========================
   USER SAVE / LOAD
========================= */
async function saveCurrentUser(email) {
  try {
    const { data, error } = await supabase
      .from("users")
      .upsert([{
        email: email,
        balance: balance
      }], {
        onConflict: "email"
      })
      .select()
      .single();

    if (error) throw error;

    currentUser = email;
    balance = data.balance || 0;

    updateUI();

  } catch (err) {
    console.error(err.message);
  }
}


/* =========================
   REGISTER
========================= */
const oldRegister = window.register;

window.register = async function () {
  if (oldRegister) await oldRegister();

  if (!currentUser) return;

  await saveCurrentUser(currentUser);

  await supabase
    .from("users")
    .update({
      ref_code: "REF" + Date.now()
    })
    .eq("email", currentUser);
};


/* =========================
   LOGIN
========================= */
const oldLogin = window.login;

window.login = async function () {
  if (oldLogin) await oldLogin();

  if (!currentUser) return;

  await saveCurrentUser(currentUser);
  await loadAds();
  await loadReferrals();
};


/* =========================
   BALANCE
========================= */
async function syncBalance() {
  if (!currentUser) return;

  await supabase
    .from("users")
    .update({
      balance: balance
    })
    .eq("email", currentUser);
}


/* =========================
   FINISH TRADE
========================= */
const oldFinishTrade = window.finishTrade;

window.finishTrade = async function (ok) {
  if (oldFinishTrade) oldFinishTrade(ok);

  if (ok) {
    await syncBalance();
  }
};


/* =========================
   ADS SAVE
========================= */
const oldPostAd = window.postAd;

window.postAd = async function () {
  if (oldPostAd) oldPostAd();

  const ad = ads[ads.length - 1];
  if (!ad) return;

  await supabase
    .from("ads")
    .insert([ad]);
};


/* =========================
   LOAD ADS
========================= */
async function loadAds() {
  const { data } =
    await supabase
      .from("ads")
      .select("*")
      .order("id", { ascending: false });

  if (data) {
    ads = data;
    renderAds();
  }
}


/* realtime ads */
supabase
.channel("ads-live")
.on(
  "postgres_changes",
  {
    event: "*",
    schema: "public",
    table: "ads"
  },
  loadAds
)
.subscribe();


/* =========================
   SEND CHAT
========================= */
const oldSend = window.sendTextMessage;

window.sendTextMessage = async function () {
  const input =
    document.getElementById("chat-input");

  const msg = input.value.trim();

  if (!msg) return;

  await supabase
    .from("chats")
    .insert([{
      sender: currentUser,
      message: msg,
      image_url: null
    }]);

  input.value = "";

  if (oldSend) oldSend();
};


/* realtime chat */
supabase
.channel("chat-live")
.on(
  "postgres_changes",
  {
    event: "INSERT",
    schema: "public",
    table: "chats"
  },
  payload => {

    const chat =
      document.getElementById("chat-content");

    if (!chat) return;

    if (payload.new.image_url) {
      chat.innerHTML += `
      <div class="msg received">
        <img src="${payload.new.image_url}" class="uploaded-img">
      </div>`;
    } else {
      chat.innerHTML += `
      <div class="msg received">
        ${payload.new.message}
      </div>`;
    }
  }
)
.subscribe();


/* =========================
   IMAGE UPLOAD
========================= */
window.handleImageUpload = async function (e) {

  const file = e.target.files[0];
  if (!file) return;

  const fileName =
    Date.now() + "_" + file.name;

  const { error } =
    await supabase.storage
      .from("chat-images")
      .upload(fileName, file);

  if (error) {
    console.error(error.message);
    return;
  }

  const { data } =
    supabase.storage
      .from("chat-images")
      .getPublicUrl(fileName);

  await supabase
    .from("chats")
    .insert([{
      sender: currentUser,
      message: "",
      image_url: data.publicUrl
    }]);
};


/* =========================
   REFERRALS
========================= */
async function loadReferrals() {
  if (!currentUser) return;

  const { data } =
    await supabase
      .from("referrals")
      .select("*")
      .eq("owner", currentUser);

  if (!data) return;

  referrals = data;

  const count = data.length;

  await supabase
    .from("users")
    .update({
      referral_count: count
    })
    .eq("email", currentUser);

  updateUI();
}


/* realtime referrals */
supabase
.channel("ref-live")
.on(
  "postgres_changes",
  {
    event: "*",
    schema: "public",
    table: "referrals"
  },
  loadReferrals
)
.subscribe();


/* =========================
   REPORTS
========================= */
async function reportProblem(text) {
  if (!text) return;

  await supabase
    .from("reports")
    .insert([{
      user_email: currentUser,
      message: text
    }]);

  alert("تم إرسال البلاغ");
}


/* =========================
   LOAD OLD CHAT
========================= */
async function loadOldChat() {
  const { data } =
    await supabase
      .from("chats")
      .select("*")
      .order("id");

  const chat =
    document.getElementById("chat-content");

  if (!chat || !data) return;

  chat.innerHTML = "";

  data.forEach(m => {
    if (m.image_url) {
      chat.innerHTML += `
      <div class="msg received">
       <img src="${m.image_url}" class="uploaded-img">
      </div>`;
    } else {
      chat.innerHTML += `
      <div class="msg received">
       ${m.message}
      </div>`;
    }
  });
}


/* =========================
   START
========================= */
window.addEventListener("load", async () => {
  await loadAds();
  await loadOldChat();

  if (currentUser) {
    await loadReferrals();
    await saveCurrentUser(currentUser);
  }
});


fetch("/api/notify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: "merchant_1",
    message: "لديك رسالة جديدة"
  })
});
