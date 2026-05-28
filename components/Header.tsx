import Search from "./Search";
import FileUploader from "./FileUploader";
import { SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="header">
      <div className="w-full max-w-4xl">
        <Search />
      </div>
      <div className="header-wrapper">
        <FileUploader className="h-12 rounded-2xl bg-linear-to-r from-[#ff6b6b] to-[#ff8e7e] px-6 text-[15px] font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-[#ff6464] hover:to-[#ff8674] cursor-pointer" />
        
        <SignOutButton redirectUrl="/sign-in">
          <Button 
            variant="outline" 
            className="h-12 rounded-2xl px-5 text-[15px] font-semibold flex items-center gap-2 border-light-300 shadow-sm cursor-pointer hover:bg-light-400"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:block text-slate-700">Sign Out</span>
          </Button>
        </SignOutButton>
      </div>
    </header>
  );
};

export default Header;
