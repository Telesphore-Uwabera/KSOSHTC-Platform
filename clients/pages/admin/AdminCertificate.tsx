import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Certificate } from "@/components/Certificate";
import { getApiBase } from "@/lib/apiBase";
import { Loader2, Printer, Plus, History, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminCertificate() {
  const [formData, setFormData] = useState({
    learnerName: "",
    courses: "",
    dateIssued: format(new Date(), "yyyy-MM-dd"),
    duration: "3 months",
    email: "ksoshtc@gmail.com",
  });
  const [isPreview, setIsPreview] = useState(false);
  const [generatedCert, setGeneratedCert] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ["certificates"],
    queryFn: async () => {
      const res = await fetch(`${getApiBase()}/api/certificates`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_session_token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch certificates");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`${getApiBase()}/api/certificates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_session_token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create certificate");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success("Certificate generated successfully!");
      setGeneratedCert(data);
      setIsPreview(true);
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handlePrint = () => {
    const printContent = document.getElementById("certificate-print-area");
    if (!printContent) return;

    const originalContents = document.body.innerHTML;
    const printArea = printContent.outerHTML;

    document.body.innerHTML = `
      <html>
        <head>
          <title>Certificate - ${generatedCert?.learnerName}</title>
          <style>
            @media print {
              @page { size: landscape; margin: 0; }
              body { margin: 0; padding: 0; }
              #certificate-print-area { transform: scale(1); border: none; }
            }
          </style>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${printArea}
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => {
                window.location.reload();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (isPreview && generatedCert) {
    return (
      <div className="p-8 space-y-6 flex flex-col items-center">
        <div className="flex justify-between w-full max-w-[1122px]">
          <h2 className="text-2xl font-bold">Certificate Preview</h2>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => setIsPreview(false)}>
              Back to Form
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print Certificate
            </Button>
          </div>
        </div>
        
        <div className="bg-gray-100 p-8 rounded-xl shadow-inner border w-full overflow-auto">
          <Certificate data={generatedCert} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Certificate Management</h1>
          <p className="text-muted-foreground">Generate and manage training certificates.</p>
        </div>
        <Button onClick={() => setGeneratedCert(null)}>
           <Plus className="mr-2 h-4 w-4" /> New Certificate
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Form */}
        <Card className="lg:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Generate Certificate</CardTitle>
            <CardDescription>Fill in the learner details below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="learnerName">Learner Full Name</Label>
                <Input 
                  id="learnerName" 
                  placeholder="e.g. Mr. Ephrem HAKUZIMANA"
                  required
                  value={formData.learnerName}
                  onChange={(e) => setFormData({...formData, learnerName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courses">Courses Completed</Label>
                <Select 
                  value={formData.courses} 
                  onValueChange={(value) => setFormData({...formData, courses: value})}
                >
                  <SelectTrigger id="courses">
                    <SelectValue placeholder="Select a course types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MINING Workplaces">OSH in Mining</SelectItem>
                    <SelectItem value="CONSTRUCTION Workplaces">OSH in Construction</SelectItem>
                    <SelectItem value="INDUSTRIAL Safety">OSH in Industrial Safety</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateIssued">Date</Label>
                <Input 
                  id="dateIssued" 
                  type="date"
                  required
                  value={formData.dateIssued}
                  onChange={(e) => setFormData({...formData, dateIssued: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input 
                  id="duration" 
                  placeholder="e.g. 3 months"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Institute Email</Label>
                <Input 
                  id="email" 
                  value={formData.email}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Generate & Preview"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List of Certificates */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="mr-2 h-5 w-5" /> Issued Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cert ID</TableHead>
                    <TableHead>Learner</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates?.map((cert: any) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-mono text-xs">{cert.certificateId}</TableCell>
                      <TableCell className="font-medium">{cert.learnerName}</TableCell>
                      <TableCell className="text-xs">{cert.courses}</TableCell>
                      <TableCell>{format(new Date(cert.dateIssued), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setGeneratedCert(cert);
                            setIsPreview(true);
                          }}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {certificates?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No certificates issued yet.
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
