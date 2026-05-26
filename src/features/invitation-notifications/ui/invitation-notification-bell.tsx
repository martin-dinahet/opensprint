"use client";

import { BellIcon, CheckIcon, InboxIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import {
  type InvitationOutput,
  useAcceptInvitation,
  useDeclineInvitation,
  useUserInvitations,
} from "@/entities/invitation";
import {
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Separator,
  Spinner,
} from "@/shared";

export function InvitationNotificationBell() {
  const { data: invitations = [], isLoading } = useUserInvitations();
  const acceptInvitation = useAcceptInvitation();
  const declineInvitation = useDeclineInvitation();
  const count = invitations.length;

  const accept = async (invitation: InvitationOutput) => {
    const result = await acceptInvitation.mutateAsync(invitation.id);
    toast.success(`Joined ${invitation.project?.name ?? "project"}`);
    return result;
  };

  const decline = async (invitation: InvitationOutput) => {
    await declineInvitation.mutateAsync(invitation.id);
    toast.success(`Declined ${invitation.project?.name ?? "project"} invite`);
  };

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="icon-sm" className="relative" />}>
        <BellIcon />
        <span className="sr-only">Notifications</span>
        {count > 0 ? (
          <Badge className="-right-1 -top-1 absolute h-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none">
            {count > 9 ? "9+" : count}
          </Badge>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-none border-2 p-0">
        <PopoverHeader className="gap-1 p-3">
          <PopoverTitle>Notifications</PopoverTitle>
          <p className="text-muted-foreground text-xs">
            {count > 0 ? `${count} project invitation${count === 1 ? "" : "s"}` : "No pending invitations"}
          </p>
        </PopoverHeader>
        <Separator />
        {isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <Spinner />
          </div>
        ) : invitations.length === 0 ? (
          <Empty className="border-0 p-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <InboxIcon />
              </EmptyMedia>
              <EmptyTitle>All clear</EmptyTitle>
              <EmptyDescription>Project invitations will appear here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex max-h-96 flex-col overflow-y-auto">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex flex-col gap-3 border-border border-b p-3 last:border-b-0">
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{invitation.project?.name ?? "Project invite"}</p>
                  <p className="truncate text-muted-foreground text-xs">
                    {invitation.inviter.name || invitation.inviter.email} invited you as {invitation.role}
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Expires{" "}
                    {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(invitation.expiresAt))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    onClick={() => accept(invitation)}
                    disabled={acceptInvitation.isPending || declineInvitation.isPending}
                  >
                    <CheckIcon data-icon="inline-start" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => decline(invitation)}
                    disabled={acceptInvitation.isPending || declineInvitation.isPending}
                  >
                    <XIcon data-icon="inline-start" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
