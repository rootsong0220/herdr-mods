[English](README.md) | **한국어**

# herdr-mods

[Herdr](https://herdr.dev)용 mod와 레이아웃 모음입니다. 폴더 하나가 항목 하나입니다. 각 폴더의 `RECIPE.md`는 처음부터 다시 만들 수 있는 설계서이고, 폴더 안의 파일은 그 설계서로 만든 구현 하나입니다.

| 폴더 | 종류 | 설명 |
|---|---|---|
| [`all-in-one/`](all-in-one/RECIPE.md) | 레이아웃 묶음 | 아래 항목 전부를 한 번에. CPU·메모리 미터가 있는 기본 창에 Inbox, Recent, Projects, Viewer를 붙이고 키 세트를 고릅니다. mod는 각자의 폴더에서 가져와 설치합니다 |
| [`sysmon-status/`](sysmon-status/RECIPE.md) | 레이아웃 | 기본 `main` 레이아웃의 상태 바에 CPU·메모리 사용량 미터를 더한 것 |
| [`inbox/`](inbox/RECIPE.md) | mod | 모든 agent를 보여주는 키보드 중심 팝업. 입력을 기다리는 agent가 맨 위에 옵니다 (제안 키 `alt-2`) |
| [`recent/`](recent/RECIPE.md) | mod | 최근에 본 탭 순서로 보여주는 팝업. 열고 Enter를 누르면 직전 두 탭을 오갑니다 (제안 키 `ctrl-e`. 셸의 줄 끝 이동을 가져가므로 대안은 `alt-e`). 레이아웃에 0px 칸이 하나 필요합니다. [Built from](recent/RECIPE.md#built-from) 참고 |
| [`projects/`](projects/RECIPE.md) | mod | space 전환과 프로젝트 폴더 열기를 한 팝업에서. 열린 space가 먼저, 그다음 지정한 root 아래 폴더와 pin이 나옵니다 (제안 키 `alt-1`, `ctrl-shift-j`) |
| [`keymap/`](keymap/README.ko.md) | 키 배치 | 작성자의 `keys.json` (vim식 pane 이동, `ctrl-b` 접두 키, 팝업 키). 내 키 설정에 병합해서 씁니다. gallery 항목은 아닙니다 |
| [`viewer/`](viewer/RECIPE.md) | mod | 터미널의 경로나 웹 주소를 Ctrl/Cmd-클릭하면 바로 옆 pane에 보여줍니다. 코드(클릭한 줄로 이동), markdown, 이미지, 웹페이지를 지원하고, agent가 repo 기준으로 쓴 상대 경로도 찾습니다. |

## 지원 OS와 요구 사항

모두 Linux에서 Herdr 0.1.16–0.1.17로 만들고 검증했습니다. "코드상 지원"은 해당 OS를 고려해 작성했지만 실제로 돌려 보지는 않았다는 뜻입니다.

| 폴더 | Linux | macOS | Windows | Herdr | 그 밖에 필요한 것 |
|---|---|---|---|---|---|
| `all-in-one` | 설치만 검증 (실제 창 전환은 아직) | 코드상 지원 (미터는 설치에서 제외) | 코드상 지원 (미터는 설치에서 제외) | **0.1.17 이상** | `viewer`가 필요로 하는 것 |
| `keymap` | 검증 | 대부분 됨 (`alt-1`/`alt-2`가 문자 입력이 될 수 있음) | 키 자체는 OS와 무관 | 0.1.16 이상 | 키에 해당하는 `projects`, `inbox`, `recent` |
| `sysmon-status` | 검증 | 미지원 (미터가 비어 보임) | 미지원 (미터가 비어 보임) | 0.1.16 이상 | 없음 (`/proc`를 읽음) |
| `inbox` | 검증 | 코드상 지원 | 코드상 지원 | 0.1.16 이상 | 없음 |
| `recent` | 검증 | 코드상 지원 | 코드상 지원 | 0.1.16 이상 | 없음 |
| `projects` | 검증 | 코드상 지원 | 코드상 지원 | 0.1.16 이상 | 없음. Windows에서 홈 폴더 밖 root는 PowerShell로 읽음 |
| `viewer` | 검증 | 코드상 지원 | 코드상 지원 | **0.1.17 이상** (터미널 링크 처리) | Node 22 이상, `git`. 웹페이지·`.html`은 Chrome, Chromium 또는 Edge |

## 설치

Herdr 안에서 Claude Code(또는 다른 agent)를 열고 아래 문장을 주세요. 주소만 원하는 폴더로 바꾸면 됩니다. `all-in-one`은 전부를 한 번에 설치하고, 다른 폴더도 같은 방식으로 하나씩 설치할 수 있습니다.

```
https://github.com/rootsong0220/herdr-mods/tree/main/all-in-one 을 내 Herdr에 설치해줘.
- repo는 임시 폴더에 `git clone --depth 1`로 받아. git이 없으면 https://github.com/rootsong0220/herdr-mods/archive/refs/heads/main.zip 을 받고, 커밋은 https://api.github.com/repos/rootsong0220/herdr-mods/commits/main 에서 읽어. 그다음 Herdr 홈(AGENTS.md가 있는 폴더)의 AGENTS.md와 그 폴더의 RECIPE.md 절차를 따라.
- 먼저 RECIPE의 요구 사항(Herdr 버전, Node, git, 브라우저)을 확인해서 결과를 보여줘. 빠진 게 있으면 설치하기 전에 물어봐.
- 기존 파일은 덮어쓰지 마. keys.json을 바꾸기 전에 keys.json.bak-<날짜>로 백업해.
- 키는 각 mod가 제안하는 키로 하고, 이미 쓰는 키와 겹치면 바꾸지 말고 물어봐.
- 설치한 각 mod 폴더의 .herdr-mods-commit에 그 커밋을 남겨.
- 끝나면 각 mod에 herdr-app check를 돌리고(herdr-app 명령이 없으면 알려주고 건너뛰어), 새 레이아웃이 있으면 전환한 뒤, 설치한 것, 이름을 바꾼 것, 원래대로 돌아가는 방법, 전부 지우는 방법을 정리해줘.
```

폴더 주소:

- https://github.com/rootsong0220/herdr-mods/tree/main/all-in-one
- https://github.com/rootsong0220/herdr-mods/tree/main/keymap (내 키 설정에 병합. 폴더의 README 참고)
- https://github.com/rootsong0220/herdr-mods/tree/main/sysmon-status
- https://github.com/rootsong0220/herdr-mods/tree/main/inbox
- https://github.com/rootsong0220/herdr-mods/tree/main/recent
- https://github.com/rootsong0220/herdr-mods/tree/main/projects
- https://github.com/rootsong0220/herdr-mods/tree/main/viewer

각 폴더의 `RECIPE.md`는 설치하는 agent가 읽는 문서라 영어로만 제공합니다.

## 업데이트

설치한 mod는 사본이라 저절로 업데이트되지 않습니다. agent에게 아래를 주세요.

```
https://github.com/rootsong0220/herdr-mods 에서 설치한 항목을 최신으로 업데이트해줘.
- repo는 임시 폴더에 `git clone --depth 1`로 받아 (git이 없으면 설치 문장의 zip과 커밋 주소로). 웹 페이지나 raw.githubusercontent.com으로 읽지 마 (최대 5분 캐시됨).
- 내 Herdr 홈에서 이 repo로 설치한 mod를 찾아 (inbox, recent, projects, viewer, sysmon, 또는 설치할 때 바꾼 이름).
- 각 mod의 .herdr-mods-commit을 clone의 커밋과 비교하고, 모든 파일을 repo 폴더와 diff로 비교해. diff 없이 최신이라고 판단하지 마.
- 다른 파일은 교체해 (업데이트라 덮어써도 됨). 단 내가 직접 고친 파일이면 차이를 보여주고 먼저 물어봐. 다른 이름으로 설치한 mod는 RECIPE에 적힌 이름 변경을 다시 적용해.
- 내 데이터(projects.json, Recent 방문 기록)는 그대로 둬. Windows라면 projects.json에서 "~/"로 시작하는 항목은 전체 경로로 바꿔.
- 각 keys.json의 키를 병합하고, 내가 쓰는 키를 바꿔야 하면 먼저 물어봐.
- 그 커밋을 .herdr-mods-commit에 쓰고, 각 mod에 herdr-app check를 돌린 뒤(명령이 없으면 건너뛰고) 바뀐 점을 정리해줘.
```
