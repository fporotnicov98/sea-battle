import { cn } from '@/lib/utils'
import { ReactNode } from 'react';

export function ScrollArea({ className, children }: { className?: string; children?: ReactNode }) {
  return <div className={cn('overflow-auto', className)}>{children}</div>
}
