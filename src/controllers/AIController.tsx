import { Coord, within } from "@/lib/seabattle"

export class AIController {
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
