
import * as React from 'react'
import { cn } from '@/lib/utils'
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn('h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 outline-none focus:border-slate-400', className)} {...props} />
  )
)
Input.displayName = 'Input'
