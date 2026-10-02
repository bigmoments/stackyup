"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Shield,
  Plus,
  Trash2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Lock,
} from "lucide-react";
import { useDialog } from "@/components/ui/CustomDialog";

export interface AdminUserItem {
  id: string;
  email: string;
  role: string;
  createdAt: Date | string;
}

interface UsersClientProps {
  initialAdmins: AdminUserItem[];
  currentUserEmail: string;
}

export default function UsersClient({
  initialAdmins,
  currentUserEmail,
}: UsersClientProps) {
  const router = useRouter();
  const dialog = useDialog();
  const [admins, setAdmins] = useState<AdminUserItem[]>(initialAdmins);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);

  // Add Form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("admin");

  // Change Password Form
  const [changePasswordInput, setChangePasswordInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail.trim(),
          password: newPassword.trim(),
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create admin");

      setAdmins((prev) => [...prev, data.data.admin]);
      setSuccess("New administrator created successfully!");
      setIsAddModalOpen(false);
      setNewEmail("");
      setNewPassword("");
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser || !changePasswordInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser.id,
          newPassword: changePasswordInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to update password");

      setSuccess(`Password for ${selectedUser.email} updated successfully!`);
      setIsPasswordModalOpen(false);
      setChangePasswordInput("");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(adm: AdminUserItem) {
    if (adm.email === currentUserEmail) {
      dialog.error(
        "Tidak Dapat Menghapus",
        "Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk."
      );
      return;
    }

    const ok = await dialog.dangerConfirm(
      `Cabut Akses Admin "${adm.email}"?`,
      "Pengguna ini tidak akan dapat lagi masuk ke dashboard manajemen sistem blog.",
      "Ya, Cabut Akses"
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/users?id=${adm.id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        setAdmins((prev) => prev.filter((a) => a.id !== adm.id));
        setSuccess(`Removed ${adm.email}.`);
        setTimeout(() => setSuccess(null), 3000);
        router.refresh();
      } else {
        dialog.error("Gagal Menghapus", data.error?.message || "Gagal menghapus pengguna admin.");
      }
    } catch (err: any) {
      dialog.error("Gagal Menghapus", err.message || "Gagal menghubungi server.");
    }
  }

  return (
    <div className="space-y-6 font-sans max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block mb-1">
            Access Control
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101313]">
            Users & Roles ({admins.length})
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Manage administrator and editorial credentials for the StackYup workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#079653] hover:bg-[#068046] text-white font-semibold text-xs transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Admin User</span>
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-[#EAF8F0] border border-[#c1e8d0] text-[#079653] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E6EBE8] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E6EBE8] text-[11px] font-bold uppercase tracking-wider text-[#667085] bg-[#FAFCFB]">
                <th className="py-3 px-5">User</th>
                <th className="py-3 px-5">Role</th>
                <th className="py-3 px-5">Registered Date</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EBE8]">
              {admins.map((adm) => {
                const isCurrent = adm.email.toLowerCase() === currentUserEmail.toLowerCase();
                return (
                  <tr key={adm.id} className="hover:bg-[#F8FAF9] transition">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#101313] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {adm.email[0]?.toUpperCase() || "A"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#101313]">
                              {adm.email.split("@")[0]}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] bg-[#EAF8F0] text-[#079653] px-1.5 py-0.2 rounded-md font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#667085] font-mono block">
                            {adm.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF8F0] text-[#079653]">
                        <Shield className="w-3 h-3" />
                        <span className="capitalize">{adm.role}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#8a9099]">
                      {new Date(adm.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(adm);
                            setError(null);
                            setChangePasswordInput("");
                            setIsPasswordModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-[#E6EBE8] hover:border-[#079653] text-[#101313] hover:text-[#079653] text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Reset Password</span>
                        </button>

                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleDelete(adm)}
                            className="p-1.5 rounded-lg text-[#8a9099] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E6EBE8] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E6EBE8] flex items-center justify-between bg-[#FAFCFB]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#079653]" />
                <h3 className="font-bold text-sm text-[#101313]">Add Administrator</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="editor@stackyup.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">
                  Initial Password (min 6 chars) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                >
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="editor">Editor (Publishing Only)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-[#E6EBE8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E6EBE8] text-xs font-semibold text-[#667085] hover:bg-[#F8FAF9] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#079653] hover:bg-[#068046] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{loading ? "Creating..." : "Create User"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E6EBE8] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E6EBE8] flex items-center justify-between bg-[#FAFCFB]">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#079653]" />
                <h3 className="font-bold text-sm text-[#101313]">
                  Reset Password for {selectedUser.email}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1.5 rounded-lg text-[#667085] hover:text-[#101313] hover:bg-[#F0F3F1] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#101313] mb-1">
                  New Password (min 6 chars) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={changePasswordInput}
                  onChange={(e) => setChangePasswordInput(e.target.value)}
                  placeholder="Enter new secure password..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF9] border border-[#E6EBE8] text-xs text-[#101313] focus:outline-none focus:border-[#079653]"
                />
              </div>

              <div className="pt-4 border-t border-[#E6EBE8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E6EBE8] text-xs font-semibold text-[#667085] hover:bg-[#F8FAF9] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#079653] hover:bg-[#068046] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? "Updating..." : "Update Password"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
