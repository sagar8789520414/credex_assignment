import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-emerald-100 text-emerald-800',
        warning: 'bg-amber-100 text-amber-800',
        danger: 'bg-red-100 text-red-800',
        secondary: 'bg-zinc-100 text-zinc-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
