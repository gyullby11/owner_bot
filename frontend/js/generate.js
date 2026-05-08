
/* ==========================================================================
   공통 상태
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

    let data;
    try {
        data = await apiRequest("/generate", {
            method: "POST",
            body: JSON.stringify(body),
        });
    } catch (e) {
        if (e.status === 403) {
            alert(e.message || "무료 체험이 종료되었습니다. 회원가입 후 계속 이용하세요.");
            window.location.href = "register.html";
            return;
        }
        if (e.status === 402) {
            showCreditModal(e.message || "크레딧이 부족합니다.");
            return;
        }
        alert(e.message || "콘텐츠 생성에 실패했습니다.");
        return;
    }

    try {

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
        if (e.status === 402) {
            showCreditModal(e.message || "크레딧이 부족합니다.");
        } else {
            alert(e.message || "재생성에 실패했습니다.");
        }
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
        if (loggedInHeader) { loggedInHeader.classList.remove("hidden"); loggedInHeader.classList.add("flex"); }
        if (guestHeader) guestHeader.classList.add("hidden");
        if (guestBanner) guestBanner.classList.add("hidden");
    } else {
        // 비로그인: 게스트 UI 표시
        if (loggedInHeader) { loggedInHeader.classList.add("hidden"); loggedInHeader.classList.remove("flex"); }
        if (guestHeader) { guestHeader.classList.remove("hidden"); guestHeader.classList.add("flex"); }
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
    if (typeSelect && typeSelect.value !== 'custom' && typeSelect.value !== '') {
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

window.addEventListener("DOMContentLoaded", () => {
    // generate.html 진입 시 UI 상태 초기화 (비로그인 허용)
    if (document.getElementById("generate-btn")) {
        initGeneratePage();
    }
    if (document.getElementById("history-list")) loadHistory();
});
