import {
  Home,
  UserRound,
  BarChart3,
  ClipboardPlus,
  CalendarDays,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 border-t bg-gradient-to-r from-secondary to-accent flex">
      <Link
        to="/dashboard"
        className="flex-1 flex flex-col items-center justify-center"
      >
        <Home className="w-5 h-5" />
        <span className="text-xs">Home</span>
      </Link>
      <Link
        to="/dashboard/profile"
        className="flex-1 flex flex-col items-center justify-center"
      >
        <UserRound className="w-5 h-5" />
        <span className="text-xs">Profile</span>
      </Link>

      <Link
        to="/dashboard/reminders"
        className="flex-1 flex flex-col items-center justify-center"
      >
        <CalendarDays className="w-5 h-5" />
        <span className="text-xs">Reminders</span>
      </Link>
      <Link
        to="/dashboard/insights"
        className="flex-1 flex flex-col items-center justify-center"
      >
        <BarChart3 className="w-5 h-5" />
        <span className="text-xs">Insights</span>
      </Link>
      <Link
        to="/dashboard/log"
        className="flex-1 flex flex-col items-center justify-center"
      >
        <ClipboardPlus className="w-5 h-5" />
        <span className="text-xs">Log Data</span>
      </Link>
    </nav>
  );
}
