import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'

import routes from './common/routes.jsx'
import Home from './home.jsx'

createRoot(document.getElementById('root')).render(
  <RouterProvider router={routes}>
    <Home />
  </RouterProvider>
)
