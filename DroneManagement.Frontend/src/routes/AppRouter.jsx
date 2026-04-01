import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "../App";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import DronesPage from "../pages/DronesPage";
import FlightRequestPage from "../pages/FlightRequestPage";
import AdminRequestsPage from "../pages/AdminRequestsPage";
import AirForceOpsPage from "../pages/AirForceOpsPage";
import UsersPage from "../pages/UsersPage";
import UnitsPage from "../pages/UnitsPage";
import CategoriesPage from "../pages/CategoriesPage";
import LicensesPage from "../pages/LicensesPage";
import NoFlyZonesPage from "../pages/NoFlyZonesPage";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "drones", element: <DronesPage /> },
      { path: "permits", element: <FlightRequestPage /> },
      { path: "flight-request", element: <Navigate to="/permits" replace /> },
      { path: "admin-requests", element: <AdminRequestsPage /> },
      { path: "airforce-ops", element: <AirForceOpsPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "units", element: <UnitsPage /> },
      { path: "categories", element: <CategoriesPage /> },
      { path: "licenses", element: <LicensesPage /> },
      { path: "no-fly-zones", element: <NoFlyZonesPage /> },
      { path: "master-data", element: <Navigate to="/users" replace /> }
    ]
  }
]);

// Router provider wrapper for route-based app rendering.
export default function AppRouter() {
  return <RouterProvider router={router} />;
}
