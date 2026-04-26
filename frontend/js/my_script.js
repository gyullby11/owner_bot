
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
            if (res.status === 403) {
                // 비로그인 무료 체험 소진
                alert(data.detail || "무료 체험이 종료되었습니다. 회원가입 후 계속 이용하세요.");
                window.location.href = "register.html";
                return;
            }
            alert(data.detail || "콘텐츠 생성에 실패했습니다.");
            return;
        }

        currentOutput = data.output;
        currentHistoryId = data.history_id || null;

        if (data.credits_remaining !== null && data.credits_remaining !== undefined) {
            const creditsEl = document.getElementById("header-credits");
            if (creditsEl) creditsEl.textContent = `${data.credits_remaining}회`;
        }

        // 생성 성공 후 히스토리 목록 자동 갱신
        if (document.getElementById("history-list")) loadHistory();

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
        if (blog && typeof blog === "object") {
            content.innerText = `${blog.title || ""}\n\n${blog.body || ""}\n\n${blog.hashtags || ""}`;
        } else {
            content.innerText = blog || "";
        }
    } else if (tab === "review") {
        const r = currentOutput.review;
        if (r && typeof r === "object") {
            let text = "";
            if (r.customer_review) text += `📝 고객 리뷰 예시 (고객에게 보내줄 용도)\n${r.customer_review}\n\n`;
            if (r.owner_reply_1) text += `💬 사장님 답글 예시 1 (감사형)\n${r.owner_reply_1}\n\n`;
            if (r.owner_reply_2) text += `💬 사장님 답글 예시 2 (정보형)\n${r.owner_reply_2}`;
            content.innerText = text;
        } else {
            content.innerText = r || "";
        }
    } else if (tab === "shorts") {
        const s = currentOutput.shorts;
        if (typeof s === "object" && s.timeline) {
            let text = "";
            if (s.concept) text += `🎬 컨셉\n${s.concept}\n\n`;
            if (s.timeline) {
                text += `📋 타임라인\n`;
                s.timeline.forEach(cut => {
                    text += `\n[${cut.time}]\n`;
                    text += `화면: ${cut.scene}\n`;
                    text += `자막: ${cut.caption}\n`;
                    if (cut.thumbnail_text) text += `썸네일: ${cut.thumbnail_text}\n`;
                });
            }
            if (s.filming_tips) {
                text += `\n\n📸 촬영 팁\n`;
                text += `${s.filming_tips.overall}\n\n`;
                if (s.filming_tips.must_shots) {
                    text += `필수 장면\n`;
                    s.filming_tips.must_shots.forEach((shot, i) => {
                        text += `${i+1}. ${shot}\n`;
                    });
                }
                text += `\n자막 스타일: ${s.filming_tips.caption_style || ""}\n`;
                text += `BGM: ${s.filming_tips.bgm || ""}\n`;
                text += `컷 전환: ${s.filming_tips.cut_transition || ""}\n`;
            }
            if (s.caption_list) {
                text += `\n\n🏷️ 자막 목록\n`;
                s.caption_list.forEach((c, i) => text += `${i+1}. ${c}\n`);
            }
            if (s.instagram_body) {
                text += `\n\n📱 인스타그램 본문\n${s.instagram_body}`;
            }
            content.innerText = text;
        } else if (typeof s === "object") {
            content.innerText = `${s.cut1 || ""}\n${s.cut2 || ""}\n${s.cut3 || ""}`;
        } else {
            content.innerText = s || "";
        }
    } else if (tab === "thumbnail") {
        const thumb = currentOutput.thumbnail;
        if (typeof thumb === "object" && thumb.copies) {
            let text = "";
            if (thumb.copies) {
                text += `✏️ 썸네일 문구\n`;
                text += `숫자형: ${thumb.copies.number_type || ""}\n`;
                text += `질문형: ${thumb.copies.question_type || ""}\n`;
                text += `감성형: ${thumb.copies.emotion_type || ""}\n\n`;
            }
            if (thumb.main_image_guide) {
                text += `📸 메인 썸네일 화면 가이드\n`;
                text += `베스트 장면: ${thumb.main_image_guide.best_shot || ""}\n`;
                if (thumb.main_image_guide.alternatives) {
                    text += `대안 장면:\n`;
                    thumb.main_image_guide.alternatives.forEach((a, i) => text += `${i+1}. ${a}\n`);
                }
                text += `피해야 할 장면: ${thumb.main_image_guide.avoid || ""}\n\n`;
            }
            if (thumb.design_guide) {
                text += `🎨 디자인 가이드\n`;
                text += `배경: ${thumb.design_guide.background || ""}\n`;
                text += `폰트: ${thumb.design_guide.font_style || ""}\n`;
                text += `포인트 색상: ${thumb.design_guide.point_color || ""}\n\n`;
            }
            if (thumb.cta) {
                text += `📢 CTA 문구\n`;
                thumb.cta.forEach((c, i) => text += `${i+1}. ${c}\n`);
            }
            content.innerText = text;
        } else {
            content.innerText = Array.isArray(thumb) ? thumb.join("\n") : (thumb || "");
        }
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
            if (output.review) {
                const r = output.review;
                if (r && typeof r === "object") {
                    text += `⭐ [리뷰]\n`;
                    if (r.customer_review) text += `고객 리뷰:\n${r.customer_review}\n\n`;
                    if (r.owner_reply_1) text += `답글 예시 1:\n${r.owner_reply_1}\n\n`;
                    if (r.owner_reply_2) text += `답글 예시 2:\n${r.owner_reply_2}\n\n`;
                } else {
                    text += `⭐ [리뷰]\n${r}\n\n`;
                }
            }
            if (output.shorts) {
                const s = output.shorts;
                if (s.timeline) {
                    text += `📱 [쇼츠]\n`;
                    s.timeline.forEach(cut => { text += `[${cut.time}] ${cut.caption}\n`; });
                    if (s.instagram_body) text += `\n본문: ${s.instagram_body}\n`;
                    text += "\n";
                } else {
                    text += `📱 [쇼츠]\n${s.cut1 || ""}\n${s.cut2 || ""}\n${s.cut3 || ""}\n\n`;
                }
            }
            if (output.thumbnail) {
                const thumb = output.thumbnail;
                if (thumb && typeof thumb === "object" && thumb.copies) {
                    text += `🎨 [썸네일]\n`;
                    text += `숫자형: ${thumb.copies.number_type || ""}\n`;
                    text += `질문형: ${thumb.copies.question_type || ""}\n`;
                    text += `감성형: ${thumb.copies.emotion_type || ""}\n`;
                } else {
                    const t = Array.isArray(thumb) ? thumb.join("\n") : thumb;
                    text += `🎨 [썸네일]\n${t}\n`;
                }
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
        const data = await apiRequest(`/history/${id}/regenerate`, { method: "POST" });
        alert("재생성이 완료되었습니다.");
        loadHistory();
        // mypage.html에서만 loadMyPage() 및 loadCreditHistory() 호출
        if (document.getElementById("user-info")) {
            loadMyPage();
            loadCreditHistory();
        }
        // generate.html 헤더 크레딧 갱신
        if (data.credits_remaining !== null && data.credits_remaining !== undefined) {
            const creditsEl = document.getElementById("header-credits");
            if (creditsEl) creditsEl.textContent = `${data.credits_remaining}회`;
        }
    } catch (e) {
        alert(e.message || "재생성에 실패했습니다.");
    }
}

