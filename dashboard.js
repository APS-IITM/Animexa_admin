// ----------------- SUPABASE CONFIG -----------------
const SUPABASE_URL = "https://kfzzfjiicoqvirofkvyy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmenpmamlpY29xdmlyb2Zrdnl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNjk5NjYsImV4cCI6MjA4Mjg0NTk2Nn0.3Eciwhgr7tY1bT7ixbziaOx-eKGS8rDS58dY365mOVk";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ----------------- DOM ELEMENTS -----------------
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

// ----------------- ADMIN LOGIN CHECK -----------------
const adminData = JSON.parse(localStorage.getItem("admin"));
if (!adminData) {
    window.location.href = "index.html"; // redirect to login if not admin
}

// ----------------- LOAD PRODUCTS -----------------
async function loadProducts() {
    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error(error);
        table.innerHTML = `<tr><td colspan="5">Error loading products</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        table.innerHTML = `<tr><td colspan="5">No products found</td></tr>`;
        return;
    }

    table.innerHTML = "";
    data.forEach(p => {
        table.innerHTML += `
            <tr>
                <td>${p.name}</td>
                <td>₹${p.price ?? "-"}</td>
                <td>${p.category ?? "-"}</td>
                <td>${p.rating ?? "-"}</td>
                <td class="actions">
                    <button class="edit" onclick="editProduct(${p.id})">Edit</button>
                    <button class="delete" onclick="deleteProduct(${p.id})">Delete</button>
                </td>
            </tr>`;
    });
}

// ----------------- ADD / UPDATE PRODUCT -----------------
form.addEventListener("submit", async e => {
    e.preventDefault();

    // ----------------- VALIDATION -----------------
    if (!inputName.value.trim()) {
        alert("Product name is required!");
        return;
    }

    const product = {
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

    const id = productId.value;
    let result;

    try {
        if (id) {
            // UPDATE PRODUCT
            result = await supabaseClient
                .from("products")
                .update(product)
                .eq("id", id);
        } else {
            // ADD NEW PRODUCT
            result = await supabaseClient
                .from("products")
                .insert(product);
        }

        if (result.error) throw result.error;

        // Reset form
        form.reset();
        productId.value = "";
        formTitle.textContent = "Add Product";

        loadProducts();
    } catch (err) {
        alert("Error: " + err.message);
        console.error(err);
    }
});

// ----------------- EDIT PRODUCT -----------------
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
        formTitle.textContent = "Edit Product";

        window.scrollTo({ top: 0, behavior: "smooth" }); // scroll to form
    } catch (err) {
        alert("Error: " + err.message);
        console.error(err);
    }
}

// ----------------- DELETE PRODUCT -----------------
async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
        const { error } = await supabaseClient
            .from("products")
            .delete()
            .eq("id", id);

        if (error) throw error;

        loadProducts();
    } catch (err) {
        alert("Error: " + err.message);
        console.error(err);
    }
}

// ----------------- LOGOUT -----------------
document.getElementById("logoutBtn").onclick = () => {
    localStorage.removeItem("admin");
    window.location.href = "index.html";
};

// ----------------- INITIALIZE -----------------
loadProducts();
