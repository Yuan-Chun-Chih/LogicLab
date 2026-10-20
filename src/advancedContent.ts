import type { Challenge } from './content'
import { getInputVectors, type Bit, type CircuitStep, type Signal } from './logic'

const exam2025 = '改編自 LOGIC2025A：K-Map、無關項與暫存器運算題型。'
const exam2026 = '改編自 LOGIC2026A：NOR、號碼分組與輸出埠解碼題型。'
const exam109 = '改編自 109 學年度第 2 學期數位邏輯期中考：BCD 七段顯示解碼題型。注意本關明訂 D 為最高位、A 為最低位。'
const bit = (value: number) => value as Bit
const examMinterms = [1, 3, 5, 8, 10, 14]
const examDontCares = [6, 7, 9, 15]
const bcdMinterms = [0, 1, 2, 3, 4, 7, 8, 9]
const bcdDontCares = [10, 11, 12, 13, 14, 15]
const referenceTable = (ones: number[], dontCares: number[], output: string) => Array.from({ length: 16 }, (_, index) => ({ [output]: (dontCares.includes(index) ? 'X' : ones.includes(index) ? 1 : 0) as Signal }))

const shiftSteps: CircuitStep[] = [
  { inputs: { D: 1, CLK: 0, RST: 0 }, expected: { Q1: 0, Q2: 0 } },
  { inputs: { D: 1, CLK: 1, RST: 0 }, expected: { Q1: 1, Q2: 0 } },
  { inputs: { D: 0, CLK: 1, RST: 0 }, expected: { Q1: 1, Q2: 0 } },
  { inputs: { D: 0, CLK: 0, RST: 0 }, expected: { Q1: 1, Q2: 0 } },
  { inputs: { D: 0, CLK: 1, RST: 0 }, expected: { Q1: 0, Q2: 1 } },
  { inputs: { D: 1, CLK: 0, RST: 0 }, expected: { Q1: 0, Q2: 1 } },
  { inputs: { D: 1, CLK: 1, RST: 0 }, expected: { Q1: 1, Q2: 0 } },
  { inputs: { D: 1, CLK: 1, RST: 1 }, expected: { Q1: 0, Q2: 0 } },
  { inputs: { D: 1, CLK: 1, RST: 0 }, expected: { Q1: 0, Q2: 0 } },
  { inputs: { D: 1, CLK: 0, RST: 0 }, expected: { Q1: 0, Q2: 0 } },
  { inputs: { D: 1, CLK: 1, RST: 0 }, expected: { Q1: 1, Q2: 0 } },
]

const enableSteps: CircuitStep[] = [
  { inputs: { D: 1, EN: 0, CLK: 0, RST: 0 }, expected: { Q: 0 } },
  { inputs: { D: 1, EN: 0, CLK: 1, RST: 0 }, expected: { Q: 0 } },
  { inputs: { D: 1, EN: 1, CLK: 1, RST: 0 }, expected: { Q: 0 } },
  { inputs: { D: 1, EN: 1, CLK: 0, RST: 0 }, expected: { Q: 0 } },
  { inputs: { D: 1, EN: 1, CLK: 1, RST: 0 }, expected: { Q: 1 } },
  { inputs: { D: 0, EN: 0, CLK: 0, RST: 0 }, expected: { Q: 1 } },
  { inputs: { D: 0, EN: 0, CLK: 1, RST: 0 }, expected: { Q: 1 } },
  { inputs: { D: 0, EN: 1, CLK: 0, RST: 0 }, expected: { Q: 1 } },
  { inputs: { D: 0, EN: 1, CLK: 1, RST: 0 }, expected: { Q: 0 } },
  { inputs: { D: 1, EN: 1, CLK: 0, RST: 0 }, expected: { Q: 0 } },
  { inputs: { D: 1, EN: 1, CLK: 1, RST: 0 }, expected: { Q: 1 } },
  { inputs: { D: 1, EN: 1, CLK: 1, RST: 1 }, expected: { Q: 0 } },
  { inputs: { D: 1, EN: 1, CLK: 1, RST: 0 }, expected: { Q: 0 } },
]

