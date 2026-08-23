import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { authApi, uploadsApi, getApiErrorMessage } from "../api/endpoints";
import { useAuthStore } from "../stores/authStore";
import { Seo } from "../components/Seo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatar, setAvatar] = useState<{ url: string; publicId?: string } | null>(
    user?.avatar ?? null,
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const profileMutation = useMutation({
    mutationFn: () =>
      authApi.updateProfile({
        bio,
        avatarUrl: avatar?.url ?? null,
        avatarPublicId: avatar?.publicId,
      }),
    onSuccess: (res) => {
      setUser(res.data.data.user);
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadsApi.image(file, "avatars"),
    onSuccess: (res) =>
      setAvatar({ url: res.data.data.url, publicId: res.data.data.publicId }),
    onError: (err) => toast.error(getApiErrorMessage(err, "Upload failed")),
  });

  const passwordMutation = useMutation({
    mutationFn: () => authApi.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (!user) return null;

  return (
    <>
      <Seo title="Settings" pathname="/settings" noIndex />
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Settings</h1>

      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {avatar?.url ? <AvatarImage src={avatar.url} /> : null}
                <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <label className="cursor-pointer text-sm text-accent hover:underline">
                {uploadMutation.isPending ? (
                  <Loader2 className="inline h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="mr-1 inline h-4 w-4" /> Change avatar
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadMutation.mutate(file);
                  }}
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community about yourself…"
                maxLength={400}
              />
            </div>
            <Button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}>
              Save profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Current password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                placeholder="At least 8 characters"
              />
            </div>
            <Button
              variant="secondary"
              disabled={
                !currentPassword ||
                newPassword.length < 8 ||
                passwordMutation.isPending
              }
              onClick={() => passwordMutation.mutate()}
            >
              Update password
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