async function loadPackages() {
    const list = document.getElementById("packages-list");
    if (!list) return;

    try {
        const packages = await apiRequest("/mypage/packages");
        const labels = { light: "라이트", basic: "베이직", pro: "프로" };
        const badges = { light: "", basic: "🔥 인기", pro: "💎 베스트" };

        list.innerHTML = packages.map(pkg => `
            <div class="border-2 border-gray-200 hover:border-navy rounded-2xl p-6 text-center transition cursor-pointer group relative" onclick="chargeCredits('${pkg.id}')">
                ${badges[pkg.id] ? `<span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-camel text-white text-xs font-bold px-3 py-1 rounded-full">${badges[pkg.id]}</span>` : ""}
                <p class="font-black text-lg text-navy mb-1">${labels[pkg.id] || pkg.id}</p>
                <p class="text-3xl font-black text-navy mb-1">${pkg.credits}<span class="text-base font-bold text-gray-500">회</span></p>
                <p class="text-camel font-black text-xl mb-4">${pkg.price.toLocaleString()}원</p>
                <button class="w-full bg-navy text-white font-bold py-2.5 rounded-xl group-hover:bg-steel transition text-sm">충전하기</button>
            </div>
        `).join("");
    } catch (e) {
        console.error("패키지 로드 실패", e);
    }
}

async function chargeCredits(packageId) {
    const packageLabels = { light: "라이트", basic: "베이직", pro: "프로" };
    const label = packageLabels[packageId] || packageId;
    if (!confirm(`'${label}' 패키지로 충전하시겠습니까?\n(실제 결제 없이 테스트 충전됩니다)`)) return;

    try {
        const data = await apiRequest("/mypage/charge", {
            method: "POST",
            body: JSON.stringify({ package: packageId }),
        });

        alert(`✅ ${data.charged}크레딧이 충전되었습니다!\n현재 잔여 크레딧: ${data.credits}회`);

        const creditEl = document.getElementById("user-credits");
        if (creditEl) creditEl.textContent = data.credits;

        loadCreditHistory();
    } catch (e) {
        alert(e.message || "충전에 실패했습니다.");
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

        const typeLabel = { earn: "충전", use: "사용", refund: "환불" };
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
                        <span class="font-bold text-navy">${typeLabel[t.type] || t.type}</span>
                        ${t.note ? `<span class="text-gray-500 ml-2">${t.note}</span>` : ""}
                        <p class="text-xs text-gray-400">${date}</p>
                    </div>
                    <span class="font-black ${color}">${sign}${t.amount}회</span>
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
            const creditsEl = document.getElementById("header-credits");
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
   generate.html - 게스트/로그인 UI 초기화
   ========================================================================== */

function initGeneratePage() {
    const isLoggedIn = !!localStorage.getItem("access_token");

    const loggedInHeader = document.getElementById("header-logged-in");
    const guestHeader = document.getElementById("header-guest");
    const guestBanner = document.getElementById("guest-banner");

    if (isLoggedIn) {
        // 로그인: 크레딧 표시
        if (loggedInHeader) loggedInHeader.style.display = "flex";
        if (guestHeader) guestHeader.style.display = "none";
        if (guestBanner) guestBanner.classList.add("hidden");
    } else {
        // 비로그인: 게스트 UI 표시
        if (loggedInHeader) loggedInHeader.style.display = "none";
        if (guestHeader) guestHeader.style.display = "flex";
        if (guestBanner) guestBanner.classList.remove("hidden");
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
   mypage.html - 유저 정보 / 크레딧 로드
   ========================================================================== */

const PLAN_LABELS = {
    free: { label: "무료 플랜", color: "bg-gray-100 text-gray-600" },
    per_use: { label: "1회권", color: "bg-blue-100 text-blue-700" },
    monthly: { label: "월정액", color: "bg-sand/30 text-camel" },
};

async function loadMyPage() {
    if (!document.getElementById("user-info")) return;

    if (!localStorage.getItem("access_token")) {
        window.location.href = "login.html";
        return;
    }

    try {
        // /mypage/me 엔드포인트 사용 (plan 포함)
        const user = await apiRequest("/mypage/me");

        const avatarEl = document.getElementById("user-avatar");
        if (avatarEl) avatarEl.textContent = (user.nickname || user.email)[0];

        const nameEl = document.getElementById("user-name");
        if (nameEl) nameEl.textContent = `${user.nickname || "사용자"} 사장님`;

        const emailEl = document.getElementById("user-email");
        if (emailEl) emailEl.textContent = user.email;

        const creditEl = document.getElementById("user-credits");
        if (creditEl) creditEl.textContent = user.credits;

        // 플랜 배지 표시
        const planEl = document.getElementById("user-plan");
        if (planEl) {
            const plan = PLAN_LABELS[user.plan] || { label: user.plan, color: "bg-gray-100 text-gray-600" };
            planEl.textContent = plan.label;
            planEl.className = `text-xs font-bold px-3 py-1 rounded-full ${plan.color}`;
        }

    } catch (e) {
        console.error("유저 정보 로드 실패", e);
    }
}

/* ==========================================================================
   mypage.html - 비밀번호 변경
   ========================================================================== */

async function changePassword() {
    const current = document.getElementById("current-password").value;
    const next = document.getElementById("new-password").value;
    const confirm = document.getElementById("confirm-password").value;
    const msg = document.getElementById("password-message");

    const showMsg = (text, isError) => {
        msg.textContent = text;
        msg.className = `text-sm font-medium ${isError ? "text-red-500" : "text-green-600"}`;
        msg.classList.remove("hidden");
    };

    if (!current || !next || !confirm) return showMsg("모든 항목을 입력해주세요.", true);
    if (next.length < 6) return showMsg("새 비밀번호는 6자 이상이어야 합니다.", true);
    if (next !== confirm) return showMsg("새 비밀번호가 일치하지 않습니다.", true);

    try {
        const data = await apiRequest("/auth/password", {
            method: "PUT",
            body: JSON.stringify({ current_password: current, new_password: next }),
        });
        showMsg(data.message || "비밀번호가 변경되었습니다.", false);
        document.getElementById("current-password").value = "";
        document.getElementById("new-password").value = "";
        document.getElementById("confirm-password").value = "";
    } catch (e) {
        showMsg(e.message || "비밀번호 변경에 실패했습니다.", true);
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
    const el = document.getElementById("header-credits");
    if (!el) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
        const user = await apiRequest("/auth/me");
        el.textContent = `${user.credits}회`;
    } catch (e) {}
}

window.addEventListener("DOMContentLoaded", () => {
    // generate.html 진입 시 UI 상태 초기화 (비로그인 허용)
    if (document.getElementById("generate-btn")) {
        initGeneratePage();
    }

    initSlider();
    if (document.getElementById("history-list")) loadHistory();
    if (document.getElementById("user-info")) {
        loadMyPage();
        loadCreditHistory();
        loadPackages();
    }
    loadCreditsDisplay();
});