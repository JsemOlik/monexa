"use client";

import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="flex justify-end items-center p-4 gap-4 h-16">
      {/* Show the sign-in and sign-up buttons when the user is signed out */}
      <Unauthenticated>
        <SignInButton />
        <SignUpButton>
          <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
            Sign Up
          </button>
        </SignUpButton>
      </Unauthenticated>
      {/* Show the user button when the user is signed in */}
      <Authenticated>
        <button>
          <Link href={"/dashboard"}>Dashboard</Link>
        </button>
        <UserButton />
      </Authenticated>
    </header>
  );
}
