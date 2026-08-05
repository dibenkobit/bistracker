import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

import Armory from '@/Armory'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Loading } from '@/components/Loading'

import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('нет узла #root в index.html')

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Armory />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
)
