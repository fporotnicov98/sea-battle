
export type Coord = { x:number; y:number }
export type Orientation = 'H' | 'V'
export type Cell = { x:number; y:number; shotByPlayer:boolean; shotByAI:boolean; shipId?:string }
export type Ship = { id:string; size:number; bow:Coord; orientation:Orientation; hits:Set<string>; sunk:boolean; owner:'player'|'ai' }
export type Board = { size:number; cells:Cell[][]; ships:Ship[] }

export const GRID = 8
export const cellKey = (x:number,y:number)=>`${x},${y}`
export const within = (x:number,y:number,size=GRID)=> x>=0 && y>=0 && x<size && y<size

export function createEmptyBoard(size=GRID): Board {
  const cells: Cell[][] = []
  for (let y=0;y<size;y++){
    const row: Cell[] = []
    for (let x=0;x<size;x++) row.push({x,y,shotByAI:false,shotByPlayer:false})
    cells.push(row)
  }
  return { size, cells, ships: [] }
}

export function iterShipCells(ship: Ship) {
  const coords = [] as Coord[]
  for (let i=0;i<ship.size;i++) {
    const x = ship.bow.x + (ship.orientation==='H'? i:0)
    const y = ship.bow.y + (ship.orientation==='V'? i:0)
    coords.push({x,y})
  }
  return coords
}

export function placeable(board: Board, ship: Ship, enforceNoTouch: boolean): boolean {
  const coords = iterShipCells(ship)
  if (!coords.every(c=>within(c.x,c.y,board.size))) return false
  for (const c of coords) {
    const current = board.cells[c.y][c.x]
    if (current.shipId && current.shipId !== ship.id) return false
    if (enforceNoTouch) {
      for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++) {
        const nx=c.x+dx, ny=c.y+dy
        if (!within(nx,ny,board.size)) continue
        const neighbor = board.cells[ny][nx]
        if (neighbor.shipId && neighbor.shipId !== ship.id) return false
      }
    }
  }
  return true
}

export function applyShipToCells(board: Board, ship: Ship) {
  for (const c of iterShipCells(ship)) {
    board.cells[c.y][c.x].shipId = ship.id
  }
}

export function clearShipFromCells(board: Board, ship: Ship) {
  for (let y=0;y<board.size;y++) for (let x=0;x<board.size;x++) {
    if (board.cells[y][x].shipId===ship.id) board.cells[y][x].shipId = undefined
  }
}

export function cloneBoard(b: Board): Board {
  return {
    size: b.size,
    cells: b.cells.map(row=>row.map(c=>({...c}))),
    ships: b.ships.map(s=>({...s, hits: new Set(Array.from(s.hits))}))
  }
}

export function randomPlacement(board: Board, fleet: number[], owner: Ship['owner'], enforceNoTouch: boolean): Board {
  const b = cloneBoard(board)
  function randInt(n:number){ return Math.floor(Math.random()*n) }
  for (const size of fleet) {
    let placed=false, attempts=0
    while(!placed && attempts<2000) {
      attempts++
      const orientation: Orientation = Math.random()<0.5? 'H':'V'
      const maxX = orientation==='H'? b.size-size : b.size-1
      const maxY = orientation==='V'? b.size-size : b.size-1
      const bow = { x: randInt(maxX+1), y: randInt(maxY+1) }
      const ship: Ship = { id: `${owner}-${size}-${attempts}-${Math.random().toString(36).slice(2,7)}`, size, bow, orientation, hits: new Set(), sunk:false, owner }
      if (placeable(b, ship, enforceNoTouch)) { b.ships.push(ship); applyShipToCells(b, ship); placed=true }
    }
    if (!placed) return randomPlacement(createEmptyBoard(board.size), fleet, owner, enforceNoTouch)
  }
  return b
}
