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

    typingSpeed: 32,
    typingJitter: 26,
    lineDelay: 90,
    promptDelay: 420,

    interactive: true,
    loop: false,
    startDelay: 500
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
    { type: "muted", text: "system ready · type `help` for commands" },
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
  "stack":  ["Java", "Spring Boot", "MySQL", "Redis"],
  "status": "open to work"
}`
        }
      ]
    },

    {
      cmd: "ls -la ./projects",
      out: [
        { type: "muted", text: "total 5" },
        {
          type: "table",
          head: ["PERM", "NAME", "DESCRIPTION"],
          rows: [
            ["drwxr-xr-x", "VictoryFairy/",  "KBO 팬 참여형 콘텐츠 플랫폼"],
            ["drwxr-xr-x", "YGSS/",          "사회초년생 퇴직연금 추천 서비스"],
            ["drwxr-xr-x", "onAiR/",         "AI·AR 산업 현장 스마트 헬멧"],
            ["drwxr-xr-x", "POOKIE/",        "mini web game platform"],
            ["drwxr-xr-x", "MusoonZupZup/",  "무순위 청약 플랫폼 무순줍줍"]
          ]
        }
      ]
    },

    {
      cmd: "./build.sh --release",
      out: [
        { type: "spinner",  label: "dependencies 확인 중", duration: 900, done: "resolved · 0 vulnerabilities" },
        { type: "progress", label: "building", duration: 1400 },
        { type: "success",  text: "✔ build succeeded in 1.9s" }
      ]
    },

    {
      cmd: "skills --top",
      out: [
        { type: "head", text: "CORE" },
        {
          type: "kv",
          pairs: [
            ["Language ", "Java · Kotlin · TypeScript"],
            ["Framework", "Spring Boot · JPA · Next.js"],
            ["Data     ", "MySQL · Redis"],
            ["Infra    ", "AWS · Docker · GitHub Actions"]
          ]
        },
        { type: "blank" },
        { type: "head", text: "NOW LEARNING" },
        { type: "list", items: ["Kubernetes", "gRPC", "Event-driven architecture"] }
      ]
    },

    {
      cmd: "contact --all",
      out: [
        { type: "link", label: "swm.jeahwan@gmail.com",             href: "mailto:swm.jeahwan@gmail.com" },
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

    about: [
      { type: "accent", text: "박재환 (hwannee)" },
      { type: "text",   text: "백엔드 개발자. 문제를 구조로 푸는 걸 좋아합니다." }
    ],

    skills: [
      { type: "list", items: [
        "Java / Kotlin / TypeScript",
        "Spring Boot / JPA / Next.js",
        "MySQL / Redis",
        "AWS / Docker / GitHub Actions"
      ]}
    ],

    projects: [
      { type: "kv", pairs: [
        ["VictoryFairy ", "KBO 팬 참여형 콘텐츠 플랫폼"],
        ["YGSS         ", "사회초년생 퇴직연금 추천 서비스"],
        ["onAiR        ", "AI·AR 산업 현장 스마트 헬멧"],
        ["POOKIE       ", "mini web game platform"],
        ["MusoonZupZup ", "무순위 청약 플랫폼 무순줍줍"]
      ]},
      { type: "blank" },
      { type: "link", label: "전체 레포지터리 보기", href: "https://github.com/ParkJaeHwan-906?tab=repositories" }
    ],

    contact: [
      { type: "link", label: "swm.jeahwan@gmail.com",      href: "mailto:swm.jeahwan@gmail.com" },
      { type: "link", label: "github.com/ParkJaeHwan-906", href: "https://github.com/ParkJaeHwan-906" },
      { type: "link", label: "parkjaehwan-906.github.io",  href: "https://parkjaehwan-906.github.io" }
    ],

    date: () => [
      { type: "muted", text: new Date().toString() }
    ],

    sudo: [
      { type: "error", text: "hwannee is not in the sudoers file. This incident will be reported." }
    ]
  },

  /* ---------- 5. 없는 명령어 ---------- */
  notFound: (cmd) => [
    { type: "error", text: `zsh: command not found: ${cmd}` },
    { type: "muted", text: "`help` 를 입력하면 사용 가능한 명령어가 나옵니다." }
  ]
};