const counterSteps: CircuitStep[] = [{ inputs: { CLK: 0, RST: 0 }, expected: { Q1: 0, Q0: 0 } }]
for (let pulse = 1; pulse <= 8; pulse++) {
  const previous = (pulse - 1) % 4
  if (pulse > 1) counterSteps.push({ inputs: { CLK: 0, RST: 0 }, expected: { Q1: bit(previous >> 1), Q0: bit(previous & 1) } })
  const value = pulse % 4
  counterSteps.push({ inputs: { CLK: 1, RST: 0 }, expected: { Q1: bit(value >> 1), Q0: bit(value & 1) } })
}
counterSteps.push(
  { inputs: { CLK: 0, RST: 0 }, expected: { Q1: 0, Q0: 0 } },
  { inputs: { CLK: 1, RST: 0 }, expected: { Q1: 0, Q0: 1 } },
  { inputs: { CLK: 1, RST: 1 }, expected: { Q1: 0, Q0: 0 } },
  { inputs: { CLK: 1, RST: 0 }, expected: { Q1: 0, Q0: 0 } },
  { inputs: { CLK: 0, RST: 0 }, expected: { Q1: 0, Q0: 0 } },
  { inputs: { CLK: 1, RST: 0 }, expected: { Q1: 0, Q0: 1 } },
)

