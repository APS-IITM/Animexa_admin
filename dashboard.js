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
const inputLicense = document.getElementById("license");
const inputVideoUrl = document.getElementById("video_url");
const inputThumbnailUrl = document.getElementById("thumbnail_url");
const inputGumroadUrl = document.getElementById("gumroad_url");

const newCategoryInput = document.getElementById("newCategory");
const saveNewCategoryBtn = document.getElementById("saveNewCategoryBtn");
const canvas3d = document.getElementById("canvas3d");

// ============================================
// ADMIN LOGIN CHECK
// ============================================
const adminData = JSON.parse(localStorage.getItem("admin"));
if (!adminData) {
    window.location.href = "index.html";
}

// ============================================
// 3D CANVAS INITIALIZATION
// ============================================
let canvas3dContext = null;
let rotationX = 0;
let rotationY = 0;

function initCanvas3D() {
    if (!canvas3d) return;
    canvas3dContext = canvas3d.getContext('2d');
    canvas3d.width = canvas3d.offsetWidth || 400;
    canvas3d.height = canvas3d.offsetHeight || 300;
    draw3DCube();
}

function draw3DCube() {
    if (!canvas3dContext) return;

    const centerX = canvas3d.width / 2;
    const centerY = canvas3d.height / 2;
    const size = 80;

    canvas3dContext.clearRect(0, 0, canvas3d.width, canvas3d.height);
    canvas3dContext.fillStyle = 'rgba(33, 128, 141, 0.1)';
    canvas3dContext.strokeStyle = 'rgba(33, 128, 141, 0.6)';
    canvas3dContext.lineWidth = 2;

    // Draw rotating cube
    const cos = Math.cos;
    const sin = Math.sin;

    rotationX += 0.01;
    rotationY += 0.015;

    // Cube vertices
    const vertices = [
        [-size, -size, -size],
        [size, -size, -size],
        [size, size, -size],
        [-size, size, -size],
        [-size, -size, size],
        [size, -size, size],
        [size, size, size],
        [-size, size, size]
    ];

    // Apply rotations
    const rotated = vertices.map(v => {
        let [x, y, z] = v;

        // Rotate around X
        let y1 = y * cos(rotationX) - z * sin(rotationX);
        let z1 = y * sin(rotationX) + z * cos(rotationX);

        // Rotate around Y
        let x2 = x * cos(rotationY) + z1 * sin(rotationY);
        let z2 = -x * sin(rotationY) + z1 * cos(rotationY);

        // Project to 2D
        const scale = 300 / (300 + z2);
        return [centerX + x2 * scale, centerY + y1 * scale];
    });

    // Draw cube edges
    const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    edges.forEach(edge => {
        const [start, end] = edge;
        canvas3dContext.beginPath();
        canvas3dContext.moveTo(rotated[start][0], rotated[start][1]);
        canvas3dContext.lineTo(rotated[end][0], rotated[end][1]);
        canvas3dContext.stroke();
    });

    requestAnimationFrame(draw3DCube);
}

// ============================================
// CATEGORY DROPDOWN LOGIC
// ============================================
inputCategory.addEventListener("change", function () {
    if (this.value === "add-new") {
        newCategoryInput.style.display = "block";
        saveNewCategoryBtn.style.display = "block";
        canvas3d.style.display = "block";
        initCanvas3D();
    } else {
        newCategoryInput.style.display = "none";
        saveNewCategoryBtn.style.display = "none";
        canvas3d.style.display = "none";
    }
});

saveNewCategoryBtn.addEventListener("click", function (e) {
    e.preventDefault();
    const newCategory = newCategoryInput.value.trim();

    if (!newCategory) {
        alert("Please enter a category name");
        return;
    }

    // Add new option to dropdown
    const option = document.createElement("option");
    option.value = newCategory;
    option.text = newCategory;
    option.selected = true;
    inputCategory.insertBefore(option, inputCategory.options[inputCategory.options.length - 1]);

    // Clear input
    newCategoryInput.value = "";
    newCategoryInput.style.display = "none";
    saveNewCategoryBtn.style.display = "none";
    canvas3d.style.display = "none";

    alert(`Category "${newCategory}" added successfully!`);
});

