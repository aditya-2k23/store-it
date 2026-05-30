import Search from "./Search";
import FileUploader from "./FileUploader";
import ClerkUserButton from "./ClerkUserButton";

const Header = () => {
  return (
    <header className="header">
      <div className="w-full max-w-4xl">
        <Search />
      </div>
      <div className="header-wrapper">
        <FileUploader className="h-10 px-6 rounded-3xl bg-linear-to-r from-[#ff6b6b] to-[#ff8e7e] font-medium text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-[#ff6464] hover:to-[#ff8674] cursor-pointer font-dynapuff" />

        <ClerkUserButton />
      </div>
    </header>
  );
};

export default Header;
