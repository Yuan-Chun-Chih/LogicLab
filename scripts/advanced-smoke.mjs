import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import { chromium } from 'playwright-core'
import { createServer } from 'vite'

const server = await createServer({ server: { host: '127.0.0.1', port: 4175, strictPort: true } })
let browser
await server.listen()
try {
  const { checkCircuit, evaluateCircuit, gateValue, getInputVectors } = await server.ssrLoadModule('/src/logic.ts')
  const { challenges, wiringGuides } = await server.ssrLoadModule('/src/content.ts')
  const advanced = challenges.filter(task => task.difficulty)
  const spec = id => challenges.find(task => task.id === id).circuit
  const node = (id, type, gate) => ({ id, type, data: { label: id, gate }, position: { x: 0, y: 0 } })
  const build = (id, gates, wires) => ({ nodes: [...spec(id).inputs.map(id => node(id, 'input')), ...spec(id).outputs.map(id => node(id, 'output')), ...gates.map(([id, gate]) => node(id, gate === 'DFF' ? 'dff' : 'gate', gate === 'DFF' ? undefined : gate))], edges: wires.map(([source, target, targetHandle], index) => ({ id: `e${index}`, source, target, sourceHandle: 'out', targetHandle })) })
  const solutions = {}
  solutions.b7 = build('b7', Array.from({ length: 11 }, (_, i) => [`N${i+1}`, 'NAND']), [['A','N1','a'],['A','N1','b'],['B','N2','a'],['B','N2','b'],['D','N3','a'],['D','N3','b'],['N1','N4','a'],['D','N4','b'],['A','N5','a'],['N2','N5','b'],['N5','N6','a'],['N5','N6','b'],['N6','N7','a'],['N3','N7','b'],['B','N8','a'],['C','N8','b'],['N4','N9','a'],['N7','N9','b'],['N9','N10','a'],['N9','N10','b'],['N10','N11','a'],['N8','N11','b'],['N11','F','in']])
  solutions.b8 = build('b8', [['N1','NOR'],['N2','NOR'],['N3','NOR'],['N4','NOR']], [['A','N1','a'],['A','N1','b'],['A','N2','a'],['B','N2','b'],['N1','N3','a'],['C','N3','b'],['N2','N4','a'],['N3','N4','b'],['N4','F','in']])
  solutions.b10 = build('b10', [['NC','NOT'],['NB','NOT'],['NA','NOT'],['P','AND'],['Q','AND'],['R','OR'],['T','OR']], [['C','NC','a'],['B','NB','a'],['A','NA','a'],['NB','P','a'],['NA','P','b'],['B','Q','a'],['A','Q','b'],['NC','R','a'],['P','R','b'],['R','T','a'],['Q','T','b'],['T','b','in']])
  solutions.c6 = build('c6', [['P','AND'],['Q','OR']], [['N2','P','a'],['N1','P','b'],['N3','Q','a'],['P','Q','b'],['Q','G1','in']])
  solutions.c7 = build('c7', [['P','AND'],['Q','OR'],['N','NOT'],['R','AND'],['T','OR'],['U','AND'],['V','OR']], [['N2','P','a'],['N1','P','b'],['N3','Q','a'],['P','Q','b'],['Q','N','a'],['N1','R','a'],['N0','R','b'],['N2','T','a'],['R','T','b'],['N3','U','a'],['T','U','b'],['N','V','a'],['U','V','b'],['V','G0','in']])
  solutions.c8 = build('c8', [['N','NOT'],['P','AND']], [['A2','N','a'],['A3','P','a'],['N','P','b'],['P','SEL','in']])
  solutions.c9 = build('c9', [['T','XOR'],['U','XOR'],['NA','NOT'],['NT','NOT'],['P','AND'],['Q','AND'],['R','OR']], [['A','T','a'],['B','T','b'],['T','U','a'],['BI','U','b'],['U','D','in'],['A','NA','a'],['T','NT','a'],['NA','P','a'],['B','P','b'],['NT','Q','a'],['BI','Q','b'],['P','R','a'],['Q','R','b'],['R','BO','in']])
  solutions.s6 = build('s6', [['F1','DFF'],['F2','DFF']], [['D','F1','d'],['F1','F2','d'],['CLK','F1','clk'],['CLK','F2','clk'],['RST','F1','rst'],['RST','F2','rst'],['F1','Q1','in'],['F2','Q2','in']])
  solutions.s7 = build('s7', [['F','DFF'],['N','NOT'],['P','AND'],['R','AND'],['T','OR']], [['EN','N','a'],['EN','P','a'],['D','P','b'],['N','R','a'],['F','R','b'],['P','T','a'],['R','T','b'],['T','F','d'],['CLK','F','clk'],['RST','F','rst'],['F','Q','in']])
  solutions.s8 = build('s8', [['F0','DFF'],['F1','DFF'],['N','NOT'],['X','XOR']], [['F0','N','a'],['N','F0','d'],['F1','X','a'],['F0','X','b'],['X','F1','d'],['CLK','F0','clk'],['CLK','F1','clk'],['RST','F0','rst'],['RST','F1','rst'],['F0','Q0','in'],['F1','Q1','in']])
  solutions.sb5 = build('sb5', [['T','NOR'],['U','NOR'],['V','NOR'],['W','NOR'],['Z','NOR']], [['A','T','a'],['B','T','b'],['A','U','a'],['T','U','b'],['B','V','a'],['T','V','b'],['U','W','a'],['V','W','b'],['W','Z','a'],['W','Z','b'],['Z','F','in']])

  assert.equal(challenges.length, 40)
  assert.equal(advanced.length, 16)
  assert.equal(challenges.filter(task => task.kind === 'circuit').length, 27)
  assert.equal(new Set(challenges.map(task => task.id)).size, challenges.length)
  assert.ok(challenges.filter(task => task.circuit).every(task => wiringGuides[task.id]?.length >= 3))
  for (const task of advanced) {
    if (task.circuit?.truthTable) {
      assert.equal(task.circuit.truthTable.length, 2 ** task.circuit.inputs.length)
      assert.ok(task.circuit.truthTable.every(row => task.circuit.outputs.every(output => [0,1,'X'].includes(row[output]))))
    }
    if (task.table) assert.equal(task.expected.length, task.table.rows.length * task.table.answerColumns.length)
  }
  for (const [id, solution] of Object.entries(solutions)) {
    const passed = checkCircuit(solution.nodes, solution.edges, spec(id))
    assert.equal(passed.ok, true, `${id}: ${passed.message}`)
    assert.ok(solution.nodes.filter(node => ['gate','dff'].includes(node.type)).length <= (spec(id).maxComponents ?? 8))
    const incomplete = solution.edges.filter(edge => edge.target !== spec(id).outputs[0])
    assert.equal(checkCircuit(solution.nodes, incomplete, spec(id)).ok, false, `${id} must reject disconnected output`)
  }
  assert.deepEqual([gateValue('NOR',0,0),gateValue('NOR',0,1),gateValue('NOR',1,0),gateValue('NOR',1,1)], [1,0,0,0])
  assert.equal(gateValue('NOR','X',1), 0)
  assert.equal(gateValue('NOR',0,'X'), 'X')
  // Independent arithmetic oracles, including both outputs and all valid inputs.
  for (const vector of getInputVectors(['A','B','BI'])) {
    const result = evaluateCircuit(solutions.c9.nodes, solutions.c9.edges, vector)
    const difference = vector.A - vector.B - vector.BI
    assert.equal(result.values.D, (difference + 2) % 2)
    assert.equal(result.values.BO, Number(difference < 0))
  }
  for (const vector of getInputVectors(['N3','N2','N1','N0'])) {
    const n = vector.N3*8 + vector.N2*4 + vector.N1*2 + vector.N0
    if (!n) continue
    const g1 = evaluateCircuit(solutions.c6.nodes, solutions.c6.edges, vector).values.G1
    const g0 = evaluateCircuit(solutions.c7.nodes, solutions.c7.edges, vector).values.G0
    assert.equal(g1*2 + g0, n <= 5 ? 1 : n <= 10 ? 2 : 3)
  }
  for (let n = 0; n < 10; n++) {
    const result = evaluateCircuit(solutions.b10.nodes, solutions.b10.edges, { D: (n>>3)&1, C: (n>>2)&1, B: (n>>1)&1, A: n&1 })
    assert.equal(result.values.b, Number(![5,6].includes(n)))
  }
  // Different outputs on don't-care inputs must both be accepted.
  const alternate = structuredClone(spec('b7'))
  for (const index of [6,7,9,15]) {
    const vector = getInputVectors(alternate.inputs)[index]
    const actual = evaluateCircuit(solutions.b7.nodes, solutions.b7.edges, vector).values.F
    alternate.truthTable[index].F = 1 - actual
  }
  assert.equal(checkCircuit(solutions.b7.nodes, solutions.b7.edges, alternate).ok, false)
  assert.match(checkCircuit(solutions.b7.nodes, solutions.b7.edges, spec('b7')).message, /12 組有效輸入.*4 組為無關項/)
  const alternateBcd = structuredClone(solutions.b10)
  alternateBcd.nodes.push(node('EXTRA', 'gate', 'OR'))
  alternateBcd.edges = alternateBcd.edges.filter(edge => edge.target !== 'b')
  alternateBcd.edges.push({ id: 'extra-a', source: 'T', target: 'EXTRA', targetHandle: 'a' }, { id: 'extra-b', source: 'D', target: 'EXTRA', targetHandle: 'b' }, { id: 'extra-out', source: 'EXTRA', target: 'b', targetHandle: 'in' })
  assert.equal(checkCircuit(alternateBcd.nodes, alternateBcd.edges, spec('b10')).ok, true)
  const dcVector = { D: 1, C: 1, B: 0, A: 1 }
  assert.notEqual(evaluateCircuit(solutions.b10.nodes, solutions.b10.edges, dcVector).values.b, evaluateCircuit(alternateBcd.nodes, alternateBcd.edges, dcVector).values.b)
  const wrongShift = solutions.s6.edges.map(edge => edge.target === 'F2' && edge.targetHandle === 'd' ? { ...edge, source: 'D' } : edge)
  assert.equal(checkCircuit(solutions.s6.nodes, wrongShift, spec('s6')).ok, false)
  const noEnable = solutions.s7.edges.map(edge => edge.target === 'F' && edge.targetHandle === 'd' ? { ...edge, source: 'D' } : edge)
  assert.equal(checkCircuit(solutions.s7.nodes, noEnable, spec('s7')).ok, false)
  const noReset = solutions.s8.edges.filter(edge => edge.targetHandle !== 'rst')
  assert.equal(checkCircuit(solutions.s8.nodes, noReset, spec('s8')).ok, false)
  const xnor = solutions.sb5.edges.map(edge => edge.target === 'F' ? { ...edge, source: 'W' } : edge)
  assert.equal(checkCircuit(solutions.sb5.nodes, xnor, spec('sb5')).ok, false)
  console.log('Advanced logic checks passed: 11 reference circuits, negative cases, all valid vectors, NOR, reset and simultaneous sampling.')

  if (!process.argv.includes('--logic-only')) {
  browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://127.0.0.1:4175/LogicLab/', { waitUntil: 'networkidle' })
  const open = async (targetPage, id) => {
    const task = challenges.find(task => task.id === id)
    await targetPage.getByRole('button', { name: '開啟學習路線' }).click()
    const moduleIndex = ['gates','boolean','combo','sequential','sandbox'].indexOf(task.module)
    const module = targetPage.locator('.drawer-module').nth(moduleIndex)
    if (await module.getAttribute('open') === null) await module.locator('summary').click()
    await module.locator('.drawer-level').filter({ hasText: task.title }).click()
    await targetPage.locator('.play-heading h1').waitFor()
    assert.match(await targetPage.locator('.play-heading h1').innerText(), new RegExp(task.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  await open(page, 'b5')
  assert.equal(await page.locator('.kmap-four button').count(), 16)
  assert.equal(await page.locator('.kmap-four button:disabled').count(), 4)
  await page.locator('.primary-test').click()
  assert.match(await page.locator('.test-feedback').innerText(), /m1/)
  for (const index of [1,3,5,8,10,14]) await page.locator(`[data-minterm="${index}"]`).click()
  await page.locator('.primary-test').click()
  assert.match(await page.locator('.test-feedback').innerText(), /卡諾圖全部正確/)
  await page.screenshot({ path: path.join(os.tmpdir(), 'logiclab-advanced-kmap.png') })
  await open(page, 'b9')
  assert.equal(await page.locator('.kmap-four button:disabled').count(), 6)
  for (const index of [0,1,2,3,4,7,8,9]) await page.locator(`[data-minterm="${index}"]`).click()
  await page.locator('.primary-test').click()
  assert.match(await page.locator('.test-feedback').innerText(), /全部正確/)
  await open(page, 's9')
  const stateValues = [1,0,0, 0,0,0, 1,0,1, 0,0,1, 1,1,0, 0,1,0, 1,1,1, 0,1,1]
  for (let i=0;i<stateValues.length;i++) if (stateValues[i]) await page.locator('.advanced-answer-table button').nth(i).click()
  await page.locator('.primary-test').click()
  assert.match(await page.locator('.test-feedback').innerText(), /全部正確/)
  await open(page, 's10')
  const accumulatorValues = [0,15,0,5,5,5,5,2,7,2,5,2,3,3,0,3]
  for (let i=0;i<accumulatorValues.length;i++) await page.locator('.advanced-answer-table select').nth(i).selectOption(String(accumulatorValues[i]))
  await page.locator('.primary-test').click()
  assert.match(await page.locator('.test-feedback').innerText(), /全部正確/)
  await page.locator('.advanced-answer-table select').nth(12).selectOption('2')
  assert.match(await page.locator('.primary-test').innerText(), /重新測試/)
  await page.locator('.primary-test').click()
  assert.match(await page.locator('.test-feedback').innerText(), /第 7 列的 A/)
  await page.screenshot({ path: path.join(os.tmpdir(), 'logiclab-advanced-registers.png') })
  await open(page, 'b8')
  for (let i=0;i<4;i++) await page.getByRole('button', { name: '加入 NOR 閘' }).click()
  const gateIds = await page.locator('.react-flow__node-gate').evaluateAll(nodes => nodes.map(node => node.dataset.id))
  const handle = (node, port) => page.locator(`.react-flow__node[data-id="${node}"] .react-flow__handle[data-handleid="${port}"]`)
  const idMap = Object.fromEntries(['N1','N2','N3','N4'].map((id, index) => [id, gateIds[index]]))
  for (const edge of solutions.b8.edges) {
    await handle(idMap[edge.source] ?? edge.source, 'out').click()
    await handle(idMap[edge.target] ?? edge.target, edge.targetHandle).click()
  }
  await page.locator('.primary-test').click()
  assert.match(await page.locator('.test-feedback').innerText(), /8 組輸入通過/)
  await page.getByRole('button', { name: '逐列演示', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('.walkthrough-banner')?.textContent.includes('8 / 8 組符合'))
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), true)
  await page.screenshot({ path: path.join(os.tmpdir(), 'logiclab-advanced-nor.png') })
  await open(page, 'b7')
  for (let i=0;i<12;i++) await page.getByRole('button', { name: '加入 NAND 閘' }).click()
  assert.equal(await page.getByRole('button', { name: '加入 NAND 閘' }).isDisabled(), true)
  assert.equal(await page.locator('.react-flow__node-gate').count(), 12)
  await page.getByRole('button', { name: '顯示全圖', exact: true }).click()
  await page.waitForTimeout(300)
  const canvas = await page.locator('.flow-surface').boundingBox()
  for (const box of await page.locator('.react-flow__node').evaluateAll(nodes => nodes.map(node => { const b = node.getBoundingClientRect(); return {x:b.x,y:b.y,right:b.right,bottom:b.bottom} }))) {
    assert.ok(box.x >= canvas.x - 1 && box.y >= canvas.y - 1 && box.right <= canvas.x + canvas.width + 1 && box.bottom <= canvas.y + canvas.height + 1)
  }
  await page.screenshot({ path: path.join(os.tmpdir(), 'logiclab-advanced-nand.png') })
  await page.locator('.node-remove-icon').last().click()
  const nandIds = await page.locator('.react-flow__node-gate').evaluateAll(nodes => nodes.map(node => node.dataset.id))
  const nandMap = Object.fromEntries(nandIds.map((id, index) => [`N${index + 1}`, id]))
  for (const edge of solutions.b7.edges) {
    await handle(nandMap[edge.source] ?? edge.source, 'out').click()
    await handle(nandMap[edge.target] ?? edge.target, edge.targetHandle).click()
  }
  await page.locator('.primary-test').click()
  assert.match(await page.locator('.test-feedback').innerText(), /12 組有效輸入.*4 組為無關項/)
  await page.getByRole('button', { name: '逐列演示', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('.walkthrough-banner')?.textContent.includes('16 / 16 組符合'))
  await page.screenshot({ path: path.join(os.tmpdir(), 'logiclab-advanced-nand-solved.png') })
  await open(page, 's6')
  for (let i=0;i<2;i++) await page.getByRole('button', { name: '加入 D 正反器' }).click()
  const flipFlops = await page.locator('.react-flow__node-dff').evaluateAll(nodes => nodes.map(node => node.dataset.id))
  const dffMap = { F1: flipFlops[0], F2: flipFlops[1] }
  for (const edge of solutions.s6.edges) {
    await handle(dffMap[edge.source] ?? edge.source, 'out').click()
    await handle(dffMap[edge.target] ?? edge.target, edge.targetHandle).click()
  }
  await page.locator('.react-flow__node-input[data-id="D"] .input-switch').click()
  await page.locator('.react-flow__node-input[data-id="CLK"] .input-switch').click()
  assert.equal(await page.locator('.react-flow__node-output[data-id="Q1"] .output-readout').innerText(), '1')
  assert.equal(await page.locator('.react-flow__node-output[data-id="Q2"] .output-readout').innerText(), '0')
  await page.getByRole('button', { name: '逐列演示', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('.walkthrough-banner')?.textContent.includes('11 / 11 組符合'))
  await page.reload({ waitUntil: 'networkidle' })
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('logiclab-progress-v1')))
  for (const id of ['b5','b9','s9','s10','b8']) assert.equal(progress[id].completed, true)

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  mobile.on('pageerror', error => errors.push(error.message))
  await mobile.goto('http://127.0.0.1:4175/LogicLab/', { waitUntil: 'networkidle' })
  await open(mobile, 'b5')
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  assert.equal(await mobile.locator('.mobile-action-bar button').isVisible(), true)
  for (const index of [1,3,5,8,10,14]) await mobile.locator(`[data-minterm="${index}"]`).click()
  await mobile.locator('.mobile-action-bar button').click()
  assert.match(await mobile.locator('.mobile-action-feedback').innerText(), /全部正確/)
  await mobile.screenshot({ path: path.join(os.tmpdir(), 'logiclab-advanced-mobile.png'), fullPage: true })
  await open(mobile, 's10')
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await open(mobile, 'b7')
  for (let i=0;i<11;i++) await mobile.getByRole('button', { name: '加入 NAND 閘' }).click()
  await mobile.getByRole('button', { name: '顯示全圖', exact: true }).click()
  await mobile.waitForTimeout(300)
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await mobile.screenshot({ path: path.join(os.tmpdir(), 'logiclab-advanced-mobile-nand.png'), fullPage: true })
  assert.deepEqual(errors, [])
  console.log('Advanced browser checks passed: K-Maps, state table, hexadecimal events, NOR wiring, walkthrough, progress, bounded 12-gate canvas and mobile.')
  }
} finally {
  await browser?.close()
  await server.close()
}
