import type { CircuitSpec } from './logic'
import { advancedChallenges, advancedWiringGuides } from './advancedContent'

export type ModuleId = 'gates' | 'boolean' | 'combo' | 'sequential' | 'sandbox'
export type ChallengeKind = 'choice' | 'bits' | 'kmap' | 'circuit'

export interface Challenge {
  id: string
  module: ModuleId
  title: string
  subtitle: string
  kind: ChallengeKind
  prompt: string
  options?: string[]
  answer?: number
  expected?: number[]
  circuit?: CircuitSpec
  hint: string
  explanation: string
  difficulty?: '中階' | '高階'
  source?: string
  kmap?: { variables: string[]; minterms: number[]; dontCares: number[] }
  table?: { givenColumns: string[]; answerColumns: string[]; rows: string[][]; answerOptions?: string[] }
}

export interface LessonModule {
  id: ModuleId
  number: string
  title: string
  short: string
  eyebrow: string
  description: string
  concept: string
  takeaway: string
  badge: string
  accent: string
}

export const modules: LessonModule[] = [
  {
    id: 'gates', number: '01', title: '邏輯閘', short: '從 0 與 1 開始', eyebrow: 'FOUNDATION',
    description: '親手切換輸入，觀察電路如何決定輸出。',
    concept: '邏輯閘把一個或多個二進位輸入轉換成輸出。AND 要全部為 1，OR 只要有一個為 1，XOR 在輸入不同時為 1。',
    takeaway: '真值表列出所有輸入組合，是檢查邏輯功能最可靠的方式。', badge: '邏輯啟航', accent: 'blue',
  },
  {
    id: 'boolean', number: '02', title: '布林代數與 K-Map', short: '把電路變成算式', eyebrow: 'SIMPLIFY',
    description: '從真值表寫出函數，再用卡諾圖看見可合併的項。',
    concept: '布林代數用 ·、+、上橫線（或 ¬）描述 AND、OR、NOT。K-Map 依格雷碼排列相鄰輸入，讓化簡更直觀。',
    takeaway: '化簡後的電路可以有不同接法；最重要的是每一組輸入都得到相同輸出。', badge: '化簡高手', accent: 'purple',
  },
  {
    id: 'combo', number: '03', title: '組合電路', short: '讓邏輯一起工作', eyebrow: 'COMPOSE',
    description: '組合多個邏輯閘，完成加法與功能選擇。',
    concept: '組合電路的輸出只由「當下輸入」決定。加法器用 XOR 產生和，用 AND 或進位邏輯產生進位。',
    takeaway: '一位元全加器：S = A ⊕ B ⊕ CI；CO = AB + ACI + BCI。', badge: '電路設計師', accent: 'orange',
  },
  {
    id: 'sequential', number: '04', title: '循序邏輯', short: '讓電路記住過去', eyebrow: 'TIMING',
    description: '用時脈一步步推演正反器與狀態機。',
    concept: '循序電路具有狀態。正緣觸發 D 正反器只在時脈上升緣取樣 D；其他時間保持上一個 Q。',
    takeaway: '推時序圖時，先標記有效時脈邊緣，再由舊狀態計算新狀態。', badge: '時序觀察家', accent: 'green',
  },
  {
    id: 'sandbox', number: '05', title: '自由連線沙盒', short: '設計你的電路', eyebrow: 'CREATE',
    description: '拖放邏輯閘、連接導線，再以完整真值表驗證作品。',
    concept: '從輸入端出發，加入邏輯閘並連到輸出端。可以拖出導線，或依序點選來源與目的接點；每個輸入接點只能有一條線。',
    takeaway: '按「測試電路」會檢查所有輸入組合，指出第一組不符合的結果。', badge: '電路創客', accent: 'pink',
  },
]

