/* ==========================================================================
   공통 설정
   ========================================================================== */
let currentOutput = null;
let currentTab = "blog";
let currentHistoryId = null;

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

    const token = localStorage.getItem("access_token");
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
        currentHistoryId = data.history_id || null;

        if (data.credits_remaining !== null && data.credits_remaining !== undefined) {
            const creditsEl = document.querySelector(".credits-display");
            if (creditsEl) creditsEl.textContent = `${data.credits_remaining}회`;
        }

        document.getElementById("empty-state").classList.add("hidden");
        document.getElementById("loading-state").classList.add("hidden");

        const seoBar = document.getElementById("seo-badge-bar");
        const badgeKeyword = document.getElementById("badge-keyword");
        const badgeRegion = document.getElementById("badge-region");
        if (seoBar && body.keyword) {
            badgeKeyword.textContent = `✓ 키워드 "${body.keyword}" 배치`;
            badgeRegion.textContent = `✓ 지역명 "${body.region}" 앞배치`;
            seoBar.classList.remove("hidden");
            seoBar.classList.add("flex");
        }

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
    const list = document.getElementById("history-list");
    if (!list) return;
    const token = localStorage.getItem("access_token");
    if (!token) {
        list.innerHTML = `<p class="text-gray-500">로그인 후 이용할 수 있습니다.</p>`;
        return;
    }

    try {
        const data = await apiRequest("/history");
        const countEl = document.getElementById("history-count");
        if (countEl) countEl.textContent = `총 ${data.length}건`;

        list.innerHTML = data.length === 0
            ? `<p class="text-gray-500">생성 이력이 없습니다.</p>`
            : data.map(h => {
                const date = new Date(h.created_at).toLocaleString('ko-KR');
                return `
                <div class="p-4 rounded-xl border border-gray-200 hover:border-navy transition bg-white/50">
                    <div class="flex justify-between items-start gap-4">
                        <div class="flex-grow">
                            <p class="font-bold text-navy">${h.shop_name} <span class="text-xs text-gray-400 font-medium">· ${h.business_type}</span></p>
                            <p class="text-sm text-gray-500 mt-1">🔑 ${h.keyword} · 📍 ${h.region}</p>
                            <p class="text-xs text-gray-400 mt-1">${date} · ${h.credits_used}크레딧 사용</p>
                        </div>
                        <div class="flex gap-2 flex-shrink-0">
                            <button onclick="viewHistoryDetail(${h.id})" class="px-3 py-1.5 text-xs font-bold bg-navy text-white rounded-lg hover:bg-steel transition">상세</button>
                            <button onclick="regenerateHistory(${h.id})" class="px-3 py-1.5 text-xs font-bold bg-sand text-navy rounded-lg hover:bg-camel hover:text-white transition">재생성</button>
                            <button onclick="deleteHistory(${h.id})" class="px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-500 transition">삭제</button>
                        </div>
                    </div>
                </div>
            `;
            }).join("");
    } catch (e) {
        console.error("히스토리 로드 실패", e);
    }
}

async function deleteHistory(id) {
    if (!confirm("이 기록을 삭제하시겠습니까?")) return;
    try {
        await apiRequest(`/history/${id}`, { method: "DELETE" });
        loadHistory();
    } catch (e) {
        alert(e.message || "삭제에 실패했습니다.");
    }
}

async function viewHistoryDetail(id) {
    try {
        const h = await apiRequest(`/history/${id}`);
        const modal = document.getElementById("history-modal");
        const title = document.getElementById("modal-title");
        const body = document.getElementById("modal-body");
        title.textContent = `${h.shop_name} - ${h.keyword}`;

        let output;
        try { output = JSON.parse(h.output_payload); } catch { output = null; }

        let text = `[가게] ${h.shop_name} (${h.business_type})\n[지역] ${h.region}\n[키워드] ${h.keyword}\n`;
        if (h.feature) text += `[특징] ${h.feature}\n`;
        text += `[톤] ${h.tone}\n\n`;

        if (output) {
            if (output.blog) {
                const b = output.blog;
                text += `📝 [블로그]\n${b.title || ""}\n\n${b.body || ""}\n\n${b.hashtags || ""}\n\n`;
            }
            if (output.review) text += `⭐ [리뷰]\n${output.review}\n\n`;
            if (output.shorts) {
                const s = output.shorts;
                text += `📱 [쇼츠]\n${s.cut1 || ""}\n${s.cut2 || ""}\n${s.cut3 || ""}\n\n`;
            }
            if (output.thumbnail) {
                const t = Array.isArray(output.thumbnail) ? output.thumbnail.join("\n") : output.thumbnail;
                text += `🎨 [썸네일]\n${t}\n`;
            }
        } else {
            text += h.output_payload;
        }

        body.textContent = text;
        modal.classList.remove("hidden");
    } catch (e) {
        alert(e.message || "상세 조회에 실패했습니다.");
    }
}