// ============================================
// ID GENERATION: DATE + UNIQUE 6-DIGIT NUMBER
// ============================================
async function generateUniqueId() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const datePrefix = `${year}${month}${day}`;

    const minId = BigInt(datePrefix + "000001");
    const maxId = BigInt(datePrefix + "999999");

    const { data, error } = await supabaseClient
        .from("products")
        .select("id")
        .gte("id", minId.toString())
        .lte("id", maxId.toString());

    if (error) {
        console.error("Error fetching today's products:", error);
        const newId = datePrefix + "000001";
        return newId;
    }

    const existingNumbers = (data || []).map(p => {
        const idStr = p.id.toString();
        if (idStr.length === 14) {
            const sixDigit = idStr.substring(8);
            return parseInt(sixDigit);
        }
        return 0;
    });

    let nextNumber = 1;
    while (existingNumbers.includes(nextNumber) && nextNumber <= 999999) {
        nextNumber++;
    }

    if (nextNumber > 999999) {
        alert("Maximum products for today exceeded (999,999). Please try tomorrow.");
        return null;
    }

    const sixDigitNumber = String(nextNumber).padStart(6, "0");
    const uniqueId = datePrefix + sixDigitNumber;

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
        table.innerHTML = `<tr><td colspan="8">Error loading products</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        table.innerHTML = `<tr><td colspan="8">No products found</td></tr>`;
        return;
    }

        table.innerHTML = "";
        data.forEach(p => {
            const thumbnail =
                p.thumbnail_url ||
                p.video_url ||
                "https://via.placeholder.com/80x60?text=No+Preview";

            table.innerHTML += `
          <tr>
            <td>
              <div class="product-info">
                <span class="product-id">${p.id}</span>
                <span class="product-name">${p.name}</span>
              </div>
            </td>
            <td>
              <img src="${thumbnail}" alt="Preview"
                   style="width: 80px; height: 60px; border-radius: 4px; object-fit: cover;">
            </td>
            <td>${p.product_type ?? "-"}</td>
            <td>${p.license ?? "-"}</td>
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

    if (!inputName.value.trim()) {
        alert("Product name is required!");
        return;
    }

    if (!inputCategory.value || inputCategory.value === "add-new") {
        alert("Please select a valid category!");
        return;
    }

    if (!inputProductType.value) {
        alert("Please select a product type!");
        return;
    }

    if (!inputLicense.value) {
        alert("Please select a license type!");
        return;
    }

    const existingId = productId.value;

    let finalId = existingId;
    if (!existingId) {
        finalId = await generateUniqueId();
        if (!finalId) return;
    }

    const product = {
        id: parseInt(finalId),
        name: inputName.value.trim(),
        short_desc: inputShortDesc.value.trim() || null,
        full_desc: inputFullDesc.value.trim() || null,
        price: inputPrice.value ? parseFloat(inputPrice.value) : null,
        rating: inputRating.value ? parseFloat(inputRating.value) : null,
        category: inputCategory.value.trim(),
        product_type: inputProductType.value.trim(),
        license: inputLicense.value.trim(),
        video_url: inputVideoUrl.value.trim() || null,
        thumbnail_url: inputThumbnailUrl.value.trim() || null,
        gumroad_url: inputGumroadUrl.value.trim() || null
    };


    let result;

    try {
        if (existingId) {
            result = await supabaseClient
                .from("products")
                .update(product)
                .eq("id", parseInt(existingId));
        } else {
            result = await supabaseClient
                .from("products")
                .insert([product]);
        }

        if (result.error) throw result.error;

        form.reset();
        productId.value = "";
        formTitle.textContent = "Add Product";
        newCategoryInput.style.display = "none";
        saveNewCategoryBtn.style.display = "none";
        canvas3d.style.display = "none";

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
            .eq("id", parseInt(id))
            .single();

        if (error) throw error;

        inputName.value = data.name ?? "";
        inputShortDesc.value = data.short_desc ?? "";
        inputFullDesc.value = data.full_desc ?? "";
        inputPrice.value = data.price ?? "";
        inputRating.value = data.rating ?? "";
        inputCategory.value = data.category ?? "";
        inputProductType.value = data.product_type ?? "";
        inputLicense.value = data.license ?? "";
        inputVideoUrl.value = data.video_url ?? "";
        inputThumbnailUrl.value = data.thumbnail_url ?? "";
        inputGumroadUrl.value = data.gumroad_url ?? "";


        productId.value = id;
        formTitle.textContent = `Edit Product (ID: ${id})`;

        window.scrollTo({ top: 0, behavior: "smooth" });
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
            .eq("id", parseInt(id));

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