const foundationChallenges: Challenge[] = [
  { id: 'g1', module: 'gates', title: '預測 XOR 輸出', subtitle: '01 · 單一步驟', kind: 'choice', prompt: 'A = 1、B = 0 時，XOR 閘的輸出是多少？', options: ['0', '1', 'X（未知）'], answer: 1, hint: 'XOR 在兩個輸入「不同」時輸出 1。', explanation: 'A 與 B 分別是 1 和 0，兩者不同，因此 1 ⊕ 0 = 1。' },
  { id: 'g2', module: 'gates', title: '辨認神祕邏輯閘', subtitle: '02 · 真值表', kind: 'choice', prompt: '下方真值表描述哪一種邏輯閘？', options: ['AND', 'OR', 'XOR', 'NAND'], answer: 3, hint: '只有 A、B 都是 1 時輸出 0。它是 AND 再反相。', explanation: 'AND 只在 11 時輸出 1；將 AND 的結果反相，就得到 00、01、10 為 1，11 為 0 的 NAND。' },
  { id: 'g3', module: 'gates', title: '接出 AND 閘', subtitle: '03 · 接線闖關', kind: 'circuit', prompt: '拖入 AND 閘，讓 Y 只有在 A、B 都為 1 時亮起。', hint: 'A 與 B 各接到 AND 的一個輸入，AND 的輸出接到 Y。', explanation: 'AND 的輸出依序是 00→0、01→0、10→0、11→1。', circuit: { goal: 'and', inputs: ['A', 'B'], outputs: ['Y'], allowed: ['AND'] } },
  { id: 'g4', module: 'gates', title: '用 NAND 做反相器', subtitle: '04 · 一閘兩線', kind: 'circuit', prompt: '只能用 NAND 閘，讓 Y = ¬A。', hint: '把 A 同時接到 NAND 的兩個輸入端。', explanation: 'A NAND A = ¬(A·A) = ¬A。扇出可以把同一輸出接到多個輸入端。', circuit: { goal: 'nand-not', inputs: ['A'], outputs: ['Y'], allowed: ['NAND'] } },
  { id: 'g5', module: 'gates', title: '讓任一輸入點亮輸出', subtitle: '05 · OR 接線', kind: 'circuit', prompt: '加入 OR 閘，讓 A 或 B 其中一個為 1 時 Y 就是 1。', hint: 'A、B 各接到 OR 的一個輸入，再將 OR 輸出接到 Y。', explanation: 'OR 的真值表為 00→0、01→1、10→1、11→1。', circuit: { goal: 'or', inputs: ['A', 'B'], outputs: ['Y'], allowed: ['OR'] } },
  { id: 'g6', module: 'gates', title: '接出不同才亮的電路', subtitle: '06 · XOR 接線', kind: 'circuit', prompt: '使用 XOR 閘，讓 A 與 B 不同時 Y=1。', hint: '讓 A、B 進入 XOR 的兩個輸入端，輸出端再接 Y。', explanation: 'XOR 在 01 和 10 時為 1；00 和 11 時為 0。試著切換輸入觀察兩條導線。', circuit: { goal: 'xor', inputs: ['A', 'B'], outputs: ['Y'], allowed: ['XOR'] } },
  { id: 'b1', module: 'boolean', title: '找出等價的 SOP', subtitle: '01 · 布林表示', kind: 'choice', prompt: '哪個乘積的和（SOP）等價於 A ⊕ B？', options: ['AB + A̅B̅', 'A̅B + AB̅', 'AB + AB̅', 'A + B'], answer: 1, hint: '列出使 XOR = 1 的兩組輸入：01 與 10。', explanation: '01 對應 A̅B；10 對應 AB̅。將兩項相加，得到 A̅B + AB̅。' },
  { id: 'b2', module: 'boolean', title: '填入卡諾圖', subtitle: '02 · 點選 1 的格子', kind: 'kmap', prompt: '點選 A ⊕ B 為 1 的格子，再檢查答案。', expected: [0, 1, 1, 0], hint: 'XOR 在 A 與 B 不同時為 1，所以找 01 和 10。', explanation: 'A=0、B=1 和 A=1、B=0 的兩格為 1；另外兩格為 0。這兩個 1 不相鄰，因此 SOP 為 A̅B + AB̅。' },
  { id: 'b3', module: 'boolean', title: '把 SOP 接成電路', subtitle: '03 · 布林接線', kind: 'circuit', prompt: '只用 NOT、AND、OR 閘實作 Y = A̅B + AB̅。', hint: '先產生 ¬A 和 ¬B，再做 A̅B、AB̅，最後用 OR 合併。', explanation: 'A̅B 與 AB̅ 對應輸入 01 與 10；兩項相加等價於 XOR。', circuit: { goal: 'xor-sop', inputs: ['A', 'B'], outputs: ['Y'], allowed: ['NOT', 'AND', 'OR'] } },
  { id: 'b4', module: 'boolean', title: '用德摩根定律改接 NAND', subtitle: '04 · 等價電路', kind: 'circuit', prompt: '只能使用 NOT 與 OR 閘，接出 Y = ¬(A·B)。', hint: '德摩根定律：¬(A·B) = ¬A + ¬B。先分別反相，再用 OR 合併。', explanation: '¬A + ¬B 只在 A=B=1 時輸出 0，因此與 NAND 的完整真值表相同。', circuit: { goal: 'demorgan-nand', inputs: ['A', 'B'], outputs: ['Y'], allowed: ['NOT', 'OR'] } },
  { id: 'c1', module: 'combo', title: '完成半加器真值表', subtitle: '01 · 和與進位', kind: 'bits', prompt: '依序點選每列的 S（和）與 C（進位），完成半加器真值表。', expected: [0, 0, 1, 0, 1, 0, 0, 1], hint: 'S = A ⊕ B；C = A · B。', explanation: '00→00、01→10、10→10、11→01（每組依序為 S、C）。1+1=二進位 10，所以和為 0、進位為 1。' },
  { id: 'c2', module: 'combo', title: '設計選擇輸出', subtitle: '02 · 組合功能', kind: 'choice', prompt: 'SEL=0 時輸出 A AND B；SEL=1 時輸出 A+B+CI 的「和」。哪個 O 算式正確？', options: ['O = SEL·AB + SEL̅·(A⊕B⊕CI)', 'O = SEL̅·AB + SEL·(A⊕B⊕CI)', 'O = AB + A⊕B⊕CI', 'O = SEL·(A+B+CI)'], answer: 1, hint: 'SEL=0 時，SEL̅=1，應保留 AB；SEL=1 時，應保留加法的和。', explanation: '選擇器的 SOP 是 O = SEL̅·AB + SEL·(A⊕B⊕CI)。SEL 為 0 時只剩 AB，為 1 時只剩全加器的和。' },
  { id: 'c3', module: 'combo', title: '接出半加器', subtitle: '03 · 雙輸出', kind: 'circuit', prompt: '讓 S 是和、C 是進位，完成一位元半加器。', hint: 'S = A ⊕ B；C = A · B。同一個輸入可以連到多個閘。', explanation: '半加器用 XOR 求和、AND 求進位；檢核會同時測試 S 和 C。', circuit: { goal: 'half-adder', inputs: ['A', 'B'], outputs: ['S', 'C'], allowed: ['AND', 'OR', 'XOR', 'NAND', 'NOT'] } },
  { id: 'c4', module: 'combo', title: '接出 2 選 1 電路', subtitle: '04 · 選擇器', kind: 'circuit', prompt: 'SEL=0 時 Y=A；SEL=1 時 Y=B。只用 NOT、AND、OR 閘。', hint: 'Y = (¬SEL · A) + (SEL · B)。先反相 SEL，再做兩個 AND。', explanation: '兩條路徑由 SEL 與 ¬SEL 控制，最後以 OR 合併。', circuit: { goal: 'mux', inputs: ['A', 'B', 'SEL'], outputs: ['Y'], allowed: ['NOT', 'AND', 'OR'] } },
  { id: 'c5', module: 'combo', title: '接出三輸入奇偶檢測', subtitle: '05 · 多級 XOR', kind: 'circuit', prompt: '只能使用 XOR 閘，讓 A、B、C 中有奇數個 1 時 Y=1。', hint: '先做 A⊕B，再把結果與 C 接到另一個 XOR。', explanation: 'Y=A⊕B⊕C。三個輸入共有 8 組，含 1 個或 3 個 1 的組合會輸出 1。', circuit: { goal: 'parity3', inputs: ['A', 'B', 'C'], outputs: ['Y'], allowed: ['XOR'] } },
  { id: 's1', module: 'sequential', title: '推演 D 正反器', subtitle: '01 · 上升緣取樣', kind: 'bits', prompt: '初始 Q=0。四次上升緣時 D 依序為 1、0、1、1。點選每次上升緣後的 Q。', expected: [1, 0, 1, 1], hint: '每遇到一次上升緣，新的 Q 就等於當下 D。', explanation: 'D 正反器在四次上升緣各取樣 1、0、1、1，所以 Q 的軌跡是 1→0→1→1。' },
  { id: 's2', module: 'sequential', title: '追蹤奇偶狀態機', subtitle: '02 · 狀態轉換', kind: 'bits', prompt: '初始狀態為偶數（0）。輸入依序為 1、0、1、1；1 會切換奇偶，0 會維持。填入每步後的狀態。', expected: [1, 1, 0, 1], hint: '只有輸入 1 時切換：偶↔奇。', explanation: '初始偶（0）；讀 1→奇（1），讀 0→奇（1），讀 1→偶（0），讀 1→奇（1）。' },
  { id: 's3', module: 'sequential', title: '接出一位元暫存器', subtitle: '03 · 時脈接線', kind: 'circuit', prompt: '用 D 正反器讓 Q 只在 CLK 上升緣取樣 D。', hint: 'D 接資料輸入，CLK 接時脈輸入，正反器的 Q 接到輸出 Q。', explanation: 'D 改變時 Q 會保持舊值；只有 CLK 從 0 變成 1 時，Q 才更新為 D。', circuit: { goal: 'register', inputs: ['D', 'CLK'], outputs: ['Q'], allowed: ['DFF'], steps: [
    { inputs: { D: 0, CLK: 0 }, expected: { Q: 0 } }, { inputs: { D: 1, CLK: 0 }, expected: { Q: 0 } },
    { inputs: { D: 1, CLK: 1 }, expected: { Q: 1 } }, { inputs: { D: 0, CLK: 1 }, expected: { Q: 1 } },
    { inputs: { D: 0, CLK: 0 }, expected: { Q: 1 } }, { inputs: { D: 0, CLK: 1 }, expected: { Q: 0 } },
    { inputs: { D: 1, CLK: 1 }, expected: { Q: 0 } }, { inputs: { D: 1, CLK: 0 }, expected: { Q: 0 } },
    { inputs: { D: 1, CLK: 1 }, expected: { Q: 1 } },
  ] } },
  { id: 's4', module: 'sequential', title: '加入非同步重置', subtitle: '04 · 時序接線', kind: 'circuit', prompt: '接上 RST；RST=1 時 Q 立即變 0，其餘時間在 CLK 上升緣取樣 D。', hint: '在前一關接線的基礎上，再把 RST 接到正反器的 RST 輸入。', explanation: '非同步重置不等待時脈。題目會測試 CLK 保持為 1 時，RST 從 0 變 1 的情況。', circuit: { goal: 'register-reset', inputs: ['D', 'CLK', 'RST'], outputs: ['Q'], allowed: ['DFF'], steps: [
    { inputs: { D: 0, CLK: 0, RST: 0 }, expected: { Q: 0 } }, { inputs: { D: 1, CLK: 1, RST: 0 }, expected: { Q: 1 } },
    { inputs: { D: 1, CLK: 1, RST: 1 }, expected: { Q: 0 } }, { inputs: { D: 1, CLK: 0, RST: 1 }, expected: { Q: 0 } },
    { inputs: { D: 1, CLK: 0, RST: 0 }, expected: { Q: 0 } }, { inputs: { D: 1, CLK: 1, RST: 0 }, expected: { Q: 1 } },
    { inputs: { D: 0, CLK: 1, RST: 0 }, expected: { Q: 1 } }, { inputs: { D: 0, CLK: 0, RST: 0 }, expected: { Q: 1 } },
    { inputs: { D: 0, CLK: 1, RST: 0 }, expected: { Q: 0 } },
  ] } },
  { id: 's5', module: 'sequential', title: '讓狀態每拍切換', subtitle: '05 · 回授電路', kind: 'circuit', prompt: '只用 D 正反器與 NOT，讓 Q 在每次 CLK 上升緣切換 0、1。', hint: '將 Q 經過 NOT 接回 D；CLK 接時脈輸入，Q 同時接到輸出。', explanation: '每個上升緣取樣 D=¬Q，因此新狀態是舊狀態的反相；兩個上升緣後又回到原狀態。', circuit: { goal: 'toggle', inputs: ['CLK'], outputs: ['Q'], allowed: ['DFF', 'NOT'], steps: [
    { inputs: { CLK: 0 }, expected: { Q: 0 } }, { inputs: { CLK: 1 }, expected: { Q: 1 } },
    { inputs: { CLK: 1 }, expected: { Q: 1 } }, { inputs: { CLK: 0 }, expected: { Q: 1 } },
    { inputs: { CLK: 1 }, expected: { Q: 0 } }, { inputs: { CLK: 0 }, expected: { Q: 0 } },
    { inputs: { CLK: 1 }, expected: { Q: 1 } },
  ] } },
  { id: 'sb1', module: 'sandbox', title: '接出 AND 功能', subtitle: '01 · 四組輸入檢核', kind: 'circuit', prompt: '讓輸出 Y = A · B。可以使用任意邏輯閘。', hint: '加入一個 AND 閘：A、B 分別接到兩個輸入，再把輸出接到 Y。', explanation: 'AND 只有 A=B=1 時輸出 1。完整真值表為 00→0、01→0、10→0、11→1。', circuit: { goal: 'and', inputs: ['A', 'B'], outputs: ['Y'], allowed: ['AND', 'OR', 'XOR', 'NAND', 'NOT'] } },
  { id: 'sb2', module: 'sandbox', title: '只用 NAND 接出 XOR', subtitle: '02 · 限定閘種', kind: 'circuit', prompt: '讓 Y = A ⊕ B，而且電路中只能使用 NAND 閘。', hint: '可用四個 NAND：T=A NAND B；U=A NAND T；V=B NAND T；Y=U NAND V。', explanation: 'T=¬AB，U=¬(A·T)，V=¬(B·T)，最後 U NAND V 只在 A、B 不同時為 1，因此等價於 XOR。', circuit: { goal: 'xor-nand', inputs: ['A', 'B'], outputs: ['Y'], allowed: ['NAND'] } },
  { id: 'sb3', module: 'sandbox', title: '完成全加器', subtitle: '03 · 進階雙輸出', kind: 'circuit', prompt: '輸入 A、B、CI，輸出 S（和）與 C（進位）。', hint: 'S = A⊕B⊕CI；C = AB + ACI + BCI。可以讓中間結果分岔到多個閘。', explanation: '全加器對三個輸入有 8 組測試向量；S 是三位元的奇偶結果，C 在至少兩個輸入為 1 時為 1。', circuit: { goal: 'full-adder', inputs: ['A', 'B', 'CI'], outputs: ['S', 'C'], allowed: ['AND', 'OR', 'XOR', 'NAND', 'NOT'] } },
  { id: 'sb4', module: 'sandbox', title: '三人投票多數決', subtitle: '04 · 三輸入設計', kind: 'circuit', prompt: 'A、B、C 是三票；至少兩票為 1 時讓 Y=1。只能用 AND 與 OR。', hint: 'Y=AB+AC+BC。先做三種兩兩配對，再把結果合併。', explanation: '000、001、010、100 輸出 0；011、101、110、111 輸出 1。', circuit: { goal: 'majority', inputs: ['A', 'B', 'C'], outputs: ['Y'], allowed: ['AND', 'OR'] } },
]

