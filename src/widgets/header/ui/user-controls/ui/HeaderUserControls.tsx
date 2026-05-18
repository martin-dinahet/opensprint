"use client";

import { LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSignOut } from "@/features/auth";
import { authClient } from "@/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared";
import { Button } from "@/shared";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared";
import { getInitials } from "../lib";

export const HeaderUserControls = () => {
  const router = useRouter();
  const session = authClient.useSession();
  const signOut = useSignOut();
  const user = session.data?.user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full" />}>
        <Avatar className="size-8">
          {user?.image && <AvatarImage src={user.image} alt={user.name || user.email || "User"} />}
          <AvatarFallback>{getInitials(user)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/account")}>
            <SettingsIcon />
            Account settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/account")}>
            <UserIcon />
            Profile
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {signOut.error && <p className="px-1.5 py-1 text-destructive text-xs">{signOut.error}</p>}
          <DropdownMenuItem variant="destructive" onClick={signOut.action} disabled={signOut.pending}>
            <LogOutIcon />
            {signOut.pending ? "Signing out..." : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
