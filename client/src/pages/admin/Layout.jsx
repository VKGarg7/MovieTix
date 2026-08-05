import React, { useEffect } from "react";
import AdminNavbar from "../../components/admin/AdminNavbar";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { Outlet } from "react-router-dom";
import { useAppContext } from "../../context/useAppContext";
import Loading from "../../components/Loading";

const Layout = () => {

  const {isAdmin , fetchIsAdmin} = useAppContext()

  useEffect(()=>{
    fetchIsAdmin()
  })

  return isAdmin ? (
    <div className="bg-void min-h-screen">
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 px-4 py-10 md:px-10 h-[calc(100vh-64px)] overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  ) : <Loading/>
};

export default Layout;
