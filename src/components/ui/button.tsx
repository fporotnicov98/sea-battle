import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant='default', size='md', ...props }, ref) => {
    const variants = {
      default: 'bg-slate-700 hover:bg-slate-600 text-white',
      secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700',
      outline: 'border border-slate-700 hover:bg-slate-800',
      ghost: 'hover:bg-slate-800'
    } as const
    const sizes = {
      sm: 'h-8 px-3 rounded-xl text-sm',
      md: 'h-10 px-4 rounded-2xl text-sm'
    } as const
    return (
      <button
        ref={ref}
        className={cn('inline-flex items-center justify-center transition focus:outline-none', variants[variant], sizes[size], className)}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