export const advancedChallenges: Challenge[] = [
  {
    id: 'b5', module: 'boolean', title: '四變數卡諾圖與無關項', subtitle: '', kind: 'kmap', difficulty: '中階', source: exam2025,
    prompt: '將 F(A,B,C,D) = Σm(1,3,5,8,10,14)、d(6,7,9,15) 填入四變數卡諾圖。A 為最高位、D 為最低位；列 AB、欄 CD 都依 00、01、11、10 排列。X 格已固定，只需填寫其他 0／1。',
    kmap: { variables: ['A', 'B', 'C', 'D'], minterms: examMinterms, dontCares: examDontCares },
    hint: '先把最小項編號轉成 ABCD，再找格雷碼位置。例如 m10 = 1010，在 AB=10、CD=10；不要把格子當成一般二進位順序。',
    explanation: '1 的最小項為 1、3、5、8、10、14；6、7、9、15 為 X。X 是規格不限制的輸入，可選成 0 或 1 來幫助化簡，但不能把指定為 0 的格子圈入。可圈 m1、m3、m5、m7 得 ¬A·D；m6、m7、m14、m15 得 B·C；m8、m10 得 A·¬B·¬D。合併後得到一個最簡 SOP：F=¬A·D+B·C+A·¬B·¬D。',
  },
  {
    id: 'b6', module: 'boolean', title: '選出可用的最簡 SOP', subtitle: '', kind: 'choice', difficulty: '高階', source: exam2025,
    prompt: 'F(A,B,C,D)=Σm(1,3,5,8,10,14)，d(6,7,9,15)，A 是最高位。下列哪個 SOP 符合全部有效輸入，並可利用無關項化簡？',
    options: ['¬A·D + B·C + A·¬B·¬D', '¬A·D + B·C', 'A·D + B·C + A·¬B·¬D', '¬A·D + B·C + A·¬B'], answer: 0,
    hint: '先測 m8=1000 與 m11=1011。前者必須為 1、後者必須為 0；X 格不限制。',
    explanation: '選項 A 的三項分別覆蓋 {1,3,5,7}、{6,7,14,15}、{8,10}；聯集除了指定的 1 之外只多覆蓋無關項。選項 B 漏掉 m8、m10；選項 C 在 m1 輸出錯誤；選項 D 的 A·¬B 會錯把 m11 變成 1。K-Map 的三個群組共使用 7 個文字，可得到上述最簡 SOP。',
  },
  {
    id: 'b7', module: 'boolean', title: 'NAND 限定：四變數化簡實作', subtitle: '', kind: 'circuit', difficulty: '高階', source: exam2025,
    prompt: '只用二輸入 NAND，實作 F=Σm(1,3,5,8,10,14)，d(6,7,9,15)。輸入順序 ABCD，A 最高位。本關最多 12 個元件；X 組合輸出 0 或 1 都接受。',
    circuit: { goal: 'truth-table', inputs: ['A', 'B', 'C', 'D'], outputs: ['F'], allowed: ['NAND'], maxComponents: 12, truthTable: referenceTable(examMinterms, examDontCares, 'F') },
    hint: '先用 F=¬A·D+B·C+A·¬B·¬D。NAND(X,X) 可產生 ¬X；二輸入 NAND 不能直接串接成三輸入 NAND，中間需要還原極性。',
    explanation: '令 P=¬A·D、Q=B·C、R=A·¬B·¬D，則 F=¬(¬P·¬Q·¬R)。第一層 NAND 產生各乘積的反相，最後再做 NAND 合併。三輸入乘積需拆成「NAND→同端反相→NAND」，以免極性錯誤。以下接法需要 11 個二輸入 NAND；檢核會測試 12 組有效輸入並忽略 4 組無關項。',
  },
  {
    id: 'b8', module: 'boolean', title: 'NOR 限定：和項的乘積', subtitle: '', kind: 'circuit', difficulty: '中階', source: exam2026,
    prompt: '只使用 NOR，接出 F=(A+B)·(¬A+C)。NOR 有 OR 外形與輸出反相圓圈；同一來源可以接到兩個輸入。',
    circuit: { goal: 'truth-table', inputs: ['A', 'B', 'C'], outputs: ['F'], allowed: ['NOR'], truthTable: getInputVectors(['A', 'B', 'C']).map(({ A, B, C }) => ({ F: bit((A | B) & ((1 - A) | C)) })) },
    hint: '令 P=¬(A+B)、Q=¬(¬A+C)，則 F=¬(P+Q)。另用一個 NOR 同端接 A 產生 ¬A。',
    explanation: 'POS（和項的乘積）適合 NOR–NOR 結構。先以 NOR(A,A) 產生 ¬A，再求 P=NOR(A,B)、Q=NOR(¬A,C)，最後 F=NOR(P,Q)。由德摩根定律，¬[¬(A+B)+¬(¬A+C)]=(A+B)(¬A+C)。共 4 個 NOR，會檢查 8 組輸入。',
  },
  {
    id: 'b9', module: 'boolean', title: 'BCD 解碼：填出七段顯示的 b 段', subtitle: '', kind: 'kmap', difficulty: '高階', source: exam109,
    prompt: '設計七段顯示器右上方的 b 段：十進位 0、1、2、3、4、7、8、9 時亮（1），5、6 時暗（0）；10～15 是無關項。輸入為 DCBA，D 是 8、A 是 1。將 b 段卡諾圖填完。',
    kmap: { variables: ['D', 'C', 'B', 'A'], minterms: bcdMinterms, dontCares: bcdDontCares },
    hint: '列是 DC，欄是 BA，兩者都是 00、01、11、10。只有數字 5=0101、6=0110 必須是 0，10～15 不限制。',
    explanation: 'b 段只在有效數字 5、6 熄滅。利用 10～15 的 X，C=0 的 8 格可合併成 ¬C；B=A=0 的四格可合併成 ¬B·¬A；B=A=1 的四格合併成 B·A。因此 b=¬C+¬B·¬A+B·A。D 被消去，表示在合法 BCD 輸入下不需要最高位就能決定 b 段。',
  },
  {
    id: 'b10', module: 'boolean', title: '接出 BCD 的 b 段解碼器', subtitle: '', kind: 'circuit', difficulty: '高階', source: exam109,
    prompt: '只用 NOT、AND、OR 接出七段顯示的 b 段。輸入 DCBA（D=8、C=4、B=2、A=1）；0、1、2、3、4、7、8、9 輸出 1，5、6 輸出 0，10～15 不限制。',
    circuit: { goal: 'truth-table', inputs: ['D', 'C', 'B', 'A'], outputs: ['b'], allowed: ['NOT', 'AND', 'OR'], truthTable: referenceTable(bcdMinterms, bcdDontCares, 'b') },
    hint: '沿用化簡結果 b=¬C+¬B·¬A+B·A，D 可以不接。三項可透過兩個二輸入 OR 逐步合併。',
    explanation: '先產生 ¬C、¬B、¬A，做出 ¬B·¬A 與 B·A，再把三項 OR 起來，共 7 個元件。測試會檢查合法 BCD 的 10 組輸入，另外 6 組是無關項。輸入 D 沒接線並不是漏接：化簡後的函數確實與 D 無關。',
  },
  {
    id: 'c6', module: 'combo', title: '號碼分組：設計高位 G1', subtitle: '', kind: 'circuit', difficulty: '中階', source: exam2026,
    prompt: '四位元 N3N2N1N0（N3 最高位）表示號碼 1～15：1～5 分到第 1 組（01）、6～10 第 2 組（10）、11～15 第 3 組（11）。本關只接高位 G1；號碼 0 不限制。',
    circuit: { goal: 'truth-table', inputs: ['N3', 'N2', 'N1', 'N0'], outputs: ['G1'], allowed: ['NOT', 'AND', 'OR'], truthTable: Array.from({ length: 16 }, (_, n) => ({ G1: n === 0 ? 'X' : n >= 6 ? 1 : 0 })) },
    hint: 'G1 只在 6～15 為 1。N3=1 包含 8～15；再補上 6、7 所共同具有的 N2=N1=1。',
    explanation: '化簡後 G1=N3+N2·N1。N3 覆蓋 8～15，N2·N1 補上 6、7；N0 不影響結果。一個 AND 接一個 OR 即可完成。這說明輸入不是每條都一定需要接線。',
  },
  {
    id: 'c7', module: 'combo', title: '號碼分組：設計低位 G0', subtitle: '', kind: 'circuit', difficulty: '高階', source: exam2026,
    prompt: '沿用 1～5→01、6～10→10、11～15→11 的分組規則，本關接出低位 G0。N3 是最高位、N0 是最低位；0 為無關項。',
    circuit: { goal: 'truth-table', inputs: ['N3', 'N2', 'N1', 'N0'], outputs: ['G0'], allowed: ['NOT', 'AND', 'OR'], truthTable: Array.from({ length: 16 }, (_, n) => ({ G0: n === 0 ? 'X' : n <= 5 || n >= 11 ? 1 : 0 })) },
    hint: '把 G0 分成「小於 6」或「至少 11」。前者是 ¬(N3+N2·N1)，後者是 N3·(N2+N1·N0)。',
    explanation: '可用 G0=¬(N3+N2·N1)+N3·(N2+N1·N0)。第一項覆蓋 0～5（0 不限制）；第二項覆蓋 11～15。兩條路徑合併後，6～10 都為 0。此接法共 7 個元件，檢核 15 組有效號碼。',
  },
  {
    id: 'c8', module: 'combo', title: '位址解碼：連續四個位址', subtitle: '', kind: 'circuit', difficulty: '中階', source: exam2026,
    prompt: '簡化輸出埠的位址選擇：四位元 A3A2A1A0（A3 最高位）等於十六進位 8、9、A、B 時 SEL=1，其餘為 0。用基本邏輯閘接出解碼器。',
    circuit: { goal: 'truth-table', inputs: ['A3', 'A2', 'A1', 'A0'], outputs: ['SEL'], allowed: ['NOT', 'AND', 'OR'], truthTable: Array.from({ length: 16 }, (_, address) => ({ SEL: address >= 8 && address <= 11 ? 1 : 0 })) },
    hint: '寫出 8、9、A、B 的二進位：1000、1001、1010、1011。找出固定的位元，變動的位元不用接。',
    explanation: '四個地址共同的條件是 A3=1、A2=0；A1、A0 可以任意，因此 SEL=A3·¬A2。只要 NOT 與 AND 各一個。這裡只做組合位址解碼；實際寫入暫存器還必須配合寫入信號與有效時脈邊緣。',
  },
  {
    id: 'c9', module: 'combo', title: '全減器：差與借位', subtitle: '', kind: 'circuit', difficulty: '高階',
    prompt: '接出一位元全減器：A−B−BI，輸出差 D 與向高位借位 BO。BI 是低位傳入的借位。',
    circuit: { goal: 'truth-table', inputs: ['A', 'B', 'BI'], outputs: ['D', 'BO'], allowed: ['NOT', 'AND', 'OR', 'XOR'], truthTable: getInputVectors(['A', 'B', 'BI']).map(({ A, B, BI }) => ({ D: bit((A - B - BI + 2) % 2), BO: bit(A - B - BI < 0 ? 1 : 0) })) },
    hint: '令 T=A⊕B，則 D=T⊕BI；BO=(¬A·B)+(¬T·BI)。借位要看減法是否小於 0。',
    explanation: '先用半減器處理 A−B，再扣掉 BI。第一次借位是 ¬A·B；第二次借位是 ¬(A⊕B)·BI，兩者 OR 起來得到 BO。例：A=0、B=1、BI=1，0−1−1=−2，故 D=0、BO=1。檢核同時驗證 D 與 BO 的全部 8 組輸入。',
  },
  {
    id: 's6', module: 'sequential', title: '雙級移位：同時取樣的陷阱', subtitle: '', kind: 'circuit', difficulty: '中階',
    prompt: '用兩個 D 正反器做移位暫存器：同一個 CLK 上升緣，第一級 Q1←D、第二級 Q2←舊 Q1。RST=1 時兩級立刻清為 0。',
    circuit: { goal: 'register-reset', inputs: ['D', 'CLK', 'RST'], outputs: ['Q1', 'Q2'], allowed: ['DFF'], steps: shiftSteps },
    hint: 'D→第一級 D；第一級 Q→第二級 D。兩級都接同一條 CLK、RST；Q1、Q2 分別觀察兩級 Q。',
    explanation: '同一個時脈邊緣到來時，所有正反器先讀取舊值，再一起更新。所以 D=1 的第一次上升緣後是 Q1Q2=10，不是 11；接著 D=0 的第二次上升緣後是 01。RST 是高有效非同步清除，即使 CLK 保持 1 也會立即清零，解除 RST 本身不會取樣。',
  },
  {
    id: 's7', module: 'sequential', title: '可保持資料的致能暫存器', subtitle: '', kind: 'circuit', difficulty: '高階',
    prompt: '設計有 EN 的一位元暫存器：CLK 上升緣時，EN=1 才載入 D，EN=0 保持 Q。RST=1 立即清零。可用 D 正反器與基本邏輯閘。',
    circuit: { goal: 'register-reset', inputs: ['D', 'EN', 'CLK', 'RST'], outputs: ['Q'], allowed: ['DFF', 'NOT', 'AND', 'OR'], steps: enableSteps },
    hint: '不要直接用 EN 去閘控時脈。讓正反器的資料端 Dff=(EN·D)+(¬EN·Q)，再把 CLK 直接接時脈端。',
    explanation: '用 2 選 1 選擇器決定下一狀態：EN=1 選外部 D，EN=0 選回授的舊 Q。這條回授經過正反器，不是組合迴路。EN 在 CLK 已是 1 時改變不應造成額外取樣；測試也會檢查這一點。RST 直接接正反器，清除優先於資料取樣。',
  },
  {
    id: 's8', module: 'sequential', title: '同步二位元模 4 計數器', subtitle: '', kind: 'circuit', difficulty: '高階',
    prompt: '接出同步計數器：每次 CLK 上升緣，Q1Q0 依 00→01→10→11→00 循環。兩個 D 正反器共用 CLK；RST=1 立即回到 00。',
    circuit: { goal: 'register-reset', inputs: ['CLK', 'RST'], outputs: ['Q1', 'Q0'], allowed: ['DFF', 'NOT', 'XOR'], steps: counterSteps },
    hint: 'Q0 每拍反相，所以 D0=¬Q0；Q1 只有舊 Q0=1 時反相，所以 D1=Q1⊕Q0。不要用 Q0 當第二級時脈。',
    explanation: '同步電路所有正反器都由同一個 CLK 驅動，下一狀態必須由更新前的 Q 計算。由狀態表可得 D0=¬Q0、D1=Q1⊕Q0。從 01 到 10 時，Q1 使用的是舊 Q0=1；回授跨越正反器因此合法。測試包含兩輪計數、維持時脈與非同步清除。',
  },
  {
    id: 's9', module: 'sequential', title: '找出狀態機的非法循環', subtitle: '', kind: 'bits', difficulty: '高階', source: '參考附件的多正反器狀態轉換題型，改為三位元扭環計數器。',
    prompt: '三個共用時脈的 D 正反器滿足 A⁺=¬C、B⁺=A、C⁺=B。填完所有舊狀態的下一狀態；每列都必須使用同一組舊 ABC，不能先更新 A 再計算 B。',
    expected: [1,0,0, 0,0,0, 1,0,1, 0,0,1, 1,1,0, 0,1,0, 1,1,1, 0,1,1],
    table: { givenColumns: ['A', 'B', 'C'], answerColumns: ['A⁺', 'B⁺', 'C⁺'], rows: getInputVectors(['A', 'B', 'C']).map(({ A, B, C }) => [String(A), String(B), String(C)]) },
    hint: '例如舊 010：A⁺=¬0=1、B⁺=0、C⁺=1，所以下一狀態為 101。試著再追蹤 101 會去哪裡。',
    explanation: '完整轉移：000→100、001→000、010→101、011→001、100→110、101→010、110→111、111→011。從 000 出發得到六狀態循環 000→100→110→111→011→001→000；另外 010↔101 形成獨立二狀態循環，不能自行回到正常循環。因此實際設計需要初始化或非法狀態復原機制。',
  },
  {
    id: 's10', module: 'sequential', title: '四位元累加器：加減與同時取樣', subtitle: '', kind: 'bits', difficulty: '高階', source: exam2025,
    prompt: '初始 A=B=F（十六進位，皆為 4 位元）。CLR 立即清除 A；LOAD↑ 令 B←資料；TRANSFER↑ 在 SUB=0 時 A←A+B，SUB=1 時 A←A−B。每列事件後填 A、B；只保留低 4 位元。同時上升緣必須使用事件前的 B。',
    expected: [0,15, 0,5, 5,5, 5,2, 7,2, 5,2, 3,3, 0,3],
    table: { givenColumns: ['事件', '資料', 'SUB'], answerColumns: ['A（Hex）', 'B（Hex）'], answerOptions: Array.from({ length: 16 }, (_, index) => index.toString(16).toUpperCase()), rows: [['CLR 有效後解除', '—', '0'], ['LOAD↑', '5', '0'], ['TRANSFER↑', '—', '0'], ['LOAD↑', '2', '0'], ['TRANSFER↑', '—', '0'], ['TRANSFER↑', '—', '1'], ['LOAD↑ 與 TRANSFER↑', '3', '1'], ['TRANSFER↑', '—', '1']] },
    hint: '先追蹤 B 只在 LOAD↑ 改變。倒數第二列前 A=5、B=2，因此 A 取樣 5−2=3，同時 B 載入 3。',
    explanation: '各列 (A,B) 依序為 (0,F)、(0,5)、(5,5)、(5,2)、(7,2)、(5,2)、(3,3)、(0,3)。CLR 只清 A，B 保持 F；LOAD 不會改 A，TRANSFER 不會改 B。同時 LOAD 與 TRANSFER 時，A 用舊 B=2 做 5−2，B 才一起變成 3。四位元結果以模 16 計算，例如 0−1 會留下 F。',
  },
  {
    id: 'sb5', module: 'sandbox', title: 'NOR 挑戰：打造 XOR', subtitle: '', kind: 'circuit', difficulty: '高階', source: exam2026,
    prompt: '只能使用 NOR，接出 F=A⊕B。請特別留意：經典四個 NOR 的結構先得到的是 XNOR，還需要再反相。',
    circuit: { goal: 'truth-table', inputs: ['A', 'B'], outputs: ['F'], allowed: ['NOR'], truthTable: getInputVectors(['A', 'B']).map(({ A, B }) => ({ F: bit(A ^ B) })) },
    hint: 'T=NOR(A,B)，U=NOR(A,T)，V=NOR(B,T)，W=NOR(U,V)。先觀察 W，再用 NOR(W,W) 產生 F。',
    explanation: 'U=¬A·B、V=A·¬B，所以 W=¬(U+V)=¬(A⊕B)。最後 F=NOR(W,W)=¬W=A⊕B，共 5 個 NOR。若只接四個 NOR，輸入 00、11 時會錯亮；完整真值表能立刻找出這個極性錯誤。',
  },
]

