"use client";

import FileUploader from "./FileUploader";

interface EmptyStateProps {
  type?: string;
}

const EmptyState = ({ type }: EmptyStateProps) => {
  const isTypeSpecific = !!type;
  const title = isTypeSpecific ? `No ${type} found` : "Your space is empty";
  const description = isTypeSpecific
    ? `You haven't uploaded any ${type} yet. Drag and drop them here to get started!`
    : "Upload your first file to get started. You can upload documents, images, audio, video, or any other files.";

  return (
    <div className="flex flex-col items-center justify-center w-full flex-1 text-center p-4 relative overflow-hidden">
      {/* Animated Graphic Area */}
      <div className="relative w-48 h-48 mb-4 flex items-center justify-center">
        {/* Glow effect behind */}
        <div className="absolute inset-0 bg-brand/20 blur-2xl rounded-full scale-100" />

        {/* Main Folder/Box SVG */}
        <svg
          className="relative z-10 w-24 h-24 text-brand drop-shadow-xl"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>

        {/* Orbiting / Floating Elements */}
        {/* Image File */}
        <div className="absolute top-4 left-4 animate-float-slow text-[#ff8e7e] drop-shadow-md z-20">
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 5a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2H4zm12 4a2 2 0 11-4 0 2 2 0 014 0zm-8 8l3-4 2 2 3-5 3 7H8z" />
          </svg>
        </div>

        {/* Document File */}
        <div
          className="absolute bottom-8 left-0 animate-float-medium text-[#ff6b6b] drop-shadow-md z-20"
          style={{ animationDelay: "0.5s" }}
        >
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z" />
          </svg>
        </div>

        {/* Media/Video File */}
        <div
          className="absolute top-10 right-0 animate-float-fast text-[#ff6464] drop-shadow-md z-20"
          style={{ animationDelay: "1s" }}
        >
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v2a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h8a2 2 0 012 2v2z" />
          </svg>
        </div>
      </div>

      {/* Typography */}
      <h3 className="h3 font-dynapuff text-light-100 mb-3 tracking-wider bg-clip-text">
        {title}
      </h3>
      <p className="body-1 text-light-200 max-w-[400px] mb-5">{description}</p>

      {/* Action / Upload Button */}
      <div className="relative z-30">
        <FileUploader className="h-12 px-8 rounded-3xl bg-linear-to-r from-[#ff6b6b] to-[#ff8e7e] font-medium text-white shadow-drop-1 transition-all duration-300 hover:scale-105 hover:from-[#ff6464] hover:to-[#ff8674] cursor-pointer font-dynapuff" />
      </div>
    </div>
  );
};

export default EmptyState;
