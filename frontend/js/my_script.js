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
    document.getElementById("message").innerText = data.message || data.detail;
}

// 콘텐츠 생성
async function generateContent() {
    console.log("1. 함수 시작");
    const body = {
        shop_name: document.getElementById("shop_name").value,
        business_type: document.getElementById("business_type").value,
        region: document.getElementById("region").value,
        keyword: document.getElementById("keyword").value,
        feature: document.getElementById("feature").value,
        tone: document.getElementById("tone").value,
    };

    console.log("2. 요청 데이터:", body);

    try {
        const btn = document.querySelector("button[type='button'][onclick='generateContent()']");
        if (btn) btn.innerText = "생성 중...";

        console.log("3. fetch 시작");
        const res = await fetch(`${API_BASE}/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        console.log("4. 응답 받음:", res.status);
        const data = await res.json();
        console.log("5. 데이터:", data);

        currentOutput = data.output;
        console.log("6. currentOutput:", currentOutput);

        const resultDiv = document.getElementById("result");
        console.log("7. resultDiv:", resultDiv);
        resultDiv.style.display = "block";

        console.log("8. showTab 호출");
        showTab("blog");

        if (btn) btn.innerText = "콘텐츠 생성하기";
        console.log("9. 완료");

    } catch (err) {
        console.error("에러:", err);
    }
}

// 탭 전환
function showTab(tab) {
    currentTab = tab;
    const content = document.getElementById("tab-content");
    if (!currentOutput) return;

    if (tab === "blog") {
        content.innerText = currentOutput.blog || "";
    } else if (tab === "review") {
        content.innerText = currentOutput.review || "";
    } else if (tab === "shorts") {
        content.innerText = currentOutput.shorts || "";
    } else if (tab === "thumbnail") {
        const thumb = currentOutput.thumbnail;
        content.innerText = Array.isArray(thumb) ? thumb.join("\n") : (thumb || "");
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
    const list = document.getElementById("history-list");
    if (!list) return;

    try {
        const res = await fetch(`${API_BASE}/history`);
        if (!res.ok) return;
        const data = await res.json();
        list.innerHTML = data.map(h => `
            <div style="padding:10px;border-bottom:1px solid #eee;">
                <p>${h.shop_name} · ${h.keyword} · ${h.created_at}</p>
                <button onclick="deleteHistory(${h.id})">삭제</button>
            </div>
        `).join("");
    } catch (e) {}
}

// 히스토리 삭제
async function deleteHistory(id) {
    await fetch(`${API_BASE}/history/${id}`, { method: "DELETE" });
    loadHistory();
}

window.onload = function() {
    if (window.location.pathname.includes("mypage")) {
        loadHistory();
    }
};