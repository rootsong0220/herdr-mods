[English](README.md) | **한국어**

# keymap

작성자가 쓰는 Herdr `keys.json`입니다. 주요 특징은 이렇습니다.

- `alt-h/j/k/l`로 vim처럼 pane을 이동합니다.
- tmux처럼 `ctrl-b` 접두 키를 씁니다.
- `ctrl-1`…`9`로 탭을 고릅니다.
- 이 repo의 팝업을 여는 키가 있습니다.

gallery 항목이 아닙니다. 내 파일을 덮어쓰지 말고 병합해서 설치하세요.

## 설치

agent에게 이 폴더 주소를 주세요. 예: "https://github.com/rootsong0220/herdr-mods/tree/main/keymap 을 내 키 설정에 병합해줘". agent는 다음을 해야 합니다.

1. `AGENTS.md`의 절차대로, 이 `keys.json`을 Herdr 홈(`~/.config/herdr-app`, 또는 `$HERDR_APP_HOME`)의 `keys.json`에 병합합니다. 새 키는 추가하고, 이미 쓰는 키를 바꿀 때는 먼저 묻습니다. Herdr 기본값을 바꾸는 키는 아래 표에 있습니다.
2. `projects`, `inbox`, `recent`를 다른 이름으로 설치했다면 `mod.open:<이름>`을 그 이름으로 고칩니다. 설치하지 않았다면 해당 키는 아무 동작도 하지 않습니다.
3. 거절한 키는 넣지 않습니다.

`keys.json`을 한 번 고치면, 그 뒤 Herdr 업데이트의 새 기본 단축키는 자동으로 들어오지 않습니다(`AGENTS.md` 참고).

## Herdr 기본값과 달라지는 점

### 기본 동작을 바꾸는 키

| 키 | Herdr 기본값 | 이 키 배치 |
|---|---|---|
| `alt-1` | `space.select:1` | `mod.open:projects` ([`projects`](../projects/RECIPE.md) 필요) |
| `alt-2` | `space.select:2` | `mod.open:inbox` ([`inbox`](../inbox/RECIPE.md) 필요) |
| `alt-3` … `alt-9` | `space.select:3` … `9` | 이 파일에는 없음. 병합은 키를 지우지 않으므로 원래 키가 그대로 남음 |
| `alt-up` / `alt-down` | `agent.prev` / `agent.next` | `pane.go:up` / `pane.go:down` |
| `ctrl-shift-l` | `layout.switch` | `pane.split:down` |

### 추가되는 키

| 키 | 동작 |
|---|---|
| `alt-shift-up` / `alt-shift-down` | `agent.prev` / `agent.next` (`alt-up`/`alt-down`에서 옮김) |
| `alt-shift-left` / `alt-shift-right` | `tab.prev` / `tab.next` |
| `alt-n` | `tab.rename` |
| `ctrl-shift-j` | `mod.open:projects` |
| `ctrl-shift-r` | `pane.split:right` |
| `ctrl-e` | `mod.open:recent` ([`recent`](../recent/RECIPE.md) 필요) |
| `ctrl-n` | `tab.new` |
| `ctrl-b %` / `ctrl-b shift-5` | `pane.split:right` |
| `ctrl-b "` / `ctrl-b shift-'` | `pane.split:down` |
| `ctrl-b x` | `pane.close` |
| `ctrl-b &` / `ctrl-b shift-7` | `tab.close` |

나머지는 Herdr 0.1.17 기본값과 같습니다.

## 주의할 점

- **셸이나 터미널 프로그램이 쓰던 키를 가져갑니다.** 전역 키가 터미널 안 프로그램보다 먼저 적용되기 때문입니다.
  - `ctrl-e`는 모든 셸에서 줄 끝 이동을 막습니다.
  - `ctrl-n`은 다음 명령 기록 불러오기를 막고, 많은 TUI에서 "아래로"도 막습니다.
  - `ctrl-b` 조합은 셸의 한 글자 뒤로 가기(`ctrl-b`)를 막고, Herdr 안에서 tmux를 쓰면 tmux 키와 겹칩니다.
  - 셸에서 이 키들을 계속 쓰려면 거절하세요. recent는 RECIPE가 제안하는 `alt-e`로 옮겨도 됩니다.
- **`ctrl-shift-l` 교체를 받아들이면, 이 키로는 더 이상 레이아웃이 바뀌지 않습니다.** 명령 팔레트(`ctrl-shift-p`)나 `herdr-app do layout.switch`로 바꾸세요.
- macOS의 여러 키보드 배열에서는 Option+숫자가 문자를 입력하므로, `alt-1`/`alt-2`가 Herdr까지 오지 않을 수 있습니다.
- Linux와 Herdr 0.1.16–0.1.17에서 확인했습니다.
