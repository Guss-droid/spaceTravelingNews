import Link from 'next/link'

import styles from './style.module.scss'

interface IStylesExitButton {
  haveStyles?: string;
}

export function ExitButton({ haveStyles }: IStylesExitButton) {
  return (
    <Link href="/api/exit-preview">
      <a className={`${styles.container} ${haveStyles}`}>Sair do modo preview</a>
    </Link>
  )
}