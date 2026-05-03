import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import DashboardHome from "@/pages/user/DashboardHome";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AccountPage from "@/pages/user/AccountPage";
import NotificationsPage from "@/pages/user/NotificationsPage";
import SecurityPage from "@/pages/user/SecurityPage";
import AdminDashboardLayout from "@/pages/admin/AdminDashboardLayout";
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminEventsPage from "@/pages/admin/AdminEventsPage";
import AdminRolesPage from "@/pages/admin/AdminRolesPage";
import ErrorPage from "@/components/common/ErrorPage";
import { adminLoader, requireAuth } from "./scripts/auth.loader";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />
  },
  {
    path: "/",
    children: [
      {
        path: "/auth/signup",
        element: <Signup />
      },
      {
        path: "/auth/login",
        element: <Login />
      },
      {
        path: "/auth/forgot-password",
        element: <ForgotPassword />
      },
      {
        path: "/auth/verify-email",
        element: <VerifyEmail />
      }
    ]
  },
  {
    path: "/dashboard",
    loader: requireAuth,
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <DashboardHome />
      },
      {
        path: "account",
        element: <AccountPage />
      },
      {
        path: "notifications",
        element: <NotificationsPage />
      },
      {
        path: "security",
        element: <SecurityPage />
      }
    ]
  },
  {
    path: "/admin/dashboard",
    loader: adminLoader,
    element: <AdminDashboardLayout />,
    children: [
      {
        index: true,
        element: <AdminOverview />
      },
      {
        path: "users",
        element: <AdminUsersPage />
      },
      {
        path: "events",
        element: <AdminEventsPage />
      },
      {
        path: "roles",
        element: <AdminRolesPage />
      }
    ]
  },
  {
    path: "*",
    element: <ErrorPage />
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
