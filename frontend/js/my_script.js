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
    const typeSelect = document.getElementById("business_type_select");
    const typeInput = document.getElementById("business_type");
    
    // 업종 값 처리
    if (typeSelect && typeSelect.value !== 'custom' && typeSelect.value !== '') {
        typeInput.value = typeSelect.value;
    }

    const body = {
        shop_name: document.getElementById("shop_name").value,
        business_type: typeInput ? typeInput.value : "",
        region: document.getElementById("region").value,
        keyword: document.getElementById("keyword").value,
        feature: document.getElementById("feature").value,
        tone: document.getElementById("tone").value,
    };

    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
        const res = await fetch(`${API_BASE}/generate`, {
            method: "POST",
            headers,
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.detail || "콘텐츠 생성에 실패했습니다.");
            return;
        }

        currentOutput = data.output;

        document.getElementById("empty-state").classList.add("hidden");
        document.getElementById("loading-state").classList.add("hidden");
        showTab("blog");

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
    const list = document.getElementById("history-list");
    if (!list) return;
    if (!token) {
        list.innerHTML = "<p>로그인 후 이용할 수 있습니다.</p>";
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/history`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        list.innerHTML = data.length === 0
            ? "<p>생성 이력이 없습니다.</p>"
            : data.map(h => `
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
   mypage.html - 내 정보 로드 / 로그아웃
   ========================================================================== */

async function loadMyInfo() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch(`${API_BASE}/mypage/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();

        const nicknameEl = document.getElementById("user-nickname");
        const creditsEl  = document.getElementById("user-credits");
        const planEl     = document.getElementById("user-plan");

        if (nicknameEl) nicknameEl.innerText = data.nickname || data.email;
        if (creditsEl)  creditsEl.innerText  = `${data.credits}회`;
        if (planEl)     planEl.innerText      = data.plan === "free" ? "무료 플랜" : "구독 플랜";
    } catch (e) {}
}

function logout() {
    if (confirm("로그아웃 하시겠습니까?")) {
        localStorage.removeItem("token");
        window.location.href = "/index.html";
    }
}

/* ==========================================================================
   페이지 로드
   ========================================================================== */

window.addEventListener("DOMContentLoaded", () => {
    initSlider();
    loadHistory();
    loadMyInfo();
});