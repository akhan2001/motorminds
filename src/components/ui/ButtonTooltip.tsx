import { ReactNode } from 'react'
import { Button } from './button'

interface TooltipProps {
    content: {
        side?: 'top' | 'bottom' | 'left' | 'right'
        text: string
    }
}

interface ButtonTooltipProps {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    icon?: ReactNode
    onClick?: () => void
    className?: string
    disabled?: boolean
    children?: ReactNode
    tooltip?: TooltipProps
    'aria-label'?: string
    title?: string
    type?: 'button' | 'submit' | 'reset'
}

export const ButtonTooltip = ({
    variant = 'default',
    size = 'default',
    icon,
    onClick,
    className = '',
    disabled = false,
    children,
    tooltip,
    'aria-label': ariaLabel,
    title,
    type,
    ...props
}: ButtonTooltipProps) => {
    return (
        <Button
            variant={variant}
            size={size}
            onClick={onClick}
            className={className}
            disabled={disabled}
            aria-label={ariaLabel}
            title={title || tooltip?.content?.text}
            type={type}
            {...props}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </Button>
    )
}
