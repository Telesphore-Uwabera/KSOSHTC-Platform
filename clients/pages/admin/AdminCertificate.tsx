import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Certificate } from "@/components/Certificate";
import { getApiBase } from "@/lib/apiBase";
import { Loader2, Printer, Plus, History, Trash2, Edit2, Mail } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminFetch } from "@/lib/adminApi";

export default function AdminCertificate() {
  const [formData, setFormData] = useState({
    title: "Mr.",
    learnerName: "",
    courses: "",
    dateIssued: format(new Date(), "yyyy-MM-dd"),
    duration: "3 months",
    email: "",
    totalHours: 120,
    averageScore: 90,
    gpa: "3.60",
    transcript: [] as any[],
  });
  const [isPreview, setIsPreview] = useState(false);
  const [generatedCert, setGeneratedCert] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ["certificates"],
    queryFn: async () => {
      const res = await adminFetch(`${getApiBase()}/api/certificates`);
      if (!res.ok) throw new Error("Failed to fetch certificates");
      return res.json();
    },
  });

  const { data: nextIdData } = useQuery({
    queryKey: ["nextId", formData.dateIssued.split('-')[0]],
    queryFn: async () => {
      const year = formData.dateIssued.split('-')[0];
      const res = await adminFetch(`${getApiBase()}/api/certificates/next-id?year=${year}`);
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await adminFetch(`${getApiBase()}/api/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create certificate" }));
        throw new Error(err.error || "Failed to create certificate");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success("Certificate generated successfully!");
      setGeneratedCert(data);
      setIsPreview(true);
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await adminFetch(`${getApiBase()}/api/certificates/${currentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update certificate");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Certificate updated successfully!");
      setIsEditing(false);
      setCurrentId(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await adminFetch(`${getApiBase()}/api/certificates/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete certificate");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Certificate deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await adminFetch(`${getApiBase()}/api/certificates/${id}/send-email`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to send email" }));
        throw new Error(err.error || "Failed to send email");
      }
      return res.json();
    },
    onSuccess: (data) => toast.success(data.message),
    onError: (error) => toast.error(error.message),
  });

  const resetForm = () => {
    setFormData({
      title: "Mr.",
      learnerName: "",
      courses: "",
      dateIssued: format(new Date(), "yyyy-MM-dd"),
      duration: "3 months",
      email: "",
      totalHours: 120,
      averageScore: 90,
      gpa: "3.60",
      transcript: [],
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  const updateTranscriptItem = (idx: number, field: string, value: any) => {
    const newT = [...formData.transcript];
    if (newT.length === 0 || !newT[idx]) return;
    
    newT[idx][field] = value;
    
    let totalHrs = 0;
    let totalScorePoints = 0;
    let totalGradePoints = 0;
    
    newT.forEach((item: any) => {
      const h = Number(item.hours) || 0;
      const sSrc = item.score;
      
      if (sSrc !== "" && sSrc !== null && sSrc !== undefined) {
        const s = Number(sSrc);
        totalHrs += h;
        totalScorePoints += (s * h);

        // Direct proportional GPA (100% = 4.0, 95% = 3.8...)
        let gp = (s / 100) * 4.0;
        totalGradePoints += (gp * h);
      }
    });

    let newAvg = formData.averageScore;
    let newGpa = formData.gpa;
    let newTotalHrs = formData.totalHours;

    if (totalHrs > 0) {
       newTotalHrs = totalHrs;
       newAvg = Math.round(totalScorePoints / totalHrs);
       newGpa = (totalGradePoints / totalHrs).toFixed(2);
    }

    setFormData(prev => ({
      ...prev,
      transcript: newT,
      totalHours: newTotalHrs,
      averageScore: newAvg,
      gpa: newGpa
    }));
  };


  const handleImportCurriculum = async () => {
    if (!formData.courses) {
      toast.error("Please select a course first");
      return;
    }
    
    try {
      // Find course slug
      const title = formData.courses.toLowerCase();
      let slug = "";
      if (title.includes("construction")) slug = "construction";
      else if (title.includes("industrial")) slug = "industrial-safety";
      else if (title.includes("mining")) slug = "mining";
      else slug = "safety-management";

      const res = await fetch(`${getApiBase()}/api/course-content/courses/${slug}/modules`);
      const data = await res.json();
      
      const newItems: any[] = [];

      if (data.modules) {
        for (const m of data.modules) {
          const lRes = await fetch(`${getApiBase()}/api/course-content/courses/${slug}/modules/${m.id}/lessons`);
          const lData = await lRes.json();
          if (lData.lessons) {
            lData.lessons.forEach((l: any) => {
              newItems.push({ title: l.title, score: "", date: formData.dateIssued, hours: 6.0, note: "" });
            });
          }
        }
        
        // Also add core safety items
        if (slug !== "safety-management") {
          const genRes = await fetch(`${getApiBase()}/api/course-content/courses/safety-management/modules`);
          const genData = await genRes.json();
          if (genData.modules) {
            for (const m of genData.modules) {
              const lRes = await fetch(`${getApiBase()}/api/course-content/courses/safety-management/modules/${m.id}/lessons`);
              const lData = await lRes.json();
              if (lData.lessons) {
                lData.lessons.forEach((l: any) => {
                  newItems.push({ title: l.title, score: "", date: formData.dateIssued, hours: 6.0, note: "" });
                });
              }
            }
          }
        }

        setFormData(prev => ({ ...prev, transcript: newItems }));
        toast.success("Lessons imported. Please add scores manually.");
      }
    } catch (e) {
      toast.error("Failed to import lessons");
    }
  };

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
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
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
        <Button onClick={() => { setGeneratedCert(null); resetForm(); }}>
           <Plus className="mr-2 h-4 w-4" /> New Certificate
        </Button>
      </div>

      <div className="flex flex-col gap-8">
        {/* Creation Form */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Generate Certificate</CardTitle>
            <CardDescription>Fill in the learner details below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1 space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Select 
                    value={formData.title} 
                    onValueChange={(value) => setFormData({...formData, title: value})}
                  >
                    <SelectTrigger id="title">
                      <SelectValue placeholder="Title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr.">Mr.</SelectItem>
                      <SelectItem value="Mrs.">Mrs.</SelectItem>
                      <SelectItem value="Miss.">Miss.</SelectItem>
                      <SelectItem value="Dr.">Dr.</SelectItem>
                      <SelectItem value="Prof.">Prof.</SelectItem>
                      <SelectItem value="Sir.">Sir.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor="learnerName">Learner Full Name</Label>
                  <Input 
                    id="learnerName" 
                    placeholder="Ephrem HAKUZIMANA"
                    required
                    value={formData.learnerName}
                    onChange={(e) => setFormData({...formData, learnerName: e.target.value})}
                  />
                </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateIssued">Date of Issuance</Label>
                  <Input 
                    id="dateIssued" 
                    type="date"
                    required
                    value={formData.dateIssued}
                    onChange={(e) => setFormData({...formData, dateIssued: e.target.value})}
                  />
                </div>
                {!isEditing && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Generated ID (Expected)</Label>
                    <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted font-mono text-sm flex items-center">
                      {nextIdData?.nextId || "..."}
                    </div>
                  </div>
                )}
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
                <Label htmlFor="email">Student Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="student@example.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                   <h3 className="font-bold text-gray-900">Academic Transcript</h3>
                   <Button type="button" variant="outline" size="sm" onClick={handleImportCurriculum}>
                     Import from Modules
                   </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Total Hours</Label>
                    <Input 
                      type="number"
                      value={formData.totalHours} 
                      className="bg-gray-100 font-bold"
                      readOnly
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Average Score (%)</Label>
                    <Input 
                      type="number"
                      value={formData.averageScore} 
                      className="bg-gray-100 font-bold"
                      readOnly
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">GPA</Label>
                    <Input 
                      value={formData.gpa} 
                      className="bg-gray-100 font-bold"
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Course Details (for scanner to see)</Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {formData.transcript.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:items-center bg-white p-2 sm:p-3 rounded border group relative">
                        <div className="md:col-span-4">
                          <Input 
                            placeholder="Course Title" 
                            className="text-xs h-8" 

                            value={item.title}
                            onChange={(e) => updateTranscriptItem(idx, "title", e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Input 
                            type="number" 
                            placeholder="Score (%)" 
                            className="text-xs h-8" 
                            value={item.score}
                            onChange={(e) => updateTranscriptItem(idx, "score", e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-3">
                          <Input 
                            type="date" 
                            className="text-xs h-8" 
                            value={item.date}
                            onChange={(e) => updateTranscriptItem(idx, "date", e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Input 
                            type="number" 
                            placeholder="Hrs" 
                            className="text-xs h-8" 
                            value={item.hours}
                            onChange={(e) => updateTranscriptItem(idx, "hours", e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500"
                            onClick={() => {
                              const newT = formData.transcript.filter((_, i) => i !== idx);
                              setFormData({...formData, transcript: newT});
                              // Quick calculation reset when a row is removed
                              setTimeout(() => { updateTranscriptItem(0, "hours", newT[0]?.hours || 0); }, 50);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="w-full border-dashed border-2 h-9 text-gray-500 hover:text-primary hover:border-primary"
                    onClick={() => setFormData({
                      ...formData, 
                      transcript: [...formData.transcript, { title: "", score: 100, date: formData.dateIssued, hours: 6.0 }]
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Course to Transcript
                  </Button>
                </div>
              </div>

<div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : isEditing ? (
                    "Update Certificate"
                  ) : (
                    "Generate & Preview"
                  )}
                </Button>
                {isEditing && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List of Certificates */}
        <Card>
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
              <div className="overflow-x-auto w-full">
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
                        <TableCell className="font-medium">{cert.title} {cert.learnerName}</TableCell>
                        <TableCell className="text-xs">{cert.courses}</TableCell>
                        <TableCell>{format(new Date(cert.dateIssued), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="Preview/Print"
                              onClick={() => {
                                setGeneratedCert(cert);
                                setIsPreview(true);
                              }}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="Edit"
                              onClick={() => {
                                setIsEditing(true);
                                setCurrentId(cert.id);
                                setFormData({
                                  title: cert.title || "Mr.",
                                  learnerName: cert.learnerName,
                                  courses: cert.courses,
                                  dateIssued: format(new Date(cert.dateIssued), "yyyy-MM-dd"),
                                  duration: cert.duration,
                                  email: cert.email,
                                  totalHours: cert.totalHours || 120,
                                  averageScore: cert.averageScore || 90,
                                  gpa: cert.gpa || "3.60",
                                  transcript: cert.transcript || [],
                                });
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="Delete"
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this certificate record?")) {
                                  deleteMutation.mutate(cert.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="Send Congratulations Email"
                              disabled={sendEmailMutation.isPending}
                              onClick={() => {
                                if (window.confirm(`Send professional congratulatory email to ${cert.email}?`)) {
                                  sendEmailMutation.mutate(cert.id);
                                }
                              }}
                            >
                              {sendEmailMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 text-green-600" />}
                            </Button>
                          </div>
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
