import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import 'bootstrap';

import { initState, rootReducer } from '@lib/store.ts'

import App from './App.tsx'
import './index.scss'
import RobotConsole from '@components/overview/RobotConsole.tsx';

const globalStore = configureStore({
  reducer: rootReducer,
  preloadedState: initState(),
})

if (window.location.hash == "#console") {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <RobotConsole window='console' enabled={true} />
      </div>
    </StrictMode>,
  )
}
else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Provider store={globalStore}>
        <App />
      </Provider>
    </StrictMode>,
  )
}