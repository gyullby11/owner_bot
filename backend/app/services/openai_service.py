def generate_content(data: dict) -> dict:
    return {
        "blog": {
            "title": f"{data['region']} {data['keyword']} 추천",
            "body": f"{data['shop_name']}에서 {data['keyword']} 관련 콘텐츠 예시 본문입니다.",
            "hashtags": f"#{data['region']} #{data['keyword']} #{data['shop_name']}"
        },
        "review": f"{data['shop_name']}에서 {data['keyword']} 서비스를 이용한 후기 예시입니다.",
        "shorts": {
            "cut1": "0~5초: 고민 장면",
            "cut2": "5~15초: 관리 장면",
            "cut3": "15~25초: 후기 장면"
        },
        "thumbnail": [
            f"{data['keyword']} 이 정도였어?",
            f"{data['region']}에서 찾은 곳",
            f"{data['shop_name']} 후기"
        ]
    }