import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "../App";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import DronesPage from "../pages/DronesPage";
import FlightRequestPage from "../pages/FlightRequestPage";
import AdminRequestsPage from "../pages/AdminRequestsPage";
import MasterDataPage from "../pages/MasterDataPage";
import AirForceOpsPage from "../pages/AirForceOpsPage";

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
      { path: "flight-request", element: <FlightRequestPage /> },
      { path: "admin-requests", element: <AdminRequestsPage /> },
      { path: "airforce-ops", element: <AirForceOpsPage /> },
      { path: "master-data", element: <MasterDataPage /> }
    ]
  }
]);

// Router provider wrapper for route-based app rendering.
export default function AppRouter() {
  return <RouterProvider router={router} />;
}
