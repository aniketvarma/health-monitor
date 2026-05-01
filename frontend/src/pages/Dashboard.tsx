import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, UserRound } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import BottomNav from "@/components/BottomNav";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  if (isMobile) {
    return (
      <div>
        <main className="p-4 pb-20">
          <Link to="/dashboard/settings" className="fixed top-4 right-4 z-50 rounded-full w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center shadow-md">
            <UserRound className="w-5 h-5" />
          </Link>
          <Outlet />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/dashboard"}
                >
                  <Link to="/dashboard">Home</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/dashboard/profile"}
                >
                  <Link to="/dashboard/profile">Profile</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/dashboard/reminders"}
                >
                  <Link to="/dashboard/reminders">Reminders</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/dashboard/insights"}
                >
                  <Link to="/dashboard/insights">Insights</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/dashboard/settings"}
                >
                  <Link to="/dashboard/settings">Settings</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 p-6 pt-2">
        <SidebarTrigger className="mb-2" />
        <Link to="/dashboard/settings" className="fixed top-4 right-4 z-50 rounded-full w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center shadow-md">
          <UserRound className="w-5 h-5" />
        </Link>
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
