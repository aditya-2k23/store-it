import { SignIn } from "@clerk/nextjs";
import React from "react";

const SignInPage = () => (
  <div className="flex w-full items-center justify-center px-6 py-10">
    <SignIn />
  </div>
);

export default SignInPage;
