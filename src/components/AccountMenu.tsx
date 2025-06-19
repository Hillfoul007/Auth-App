import React from "react";
import { User, History, LogOut, ChevronDown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AccountMenuProps {
  isLoggedIn: boolean;
  userEmail: string;
  currentUser?: any;
  onLogin: () => void;
  onLogout: () => void;
  onViewBookings: () => void;
  className?: string;
}

const AccountMenu: React.FC<AccountMenuProps> = ({
  isLoggedIn,
  userEmail,
  currentUser,
  onLogin,
  onLogout,
  onViewBookings,
  className = "",
}) => {
  const handleAccountSettings = () => {
    alert(
      "Account Settings\n\n• Change Password\n• Update Profile\n• Notification Preferences\n• Privacy Settings\n• Payment Methods\n\nComing soon!",
    );
  };

  if (!isLoggedIn) {
    return (
      <Button
        onClick={onLogin}
        className={`flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all duration-300 hover:scale-105 ${className}`}
      >
        <User className="w-4 h-4 text-white" />
        <span className="text-white font-medium">Sign In</span>
      </Button>
    );
  }

  // Get user's full name from different possible sources
  const getUserDisplayName = () => {
    if (currentUser?.full_name) return currentUser.full_name;
    if (currentUser?.profile?.full_name) return currentUser.profile.full_name;
    if (currentUser?.displayName) return currentUser.displayName;
    if (userEmail) return userEmail.split("@")[0];
    return "User";
  };

  const userName = getUserDisplayName();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all duration-300 hover:scale-105 ${className}`}
        >
          <User className="w-4 h-4 text-white" />
          <span className="text-white font-medium hidden md:inline">
            {userName}
          </span>
          <ChevronDown className="w-4 h-4 text-white" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 bg-white shadow-xl border border-gray-200 rounded-xl"
      >
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900">{userName}</p>
          <p className="text-sm text-gray-600 truncate">{userEmail}</p>
          {currentUser?.phone && (
            <p className="text-xs text-gray-500">{currentUser.phone}</p>
          )}
        </div>

        <DropdownMenuItem
          onClick={onViewBookings}
          className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 cursor-pointer"
        >
          <History className="w-4 h-4 text-blue-600" />
          <span className="text-gray-700">My Bookings</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleAccountSettings}
          className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
        >
          <Settings className="w-4 h-4 text-gray-600" />
          <span className="text-gray-700">Account Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onLogout}
          className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 cursor-pointer text-red-600"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountMenu;
