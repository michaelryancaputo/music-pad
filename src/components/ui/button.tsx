import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-950 hover:bg-white',
        secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
        outline: 'border border-slate-700 text-slate-200 hover:border-slate-500',
        ghost: 'text-slate-200 hover:bg-slate-800/60',
        destructive:
          'border border-red-400 text-red-200 hover:border-red-300 hover:text-red-100',
      },
      size: {
        sm: 'h-7 rounded-md px-2 text-[11px]',
        default: 'h-9 px-3',
        lg: 'h-10 rounded-md px-4',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'sm',
    },
  },
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
