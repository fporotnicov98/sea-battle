
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

import {
  type Coord, type Board,
  GRID, cellKey, within, createEmptyBoard, cloneBoard,
  placeable, applyShipToCells, clearShipFromCells, randomPlacement
} from '@/lib/seabattle'

type Phase = 'setup' | 'inProgress' | 'finished'
type MoveMode = 'none' | 'selecting' | 'moving'
type LogEntry = { t: number; text: string }
type Ship = Board['ships'][number]

const defaultFleet = [4,3,3,2,2,2,1,1,1,1]

class AIController {
  size: number
  targets: Coord[] = []
  tried = new Set<string>()
  constructor(size: number) { this.size = size }
  enqueueNeighbors(x: number, y: number) {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]] as const
    for (const [dx,dy] of dirs) {
      const nx = x+dx, ny = y+dy
      if (within(nx, ny, this.size) && !this.tried.has(`${nx},${ny}`)) this.targets.push({x:nx,y:ny})
    }
  }
  nextShot(): Coord {
    while (this.targets.length) {
      const c = this.targets.pop()!
      if (!this.tried.has(`${c.x},${c.y}`)) return c
    }
    let x=0,y=0,guard=0
    while (guard++<5000) { x = Math.floor(Math.random()*this.size); y = Math.floor(Math.random()*this.size);
      if ((x+y)%2===0 && !this.tried.has(`${x},${y}`)) break }
    return {x,y}
  }
}

