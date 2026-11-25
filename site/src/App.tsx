import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { ContentProvider } from './cms/content'
import { ConceptBar } from './shared/ConceptBar'
import Site from './site/Site'

// the five design concepts stay available for reference at /concepts (not linked from the site)
const Gallery = lazy(() => import('./Gallery'))
const AdminApp = lazy(() => import('./admin/AdminApp'))
const CONCEPT_PAGES = {
  1: lazy(() => import('./concepts/c1/Lab')),
  2: lazy(() => import('./concepts/c2/Journal')),
  3: lazy(() => import('./concepts/c3/Exhibition')),
  4: lazy(() => import('./concepts/c4/Playground')),
  5: lazy(() => import('./concepts/c5/Paper')),
} as const

function Concept() {
  const n = Number(useParams().concept) as keyof typeof CONCEPT_PAGES
  const Page = CONCEPT_PAGES[n]
  if (!Page) return <Navigate to="/concepts" replace />
  return (
    <>
      <Page />
      <ConceptBar current={n} />
    </>
  )
}

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#fee801]" />}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/concepts" element={<Gallery />} />
        <Route path="/c/:concept/:section?" element={<Concept />} />
        <Route path="/privacy" element={<ContentProvider><Site page="privacy" /></ContentProvider>} />
        <Route path="/accessibility" element={<ContentProvider><Site page="accessibility" /></ContentProvider>} />
        <Route path="/:section?" element={<ContentProvider><Site /></ContentProvider>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
