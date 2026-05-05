import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Pencil, X, Check, LogOut } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";

const API = import.meta.env.VITE_API_URL;

// shape of profile data from API
interface Profile {
  name: string;
  email: string;
  role: string;
  date_of_birth: string | null;
  gender: string | null;
}

// which fields can be edited
type EditableField = "name" | "date_of_birth" | "gender";

export default function Settings() {
  const navigate = useNavigate();

  // profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // editing state — which field is currently being edited
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  // temp value while editing
  const [editValue, setEditValue] = useState("");

  // fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${API}/api/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setProfile(data.profile);
        } else {
          toast.error("Failed to load profile");
        }
      } catch {
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // start editing a field
  function startEdit(field: EditableField) {
    setEditingField(field);
    // pre-fill with current value
    const currentValue = profile?.[field] ?? "";
    setEditValue(currentValue);
  }

  // cancel editing
  function cancelEdit() {
    setEditingField(null);
    setEditValue("");
  }

  // save a single field
  async function saveField() {
    if (!editingField) return;

    try {
      const res = await fetch(`${API}/api/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ field: editingField, value: editValue }),
      });

      if (res.ok) {
        // update local state
        setProfile((prev) =>
          prev ? { ...prev, [editingField]: editValue } : prev,
        );
        toast.success("Profile updated");
        setEditingField(null);
        setEditValue("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
      }
    } catch {
      toast.error("Network error");
    }
  }

  // logout handler
  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  // format date for display
  function formatDate(dateStr: string | null) {
    if (!dateStr) return "Not set";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">Could not load profile</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Tabs defaultValue="profile">
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="flex-1">
            Profile
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">
            Settings
          </TabsTrigger>
        </TabsList>

        {/* ===== PROFILE TAB ===== */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email — read only */}
              <ProfileRow label="Email" value={profile.email} />

              {/* Role — read only */}
              <ProfileRow label="Role" value={profile.role || "patient"} />

              {/* Name — editable */}
              {editingField === "name" ? (
                <EditRow label="Name" onSave={saveField} onCancel={cancelEdit}>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                  />
                </EditRow>
              ) : (
                <ProfileRow
                  label="Name"
                  value={profile.name}
                  onEdit={() => startEdit("name")}
                />
              )}

              {/* Date of Birth — editable with calendar */}
              {editingField === "date_of_birth" ? (
                <EditRow
                  label="Date of Birth"
                  onSave={saveField}
                  onCancel={cancelEdit}
                >
                  <Calendar
                    mode="single"
                    selected={editValue ? new Date(editValue) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        // store as YYYY-MM-DD
                        const yyyy = date.getFullYear();
                        const mm = String(date.getMonth() + 1).padStart(2, "0");
                        const dd = String(date.getDate()).padStart(2, "0");
                        setEditValue(`${yyyy}-${mm}-${dd}`);
                      }
                    }}
                    captionLayout="dropdown"
                    startMonth={new Date(1930, 0)}
                    endMonth={new Date()}
                    className="rounded-md border"
                  />
                </EditRow>
              ) : (
                <ProfileRow
                  label="Date of Birth"
                  value={formatDate(profile.date_of_birth)}
                  onEdit={() => startEdit("date_of_birth")}
                />
              )}

              {/* Gender — editable with select */}
              {editingField === "gender" ? (
                <EditRow
                  label="Gender"
                  onSave={saveField}
                  onCancel={cancelEdit}
                >
                  <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </EditRow>
              ) : (
                <ProfileRow
                  label="Gender"
                  value={profile.gender || "Not set"}
                  onEdit={() => startEdit("gender")}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== SETTINGS TAB ===== */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Helper components ---

// displays a read-only row with optional edit button
function ProfileRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

// wraps an editing field with save/cancel buttons
function EditRow({
  label,
  children,
  onSave,
  onCancel,
}: {
  label: string;
  children: React.ReactNode;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="py-2 border-b last:border-b-0 space-y-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave}>
          <Check className="w-3 h-3 mr-1" />
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
