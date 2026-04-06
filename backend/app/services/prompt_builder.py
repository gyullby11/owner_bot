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

    prompt = f"""
당신은 네이버 블로그 SEO 전문가이자 소상공인 마케팅 콘텐츠 작가입니다.

아래 정보를 바탕으로 4가지 콘텐츠를 생성해주세요.

[입력 정보]
가게명: {shop_name}
업종: {business_type}
지역: {region}
메인 키워드: {keyword}{feature_text}
말투: {tone_desc}

[SEO 규칙]
- 제목 앞부분에 지역명 + 키워드 배치, 25자 이내
- 본문에 메인 키워드 3~5회 자연스럽게 배치
- 소제목 3개 이상 포함
- 1,500자 이상 작성
- 이미지 삽입 위치 [이미지: 설명] 형식으로 표시
- 해시태그 5개 생성

[금지 표현]
이로써, 이처럼, 혁신적인, 최고의, 완치, 100% 효과, 보장

아래 JSON 형식으로만 출력하세요:
{{
  "blog": {{
    "title": "제목 (25자 이내, 지역명+키워드 앞배치)",
    "body": "본문 전체 (1,500자 이상, 소제목 3개, [이미지: 설명] 3회 포함)",
    "hashtags": "#태그1 #태그2 #태그3 #태그4 #태그5"
  }},
  "review": "플레이스 리뷰 (350~400자, 방문 경험 중심)",
  "shorts": {{
    "cut1": "0~5초: 후킹 장면 + 자막",
    "cut2": "5~15초: 핵심 장면 + 강조 포인트",
    "cut3": "15~25초: 결과 + 가게명 자막"
  }},
  "thumbnail": ["문구1", "문구2", "문구3"]
}}
"""
    return prompt.strip()