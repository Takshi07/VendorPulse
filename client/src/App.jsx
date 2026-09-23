import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import { ProtectedRoute } from './auth/ProtectedRoute.jsx'
import AppLayout from './layout/AppLayout.jsx'
import AccessDeniedPage from './pages/AccessDeniedPage.jsx'
import ComparePage from './pages/ComparePage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import EvaluationFormPage from './pages/EvaluationFormPage.jsx'
import EvaluationResultPage from './pages/EvaluationResultPage.jsx'
import EvaluationReviewPage from './pages/EvaluationReviewPage.jsx'
import EvaluationsPage from './pages/EvaluationsPage.jsx'
import KpiFormPage from './pages/KpiFormPage.jsx'
import KpisPage from './pages/KpisPage.jsx'
import KpiWeightsPage from './pages/KpiWeightsPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import SupplierDetailsPage from './pages/SupplierDetailsPage.jsx'
import SupplierFormPage from './pages/SupplierFormPage.jsx'
import SuppliersPage from './pages/SuppliersPage.jsx'
import { MANAGER_ROLES } from './suppliers/supplierUtils.js'
import './App.css'

const ADMIN = 'ADMIN'

const pageDetails = {
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
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="suppliers/:supplierId" element={<SupplierDetailsPage />} />
              <Route element={<ProtectedRoute allowedRoles={MANAGER_ROLES} />}>
                <Route path="suppliers/new" element={<SupplierFormPage mode="create" />} />
                <Route path="suppliers/:supplierId/edit" element={<SupplierFormPage mode="edit" />} />
              </Route>
              <Route path="evaluations" element={<EvaluationsPage />} />
              <Route path="evaluations/:evaluationId" element={<EvaluationResultPage />} />
              <Route element={<ProtectedRoute allowedRoles={MANAGER_ROLES} />}>
                <Route path="evaluations/new" element={<EvaluationFormPage />} />
                <Route path="evaluations/review" element={<EvaluationReviewPage />} />
              </Route>
              <Route path="compare" element={<ComparePage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="access-denied" element={<AccessDeniedPage />} />

              <Route element={<ProtectedRoute allowedRoles={[ADMIN]} />}>
                <Route path="kpis" element={<KpisPage />} />
                <Route path="kpis/new" element={<KpiFormPage mode="create" />} />
                <Route path="kpis/weights" element={<KpiWeightsPage />} />
                <Route path="kpis/:kpiId/edit" element={<KpiFormPage mode="edit" />} />
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
