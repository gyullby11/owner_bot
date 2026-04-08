const API_BASE = "http://localhost:8000/api";
let currentOutput = null;
let currentTab = "blog";

// 회원가입
async function register() {
    const email = document.getElementById("email").value;
    const nickname = document.getElementById("nickname").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nickname, password })
    });
    const data = await res.json();
    document.getElementById("message").innerText = data.message || data.detail;
}

// 로그인
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok && data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        window.location.href = "./generate.html";
    } else {
        document.getElementById("message").innerText = data.detail || "로그인에 실패했습니다.";
    }
}

// 콘텐츠 생성
async function generateContent() {
    const body = {
        shop_name: document.getElementById("shop_name").value,
        business_type: document.getElementById("business_type").value,
        region: document.getElementById("region").value,
        keyword: document.getElementById("keyword").value,
        feature: document.getElementById("feature").value,
        tone: document.getElementById("tone").value,
    };

    const res = await fetch(`${API_BASE}/generate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    currentOutput = data.output;

    document.getElementById("result").style.display = "block";
    showTab("blog");
}

// 탭 전환
function showTab(tab) {
    currentTab = tab;
    const content = document.getElementById("tab-content");

    if (tab === "blog") {
        content.innerText =
            `${currentOutput.blog.title}\n\n${currentOutput.blog.body}\n\n${currentOutput.blog.hashtags}`;
    } else if (tab === "review") {
        content.innerText = currentOutput.review;
    } else if (tab === "shorts") {
        const s = currentOutput.shorts;
        content.innerText = `${s.cut1}\n${s.cut2}\n${s.cut3}`;
    } else if (tab === "thumbnail") {
        content.innerText = currentOutput.thumbnail.join("\n");
    }
}

// 복사
function copyContent() {
    const text = document.getElementById("tab-content").innerText;
    navigator.clipboard.writeText(text);
    alert("복사 완료!");
}

// 히스토리 불러오기
async function loadHistory() {
    const res = await fetch(`${API_BASE}/history/`);
    const data = await res.json();
    const list = document.getElementById("history-list");
    if (!list) return;

    list.innerHTML = data.map(h => `
        <div>
            <p>${h.shop_name} · ${h.keyword} · ${h.created_at}</p>
            <button onclick="deleteHistory(${h.id})">삭제</button>
        </div>
    `).join("");
}

// 히스토리 삭제
async function deleteHistory(id) {
    await fetch(`${API_BASE}/history/${id}`, { method: "DELETE" });
    loadHistory();
}

// 페이지 로드 시 히스토리 불러오기
window.onload = loadHistory;