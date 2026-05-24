import Search from "./Search";
import FileUploader from "./FileUploader";
import Image from "next/image";

const Header = ({
  ownerId,
  accountId,
  fullName,
  avatar,
}: {
  ownerId: string;
  accountId: string;
  fullName: string;
  avatar: string;
}) => {
  const avatarUrl = avatar || "/assets/images/avatar.png";
  return (
    <header className="header">
      <div className="w-full max-w-4xl">
        <Search />
      </div>
      <div className="header-wrapper">
        <FileUploader
          ownerId={ownerId}
          accountId={accountId}
          className="h-12 rounded-2xl bg-linear-to-r from-[#ff6b6b] to-[#ff8e7e] px-6 text-[15px] font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-[#ff6464] hover:to-[#ff8674] cursor-pointer"
        />
      </div>
    </header>
  );
};

export default Header;
