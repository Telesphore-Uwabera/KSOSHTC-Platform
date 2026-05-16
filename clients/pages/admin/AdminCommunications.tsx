import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, UploadCloud, File as FileIcon, X, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/adminApi";
import { getApiBase } from "@/lib/apiBase";
import { ALLOWED_UPLOAD_EXTENSIONS, FILE_INPUT_ACCEPT_ATTR } from "@shared/allowedUploads";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function AdminCommunications() {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const { data: subscribersData, isLoading: isLoadingSubs } = useQuery({
    queryKey: ["admin", "subscribers"],
    queryFn: async () => {
      const res = await adminFetch(getApiBase() + "/api/subscribers");
      if (!res.ok) throw new Error("Failed to load subscribers");
      return res.json();
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const payloadFiles = await Promise.all(
        files.map(async (f) => ({
          filename: f.name,
          contentBase64: await fileToBase64(f),
        }))
      );

      const res = await adminFetch(getApiBase() + "/api/communications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          message,
          files: payloadFiles,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send communication");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || "Emails sent successfully!");
      setSubject("");
      setMessage("");
      setFiles([]);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send emails");
    },
  });

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const validFiles = selected.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`File ${f.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const subscribers = subscribersData?.subscribers || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Communications</h1>
          <p className="text-gray-600">Send updates and newsletters to your subscribers.</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100">
          <Users className="w-5 h-5" />
          <span className="font-semibold">{isLoadingSubs ? "..." : subscribers.length} Subscribers</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Compose Email</h2>
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMutation.mutate();
            }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Email subject..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message Body</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={8}
                placeholder="Type your message here... (Plain text, links will be preserved)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Multimedia & Attachments</label>
              <p className="text-xs text-gray-500 mb-3">Upload images, PDFs, or documents. Images will automatically be optimized to WebP and embedded in the email.</p>
              
              <div className="space-y-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                  <UploadCloud className="w-4 h-4" />
                  Add files
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept={FILE_INPUT_ACCEPT_ATTR}
                    onChange={handleFiles}
                  />
                </label>

                {files.length > 0 && (
                  <ul className="space-y-2">
                    {files.map((file, i) => (
                      <li key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        <span className="flex items-center gap-2 text-sm text-gray-700 truncate">
                          <FileIcon className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                          className="p-1 text-gray-400 hover:bg-white hover:text-red-500 rounded-md transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={sendMutation.isPending || subscribers.length === 0}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {sendMutation.isPending ? "Sending..." : "Send Email"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col max-h-[600px]">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Subscriber List</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {isLoadingSubs ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : subscribers.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No subscribers yet.</p>
            ) : (
              subscribers.map((sub: any, idx: number) => (
                <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate" title={sub.email}>{sub.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Subscribed: {new Date(sub.subscribedAt).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