export const challenges: Challenge[] = modules.flatMap(module => [...foundationChallenges, ...advancedChallenges].filter(challenge => challenge.module === module.id))

export const getChallenges = (module: ModuleId) => challenges.filter(challenge => challenge.module === module)

// Each guide describes one valid circuit. Equivalent circuits are also accepted by the checker.
export const wiringGuides: Record<string, string[]> = {
  ...advancedWiringGuides,
  g3: ['加入一個 AND 閘。', '將 A 接到 AND 的 A 輸入，B 接到 B 輸入。', '將 AND 的輸出接到 Y。測試時，只有 A、B 都是 1，Y 才是 1。'],
  g4: ['加入一個 NAND 閘。', '把 A 的輸出分別接到 NAND 的 A、B 兩個輸入。', '將 NAND 的輸出接到 Y。因為 A·A=A，反相後便是 ¬A。'],
  g5: ['加入一個 OR 閘。', '將 A、B 分別接到 OR 的兩個輸入。', '將 OR 的輸出接到 Y；只要任一輸入為 1，Y 就會是 1。'],
  g6: ['加入一個 XOR 閘。', '將 A、B 分別接到 XOR 的兩個輸入。', '將 XOR 的輸出接到 Y；切換 01、10，可觀察到 Y=1。'],
  b3: ['加入兩個 NOT、兩個 AND 和一個 OR。', '把 A 接到第一個 NOT，產生 ¬A；B 接到第二個 NOT，產生 ¬B。', '將 ¬A 與 B 接到第一個 AND，得到 ¬A·B。', '將 A 與 ¬B 接到第二個 AND，得到 A·¬B。', '把兩個 AND 的輸出接到 OR，再將 OR 輸出接到 Y。'],
  b4: ['加入兩個 NOT 和一個 OR。', '將 A、B 分別接到兩個 NOT，得到 ¬A、¬B。', '將兩個 NOT 輸出接到 OR 的兩個輸入。', '將 OR 輸出接到 Y；這就是 ¬A+¬B=¬(A·B)。'],
  c3: ['加入一個 XOR 和一個 AND。', 'A、B 各分岔兩條線，分別接到 XOR 和 AND 的兩個輸入。', 'XOR 的輸出接到 S（和），AND 的輸出接到 C（進位）。', '檢查 A=B=1：S 應為 0，C 應為 1。'],
  c4: ['加入一個 NOT、兩個 AND 和一個 OR。', '將 SEL 接到 NOT，產生 ¬SEL。', '把 A、¬SEL 接到第一個 AND；把 B、SEL 接到第二個 AND。', '將兩個 AND 輸出接到 OR，最後接到 Y。SEL=0 選 A，SEL=1 選 B。'],
  c5: ['加入兩個 XOR。', 'A、B 接到第一個 XOR，得到中間值 T=A⊕B。', '將 T 和 C 接到第二個 XOR。', '第二個 XOR 的輸出接到 Y；奇數個輸入為 1 時，Y=1。'],
  s3: ['加入一個 D 正反器。', '將題目的 D 接到正反器的 D 資料端。', '將 CLK 接到正反器的 CLK 端，再把正反器 Q 輸出接到題目 Q。', '先改變 D，再讓 CLK 從 0 切到 1；Q 只在這個上升緣更新。'],
  s4: ['加入一個 D 正反器。', '將 D、CLK、RST 分別接到正反器的 D、CLK、RST 端。', '將正反器的 Q 輸出接到題目 Q。', 'RST=1 時 Q 會立即歸零；RST=0 時只在 CLK 上升緣取樣 D。'],
  s5: ['加入一個 D 正反器和一個 NOT。', '將正反器的 Q 輸出接到 NOT 輸入，再將 NOT 輸出接回正反器 D 端。', '將題目的 CLK 接到正反器 CLK 端。', '將正反器 Q 同時接到題目 Q；每次上升緣會取樣 ¬Q，所以 0、1 交替。'],
  sb1: ['加入一個 AND 閘。', 'A、B 分別接到 AND 的兩個輸入，AND 輸出接到 Y。', '切換四組輸入，確認只有 11 使 Y=1。'],
  sb2: ['加入四個 NAND，依序視為 T、U、V、W。', 'A、B 接到 T 的兩個輸入，得到 T=A NAND B。', 'A、T 接到 U；B、T 接到 V。T 的輸出需要分岔。', 'U、V 接到 W，最後將 W 輸出接到 Y。', '檢查 01、10 時 Y=1，00、11 時 Y=0。'],
  sb3: ['加入兩個 XOR、兩個 AND 和一個 OR。', 'A、B 接到第一個 XOR 得到 T；T、CI 接到第二個 XOR，輸出接 S。', 'A、B 接到第一個 AND，得到 P=A·B。', 'T、CI 接到第二個 AND，得到 R=T·CI。', 'P、R 接到 OR，再接到 C。C=P+R，在至少兩個輸入為 1 時輸出 1。'],
  sb4: ['加入三個 AND 和兩個 OR。', '用三個 AND 分別接出 A·B、A·C、B·C。每個來源可以接到多個閘。', '將 A·B、A·C 接到第一個 OR。', '將第一個 OR 的輸出與 B·C 接到第二個 OR，最後接到 Y。', '任兩票以上為 1，就至少有一組 AND 為 1，因此 Y=1。'],
}
