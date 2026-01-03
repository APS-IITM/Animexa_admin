// ============================================
// SUPABASE CONFIG
// ============================================
const SUPABASE_URL = "https://kfzzfjiicoqvirofkvyy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmenpmamlpY29xdmlyb2Zrdnl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNjk5NjYsImV4cCI6MjA4Mjg0NTk2Nn0.3Eciwhgr7tY1bT7ixbziaOx-eKGS8rDS58dY365mOVk";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// DOM ELEMENTS
// ============================================
const form = document.getElementById("productForm");
const table = document.getElementById("productsTable");
const formTitle = document.getElementById("formTitle");
const productId = document.getElementById("productId");

const inputName = document.getElementById("name");
const inputShortDesc = document.getElementById("short_desc");
const inputFullDesc = document.getElementById("full_desc");
const inputPrice = document.getElementById("price");
const inputRating = document.getElementById("rating");
const inputCategory = document.getElementById("category");
const inputProductType = document.getElementById("product_type");
const inputImageUrl = document.getElementById("image_url");
const inputGumroadUrl = document.getElementById("gumroad_url");

// ============================================
// ADMIN LOGIN CHECK
// ============================================
const adminData = JSON.parse(localStorage.getItem("admin"));
if (!adminData) {
  window.location.href = "index.html"; // redirect to login if not admin
}

// ============================================
// ID GENERATION: DATE + UNIQUE 6-DIGIT NUMBER
// ============================================
async function generateUniqueId() {
  // Get today's date in YYYYMMDD format
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const datePrefix = `${year}${month}${day}`;

  // Fetch all products created today
  const { data, error } = await supabaseClient
    .from("products")
    .select("id")
    .ilike("id", `${datePrefix}%`); // Match IDs starting with today's date

  if (error) {
    console.error("Error fetching today's products:", error);
    return null;
  }

  // Extract 6-digit numbers from existing IDs
  const existingNumbers = (data || []).map(p => {
    const match = p.id.match(/^(\d{8})(\d{6})$/);
    return match ? parseInt(match[2]) : 0;
  });

  // Find the next available 6-digit number (000001 to 999999)
  let nextNumber = 1;
  while (existingNumbers.includes(nextNumber) && nextNumber <= 999999) {
    nextNumber++;
  }

  if (nextNumber > 999999) {
    alert("Maximum products for today exceeded (999,999). Please try tomorrow.");
    return null;
  }

  // Pad to 6 digits
  const sixDigitNumber = String(nextNumber).padStart(6, "0");
  const uniqueId = `${datePrefix}${sixDigitNumber}`;

  return uniqueId;
}

// ============================================
// LOAD PRODUCTS
// ============================================
async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error(error);
    table.innerHTML = `<tr><td colspan="6">Error loading products</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    table.innerHTML = `<tr><td colspan="6">No products found</td></tr>`;
    return;
  }

  table.innerHTML = "";
  data.forEach(p => {
    table.innerHTML += `
      <tr>
        <td><small style="color: #888;">${p.id}</small><br/><strong>${p.name}</strong></td>
        <td>${p.short_desc ? p.short_desc.substring(0, 50) + "..." : "-"}</td>
        <td>₹${p.price ?? "-"}</td>
        <td>${p.category ?? "-"}</td>
        <td>${p.rating ? p.rating + "★" : "-"}</td>
        <td class="actions">
          <button class="edit" onclick="editProduct('${p.id}')">Edit</button>
          <button class="delete" onclick="deleteProduct('${p.id}')">Delete</button>
        </td>
      </tr>`;
  });
}

// ============================================
// ADD / UPDATE PRODUCT
// ============================================
form.addEventListener("submit", async e => {
  e.preventDefault();

  // VALIDATION
  if (!inputName.value.trim()) {
    alert("Product name is required!");
    return;
  }

  const existingId = productId.value;

  // If it's a new product, generate unique ID
  let finalId = existingId;
  if (!existingId) {
    finalId = await generateUniqueId();
    if (!finalId) return; // ID generation failed
  }

  const product = {
    id: finalId, // Add the ID to the product object
    name: inputName.value.trim(),
    short_desc: inputShortDesc.value.trim() || null,
    full_desc: inputFullDesc.value.trim() || null,
    price: inputPrice.value ? parseFloat(inputPrice.value) : null,
    rating: inputRating.value ? parseFloat(inputRating.value) : null,
    category: inputCategory.value.trim() || null,
    product_type: inputProductType.value.trim() || null,
    image_url: inputImageUrl.value.trim() || null,
    gumroad_url: inputGumroadUrl.value.trim() || null
  };

  let result;

  try {
    if (existingId) {
      // UPDATE PRODUCT
      result = await supabaseClient
        .from("products")
        .update(product)
        .eq("id", existingId);
    } else {
      // ADD NEW PRODUCT
      result = await supabaseClient
        .from("products")
        .insert([product]); // Wrap in array for insert
    }

    if (result.error) throw result.error;

    // Reset form
    form.reset();
    productId.value = "";
    formTitle.textContent = "Add Product";

    await loadProducts();
    alert(`Product ${existingId ? "updated" : "created"} successfully with ID: ${finalId}`);
  } catch (err) {
    alert("Error: " + err.message);
    console.error(err);
  }
});

// ============================================
// EDIT PRODUCT
// ============================================
async function editProduct(id) {
  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    // Fill form
    inputName.value = data.name ?? "";
    inputShortDesc.value = data.short_desc ?? "";
    inputFullDesc.value = data.full_desc ?? "";
    inputPrice.value = data.price ?? "";
    inputRating.value = data.rating ?? "";
    inputCategory.value = data.category ?? "";
    inputProductType.value = data.product_type ?? "";
    inputImageUrl.value = data.image_url ?? "";
    inputGumroadUrl.value = data.gumroad_url ?? "";

    productId.value = id;
    formTitle.textContent = `Edit Product (ID: ${id})`;

    window.scrollTo({ top: 0, behavior: "smooth" }); // scroll to form
  } catch (err) {
    alert("Error loading product: " + err.message);
    console.error(err);
  }
}

// ============================================
// DELETE PRODUCT
// ============================================
async function deleteProduct(id) {
  if (!confirm(`Are you sure you want to delete this product?\n\nID: ${id}`)) {
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("products")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await loadProducts();
    alert("Product deleted successfully");
  } catch (err) {
    alert("Error deleting product: " + err.message);
    console.error(err);
  }
}

// ============================================
// LOGOUT
// ============================================
document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("admin");
  window.location.href = "index.html";
};

// ============================================
// INITIALIZE
// ============================================
loadProducts();
