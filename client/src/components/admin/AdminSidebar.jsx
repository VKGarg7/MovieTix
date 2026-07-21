import React from "react";
import { assets } from "../../assets/assets";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboardIcon,
  PlusSquareIcon,
  ListIcon,
  ListCollapseIcon,
  Building2Icon,
} from "lucide-react";

const AdminSidebar = () => {
  const user = {
    firstName: "Admin",
    lastName: "User",
    imageUrl: assets.profile,
  };

  const adminNavlinks = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboardIcon },
    { name: "Theaters", path: "/admin/theaters", icon: Building2Icon },
    { name: "Add Shows", path: "/admin/add-shows", icon: PlusSquareIcon },
    { name: "List Shows", path: "/admin/list-shows", icon: ListIcon },
    {
      name: "List Bookings",
      path: "/admin/list-bookings",
      icon: ListCollapseIcon,
    },
  ];

  return (
    <div className="h-[calc(100vh-64px)] md:flex flex-col items-center pt-8 max-w-13 md:max-w-60 w-full border-r border-white/10 bg-[var(--color-surface)]/40 text-sm">
      <img
        className="h-9 md:h-14 w-9 md:w-14 rounded-full mx-auto ring-2 ring-white/10"
        src={user.imageUrl}
        alt="sidebar"
      />

      <p className="mt-3 text-base max-md:hidden font-medium">
        {user.firstName} {user.lastName}
      </p>

      <div className="w-full mt-2">
        {adminNavlinks.map((link, index) => (
          <NavLink
            key={index}
            to={link.path}
            end
            className={({ isActive }) =>
              `relative flex items-center max-md:justify-center gap-3 w-full py-3 min-md:pl-10 first:mt-6 text-gray-400 transition-colors duration-200 hover:text-gray-200 ${
                isActive && "bg-primary/10 text-primary group"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon className="w-5 h-5" />
                <p className="max-md:hidden">{link.name}</p>
                <span
                  className={`w-1 h-8 rounded-l right-0 absolute transition-colors ${
                    isActive && "bg-primary"
                  }`}
                />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default AdminSidebar;
