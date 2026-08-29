/* ============================================================
   content.js — 여기만 고치면 됩니다.
   ============================================================ */

const SHELL = {

  /* ---------- 1. 기본 설정 ---------- */
  config: {
    user: "hwannee",
    host: "portfolio",
    cwd: "~",
    branch: "main",
    title: "hwannee@portfolio: ~ — zsh",

    typingSpeed: 16,
    typingJitter: 12,
    lineDelay: 45,
    promptDelay: 200,

    interactive: true,
    loop: false,
    startDelay: 250
  },

  /* ---------- 2. 부팅 로그 ---------- */
  boot: [
    { type: "muted", text: "Last login: Fri Aug 29 11:20:04 on ttys001" },
    { type: "blank" },
    {
      type: "ascii", text: `
  ██╗  ██╗██╗    ██╗ █████╗ ███╗   ██╗███╗   ██╗███████╗███████╗
  ██║  ██║██║    ██║██╔══██╗████╗  ██║████╗  ██║██╔════╝██╔════╝
  ███████║██║ █╗ ██║███████║██╔██╗ ██║██╔██╗ ██║█████╗  █████╗
  ██╔══██║██║███╗██║██╔══██║██║╚██╗██║██║╚██╗██║██╔══╝  ██╔══╝
  ██║  ██║╚███╔███╔╝██║  ██║██║ ╚████║██║ ╚████║███████╗███████╗
  ╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝╚══════╝
`
    },
    { type: "blank" },
    { type: "muted", text: "system ready · `help` 입력 · Esc 건너뛰기 · `exit` 나가기" },
    { type: "rule" }
  ],

  /* ---------- 3. 자동 재생 시나리오 ---------- */
  script: [

    {
      cmd: "whoami",
      out: [
        { type: "accent", text: "박재환 · Backend Developer" },
        { type: "muted",  text: "서버를 만들고, 데이터가 흐르는 길을 설계합니다." }
      ]
    },

    {
      cmd: "cat profile.json",
      out: [
        {
          type: "code",
          text: `{
  "name":   "박재환",
  "github": "ParkJaeHwan-906",
  "role":   "Backend Engineer",
  "stack":  ["Java", "Spring Boot", "MySQL", "Redis", "Docker"],
  "status": "open to work"
}`
        }
      ]
    },

    {
      cmd: "ls -la ./projects",
      out: [
        { type: "muted", text: "total 4" },
        {
          type: "table",
          head: ["PERM", "NAME", "DESCRIPTION"],
          rows: [
            ["drwxr-xr-x", "VictoryFairy/",  "KBO 팬 참여형 콘텐츠 플랫폼"],
            ["drwxr-xr-x", "YGSS/",          "사회초년생 퇴직연금 추천 서비스"],
            ["drwxr-xr-x", "onAiR/",         "AI·AR 산업 현장 스마트 헬멧"],
            ["drwxr-xr-x", "POOKIE/",        "mini web game platform"],
          ]
        }
      ]
    },

    {
      cmd: "skills --top",
      out: [
        { type: "head", text: "CORE" },
        {
          type: "kv",
          pairs: [
            ["Back-End ", "Java · Spring Boot · FastAPI · JPA · Node.js · MyBatis"],
            ["Language ", "Python · JavaScript"],
            ["Database ", "MySQL · Redis · MongoDB · PostgreSQL"],
            ["DevOps   ", "Docker · Jenkins · Nginx"],
            ["Infra    ", "AWS · Terraform · Kubernetes(EKS) · GitHub Actions · Lambda · Bedrock"],
            ["Front-End", "Vue.js · React · HTML/CSS"]
          ]
        }
      ]
    },

    {
      cmd: "contact --all",
      out: [
        { type: "link", label: "doormoo2@naver.com",             href: "mailto:doormoo2@naver.com" },
        { type: "link", label: "github.com/ParkJaeHwan-906",        href: "https://github.com/ParkJaeHwan-906" },
        { type: "link", label: "parkjaehwan-906.github.io",         href: "https://parkjaehwan-906.github.io" }
      ]
    },

    {
      cmd: "echo $MESSAGE",
      out: [
        { type: "blank" },
        { type: "accent", text: "문제를 구조로 푸는 걸 좋아합니다." },
        { type: "muted",  text: "`help` 를 입력하면 직접 명령어를 칠 수 있습니다." }
      ]
    }
  ],

  /* ---------- 4. 직접 칠 수 있는 명령어 ---------- */
  commands: {

    whoami: { desc: "한 줄 소개", out: [
      { type: "accent", text: "박재환 · Backend Developer" },
      { type: "muted",  text: "서버를 만들고, 데이터가 흐르는 길을 설계합니다." }
    ]},

    about: { desc: "좀 더 긴 소개", out: [
      { type: "accent", text: "박재환 (hwannee)" },
      { type: "text",   text: "안정성을 설계하고 신뢰를 구축하는 백엔드 개발자입니다." },
      { type: "text",   text: "예측 가능하며 흔들림 없는 경험을 만드는 것, 그것이 서버 개발자의 덕목이라 믿습니다." }
    ]},

    skills: { desc: "기술 스택 전체", out: [
      { type: "head", text: "Back-End" },
      { type: "list", items: ["Java", "Spring Boot", "FastAPI", "JPA", "Node.js", "MyBatis"] },
      { type: "head", text: "Language" },
      { type: "list", items: ["Python", "JavaScript"] },
      { type: "head", text: "Database" },
      { type: "list", items: ["MySQL", "Redis", "MongoDB", "PostgreSQL"] },
      { type: "head", text: "DevOps" },
      { type: "list", items: ["Docker", "Jenkins", "Nginx"] },
      { type: "head", text: "Infra · Cloud" },
      { type: "list", items: [
        "AWS (EKS · ALB · CloudFront · S3 · Route 53)",
        "Terraform", "Kubernetes", "GitHub Actions (OIDC) · ECR",
        "Lambda · EventBridge · SQS", "Amazon Bedrock"] }
    ]},

    projects: { desc: "프로젝트 목록", out: [
      { type: "kv", pairs: [
        ["승리요정 ", "KBO 야구 AI 예측 퀴즈 · 실시간 채팅 플랫폼"],
        ["연금술사 ", "사회초년생을 위한 퇴직연금 추천 서비스"],
        ["onAiR     ", "산업 현장을 최적화하는 AI·AR 스마트 헬멿"],
        ["POOKIE    ", "멀티플레이 웹게임 플랫폼"]
      ]},
      { type: "blank" },
      { type: "muted", text: "`open <이름>` 으로 저장소를 열 수 있습니다. 예) open victoryfairy" }
    ]},

    open: { desc: "저장소 바로 열기 (open <이름>)", out: [
      { type: "link", label: "VictoryFairy — 승리요정", href: "https://github.com/ParkJaeHwan-906/VictoryFairy" },
      { type: "link", label: "YGSS — 연금술사",        href: "https://github.com/ParkJaeHwan-906/YGSS" },
      { type: "link", label: "onAiR",                      href: "https://github.com/ParkJaeHwan-906/onAiR" },
      { type: "link", label: "POOKIE",                     href: "https://github.com/ParkJaeHwan-906/POOKIE" }
    ]},

    career: { desc: "이력 · 교육", out: [
      { type: "kv", pairs: [
        ["2026.04–2026.11", "AI·SW마에스트로 · 과기정통부 · IITP"],
        ["2025.12–2026.01", "(주)넥스트그라운드 · 프리랜서"],
        ["2025.01–2025.12", "삼성 청년 SW·AI 아카데미 13기"],
        ["2023.06–2024.12", "(주)다다익스 · 인턴"],
        ["2019.03–2025.02", "청운대학교 컴퓨터공학과 졸업"]
      ]}
    ]},

    portfolio: { desc: "포트폴리오 사이트", out: [
      { type: "link", label: "parkjaehwan-906.github.io", href: "https://parkjaehwan-906.github.io" }
    ]},

    github: { desc: "GitHub 프로필", out: [
      { type: "link", label: "github.com/ParkJaeHwan-906", href: "https://github.com/ParkJaeHwan-906" }
    ]},

    contact: { desc: "연락처 전체", out: [
      { type: "link", label: "doormoo2@naver.com",         href: "mailto:doormoo2@naver.com" },
      { type: "link", label: "github.com/ParkJaeHwan-906", href: "https://github.com/ParkJaeHwan-906" },
      { type: "link", label: "parkjaehwan-906.github.io",  href: "https://parkjaehwan-906.github.io" }
    ]},

    neofetch: { desc: "시스템 정보처럼 보기", out: [
      { type: "kv", pairs: [
        ["user     ", "hwannee@portfolio"],
        ["role     ", "Backend Engineer"],
        ["shell    ", "zsh"],
        ["stack    ", "Java · Spring Boot · MySQL · Redis · AWS"],
        ["projects ", "4"],
        ["status   ", "open to work"]
      ]}
    ]},

    ls: { desc: "현재 경로 보기", out: [
      { type: "muted", text: "total 4" },
      { type: "table",
        head: ["PERM", "NAME", "DESCRIPTION"],
        rows: [
          ["drwxr-xr-x", "VictoryFairy/", "KBO 팬 참여형 콘텐츠 플랫폼"],
          ["drwxr-xr-x", "YGSS/",         "사회초년생 퇴직연금 추천 서비스"],
          ["drwxr-xr-x", "onAiR/",        "AI·AR 산업 현장 스마트 헬멿"],
          ["drwxr-xr-x", "POOKIE/",       "mini web game platform"]
        ]}
    ]},

    date: { desc: "현재 시각", out: () => [
      { type: "muted", text: new Date().toString() }
    ]},

    sudo: { desc: "—", out: [
      { type: "error", text: "hwannee is not in the sudoers file. This incident will be reported." }
    ]}
  },

  /* ---------- 5. 없는 명령어 ---------- */
  notFound: (cmd) => [
    { type: "error", text: `zsh: command not found: ${cmd}` },
    { type: "muted", text: "`help` 를 입력하면 사용 가능한 명령어가 나옵니다." }
  ]
};
