/* ================= CONFIG ================= */
const SUPABASE_URL = "https://kfzzfjiicoqvirofkvyy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmenpmamlpY29xdmlyb2Zrdnl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNjk5NjYsImV4cCI6MjA4Mjg0NTk2Nn0.3Eciwhgr7tY1bT7ixbziaOx-eKGS8rDS58dY365mOVk"; // replace with your anon key

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ================= INPUT ELEMENTS ================= */
const email = document.getElementById("email");
const password = document.getElementById("password");
const nameInput = document.getElementById("name");
const shortDescInput = document.getElementById("short_desc");
const fullDescInput = document.getElementById("full_desc");
const priceInput = document.getElementById("price");
const ratingInput = document.getElementById("rating");
const productTypeInput = document.getElementById("product_type");
const imageUrlsInput = document.getElementById("image_urls");
const gumroadLinkInput = document.getElementById("gumroad_link");
const tagsInput = document.getElementById("tags");
const productList = document.getElementById("productList");

/* ================= LOGIN ================= */
async function login() {
  const { data: users, error } = await supabase
    .from('"Users"') // Users table
    .select("*")
    .eq("email", email.value)
    .eq("password", password.value); // simple plaintext password (for demo)

  if (error) return alert("❌ Login failed: " + error.message);
  if (!users || users.length === 0) return alert("❌ Invalid email or password");

  const user = users[0];
  if (user.role !== "admin") return alert("❌ You are not authorized");

  alert(`✅ Logged in as ${user.name}`);
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("adminSection").style.display = "block";
  document.getElementById("productSection").style.display = "block";

  loadProducts();
}

/* ================= LOGOUT ================= */
function logout() {
  email.value = "";
  password.value = "";
  document.getElementById("loginSection").style.display = "block";
  document.getElementById("adminSection").style.display = "none";
  document.getElementById("productSection").style.display = "none";
}

/* ================= ADD PRODUCT ================= */
async function addProduct() {
  const id = `${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const images = imageUrlsInput.value.split(",").map(i => i.trim()).join(",");
  const product = {
    id,
    name: nameInput.value,
    short_desc: shortDescInput.value,
    full_desc: fullDescInput.value,
    price: Number(priceInput.value),
    rating: Number(ratingInput.value),
    product_type: productTypeInput.value,
    image_url: images,
    gumroad_url: gumroadLinkInput.value,
    tags: tagsInput.value.split(",").map(t => t.trim()),
    created_at: new Date().toISOString()
  };

  const { error } = await supabase.from('"Products"').insert([product]);
  if (error) return alert("❌ Failed: " + error.message);

  loadProducts();
}

/* ================= LOAD PRODUCTS ================= */
async function loadProducts() {
  const { data, error } = await supabase
    .from('"Products"')
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return console.error(error);

  productList.innerHTML = "";
  data.forEach(p => {
    productList.innerHTML += `
      <div class="product-row">
        <strong>${p.name}</strong><br>
        <small>${p.id}</small>
        <button onclick="deleteProduct('${p.id}')">Delete</button>
      </div>
    `;
  });
}

/* ================= DELETE ================= */
async function deleteProduct(id) {
  if (!confirm("Delete product?")) return;
  const { error } = await supabase.from('"Products"').delete().eq("id", id);
  if (error) return alert("❌ Delete failed: " + error.message);
  loadProducts();
}
