import Search from "./Search";
import FileUploader from "./FileUploader";

const Header = ({
  ownerId,
  accountId,
}: {
  ownerId: string;
  accountId: string;
}) => {
  return (
    <header className="header">
      <Search />
      <div className="header-wrapper">
        <FileUploader ownerId={ownerId} accountId={accountId} />
      </div>
    </header>
  );
};

export default Header;
