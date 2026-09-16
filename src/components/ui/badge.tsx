import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * Status is communicated by a tinted chip with a matching hairline border, at
 * a consistent 22px height — so a table column of badges reads as one
 * vocabulary rather than as a row of differently-shaped pills.
 *
 * The four status tones map straight onto the semantic tokens in globals.css,
 * so a theme change re-tints every badge in the product at once.
 */
const badgeVariants = cva(
  "group/badge inline-flex h-[1.375rem] w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-md border px-2 text-[11px] font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground [a]:hover:bg-brand-navy-dark",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a]:hover:bg-accent",
        muted: "border-border-light bg-muted text-muted-foreground",
        success: "border-success-border bg-success-light text-success",
        warning: "border-warning-border bg-warning-light text-warning",
        info: "border-info-border bg-info-light text-info",
        destructive: "border-danger-border bg-danger-light text-danger",
        outline: "border-border bg-card text-foreground [a]:hover:bg-muted",
        ghost: "border-transparent text-muted-foreground hover:bg-muted",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