function closeHistoryDetail() {
    const modal = document.getElementById("history-modal");
    if (modal) modal.classList.add("hidden");
}

async function regenerateHistory(id) {
    if (!confirm("이 기록으로 재생성하시겠습니까? 크레딧 1회가 차감됩니다.")) return;
    try {
        await apiRequest(`/history/${id}/regenerate`, { method: "POST" });
        alert("재생성이 완료되었습니다.");
        loadHistory();
        loadMyPage();
        loadCreditHistory();
    } catch (e) {
        alert(e.message || "재생성에 실패했습니다.");
    }
}

async function loadCreditHistory() {
    const list = document.getElementById("credits-list");
    if (!list) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
        const data = await apiRequest("/mypage/credits");
        const creditEl = document.getElementById("user-credits");
        if (creditEl) creditEl.textContent = data.credits;

        const tx = data.transactions || [];
        list.innerHTML = tx.length === 0
            ? `<p class="text-gray-500">사용 내역이 없습니다.</p>`
            : tx.map(t => {
                const date = new Date(t.created_at).toLocaleString('ko-KR');
                const isPlus = t.amount > 0;
                const color = isPlus ? "text-green-600" : "text-red-500";
                const sign = isPlus ? "+" : "";
                return `
                <div class="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-gray-50">
                    <div>
                        <span class="font-bold text-navy">${t.type}</span>
                        ${t.note ? `<span class="text-gray-500 ml-2">${t.note}</span>` : ""}
                        <p class="text-xs text-gray-400">${date}</p>
                    </div>
                    <span class="font-black ${color}">${sign}${t.amount}</span>
                </div>`;
            }).join("");
    } catch (e) {
        console.error("크레딧 내역 로드 실패", e);
    }
}

async function regenerateCurrent() {
    if (!currentHistoryId) {
        startGeneration();
        return;
    }
    if (!confirm("같은 정보로 재생성하시겠습니까? 크레딧 1회가 차감됩니다.")) return;

    const generateBtn = document.getElementById('generate-btn');
    const regenBtn = document.getElementById('regen-btn');
    generateBtn.disabled = true;
    regenBtn.disabled = true;
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('tab-content').innerText = '';

    try {
        const data = await apiRequest(`/history/${currentHistoryId}/regenerate`, { method: "POST" });
        currentOutput = data.output;
        currentHistoryId = data.history_id || currentHistoryId;

        if (data.credits_remaining !== null && data.credits_remaining !== undefined) {
            const creditsEl = document.querySelector(".credits-display");
            if (creditsEl) creditsEl.textContent = `${data.credits_remaining}회`;
        }

        document.getElementById('empty-state').classList.add('hidden');
        showTab("blog");
    } catch (e) {
        alert(e.message || "재생성에 실패했습니다.");
    } finally {
        document.getElementById('loading-state').classList.add('hidden');
        generateBtn.disabled = false;
        regenBtn.disabled = false;
    }
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
   mypage.html - 유저 정보 / 크레딧 로드
   ========================================================================== */

async function loadMyPage() {
    if (!document.getElementById("user-info")) return;

    if (!localStorage.getItem("access_token")) {
        window.location.href = "login.html";
        return;
    }

    try {
        const user = await apiRequest("/auth/me");

        const avatarEl = document.getElementById("user-avatar");
        if (avatarEl) avatarEl.textContent = (user.nickname || user.email)[0];

        const nameEl = document.getElementById("user-name");
        if (nameEl) nameEl.textContent = `${user.nickname || "사용자"} 사장님`;

        const emailEl = document.getElementById("user-email");
        if (emailEl) emailEl.textContent = user.email;

        const creditEl = document.getElementById("user-credits");
        if (creditEl) creditEl.textContent = user.credits;

    } catch (e) {
        console.error("유저 정보 로드 실패", e);
    }
}

/* ==========================================================================
   mypage.html - 로그아웃
   ========================================================================== */

function logout() {
    if (confirm("로그아웃 하시겠습니까?")) {
        localStorage.removeItem("access_token");
        window.location.href = "index.html";
    }
}

/* ==========================================================================
   페이지 로드
   ========================================================================== */

async function loadCreditsDisplay() {
    const el = document.querySelector(".credits-display");
    if (!el) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
        const user = await apiRequest("/auth/me");
        el.textContent = `${user.credits}회`;
    } catch (e) {}
}

window.addEventListener("DOMContentLoaded", () => {
    // generate.html 진입 시 로그인 필수 체크
    if (document.getElementById("generate-btn")) {
        if (!localStorage.getItem("access_token")) {
            window.location.href = "login.html";
            return;
        }
    }

    initSlider();
    if (document.getElementById("history-list")) loadHistory();
    if (document.getElementById("user-info")) {
        loadMyPage();
        loadCreditHistory();
    }
    loadCreditsDisplay();
});