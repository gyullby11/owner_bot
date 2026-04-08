/* ==========================================================================
   공통 설정
   ========================================================================== */

const API_BASE = "http://localhost:8000/api";
let currentOutput = null;
let currentTab = "blog";

/* ==========================================================================
   인증 - 회원가입 / 로그인
   ========================================================================== */

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
    if (res.ok) {
        window.location.href = "/html/login.html";
    } else {
        document.getElementById("message").innerText = data.detail || "회원가입에 실패했습니다.";
    }
}

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
        localStorage.setItem("token", data.access_token);
        window.location.href = "/html/generate.html";
    } else {
        document.getElementById("message").innerText = data.detail || "로그인에 실패했습니다.";
    }
}

/* ==========================================================================
   콘텐츠 생성
   ========================================================================== */

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

        const resultDiv = document.getElementById("result-container");
        console.log("7. resultDiv:", resultDiv);
        // empty-state 숨기기
        document.getElementById("empty-state").classList.add("hidden");
        document.getElementById("loading-state").classList.add("hidden");
        console.log("8. showTab 호출");
        showTab("blog");
        if (btn) btn.innerText = "콘텐츠 생성하기";
        console.log("9. 완료");

    } catch (err) {
        console.error("에러:", err);
    }
}

/* ==========================================================================
   결과 탭
   ========================================================================== */

function showTab(tab) {
    currentTab = tab;
    const content = document.getElementById("tab-content");
    if (!currentOutput) return;

    if (tab === "blog") {
        const blog = currentOutput.blog;
        if (typeof blog === "object") {
            content.innerText = `${blog.title || ""}\n\n${blog.body || ""}\n\n${blog.hashtags || ""}`;
        } else {
            content.innerText = blog || "";
        }
    } else if (tab === "review") {
        content.innerText = currentOutput.review || "";
    } else if (tab === "shorts") {
        const s = currentOutput.shorts;
        if (typeof s === "object") {
            content.innerText = `${s.cut1 || ""}\n${s.cut2 || ""}\n${s.cut3 || ""}`;
        } else {
            content.innerText = s || "";
        }
    } else if (tab === "thumbnail") {
        const thumb = currentOutput.thumbnail;
        content.innerText = Array.isArray(thumb) ? thumb.join("\n") : (thumb || "");
    }

    switchUiTab(tab);
}

function copyContent() {
    const text = document.getElementById("tab-content").innerText;
    navigator.clipboard.writeText(text);
    alert("복사 완료!");
}

/* ==========================================================================
   히스토리
   ========================================================================== */

async function loadHistory() {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`${API_BASE}/history`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
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

async function deleteHistory(id) {
    const token = localStorage.getItem("token");
    await fetch(`${API_BASE}/history/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });
    loadHistory();
}

/* ==========================================================================
   generate.html - 업종 프리셋
   ========================================================================== */

function toggleCustomBusiness() {
    const select = document.getElementById('business_type_select');
    const input = document.getElementById('business_type');

    if (select.value === 'custom') {
        input.classList.remove('hidden');
        input.value = '';
        input.focus();
    } else {
        input.classList.add('hidden');
        input.value = select.value;
    }
}

/* ==========================================================================
   generate.html - 탭 UI 전환
   ========================================================================== */

function switchUiTab(tabName) {
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        btn.classList.remove('bg-navy', 'text-white', 'active-tab');
        btn.classList.add('text-gray-500', 'hover:bg-gray-100', 'hover:text-navy');
    });

    const activeBtn = document.getElementById(`tab-btn-${tabName}`);
    activeBtn.classList.remove('text-gray-500', 'hover:bg-gray-100', 'hover:text-navy');
    activeBtn.classList.add('bg-navy', 'text-white', 'active-tab');

    if (typeof showTab === 'function') {
        showTab(tabName);
    }
}

/* ==========================================================================
   generate.html - 생성 버튼 (로딩 → 결과 표시)
   ========================================================================== */

async function startGeneration() {
    const shopName = document.getElementById('shop_name').value;
    const region = document.getElementById('region').value;
    const keyword = document.getElementById('keyword').value;

    const typeSelect = document.getElementById('business_type_select');
    const typeInput = document.getElementById('business_type');
    if (typeSelect.value !== 'custom' && typeSelect.value !== '') {
        typeInput.value = typeSelect.value;
    }

    if (!shopName || !typeInput.value || !region || !keyword) {
        alert("가게 이름, 업종, 지역, 키워드는 필수 입력 사항입니다!");
        return;
    }

    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('tab-content').innerText = '';

    const generateBtn = document.getElementById('generate-btn');
    generateBtn.disabled = true;
    generateBtn.innerHTML = '생성 중... ⏳';

    try {
        await generateContent();
    } catch (error) {
        console.error(error);
        alert("콘텐츠 생성 중 오류가 발생했습니다.");
    } finally {
        document.getElementById('loading-state').classList.add('hidden');
        generateBtn.disabled = false;
        generateBtn.innerHTML = `<span>마케팅 콘텐츠 생성하기</span><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`;

        const copyBtn = document.getElementById('copy-btn');
        const regenBtn = document.getElementById('regen-btn');
        copyBtn.disabled = false;
        regenBtn.disabled = false;
        copyBtn.className = "flex-1 bg-sand text-navy font-black py-4 rounded-xl hover:bg-camel hover:text-white transition shadow-md flex justify-center items-center gap-2 border-b-4 border-camel active:translate-y-1 active:border-b-0";
        regenBtn.className = "flex-none bg-white border-2 border-gray-200 text-gray-600 font-bold px-6 py-4 rounded-xl hover:bg-gray-50 transition active:translate-y-1";
    }
}

/* ==========================================================================
   index.html - 배경 이미지 슬라이더
   ========================================================================== */

function initSlider() {
    const images = document.querySelectorAll('.slider-img');
    if (images.length === 0) return;

    let currentIndex = 0;
    setInterval(() => {
        images[currentIndex].classList.remove('opacity-100');
        images[currentIndex].classList.add('opacity-0');
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex].classList.remove('opacity-0');
        images[currentIndex].classList.add('opacity-100');
    }, 4000);
}

/* ==========================================================================
   mypage.html - 로그아웃 / 히스토리 상세
   ========================================================================== */

function logout() {
    if (confirm("로그아웃 하시겠습니까?")) {
        localStorage.removeItem("token");
        window.location.href = "/index.html";
    }
}

function viewHistoryDetail() {
    alert("히스토리 상세 보기 기능입니다.");
}

/* ==========================================================================
   페이지 로드
   ========================================================================== */

window.addEventListener("DOMContentLoaded", () => {
    initSlider();
    loadHistory();
});
