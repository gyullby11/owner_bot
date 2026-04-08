def build_prompt(
    shop_name: str,
    business_type: str,
    region: str,
    keyword: str,
    feature: str = "",
    tone: str = "friendly"
) -> str:

    tone_guide = {
        "friendly": "친근하고 편안한 말투로, 이모지 1~2개 사용 가능",
        "professional": "격식체, 전문 용어를 자연스럽게 포함한 신뢰감 있는 말투",
        "emotional": "감성적이고 시적인 묘사, 짧고 여운 있는 문장",
    }

    tone_desc = tone_guide.get(tone, tone_guide["friendly"])
    feature_text = f"\n가게 특징: {feature}" if feature else ""

    # 업종별 SEO 키워드 가이드
    business_seo = {
        "음식점/식당": {
            "keywords": ["맛집", "혼밥", "가성비", "웨이팅", "포장"],
            "review_focus": "음식 맛, 양, 가격 대비 만족도, 분위기",
            "shorts_hook": "이 집 못 가면 후회해요",
        },
        "카페/베이커리": {
            "keywords": ["카페", "디저트", "브런치", "분위기", "인스타"],
            "review_focus": "음료 맛, 베이커리, 인테리어, 좌석",
            "shorts_hook": "요즘 핫한 카페 발견",
        },
        "피부관리/에스테틱": {
            "keywords": ["피부관리", "에스테틱", "관리", "피부개선", "트러블"],
            "review_focus": "시술 효과, 원장님 실력, 위생, 가격",
            "shorts_hook": "피부가 이렇게 달라질 줄 몰랐어요",
        },
        "헤어샵/미용실": {
            "keywords": ["헤어샵", "미용실", "염색", "펌", "커트"],
            "review_focus": "디자이너 실력, 상담, 지속력, 가격",
            "shorts_hook": "드디어 내 인생 헤어 찾았다",
        },
        "네일아트/속눈썹": {
            "keywords": ["네일", "젤네일", "속눈썹", "연장", "케어"],
            "review_focus": "디자인, 지속력, 원장님 실력, 위생",
            "shorts_hook": "이 디자인 너무 예쁘지 않나요",
        },
        "학원/교육": {
            "keywords": ["학원", "교육", "강의", "수업", "선생님"],
            "review_focus": "강사 실력, 커리큘럼, 성적 향상, 분위기",
            "shorts_hook": "성적이 이렇게 오를 수 있다고요?",
        },
        "헬스/필라테스": {
            "keywords": ["헬스", "필라테스", "운동", "트레이닝", "PT"],
            "review_focus": "트레이너 실력, 시설, 청결, 가격",
            "shorts_hook": "운동 시작하고 몸이 달라졌어요",
        },
    }

    # 업종 매칭
    biz_info = business_seo.get(business_type, {
        "keywords": [keyword],
        "review_focus": "서비스 품질, 가격, 분위기",
        "shorts_hook": "이곳 꼭 가보세요",
    })

    seo_keywords = ", ".join(biz_info["keywords"])
    review_focus = biz_info["review_focus"]
    shorts_hook = biz_info["shorts_hook"]

    prompt = f"""
당신은 네이버 블로그 SEO 전문가이자 소상공인 마케팅 콘텐츠 작가입니다.

아래 정보를 바탕으로 4가지 콘텐츠를 생성해주세요.

[입력 정보]
가게명: {shop_name}
업종: {business_type}
지역: {region}
메인 키워드: {keyword}{feature_text}
말투: {tone_desc}

[업종별 SEO 가이드]
- 추천 연관 키워드: {seo_keywords}
- 리뷰 집중 포인트: {review_focus}
- 쇼츠 후킹 문구 참고: "{shorts_hook}"

[SEO 규칙 - C-Rank·D.I.A+ 기준]
- 제목: 지역명 + 키워드 앞배치, 25자 이내
- 본문: 메인 키워드 3~5회 자연스럽게 배치
- 소제목 3개 이상 포함
- 1,500자 이상 작성
- 이미지 삽입 위치 [이미지: 설명] 형식으로 3회 표시
- 해시태그 5개 생성

[금지 표현]
이로써, 이처럼, 혁신적인, 최고의, 완치, 100% 효과, 보장

아래 JSON 형식으로만 출력하세요. 다른 텍스트는 절대 포함하지 마세요:
{{
  "blog": {{
    "title": "제목 (25자 이내, 지역명+키워드 앞배치)",
    "body": "본문 전체 (1,500자 이상, 소제목 3개, [이미지: 설명] 3회 포함)",
    "hashtags": "#태그1 #태그2 #태그3 #태그4 #태그5"
  }},
  "review": "플레이스 리뷰 (350~400자, 방문 경험 중심, {review_focus} 위주로)",
  "shorts": {{
    "cut1": "0~5초: 후킹 장면 + 자막 (참고: {shorts_hook})",
    "cut2": "5~15초: 핵심 장면 + 강조 포인트",
    "cut3": "15~25초: 결과 + {shop_name} 자막"
  }},
  "thumbnail": ["문구1 (15자 이내)", "문구2 (15자 이내)", "문구3 (15자 이내)"]
}}
"""
    return prompt.strip()