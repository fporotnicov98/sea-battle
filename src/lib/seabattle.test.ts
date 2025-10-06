import { describe, it, expect } from 'vitest'
import { createEmptyBoard, randomPlacement, placeable, applyShipToCells, type Ship } from './seabattle'

describe('seabattle core', () => {
  it('randomPlacement places all ships without overlap (no-touch on)', () => {
    const board = createEmptyBoard(8)
    const fleet = [4,3,3,2,2,2,1,1,1,1]
    const placed = randomPlacement(board, fleet, 'player', true)
    expect(placed.ships).toHaveLength(fleet.length)
    const totalCells = placed.ships.reduce((a,s)=>a+s.size,0)
    let count=0
    for (const row of placed.cells) for (const c of row) if (c.shipId) count++
    expect(count).toBe(totalCells)
  })

  it('placeable respects bounds', () => {
    const b = createEmptyBoard(8)
    const ship: Ship = { id:'s', size:4, bow:{x:6,y:0}, orientation:'H', hits:new Set(), sunk:false, owner:'player' }
    expect(placeable(b, ship, true)).toBe(false)
  })

  it('applyShipToCells marks cells', () => {
    const b = createEmptyBoard(8)
    const ship: Ship = { id:'s', size:2, bow:{x:1,y:1}, orientation:'V', hits:new Set(), sunk:false, owner:'player' }
    expect(placeable(b, ship, true)).toBe(true)
    applyShipToCells(b, ship)
    expect(b.cells[1][1].shipId).toBe('s')
    expect(b.cells[2][1].shipId).toBe('s')
  })
})
