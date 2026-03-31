import { createContext, useContext, useState, useRef, useEffect, HTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface DropdownContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownContext = createContext<DropdownContextValue | undefined>(undefined)

const useDropdownContext = () => {
  const context = useContext(DropdownContext)
  if (!context) {
    throw new Error('Dropdown components must be used within a Dropdown provider')
  }
  return context
}

interface DropdownProps {
  children: ReactNode
}

const Dropdown = ({ children }: DropdownProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

interface DropdownTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

const DropdownTrigger = ({ children, className, ...props }: DropdownTriggerProps) => {
  const { open, setOpen } = useDropdownContext()

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(className)}
      {...props}
    >
      {children}
    </button>
  )
}

interface DropdownContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const DropdownContent = ({ children, className }: DropdownContentProps) => {
  const { open } = useDropdownContext()

  if (!open) return null

  return (
    <div
      className={cn(
        'absolute top-full left-0 z-50 mt-1 min-w-[160px]',
        'rounded-md border bg-popover p-1 shadow-lg',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
    >
      {children}
    </div>
  )
}

interface DropdownItemProps {
  to?: string
  children: ReactNode
  className?: string
  onClick?: () => void
}

const DropdownItem = ({ to, children, className, onClick }: DropdownItemProps) => {
  const { setOpen } = useDropdownContext()

  const handleClick = () => {
    setOpen(false)
    onClick?.()
  }

  if (to) {
    return (
      <Link
        to={to}
        onClick={handleClick}
        className={cn(
          'flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm',
          'outline-none hover:bg-muted focus:bg-muted',
          'transition-colors',
          className
        )}
      >
        {children}
      </Link>
    )
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm',
        'outline-none hover:bg-muted focus:bg-muted',
        'transition-colors',
        className
      )}
    >
      {children}
    </div>
  )
}

export { Dropdown, DropdownTrigger, DropdownContent, DropdownItem }