export default function App() {
  const [enforceNoTouch, setEnforceNoTouch] = useState(true)
  const [allowMove, setAllowMove] = useState(true)
  const [fleet, setFleet] = useState<number[]>(defaultFleet)
  const [phase, setPhase] = useState<Phase>('setup')
  const [turn, setTurn] = useState<'player'|'ai'>('player')

  const [playerBoard, setPlayerBoard] = useState(() => createEmptyBoard(GRID))
  const [aiBoard, setAIBoard] = useState(() => createEmptyBoard(GRID))

  const [selectedShipId, setSelectedShipId] = useState<string|undefined>()
  const [moveMode, setMoveMode] = useState<MoveMode>('none')
  const [hasMovedThisTurn, setHasMovedThisTurn] = useState(false)
  const [log, setLog] = useState<LogEntry[]>([])
  const aiRef = useRef(new AIController(GRID))

  const logLine = useCallback((text: string) => setLog((l) => [{ t: Date.now(), text }, ...l].slice(0,200)), [])

  useEffect(() => {
    setPlayerBoard(createEmptyBoard(GRID))
    const aiPlaced = randomPlacement(createEmptyBoard(GRID), fleet, 'ai', enforceNoTouch)
    setAIBoard(aiPlaced)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shipsPlacedOk = useMemo(() => playerBoard.ships.length === fleet.length, [playerBoard.ships.length, fleet.length])
  const remainingPlayer = useMemo(() => playerBoard.ships.filter(s=>!s.sunk).length, [playerBoard])
  const remainingAI = useMemo(() => aiBoard.ships.filter(s=>!s.sunk).length, [aiBoard])

  const resetGame = useCallback(() => {
    setPhase('setup')
    setTurn('player')
    setHasMovedThisTurn(false)
    setSelectedShipId(undefined)
    setLog([])
    setPlayerBoard(createEmptyBoard(GRID))
    setAIBoard(randomPlacement(createEmptyBoard(GRID), fleet, 'ai', enforceNoTouch))
    aiRef.current = new AIController(GRID)
  }, [enforceNoTouch, fleet])

  const autoPlacePlayer = useCallback(() => {
    const placed = randomPlacement(createEmptyBoard(GRID), fleet, 'player', enforceNoTouch)
    setPlayerBoard(placed)
  }, [enforceNoTouch, fleet])

  const addShipToPlayer = useCallback((size: number) => {
    const newShip: Ship = {
      id: `player-${size}-${Math.random().toString(36).slice(2,7)}`,
      size,
      bow: { x: 0, y: 0 },
      orientation: 'H',
      hits: new Set(),
      sunk: false,
      owner: 'player',
    }
    setPlayerBoard((b) => ({ ...b, ships: [...b.ships, newShip] }))
    setSelectedShipId(newShip.id)
    setMoveMode('moving')
  }, [])

  const removeLastUnplacedIfAny = useCallback(() => {
    setPlayerBoard((b) => {
      const last = b.ships[b.ships.length - 1]
      if (!last) return b
      const copy = cloneBoard(b)
      clearShipFromCells(copy, last)
      copy.ships = copy.ships.filter((s) => s.id !== last.id)
      return copy
    })
  }, [])

  const selectShip = useCallback((id: string) => {
    setSelectedShipId(id)
    setMoveMode('moving')
  }, [])

  const rotateSelected = useCallback(() => {
    setPlayerBoard((b) => {
      if (!selectedShipId) return b
      const copy = cloneBoard(b)
      const ship = copy.ships.find((s) => s.id === selectedShipId && s.owner === 'player')
      if (!ship) return b
      clearShipFromCells(copy, ship)
      ship.orientation = ship.orientation === 'H' ? 'V' : 'H'
      if (placeable(copy, ship, enforceNoTouch)) {
        applyShipToCells(copy, ship); return copy
      } else {
        ship.orientation = ship.orientation === 'H' ? 'V' : 'H'
        applyShipToCells(copy, ship); return copy
      }
    })
  }, [selectedShipId, enforceNoTouch])

  const nudgeSelected = useCallback((dx: number, dy: number) => {
    setPlayerBoard((b) => {
      if (!selectedShipId) return b
      const copy = cloneBoard(b)
      const ship = copy.ships.find((s) => s.id === selectedShipId && s.owner === 'player')
      if (!ship) return b
      clearShipFromCells(copy, ship)
      const newShip = { ...ship, bow: { x: ship.bow.x + dx, y: ship.bow.y + dy } }
      if (placeable(copy, newShip, enforceNoTouch)) {
        ship.bow = newShip.bow; applyShipToCells(copy, ship); return copy
      } else {
        applyShipToCells(copy, ship); return copy
      }
    })
  }, [selectedShipId, enforceNoTouch])

  const handleBoardClickToPlace = useCallback((x: number, y: number) => {
    if (phase !== 'setup' && !(allowMove && turn === 'player' && !hasMovedThisTurn && selectedShipId)) return
    setPlayerBoard((b) => {
      if (!selectedShipId) return b
      const copy = cloneBoard(b)
      const ship = copy.ships.find((s) => s.id === selectedShipId && s.owner === 'player')
      if (!ship) return b
      clearShipFromCells(copy, ship)
      const newShip = { ...ship, bow: { x, y } }
      if (placeable(copy, newShip, enforceNoTouch)) {
        ship.bow = newShip.bow; applyShipToCells(copy, ship)
        if (phase === 'setup') { setMoveMode('none') } else { setHasMovedThisTurn(true); logLine(`Вы передвинули корабль размером ${ship.size}.`) }
        return copy
      } else { applyShipToCells(copy, ship); return b }
    })
  }, [selectedShipId, enforceNoTouch, phase, allowMove, turn, hasMovedThisTurn, logLine])

  const startGame = useCallback(() => {
    if (!shipsPlacedOk) return
    setPhase('inProgress'); setTurn('player'); setHasMovedThisTurn(false); setSelectedShipId(undefined); logLine('Игра началась! Ваш ход.')
  }, [shipsPlacedOk, logLine])

  const fireAt = useCallback((board: Board, x: number, y: number, shooter: 'player'|'ai') => {
    const copy = cloneBoard(board)
    const cell = copy.cells[y][x]
    if (shooter === 'player' && cell.shotByPlayer) return { board: board, result: 'repeat' as const }
    if (shooter === 'ai' && cell.shotByAI) return { board: board, result: 'repeat' as const }
    if (shooter === 'player') cell.shotByPlayer = true; else cell.shotByAI = true
    if (cell.shipId) {
      const ship = copy.ships.find((s) => s.id === cell.shipId)!
      ship.hits.add(`${x},${y}`)
      if (ship.hits.size >= ship.size) { ship.sunk = true; return { board: copy, result: 'sunk' as const, ship } }
      return { board: copy, result: 'hit' as const, ship }
    }
    return { board: copy, result: 'miss' as const }
  }, [])

  const checkWin = useCallback((b: Board) => b.ships.every((s) => s.sunk), [])

  const onEnemyCellClick = useCallback((x: number, y: number) => {
    if (phase !== 'inProgress' || turn !== 'player') return
    const { board: newEnemyBoard, result, ship } = fireAt(aiBoard, x, y, 'player')
    if (result === 'repeat') return
    setAIBoard(newEnemyBoard)
    if (result === 'miss') {
      logLine('Промах! Ход переходит к ИИ.'); setHasMovedThisTurn(false); setTurn('ai')
    } else if (result === 'hit') {
      logLine('Попадание!'); aiRef.current.enqueueNeighbors(x, y)
      if (checkWin(newEnemyBoard)) { setPhase('finished'); logLine('Победа! Все корабли противника уничтожены.') }
    } else if (result === 'sunk') {
      logLine(`Корабль противника размером ${ship!.size} потоплен!`); aiRef.current.enqueueNeighbors(x, y)
      if (checkWin(newEnemyBoard)) { setPhase('finished'); logLine('Победа! Все корабли противника уничтожены.') }
    }
  }, [phase, turn, aiBoard, fireAt, logLine, checkWin])

  useEffect(() => {
    if (phase !== 'inProgress' || turn !== 'ai') return
    const t = setTimeout(() => {
      let shot = aiRef.current.nextShot()
      while (playerBoard.cells[shot.y][shot.x].shotByAI) { shot = aiRef.current.nextShot() }
      const { board: newPlayerBoard, result, ship } = fireAt(playerBoard, shot.x, shot.y, 'ai')
      setPlayerBoard(newPlayerBoard)
      aiRef.current.tried.add(`${shot.x},${shot.y}`)
      if (result === 'miss') { logLine('ИИ промахнулся. Ваш ход.'); setTurn('player'); setHasMovedThisTurn(false) }
      else if (result === 'hit') {
        logLine('ИИ попал!'); aiRef.current.enqueueNeighbors(shot.x, shot.y)
        if (checkWin(newPlayerBoard)) { setPhase('finished'); logLine('Поражение. Все ваши корабли уничтожены.') } else { setTurn('ai') }
      } else if (result === 'sunk') {
        logLine(`ИИ потопил ваш корабль размером ${ship!.size}.`); aiRef.current.enqueueNeighbors(shot.x, shot.y)
        if (checkWin(newPlayerBoard)) { setPhase('finished'); logLine('Поражение. Все ваши корабли уничтожены.') } else { setTurn('ai') }
      }
    }, 550)
    return () => clearTimeout(t)
  }, [phase, turn, fireAt, playerBoard, logLine, checkWin])

  const beginMovePhase = useCallback(() => { setMoveMode('selecting'); setSelectedShipId(undefined) }, [])
  const endMovePhase = useCallback(() => { setMoveMode('none') }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (moveMode === 'moving' && selectedShipId && (phase === 'setup' || (allowMove && turn === 'player' && !hasMovedThisTurn))) {
        if (e.key === 'r' || e.key === 'R') { e.preventDefault(); /* rotate */ }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moveMode, selectedShipId, phase, allowMove, turn, hasMovedThisTurn])

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <Card className="bg-slate-900/60 backdrop-blur border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Морской бой 8×8</span>
              <span className="text-xs font-normal text-slate-400">Phase: {phase}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Запрет касаний кораблей</span>
                <Switch checked={enforceNoTouch} onCheckedChange={setEnforceNoTouch} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Разрешать движение (1/ход)</span>
                <Switch checked={allowMove} onCheckedChange={setAllowMove} />
              </div>

              <div className="pt-2">
                <p className="text-sm mb-2">Флот (редактируемый):</p>
                <FleetEditor fleet={fleet} setFleet={setFleet} disabled={phase!=='setup'} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={autoPlacePlayer} disabled={phase!=='setup'}>Случайная расстановка</Button>
                <Button variant="ghost" onClick={resetGame}>Сброс</Button>
                <Button onClick={startGame} disabled={!shipsPlacedOk || phase!=='setup'}>Старт</Button>
                <Button variant="outline" onClick={()=>setAIBoard(randomPlacement(createEmptyBoard(GRID), fleet, 'ai', enforceNoTouch))} disabled={phase!=='setup'}>Перегенерировать ИИ</Button>
              </div>

              <div className="pt-2">
                <p className="text-sm mb-2">Лог</p>
                <ScrollArea className="h-64 rounded border border-slate-700 p-2 bg-slate-950/40">
                  <ul className="space-y-1">
                    {log.map((l)=> (<li key={l.t} className="text-xs text-slate-300">• {l.text}</li>))}
                  </ul>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <Card className="bg-slate-900/60 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ваша сетка</CardTitle>
                <p className="text-xs text-slate-400 mt-1">{remainingPlayer} кораблей осталось</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-slate-400 text-sm">Сетка рендерается компонентом внутри — см. версию в полотне чата (в этом минимальном репозитории упрощённый UI).</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Противник (ИИ)</CardTitle>
                <p className="text-xs text-slate-400 mt-1">{remainingAI} кораблей осталось</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-slate-400 text-sm">Для полноты визуала используй версию из полотна — здесь логика/тесты и минимальный UI.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function FleetEditor({ fleet, setFleet, disabled }: { fleet: number[]; setFleet: (f:number[])=>void; disabled?: boolean }) {
  const [value, setValue] = useState(fleet.join(','))
  useEffect(()=> setValue(fleet.join(',')), [fleet])
  const apply = () => {
    const nums = value.split(',').map((s)=>parseInt(s.trim(),10)).filter((n)=>!isNaN(n) && n>=1 && n<=8)
    if (nums.length>0) setFleet(nums)
  }
  return (
    <div className="flex gap-2 items-center">
      <Input value={value} onChange={(e)=>setValue(e.target.value)} disabled={disabled} placeholder="Напр. 4,3,3,2,2,2,1,1,1,1" />
      <Button onClick={apply} disabled={disabled}>OK</Button>
    </div>
  )
}
