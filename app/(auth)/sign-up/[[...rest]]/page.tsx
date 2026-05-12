import { SignUp } from "@clerk/nextjs";
import React from "react";

const SignUpPage = () => (
  <div className="flex w-full items-center justify-center px-6 py-10">
    <SignUp />
  </div>
);

export default SignUpPage;