export const advancedWiringGuides: Record<string, string[]> = {
  b7: ['加入 11 個 NAND，依加入順序稱 N1～N11。每個 NAND 都只有 a、b 兩個輸入。', 'A→N1.a、N1.b；B→N2.a、N2.b；D→N3.a、N3.b，得到 ¬A、¬B、¬D。', 'N1→N4.a，D→N4.b，得到 ¬(¬A·D)。', 'A→N5.a，N2→N5.b；N5→N6.a、N6.b，還原出 A·¬B。', 'N6→N7.a，N3→N7.b，得到 ¬(A·¬B·¬D)。', 'B→N8.a，C→N8.b，得到 ¬(B·C)。', 'N4→N9.a，N7→N9.b；N9→N10.a、N10.b，得到 N4·N7。', 'N10→N11.a，N8→N11.b；N11→輸出 F。執行測試，驗證所有有效輸入。'],
  b8: ['加入 4 個 NOR，依序稱 N1、N2、N3、N4。', 'A 同時接 N1.a、N1.b，產生 ¬A。', 'A→N2.a、B→N2.b；N1→N3.a、C→N3.b。', 'N2→N4.a、N3→N4.b；N4→F。'],
  b10: ['加入 3 個 NOT（稱 NC、NB、NA），2 個 AND（稱 P、Q），2 個 OR（稱 R、T）。', 'C→NC.a、B→NB.a、A→NA.a，產生三條反相信號。D 不需要接線。', 'NB→P.a、NA→P.b；B→Q.a、A→Q.b。', 'NC→R.a、P→R.b；R→T.a、Q→T.b；T→輸出 b。'],
  c6: ['加入 AND 與 OR 各一個。', 'N2→AND.a，N1→AND.b。', 'N3→OR.a，AND→OR.b；OR→G1。N0 不需要接線。'],
  c7: ['加入 AND（P、R、U）、OR（Q、T、V）、NOT（N），共 7 個元件。', 'N2→P.a、N1→P.b；N3→Q.a、P→Q.b；Q→N.a，得到 0～5 的條件。', 'N1→R.a、N0→R.b；N2→T.a、R→T.b；N3→U.a、T→U.b，得到 11～15 的條件。', 'N→V.a、U→V.b；V→G0，最後測試 15 組有效號碼。'],
  c8: ['加入 NOT 與 AND 各一個。', 'A2→NOT.a，得到 ¬A2。', 'A3→AND.a、NOT→AND.b；AND→SEL。A1、A0 不需要接線。'],
  c9: ['加入 XOR（T、U）、NOT（NA、NT）、AND（P、Q）、OR（R），共 7 個元件。', 'A→T.a、B→T.b；T→U.a、BI→U.b；U→差 D。', 'A→NA.a、T→NT.a。NA→P.a、B→P.b；NT→Q.a、BI→Q.b。', 'P→R.a、Q→R.b；R→借位 BO。'],
  s6: ['加入兩個 D 正反器，稱第一級 F1、第二級 F2。', '外部 D→F1.d；F1 的 Q（右側接點）→F2.d。', '外部 CLK 分別接 F1.clk、F2.clk；RST 分別接兩個 rst。', 'F1 的 Q→輸出 Q1，F2 的 Q→輸出 Q2。使用逐列演示觀察延遲一拍的傳遞。'],
  s7: ['加入 D 正反器 F、NOT N、AND P、AND R、OR T，共 5 個元件。', 'EN→N.a；EN→P.a、外部 D→P.b，得到載入路徑。', 'N→R.a、F 的 Q→R.b，得到保留舊狀態的路徑。', 'P→T.a、R→T.b；T→F.d。', '外部 CLK→F.clk、RST→F.rst；F 的 Q→輸出 Q。'],
  s8: ['加入兩個 D 正反器（低位 F0、高位 F1）、NOT N、XOR X。', 'F0 的 Q→N.a；N→F0.d，讓低位每拍反相。', 'F1 的 Q→X.a、F0 的 Q→X.b；X→F1.d。', 'CLK 接兩個 clk；RST 接兩個 rst。F0 的 Q→Q0、F1 的 Q→Q1。'],
  sb5: ['加入 5 個 NOR，依序稱 T、U、V、W、F閘。', 'A→T.a、B→T.b。A→U.a、T→U.b；B→V.a、T→V.b。', 'U→W.a、V→W.b，此時 W 是 XNOR。', 'W 同時接 F閘.a、F閘.b；F閘→輸出 F，完成最後一次反相。'],
}
