/**
 * ROUTES
 * /inscription/:step  signup (screen 0)
 * Once signed up, inside the app shell (left menu):
 * /                         home and checklist (screens 0, 4, 5)
 * /catalogue                catalogue (screens 1, 2, 9); ?panel=patient opens the patient panel
 * /recommandations/:uid     recommendation editor (screens 3, 6)
 * /patients, /patients/nouveau, /patients/:uid   patients (screens 7, 10)
 * /favoris                  favorites setup (screen 8)
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { CataloguePage } from './catalogue/CataloguePage';
import { FavoritesPage } from './favorites/FavoritesPage';
import { usePractitioner } from './hooks/queries';
import { HomePage } from './home/HomePage';
import { AppShell } from './layout/AppShell';
import { WordingContext, wordingFor } from './lib/wording';
import { PatientCreatePage } from './patients/PatientCreatePage';
import { PatientDetailPage } from './patients/PatientDetailPage';
import { PatientsListPage } from './patients/PatientsListPage';
import { RecommendationPage } from './reco/RecommendationPage';
import { SignupPage } from './signup/SignupPage';
import { ToastProvider } from './ui';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
});

/** The app is only reachable once the signup is completed (checklist item 1). */
function RequireSignup() {
  const { data: p, isLoading, error } = usePractitioner();
  if (error) return <div className="p-6 text-sm">API injoignable. Lancez le serveur : npm run dev (à la racine).</div>;
  if (isLoading || !p) return null;
  if (!p.signupCompletedAt) return <Navigate to="/inscription/infos" replace />;
  // « prescription » + « patient » for physicians, « recommandation » + « client » otherwise.
  return (
    <WordingContext.Provider value={wordingFor(p.profession)}>
      <Outlet />
    </WordingContext.Provider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/inscription/:step?" element={<SignupPage />} />
              <Route element={<RequireSignup />}>
                <Route element={<AppShell />}>
                  <Route index element={<HomePage />} />
                  <Route path="catalogue" element={<CataloguePage />} />
                  <Route path="recommandations/:uid" element={<RecommendationPage />} />
                  <Route path="patients" element={<PatientsListPage />} />
                  <Route path="patients/nouveau" element={<PatientCreatePage />} />
                  <Route path="patients/:uid" element={<PatientDetailPage />} />
                  <Route path="favoris" element={<FavoritesPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
    </QueryClientProvider>
  );
}
