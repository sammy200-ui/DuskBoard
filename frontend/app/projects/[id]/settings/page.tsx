"use client";

import { AxiosError } from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import useAuthStore from "@/lib/stores/auth-store";

type ProjectRole = "ADMIN" | "PM" | "DEVELOPER" | "QA" | "VIEWER";

type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  myRole: ProjectRole;
};

type ProjectMemberView = {
  userId: string;
  name: string;
  email: string;
  role: ProjectRole;
};

const roleClassMap: Record<ProjectRole, string> = {
  ADMIN: "bg-teal-300/20 text-teal-200 border border-teal-200/30",
  PM: "bg-sky-300/20 text-sky-200 border border-sky-200/30",
  DEVELOPER: "bg-emerald-300/20 text-emerald-200 border border-emerald-200/30",
  QA: "bg-amber-300/20 text-amber-200 border border-amber-200/30",
  VIEWER: "bg-zinc-300/20 text-zinc-200 border border-zinc-200/30",
};

const roleOrder: Record<ProjectRole, number> = {
  ADMIN: 0,
  PM: 1,
  DEVELOPER: 2,
  QA: 3,
  VIEWER: 4,
};

const toMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const sortMembers = (collection: ProjectMemberView[]): ProjectMemberView[] => {
  return [...collection].sort((left, right) => {
    const roleGap = roleOrder[left.role] - roleOrder[right.role];
    if (roleGap !== 0) {
      return roleGap;
    }

    return left.name.localeCompare(right.name);
  });
};

