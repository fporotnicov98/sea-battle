import { ReactNode } from "react"

export const Select = ({ children }: { children?: ReactNode }) => <div className="inline-block">{children}</div>
export const SelectTrigger = ({ children }: { children?: ReactNode }) => <div>{children}</div>
export const SelectValue = ({ children }: { children?: ReactNode }) => <span>{children}</span>
export const SelectContent = ({ children }: { children?: ReactNode }) => <div>{children}</div>
export const SelectItem = ({ children }: { children?: ReactNode }) => <div>{children}</div>
