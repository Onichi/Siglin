import { createBrowserRouter } from "react-router";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Auth } from "./pages/Auth";
import { Profile } from "./pages/Profile";
import { Dictionary } from "./pages/Dictionary";
import { Lesson } from "./pages/Lesson";
import { Achievements } from "./pages/Achievements";
import { Settings } from "./pages/Settings";
import { Admin } from "./pages/Admin";
import { NotFound } from "./pages/NotFound";
import { Forbidden } from "./pages/Forbidden";
import { AppLayout } from "./components/AppLayout"; // Импортируем наш новый каркас

export const router = createBrowserRouter([
  // Публичные страницы (без сайдбара)
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/login",
    element: <Auth mode="login" />,
  },
  {
    path: "/register",
    element: <Auth mode="register" />,
  },

  // Защищенные страницы (внутри AppLayout с сайдбаром и данными)
  {
    element: <AppLayout />,
    children: [
      {
        path: "/dashboard",
        Component: Dashboard,
      },
      {
        path: "/profile",
        Component: Profile,
      },
      {
        path: "/profile/achievements",
        Component: Achievements,
      },
      {
        path: "/settings",
        Component: Settings,
      },
      {
        path: "/dictionary",
        Component: Dictionary,
      },
      {
        path: "/lesson/:id",
        Component: Lesson,
      },
      {
        path: "/admin",
        Component: Admin,
      },
    ],
  },

  // Ошибки
  {
    path: "/403",
    Component: Forbidden,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);