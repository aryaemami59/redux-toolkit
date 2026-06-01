import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App'
import { store } from './app/store'
import './index.css'
import { worker } from './mocks/browser'

// Initialize the msw worker, wait for the service worker registration to resolve, then mount
async function render() {
  await worker.start()

  const rootNode = createRoot(document.getElementById('root') as HTMLElement)

  rootNode.render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>,
  )
}

render()
