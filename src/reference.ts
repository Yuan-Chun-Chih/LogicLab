import type { ComponentType } from './logic'

export type ReferenceGateType = ComponentType | 'XNOR'
export const gateReferences: { type: ReferenceGateType; name: string; formula: string; description: string; tip: string }[] = [
  { type: 'AND', name: '且閘', formula: 'Y = A · B', description: '兩個輸入都為 1，輸出才是 1。', tip: '可用來表示「所有條件都成立」，例如致能且資料為 1。' },
  { type: 'OR', name: '或閘', formula: 'Y = A + B', description: '至少一個輸入為 1，輸出就是 1。', tip: '這裡的 + 表示邏輯 OR；1 + 1 的邏輯結果仍是 1。' },
  { type: 'NOT', name: '反相器', formula: 'Y = ¬A', description: '將 0 變成 1，將 1 變成 0。', tip: '輸出端的小圓圈表示反相。¬A、A̅ 與 A′ 都常用來表示 NOT A。' },
  { type: 'NAND', name: '反及閘', formula: 'Y = ¬(A · B)', description: '先做 AND 再反相；只有兩個輸入都為 1 時，輸出是 0。', tip: 'NAND 是通用閘。把 A 同時接到兩個輸入，就可做出 NOT A。' },
  { type: 'NOR', name: '反或閘', formula: 'Y = ¬(A + B)', description: '先做 OR 再反相；只有兩個輸入都為 0 時，輸出是 1。', tip: 'NOR 也是通用閘，特別適合實作 POS（和項的乘積）。' },
  { type: 'XOR', name: '互斥或閘', formula: 'Y = A ⊕ B = ¬A·B + A·¬B', description: '兩個輸入不同時輸出 1，相同時輸出 0。', tip: '常用於加法的和、奇偶檢查。OR 左側多一條弧線就是 XOR。' },
  { type: 'XNOR', name: '同或閘', formula: 'Y = ¬(A ⊕ B) = A·B + ¬A·¬B', description: '兩個輸入相同時輸出 1，不同時輸出 0。', tip: '可用 XOR 後接 NOT 實作，常用於相等比較。符號是 XOR 加上輸出反相圓圈。' },
  { type: 'DFF', name: 'D 正反器', formula: 'CLK ↑ 時 Q⁺ = D；RST = 1 時 Q = 0', description: '這是具有記憶的循序元件。只有 CLK 從 0 變成 1 時才取樣 D，其餘時間保持 Q。', tip: '本工坊的 RST 是高有效非同步清除，優先於時脈。多個正反器在同一上升緣讀取各自的舊狀態，再一起更新。' },
]

