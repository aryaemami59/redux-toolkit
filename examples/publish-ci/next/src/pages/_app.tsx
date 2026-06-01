import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { store } from '../app-core/store'
import '../styles/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  const [showComponent, setShowComponent] = useState(false)
  useEffect(() => {
    ;(async () => {
      if (typeof window !== 'undefined') {
        const { worker } = await import('../mocks/browser')
        await worker.start()
        setShowComponent(true)
      }
    })()
  }, [])
  return (
    <Provider store={store}>
      {showComponent && <Component {...pageProps} />}
    </Provider>
  )
}
