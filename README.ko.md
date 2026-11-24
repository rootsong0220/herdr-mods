[English](README.md) | **한국어**

# herdr-mods

[Herdr](https://herdr.dev)용 mod와 레이아웃 모음입니다. 폴더 하나가 항목 하나입니다. 각 폴더의 `RECIPE.md`는 처음부터 다시 만들 수 있는 설계서이고, 폴더 안의 파일은 그 설계서로 만든 구현 하나입니다.

| 폴더 | 종류 | 설명 |
|---|---|---|
| [`sysmon-status/`](sysmon-status/RECIPE.md) | 레이아웃 | 기본 `main` 레이아웃의 상태 바에 CPU·메모리 사용량 미터를 더한 것 (Linux 전용) |
| [`inbox/`](inbox/RECIPE.md) | mod | 모든 agent를 보여주는 키보드 중심 팝업. 입력을 기다리는 agent가 맨 위에 옵니다 (제안 키 `alt-2`) |
| [`recent/`](recent/RECIPE.md) | mod | 최근에 본 탭 순서로 보여주는 팝업. 열고 Enter를 누르면 직전 두 탭을 오갑니다 (제안 키 `alt-e`). 레이아웃에 0px 칸이 하나 필요합니다. [Built from](recent/RECIPE.md#built-from) 참고 |
| [`projects/`](projects/RECIPE.md) | mod | space 전환과 프로젝트 폴더 열기를 한 팝업에서. 열린 space가 먼저, 그다음 지정한 root 아래 폴더와 pin이 나옵니다 (제안 키 `ctrl-shift-j`) |
| [`viewer/`](viewer/RECIPE.md) | mod | 터미널의 경로나 웹 주소를 Ctrl/Cmd-클릭하면 바로 옆 pane에 보여줍니다. 코드(클릭한 줄로 이동), markdown, 이미지, 웹페이지를 지원하고, agent가 repo 기준으로 쓴 상대 경로도 찾습니다. Node 22 이상, 웹페이지에는 Chrome 또는 Edge가 필요합니다 |

설치하려면 agent에게 폴더 주소를 주세요. 예: "https://github.com/rootsong0220/herdr-mods/tree/main/inbox 추가해줘"

- https://github.com/rootsong0220/herdr-mods/tree/main/sysmon-status
- https://github.com/rootsong0220/herdr-mods/tree/main/inbox
- https://github.com/rootsong0220/herdr-mods/tree/main/recent
- https://github.com/rootsong0220/herdr-mods/tree/main/projects
- https://github.com/rootsong0220/herdr-mods/tree/main/viewer

agent는 Herdr 홈(`~/.config/herdr-app`, 또는 `$HERDR_APP_HOME`)의 `AGENTS.md`에 있는 절차대로 설치합니다. 각 항목의 `RECIPE.md`는 설치하는 agent가 읽는 문서라 영어로만 제공합니다.
