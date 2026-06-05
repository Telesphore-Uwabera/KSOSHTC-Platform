import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, UploadCloud, File as FileIcon, X } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getApiBase } from "@/lib/apiBase";
import { Checkbox } from "@/components/ui/checkbox";
import { ALLOWED_UPLOAD_EXTENSIONS, FILE_INPUT_ACCEPT_ATTR } from "@shared/allowedUploads";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const formSchema = z.object({
  names: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Phone number is required"),
  courses: z.array(z.string()).min(1, "Select at least one course"),
});

type FormValues = z.infer<typeof formSchema>;

const COURSES_OFFERED = [
  "OSH IN INDUSTRIES",
  "OSH IN CONSTRUCTION", // fixed typo from user prompt
  "OSH IN MINING",
  "REFRESHER TRAINING",
  "SAFETY AWARENESS",
];

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

export default function TrainingRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regFile, setRegFile] = useState<File | null>(null);
  const [tuitionFile, setTuitionFile] = useState<File | null>(null);
  const [degreeFiles, setDegreeFiles] = useState<File[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      names: "",
      email: "",
      phone: "",
      courses: [],
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!regFile) {
      toast.error("Please upload your registration fee receipt.");
      return;
    }
    if (degreeFiles.length === 0) {
      toast.error("Please upload at least one file for your highest degree.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        ...data,
      };

      if (regFile) {
        payload.registrationFeeReceipt = {
          filename: regFile.name,
          contentBase64: await fileToBase64(regFile),
        };
      }
      if (tuitionFile) {
        payload.tuitionFeeReceipt = {
          filename: tuitionFile.name,
          contentBase64: await fileToBase64(tuitionFile),
        };
      }
      if (degreeFiles.length > 0) {
        payload.highestDegrees = await Promise.all(
          degreeFiles.map(async (f) => ({
            filename: f.name,
            contentBase64: await fileToBase64(f),
          }))
        );
      }

      const res = await fetch(getApiBase() + "/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit registration");
      }

      toast.success("Registration submitted successfully!");
      form.reset();
      setRegFile(null);
      setTuitionFile(null);
      setDegreeFiles([]);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (f: File | null) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File ${file.name} is too large (max 10MB)`);
      return;
    }
    setter(file);
  };

  const handleDegreeFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (degreeFiles.length + files.length > 5) {
      toast.error("You can only upload up to 5 files for your degree.");
      return;
    }
    const validFiles = files.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`File ${f.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });
    setDegreeFiles((prev) => [...prev, ...validFiles].slice(0, 5));
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      <Header />
      <div className="h-28 sm:h-32" aria-hidden="true" />
      
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-4">Welcome to KSOSHTC Registration</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Welcome to the Kigali Safety OSH Training Center. Please fill out the form below to register for our comprehensive Occupational Health and Safety training courses.
            </p>
          </div>

          <div className="bg-green-50 text-green-900 p-6 rounded-2xl mb-10 border border-green-100">
            <h3 className="font-semibold text-lg mb-3">Training we offer:</h3>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              {COURSES_OFFERED.map((course, idx) => (
                <li key={idx} className="font-medium">{course}</li>
              ))}
            </ol>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Full Names *</label>
                <input
                  type="text"
                  {...form.register("names")}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="Emmanuel NIYOBUHUNGIRO"
                />
                {form.formState.errors.names && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.names.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Email Address *</label>
                <input
                  type="email"
                  {...form.register("email")}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="ksoshtc@gmail.com"
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Telephone *</label>
                <input
                  type="tel"
                  {...form.register("phone")}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="0785072512"
                />
                {form.formState.errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <label className="text-base font-semibold text-gray-900 block mb-2">Choose the course or more *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COURSES_OFFERED.map((course) => (
                  <div key={course} className="flex items-center space-x-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <Checkbox
                      id={`course-${course}`}
                      checked={form.watch("courses").includes(course)}
                      onCheckedChange={(checked) => {
                        const current = form.watch("courses");
                        if (checked) {
                          form.setValue("courses", [...current, course], { shouldValidate: true });
                        } else {
                          form.setValue("courses", current.filter((c) => c !== course), { shouldValidate: true });
                        }
                      }}
                    />
                    <label
                      htmlFor={`course-${course}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {course}
                    </label>
                  </div>
                ))}
              </div>
              {form.formState.errors.courses && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.courses.message}</p>
              )}
            </div>

            {/* Registration Fee */}
            <div className="bg-green-50 rounded-2xl p-6 border border-green-200 shadow-sm">
              <h3 className="font-bold text-green-900 mb-2 uppercase text-sm tracking-wider">Registration Fees</h3>
              <div className="text-sm text-gray-700 mb-4 space-y-1">
                <p className="font-semibold text-lg text-primary">10,000 RWF</p>
                <p>Account no: <strong>4025201372795</strong> (EQUITY BANK)</p>
                <p>Account Name: <strong>KIGALI SAFETY OSH TRAINING CENTER</strong></p>
                <p>Or use Telephone: <strong>TEL: 0785072512</strong></p>
                <p>Names: <strong>Emmanuel NIYOBUHUNGIRO</strong>.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Upload Receipt or Message Screenshots *</label>
                <p className="text-xs text-gray-500 mb-2">Upload 1 supported file: PDF, document, or image. Max 10 MB.</p>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <UploadCloud className="w-4 h-4" />
                    Add file
                    <input
                      type="file"
                      className="hidden"
                      accept={FILE_INPUT_ACCEPT_ATTR}
                      onChange={(e) => handleFileChange(e, setRegFile)}
                    />
                  </label>
                  {regFile && (
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <FileIcon className="w-4 h-4 text-primary" /> {regFile.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tuition Fee */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2 uppercase text-sm tracking-wider">Tuition Fees</h3>
              <div className="text-sm text-gray-700 mb-4 space-y-1">
                <p className="font-semibold text-lg text-primary">200,000 RWF</p>
                <p>Account no: <strong>4025201372795</strong> (EQUITY BANK)</p>
                <p>Names: <strong>KIGALI SAFETY OSH TRAINING CENTER</strong>.</p>
                <p className="text-blue-700 font-medium mt-2 bg-blue-50 p-2 rounded-lg inline-block border border-blue-100">
                  N.B: You can pay all amount, all pay by Installments, or Pay Gradually.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Upload The Receipt That shows your Payment (Optional)</label>
                <p className="text-xs text-gray-500 mb-2">Upload 1 supported file: PDF, document, or image. Max 10 MB.</p>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <UploadCloud className="w-4 h-4" />
                    Add file
                    <input
                      type="file"
                      className="hidden"
                      accept={FILE_INPUT_ACCEPT_ATTR}
                      onChange={(e) => handleFileChange(e, setTuitionFile)}
                    />
                  </label>
                  {tuitionFile && (
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <FileIcon className="w-4 h-4 text-primary" /> {tuitionFile.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Highest Degree */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2 uppercase text-sm tracking-wider">Highest Degree *</h3>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Upload your Highest Degree</label>
                <p className="text-xs text-gray-500 mb-2">Upload up to 5 supported files: PDF, document, or image. Max 10 MB per file.</p>
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-3">
                    <UploadCloud className="w-4 h-4" />
                    Add file
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept={FILE_INPUT_ACCEPT_ATTR}
                      onChange={handleDegreeFiles}
                    />
                  </label>
                  {degreeFiles.length > 0 && (
                    <ul className="space-y-2">
                      {degreeFiles.map((file, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-100">
                          <span className="flex items-center gap-2 truncate">
                            <FileIcon className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setDegreeFiles(prev => prev.filter((_, idx) => idx !== i))}
                            className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Submitting Registration...
                </>
              ) : (
                "Submit Registration"
              )}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
