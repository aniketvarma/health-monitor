// Step 1: Import sidebar pieces (same as importing Card, Button in Login.tsx)
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Outlet, Link, useLocation } from "react-router-dom";

export default function Dashboard() {
  // useLocation() returns the current URL path, e.g. "/dashboard/profile"
  const location = useLocation();

  return (
    // SidebarProvider = the "manager" — it tracks whether sidebar is open/closed
    // Everything (sidebar + main content) must be inside it
    <SidebarProvider>
      {/* Sidebar = the actual panel on the left side of the screen */}
      <Sidebar>
        {/* SidebarContent = scrollable area inside the sidebar */}
        <SidebarContent>
          {/* SidebarGroup = a section of related items (like a fieldset in a form) */}
          <SidebarGroup>
            {/* SidebarGroupLabel = heading for this section */}
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            {/* SidebarMenu = the list container (like <ul>) */}
            <SidebarMenu>
              {/* SidebarMenuItem = one item in the list (like <li>) */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/dashboard"}>
                  <Link to="/dashboard">Home</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/dashboard/profile"}>
                  <Link to="/dashboard/profile">Profile</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/dashboard/calendar"}>
                  <Link to="/dashboard/calendar">Calendar</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/dashboard/reports"}>
                  <Link to="/dashboard/reports">Reports</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/dashboard/settings"}>
                  <Link to="/dashboard/settings">Settings</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* main page content goes here, next to sidebar */}
      {/* Outlet = placeholder that swaps content based on URL */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
