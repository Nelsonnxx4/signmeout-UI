import { cva, type VariantProps } from 'class-variance-authority'

export const buttonVariants = cva(
  [
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap',
    'rounded-[var(--radius-control)] border text-sm font-semibold leading-none outline-none',
    'transition-[transform,box-shadow,background-color,border-color,color] duration-100 ease-out',
    'focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2',
    'focus-visible:ring-offset-[var(--surface)] active:translate-y-0.5 active:shadow-none',
    'disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    'motion-reduce:transition-none motion-reduce:active:transform-none',
  ],
  {
    variants: {
      variant: {
        primary:
          'border-[var(--brand-strong)] bg-[var(--brand)] text-white shadow-[var(--shadow-button-primary)] hover:bg-[var(--brand-hover)]',
        secondary:
          'border-[var(--control)] bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-button-secondary)] hover:bg-[var(--raised)]',
        quiet:
          'border-transparent bg-transparent text-[var(--text)] hover:bg-[var(--raised)] active:bg-[var(--border)]',
        danger:
          'border-[var(--negative-strong)] bg-[var(--negative)] text-white shadow-[var(--shadow-button-danger)] hover:bg-[var(--negative-hover)]',
      },
      size: {
        sm: 'h-9 px-3.5',
        md: 'h-11 px-5',
        lg: 'h-12 px-6 text-base',
        icon: 'size-11 p-0',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
      fullWidth: false,
    },
  },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
