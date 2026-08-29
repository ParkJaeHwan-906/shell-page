# shell-page

개발자 셸(터미널)처럼 명령어가 타이핑되고 결과가 흐르는 동적 웹페이지.

## 실행

`index.html` 을 더블클릭하면 끝. 빌드·서버 필요 없음.

## 파일

| 파일 | 역할 |
|---|---|
| `content.js` | **콘텐츠. 여기만 고치면 됩니다.** |
| `terminal.js` | 재생 엔진 (건드릴 일 거의 없음) |
| `styles.css` | 색·폰트·크기 (`:root` 변수만 바꿔도 충분) |
| `index.html` | 뼈대 |

## content.js 구조

```js
const SHELL = {
  config:  { ... },   // 사용자명/호스트/타이핑 속도/반복 여부
  boot:    [ ... ],   // 프롬프트 없이 먼저 흐르는 부팅 로그
  script:  [ ... ],   // 자동 재생 시나리오 (명령어 + 출력)
  commands:{ ... },   // 사용자가 직접 칠 수 있는 명령어
  notFound: (cmd) => [ ... ]
};
```

시나리오 한 칸:

```js
{
  cmd: "cat profile.json",     // 타이핑될 명령어
  delay: 300,                  // (선택) 시작 전 대기 ms
  out: [ /* 출력 블록들 */ ]
}
```

## 출력 블록 타입

```js
"문자열"                                   // 일반 텍스트
{ type:"text"|"muted"|"success"|"warn"|"error"|"info"|"accent"|"head", text:"..." }
{ type:"blank" }                           // 빈 줄
{ type:"rule" }                            // 구분선
{ type:"ascii", text:`아스키아트` }
{ type:"code",  text:"코드 블록" }
{ type:"list",  items:["a","b"], bullet:"›" }
{ type:"kv",    pairs:[["키","값"]] }
{ type:"link",  label:"보이는 글자", href:"https://..." }
{ type:"table", head:["A","B"], rows:[["1","2"]] }
{ type:"progress", label:"building", duration:1400 }   // 진행 바 애니메이션
{ type:"spinner",  label:"확인 중", duration:900, done:"완료" }
{ type:"html",  html:"<b>...</b>" }        // 신뢰하는 내용만
```

## 조작

| 동작 | 방법 |
|---|---|
| 빨리감기 | 화면 클릭 |
| 전부 건너뛰기 | `Esc` 또는 타이틀바 `⏭` |
| 처음부터 다시 | `R` 또는 타이틀바 `↻` |
| 명령 입력 | 재생이 끝나면 커서가 살아남 |
| 자동완성 / 기록 / 화면 지우기 | `Tab` / `↑↓` / `Ctrl+L` |

내장 명령어: `help`, `clear`, `replay`

## 자주 바꾸는 설정 (`content.js` → `config`)

```js
typingSpeed: 32,     // 글자당 ms — 작을수록 빠름
promptDelay: 420,    // 명령 사이 간격
interactive: true,   // 끝난 뒤 직접 입력 허용
loop: false          // true면 무한 반복 재생
```

색은 `styles.css` 맨 위 `:root` 의 `--accent`, `--green`, `--bg` 등을 바꾸면 전체가 따라갑니다.
