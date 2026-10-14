import { useState } from "react";
import { useListAdminNotifications, useCreateNotification, useDeleteNotification } from "@workspace/api-client-react";
import { CreateNotificationRequestTargetType } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Bell, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function NotificationsManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<CreateNotificationRequestTargetType>("ALL");

  const { data: notifications, isLoading } = useListAdminNotifications();

  const createMut = useCreateNotification();
  const deleteMut = useDeleteNotification();

  const handleCreate = () => {
    if (!title || !message) {
      toast({ variant: "destructive", title: "Error", description: "Title and message are required." });
      return;
    }
    
    createMut.mutate({ 
      data: { title, message, targetType } 
    }, {
      onSuccess: () => {
        toast({ title: "Notification Sent" });
        setTitle("");
        setMessage("");
        queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/notifications"] });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Failed to send", description: err.message });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this notification?")) {
      deleteMut.mutate({ notificationId: id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/notifications"] });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Announcements</h2>
        <p className="text-muted-foreground mt-1">Broadcast messages to students.</p>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        <Card className="md:col-span-4 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Send className="w-5 h-5" /> New Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Audience</label>
              <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Students</SelectItem>
                  {/* Group/Individual selection could be added here if needed */}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input placeholder="System Maintenance" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea className="h-32" placeholder="Write your announcement here..." value={message} onChange={e => setMessage(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleCreate} disabled={createMut.isPending}>
              {createMut.isPending ? "Sending..." : "Broadcast"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Message History</CardTitle>
            <CardDescription>Previously sent announcements.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Message</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications?.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        <p className="font-medium">{n.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{n.message}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline">{n.targetType}</Badge></TableCell>
                      <TableCell>{new Date(n.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(n.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!notifications || notifications.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No notifications sent yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
