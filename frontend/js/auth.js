// 토큰 관리
function saveAuth(token) {
    localStorage.setItem("access_token", token);
}

function getAccessToken() {
    return localStorage.getItem("access_token");
}

function clearAuth() {
    localStorage.removeItem("access_token");
}

function requireAuth() {
    if (!getAccessToken()) {
        window.location.href = "login.html";
        return false;
    }
    return true;
}

// 메시지 표시
function setMessage(elementId, message, isError = false) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.style.color = isError ? "#e53e3e" : "#2563eb";
}

// 로그인 (onclick="login()" 핸들러)
async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        setMessage("message", "이메일과 비밀번호를 입력해주세요.", true);
        return;
    }

    try {
        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        saveAuth(data.access_token);
        window.location.href = "generate.html";
    } catch (error) {
        setMessage("message", error.message || "로그인에 실패했습니다.", true);
    }
}

// 회원가입 (onclick="register()" 핸들러)
async function register() {
    const email = document.getElementById("email").value.trim();
    const nickname = document.getElementById("nickname").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !nickname || !password) {
        setMessage("message", "모든 항목을 입력해주세요.", true);
        return;
    }

    try {
        await apiRequest("/auth/signup", {
            method: "POST",
            body: JSON.stringify({ email, nickname, password }),
        });
        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        saveAuth(data.access_token);
        window.location.href = "generate.html";
    } catch (error) {
        setMessage("message", error.message || "회원가입에 실패했습니다.", true);
    }
}

// 로그아웃
function logout() {
    clearAuth();
    window.location.href = "index.html";
}

// 네비게이션 로그인 상태 반영
function initAuthNav() {
    const isLoggedIn = !!getAccessToken();

    // 로그인/회원가입 링크 (비로그인 전용)
    const loginLink = document.getElementById("nav-login");
    const registerLink = document.getElementById("nav-register");
    // 로그인 후 메뉴 (로그인 전용)
    const logoutBtn = document.getElementById("nav-logout");
    const mypageLink = document.getElementById("nav-mypage");
    const mypageLink2 = document.getElementById("nav-mypage2");

    const ctaGuest = document.getElementById("cta-guest");

    if (isLoggedIn) {
        if (loginLink) loginLink.style.display = "none";
        if (registerLink) registerLink.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "inline";
        if (mypageLink) mypageLink.style.display = "inline";
        if (mypageLink2) mypageLink2.style.display = "inline";
        if (ctaGuest) ctaGuest.style.display = "none";
    } else {
        if (loginLink) loginLink.style.display = "inline";
        if (registerLink) registerLink.style.display = "inline";
        if (logoutBtn) logoutBtn.style.display = "none";
        if (mypageLink) mypageLink.style.display = "none";
        if (mypageLink2) mypageLink2.style.display = "none";
        if (ctaGuest) ctaGuest.style.display = "inline-flex";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initAuthNav();

    const logoutBtn = document.getElementById("nav-logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }
});
