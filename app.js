// Supabase config
const SUPABASE_URL = "https://kfzzfjiicoqvirofkvyy.supabase.co";
const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmenpmamlpY29xdmlyb2Zrdnl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNjk5NjYsImV4cCI6MjA4Mjg0NTk2Nn0.3Eciwhgr7tY1bT7ixbziaOx-eKGS8rDS58dY365mOVk";

// ? IMPORTANT: use a different variable name
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// Elements
const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");
const button = form.querySelector("button");

// Login handler
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    errorMsg.textContent = "";
    button.classList.add("loading");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        errorMsg.textContent = "Please fill all fields";
        button.classList.remove("loading");
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from("admin")
            .select("*")
            .eq("email", email)
            .eq("password", password)
            .maybeSingle();;

        if (error || !data) {
            throw new Error("Invalid email or password");
        }

        if (data.role !== "admin") {
            throw new Error("Access denied");
        }

        // Save admin session
        localStorage.setItem("admin", JSON.stringify(data));

        // Redirect
        window.location.href = "dashboard.html";

    } catch (err) {
        errorMsg.textContent = err.message;
    } finally {
        button.classList.remove("loading");
    }
});
// Password show / hide
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePassword.textContent = isPassword ? "??" : "???";
});

