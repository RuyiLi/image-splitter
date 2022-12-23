import { Component } from 'solid-js'
import { classes } from '../util'
import styles from '../styles/Tooltip.module.scss'

interface TooltipProps {
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const Tooltip: Component<TooltipProps> = (props) => {
  let container
  return (
    <div ref={container} class={styles.Tooltip}>
      {props.children}
      <span class={classes(styles.TooltipText, styles[props.position])}>
        {props.text}
      </span>
    </div>
  )
}