export default function ProjectSettingsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const clearSession = useAuthStore((state) => state.clearSession);

  const projectId = typeof params.id === "string" ? params.id : "";

  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [members, setMembers] = useState<ProjectMemberView[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [didLoad, setDidLoad] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isSavingProject, setIsSavingProject] = useState(false);

  const [memberIdentifier, setMemberIdentifier] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<ProjectRole>("DEVELOPER");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberActionUserId, setMemberActionUserId] = useState<string | null>(null);

  const canManageSettings = useMemo(() => project?.myRole === "ADMIN", [project?.myRole]);

  const handleUnauthorized = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [clearSession, router]);

  const loadSettingsData = useCallback(async (): Promise<void> => {
    if (!projectId) {
      return;
    }

    setIsFetching(true);
    try {
      const [projectResponse, memberResponse] = await Promise.all([
        api.get<ProjectSummary>(`/projects/${projectId}`),
        api.get<ProjectMemberView[]>(`/projects/${projectId}/members`),
      ]);

      setProject(projectResponse.data);
      setProjectName(projectResponse.data.name);
      setProjectDescription(projectResponse.data.description ?? "");
      setMembers(sortMembers(memberResponse.data));
      setDidLoad(true);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(toMessage(error, "Unable to load project settings"));

      if (error instanceof AxiosError && error.response?.status === 404) {
        router.replace("/dashboard");
      }
    } finally {
      setIsFetching(false);
    }
  }, [projectId, handleUnauthorized, router]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!accessToken) {
      router.replace("/login");
      window.setTimeout(() => {
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
      }, 150);
    }
  }, [isHydrated, accessToken, router]);

  useEffect(() => {
    if (!isHydrated || !accessToken || !projectId) {
      return;
    }

    void loadSettingsData();
  }, [isHydrated, accessToken, projectId, loadSettingsData]);

  const handleSaveProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!projectId) {
      return;
    }

    const name = projectName.trim();
    if (name.length < 2) {
      toast.error("Project name should be at least 2 characters");
      return;
    }

    setIsSavingProject(true);
    try {
      const { data } = await api.put<ProjectSummary>(`/projects/${projectId}`, {
        name,
        description: projectDescription.trim(),
      });

      setProject(data);
      setProjectName(data.name);
      setProjectDescription(data.description ?? "");
      toast.success("Project settings updated");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(toMessage(error, "Unable to update project settings"));
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleAddMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!projectId) {
      return;
    }

    const identifier = memberIdentifier.trim();
    if (!identifier) {
      toast.error("Enter a user email or user ID");
      return;
    }

    const payload = identifier.includes("@")
      ? { email: identifier.toLowerCase(), role: newMemberRole }
      : { userId: identifier, role: newMemberRole };

    setIsAddingMember(true);
    try {
      const { data } = await api.post<ProjectMemberView>(`/projects/${projectId}/members`, payload);

      setMembers((current) => sortMembers([...current, data]));
      setMemberIdentifier("");
      setNewMemberRole("DEVELOPER");
      toast.success("Member added");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(toMessage(error, "Unable to add member"));
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleChangeMemberRole = async (targetUserId: string, role: ProjectRole) => {
    if (!projectId) {
      return;
    }

    setMemberActionUserId(targetUserId);
    try {
      const { data } = await api.put<ProjectMemberView>(`/projects/${projectId}/members/${targetUserId}`, {
        role,
      });

      setMembers((current) =>
        sortMembers(current.map((member) => (member.userId === targetUserId ? data : member))),
      );
      toast.success("Member role updated");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(toMessage(error, "Unable to update member role"));
    } finally {
      setMemberActionUserId(null);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!projectId) {
      return;
    }

    setMemberActionUserId(targetUserId);
    try {
      await api.delete(`/projects/${projectId}/members/${targetUserId}`);
      setMembers((current) => current.filter((member) => member.userId !== targetUserId));
      toast.success("Member removed");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      toast.error(toMessage(error, "Unable to remove member"));
    } finally {
      setMemberActionUserId(null);
    }
  };

  if (!isHydrated || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1725] text-zinc-200">
        <p className="text-sm tracking-wide">Checking your session...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d1728] px-4 py-5 text-zinc-100 md:px-8 md:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_24rem_at_8%_-10%,rgba(36,190,172,0.16),transparent_60%),radial-gradient(38rem_24rem_at_94%_112%,rgba(251,167,75,0.14),transparent_60%)]" />

      <div className="relative mx-auto w-full max-w-screen-2xl space-y-4">
        <header className="rounded-2xl border border-white/10 bg-[#111f31]/85 p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Project Settings</p>
              <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
                {project?.name ?? "Loading project..."}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-zinc-300">
                Manage project metadata, member roles, and team access controls.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {project ? (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleClassMap[project.myRole]}`}>
                  {project.myRole}
                </span>
              ) : null}

              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-white/20 px-3 text-sm text-zinc-200 transition hover:bg-white/10"
              >
                Dashboard
              </Link>
              <Link
                href={`/projects/${projectId}`}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-white/20 px-3 text-sm text-zinc-200 transition hover:bg-white/10"
              >
                Board
              </Link>
              <Link
                href={`/projects/${projectId}/sprints`}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-white/20 px-3 text-sm text-zinc-200 transition hover:bg-white/10"
              >
                Sprints
              </Link>
              <Button
                type="button"
                onClick={() => void loadSettingsData()}
                disabled={isFetching}
                className="h-9 rounded-lg bg-teal-400 px-3 text-sm font-semibold text-[#0f1725] hover:bg-teal-300"
              >
                {isFetching ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[1fr_1.5fr]">
          <Card className="border border-white/10 bg-[#111f31]/85 text-zinc-100">
            <CardHeader>
              <CardTitle className="text-lg text-white">Project Info</CardTitle>
              <CardDescription className="text-zinc-300">
                Update name and description for this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProject} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="project-name" className="text-zinc-200">
                    Name
                  </Label>
                  <Input
                    id="project-name"
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    className="h-9 border-white/15 bg-white/5 text-zinc-100"
                    required
                    disabled={!canManageSettings || isSavingProject}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="project-description" className="text-zinc-200">
                    Description
                  </Label>
                  <textarea
                    id="project-description"
                    value={projectDescription}
                    onChange={(event) => setProjectDescription(event.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-100 outline-none transition focus-visible:border-zinc-300"
                    disabled={!canManageSettings || isSavingProject}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!canManageSettings || isSavingProject}
                  className="h-9 rounded-lg bg-sky-400 px-4 text-sm font-semibold text-[#0f1725] hover:bg-sky-300"
                >
                  {isSavingProject ? "Saving..." : "Save project settings"}
                </Button>

                {!canManageSettings ? (
                  <p className="text-xs text-zinc-400">Only admins can modify project settings.</p>
                ) : null}
              </form>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-[#111f31]/85 text-zinc-100">
            <CardHeader>
              <CardTitle className="text-lg text-white">Members</CardTitle>
              <CardDescription className="text-zinc-300">
                Add teammates and tune role-based access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddMember} className="mb-4 grid gap-3 rounded-lg border border-white/10 bg-white/4 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="member-identifier" className="text-zinc-200">
                    User email or ID
                  </Label>
                  <Input
                    id="member-identifier"
                    value={memberIdentifier}
                    onChange={(event) => setMemberIdentifier(event.target.value)}
                    placeholder="teammate@company.com or user UUID"
                    className="h-9 border-white/15 bg-white/5 text-zinc-100"
                    disabled={!canManageSettings || isAddingMember}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-member-role" className="text-zinc-200">
                    Role
                  </Label>
                  <select
                    id="new-member-role"
                    value={newMemberRole}
                    onChange={(event) => setNewMemberRole(event.target.value as ProjectRole)}
                    disabled={!canManageSettings || isAddingMember}
                    className="h-9 rounded-lg border border-white/15 bg-[#122237] px-2.5 text-sm text-zinc-100 outline-none"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="PM">PM</option>
                    <option value="DEVELOPER">DEVELOPER</option>
                    <option value="QA">QA</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={!canManageSettings || isAddingMember}
                  className="h-9 rounded-lg bg-emerald-400 px-4 text-sm font-semibold text-[#0f1725] hover:bg-emerald-300"
                >
                  {isAddingMember ? "Adding..." : "Add member"}
                </Button>
              </form>

              {!didLoad && isFetching ? (
                <p className="text-sm text-zinc-300">Loading members...</p>
              ) : members.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/20 bg-white/5 p-4 text-sm text-zinc-300">
                  No members found for this project.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {members.map((member) => {
                    const isMe = member.userId === user?.id;
                    const isActioning = memberActionUserId === member.userId;

                    return (
                      <article key={member.userId} className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {member.name}
                              {isMe ? " (you)" : ""}
                            </p>
                            <p className="text-xs text-zinc-300">{member.email}</p>
                            <p className="mt-1 font-mono text-[11px] text-zinc-500">{member.userId}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", roleClassMap[member.role])}>
                              {member.role}
                            </span>

                            <select
                              value={member.role}
                              disabled={!canManageSettings || isActioning}
                              onChange={(event) => void handleChangeMemberRole(member.userId, event.target.value as ProjectRole)}
                              className="h-8 rounded-md border border-white/15 bg-[#122237] px-2 text-xs text-zinc-100 outline-none"
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="PM">PM</option>
                              <option value="DEVELOPER">DEVELOPER</option>
                              <option value="QA">QA</option>
                              <option value="VIEWER">VIEWER</option>
                            </select>

                            <Button
                              type="button"
                              disabled={!canManageSettings || isActioning}
                              onClick={() => void handleRemoveMember(member.userId)}
                              className="h-8 rounded-md bg-red-300 px-3 text-xs font-semibold text-[#321015] hover:bg-red-200"
                            >
                              {isActioning ? "..." : "Remove"}
                            </Button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
