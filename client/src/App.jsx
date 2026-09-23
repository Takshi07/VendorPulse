import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import { ProtectedRoute } from './auth/ProtectedRoute.jsx'
import AppLayout from './layout/AppLayout.jsx'
import AccessDeniedPage from './pages/AccessDeniedPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'
import './App.css'

const ADMIN = 'ADMIN'

const pageDetails = {
  dashboard: ['Performance overview', 'A clearer view of your supplier network.'],
  suppliers: ['Suppliers', 'Manage your vendor records and performance history.'],
  supplierNew: ['Add supplier', 'Keep contact and contract details in one place.'],
  supplierDetails: ['Supplier details', 'Review supplier information and performance history.'],
  supplierEdit: ['Edit supplier', 'Update supplier and contract details.'],
  evaluations: ['Evaluations', 'Quarterly supplier assessments and their results.'],
  evaluationNew: ['Evaluate supplier', 'Score each KPI from 1 to 5. Submitted results are read-only.'],
  evaluationReview: ['Review evaluation', 'Check the assessment before final submission.'],
  evaluationResult: ['Evaluation result', 'Submitted evaluation details are read-only.'],
  compare: ['Compare suppliers', 'Compare two or three suppliers evaluated using the same criteria and weights.'],
  reports: ['Reports', 'Filter evaluation records and export the selected results.'],
  kpis: ['KPI Management', 'Manage the criteria used to assess supplier performance.'],
  kpiNew: ['Add KPI', 'Define a criterion and its weight for future evaluations.'],
  kpiEdit: ['Edit KPI', 'Update a criterion used for future evaluations.'],
  kpiWeights: ['Adjust KPI weights', 'Set the shared criteria used for new evaluations.'],
  users: ['User Management', 'Manage access to your supplier workspace.'],
  userNew: ['Add user', 'Create an account and assign an access role.'],
  userEdit: ['Edit user', 'Update account details and permissions.'],
}

function Page({ type }) {
  const [title, description] = pageDetails[type]
  return <PlaceholderPage title={title} description={description} />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Page type="dashboard" />} />
              <Route path="suppliers" element={<Page type="suppliers" />} />
              <Route path="suppliers/new" element={<Page type="supplierNew" />} />
              <Route path="suppliers/:supplierId" element={<Page type="supplierDetails" />} />
              <Route path="suppliers/:supplierId/edit" element={<Page type="supplierEdit" />} />
              <Route path="evaluations" element={<Page type="evaluations" />} />
              <Route path="evaluations/new" element={<Page type="evaluationNew" />} />
              <Route path="evaluations/review" element={<Page type="evaluationReview" />} />
              <Route path="evaluations/:evaluationId" element={<Page type="evaluationResult" />} />
              <Route path="compare" element={<Page type="compare" />} />
              <Route path="reports" element={<Page type="reports" />} />
              <Route path="access-denied" element={<AccessDeniedPage />} />

              <Route element={<ProtectedRoute allowedRoles={[ADMIN]} />}>
                <Route path="kpis" element={<Page type="kpis" />} />
                <Route path="kpis/new" element={<Page type="kpiNew" />} />
                <Route path="kpis/weights" element={<Page type="kpiWeights" />} />
                <Route path="kpis/:kpiId/edit" element={<Page type="kpiEdit" />} />
                <Route path="users" element={<Page type="users" />} />
                <Route path="users/new" element={<Page type="userNew" />} />
                <Route path="users/:userId/edit" element={<Page type="userEdit" />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