export interface FormulaEntry { title: string; formulas: string[]; note?: string }
export interface FormulaGroup { id: string; title: string; entries: FormulaEntry[] }
export const formulaGroups: FormulaGroup[] = [
  { id: 'notation', title: '符號與訊號', entries: [
    { title: '邏輯運算', formulas: ['+：OR　· 或相鄰字母：AND', '¬A、A̅、A′：NOT A　⊕：XOR'], note: '邏輯 OR 的 + 與數值加法不同；算式中的 AB 表示 A AND B。' },
    { title: '目前狀態與下一狀態', formulas: ['Q：目前狀態　Q⁺：下一狀態', '↑：上升緣（0 → 1）'], note: '下一狀態的右側一律使用更新前的值計算。' },
    { title: '兩種 X 的意義', formulas: ['卡諾圖的 X：無關項（don’t-care）', '接線畫布的 X：訊號未知'], note: '無關項可選 0 或 1 幫助化簡；畫布的未知訊號可能來自未接線或錯誤迴路，不能當作已算出正確輸出。' },
  ] },
  { id: 'boolean', title: '布林代數常用定律', entries: [
    { title: '恆等律與支配律', formulas: ['A + 0 = A　　A · 1 = A', 'A + 1 = 1　　A · 0 = 0'] },
    { title: '冪等律、互補律、雙重否定', formulas: ['A + A = A　　A · A = A', 'A + ¬A = 1　　A · ¬A = 0', '¬(¬A) = A'] },
    { title: '交換律與結合律', formulas: ['A + B = B + A　　AB = BA', '(A + B) + C = A + (B + C)', '(AB)C = A(BC)'] },
    { title: '分配律', formulas: ['A(B + C) = AB + AC', 'A + BC = (A + B)(A + C)'] },
    { title: '吸收律', formulas: ['A + AB = A', 'A(A + B) = A'], note: 'A 已成立時，額外要求 B 不會增加可成立的情況。' },
  ] },
  { id: 'demorgan', title: '德摩根定律與閘的轉換', entries: [
    { title: '德摩根定律', formulas: ['¬(AB) = ¬A + ¬B', '¬(A + B) = ¬A · ¬B'], note: '把反相移入括號時，每項都要反相，AND 與 OR 也要互換。' },
    { title: 'NAND 實作基本閘', formulas: ['¬A = A NAND A', 'AB = (A NAND B) NAND (A NAND B)', 'A + B = (A NAND A) NAND (B NAND B)'] },
    { title: 'NOR 實作基本閘', formulas: ['¬A = A NOR A', 'A + B = (A NOR B) NOR (A NOR B)', 'AB = (A NOR A) NOR (B NOR B)'] },
    { title: '兩層結構', formulas: ['SOP（乘積的和）→ NAND–NAND', 'POS（和項的乘積）→ NOR–NOR'], note: '若元件只有兩個輸入，多輸入乘積或和項必須拆解，並逐級檢查反相的極性。' },
  ] },
  { id: 'xor', title: 'XOR、XNOR 與奇偶', entries: [
    { title: '互斥或與同或', formulas: ['A ⊕ B = ¬A·B + A·¬B', '¬(A ⊕ B) = AB + ¬A·¬B'] },
    { title: 'XOR 化簡', formulas: ['A ⊕ 0 = A　　A ⊕ 1 = ¬A', 'A ⊕ A = 0　　A ⊕ ¬A = 1'], note: '多輸入 XOR 的結果，在輸入含有奇數個 1 時為 1。' },
    { title: '三輸入奇偶檢測', formulas: ['P = A ⊕ B ⊕ C'], note: '奇校驗位可取 ¬P；偶校驗位可取 P，使加上校驗位後的 1 總數符合指定奇偶。' },
  ] },
  { id: 'arithmetic', title: '加法器與減法器', entries: [
    { title: '半加器', formulas: ['S = A ⊕ B', 'CO = A · B'], note: 'S 是當位的和，CO 是傳向高位的進位。' },
    { title: '全加器', formulas: ['S = A ⊕ B ⊕ CI', 'CO = AB + CI(A ⊕ B)', 'CO = AB + A·CI + B·CI'], note: 'CI 是低位傳入的進位；三個輸入至少兩個為 1 時，CO=1。' },
    { title: '半減器', formulas: ['D = A ⊕ B', 'BO = ¬A · B'] },
    { title: '全減器', formulas: ['D = A ⊕ B ⊕ BI', 'BO = ¬A·B + ¬(A ⊕ B)·BI'], note: '表示 A−B−BI。BI 是傳入借位，BO 表示需要向高位借位。' },
    { title: '二補數加減法', formulas: ['A − B = A + ¬B + 1（保留指定位元數）', '結果 = 運算值 mod 2ⁿ'], note: '四位元只保留低四位，所以 0−1 會得到 1111，也就是十六進位 F。' },
  ] },
  { id: 'combinational', title: '選擇器、比較器與解碼', entries: [
    { title: '2 選 1 選擇器', formulas: ['Y = ¬SEL·A + SEL·B'], note: 'SEL=0 選 A，SEL=1 選 B。' },
    { title: '一位元比較器', formulas: ['EQ = ¬(A ⊕ B)', 'GT = A·¬B　　LT = ¬A·B'] },
    { title: '三輸入多數決', formulas: ['Y = AB + AC + BC'], note: '至少兩個輸入為 1，輸出才是 1。' },
    { title: '位址解碼', formulas: ['1000～1011 → SEL = A3·¬A2'], note: '若一組目標位址內某位元可同時為 0 或 1，化簡後可以消去該位元。' },
    { title: 'BCD 位元權重', formulas: ['若採 DCBA 排列：D=8、C=4、B=2、A=1', '合法 BCD：0000～1001'], note: '1010～1111 是否能當無關項，要依題目規格；位元名稱與最高位也以題目定義為準。' },
  ] },
  { id: 'sequential', title: '正反器與下一狀態', entries: [
    { title: 'D 正反器', formulas: ['有效時脈邊緣：Q⁺ = D', '無有效邊緣：Q 保持不變'], note: '本工坊採正緣觸發，RST=1 時非同步清除為 0；解除 RST 不會自行觸發資料取樣。' },
    { title: '致能暫存器', formulas: ['Dff = EN·D + ¬EN·Q'], note: 'EN=1 選新資料，EN=0 回授舊 Q；CLK 直接接正反器，避免用 EN 閘控時脈。' },
    { title: '雙級移位暫存器', formulas: ['Q1⁺ = D　　Q2⁺ = Q1'], note: 'Q2 取得的是舊 Q1。兩級共用 CLK，不會在同一拍把新資料穿過兩級。' },
    { title: '同步模 4 計數器', formulas: ['D0 = ¬Q0　　D1 = Q1 ⊕ Q0', 'Q1Q0：00 → 01 → 10 → 11 → 00'], note: '兩個正反器共用 CLK；Q0 不是高位正反器的時脈。' },
    { title: 'JK 與 T 正反器', formulas: ['JK：Q⁺ = J·¬Q + ¬K·Q', 'T：Q⁺ = T ⊕ Q'], note: '以上描述有效時脈邊緣且無非同步控制作用時的行為；JK=11 或 T=1 時切換狀態。' },
  ] },
  { id: 'kmap', title: 'K-Map 化簡速查', entries: [
    { title: '格雷碼與相鄰', formulas: ['兩位元軸的順序：00、01、11、10'], note: '相鄰格只差一個位元；上下邊界、左右邊界也相鄰，對角線不相鄰。' },
    { title: '群組大小', formulas: ['每組格數：1、2、4、8、16…'], note: '群組須為矩形；可以重疊，優先找較大的群組，並覆蓋所有需要的 1（SOP）或 0（POS）。' },
    { title: 'SOP：圈 1', formulas: ['群組內恆為 1 → 保留原變數', '群組內恆為 0 → 保留反相變數'], note: '變動的位元消去；各群組的乘積項再 OR 起來。不能把指定為 0 的格子圈進來。' },
    { title: 'POS：圈 0', formulas: ['群組內恆為 0 → 保留原變數', '群組內恆為 1 → 保留反相變數'], note: '變動的位元消去；各群組的和項再 AND 起來。不能把指定為 1 的格子圈進來。' },
    { title: '無關項與最小項', formulas: ['X 可取 0 或 1，也可以不使用', 'm10：若 ABCD 由高到低排列，對應 1010'], note: '無關項只用來幫助化簡，不必全部圈入。最小項編號依題目指定的位元順序解讀。' },
  ] },
]
