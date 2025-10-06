
export function Switch({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (v:boolean)=>void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={()=>onCheckedChange && onCheckedChange(!checked)}
      className={"h-6 w-11 rounded-full border border-slate-700 relative " + (checked ? "bg-emerald-500/60" : "bg-slate-800")}
    >
      <span className={"absolute top-0.5 transition-all h-5 w-5 rounded-full bg-white " + (checked ? "left-5" : "left-0.5")}></span>
    </button>
  )
}
