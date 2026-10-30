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
  // Personal
  citizenship: z.string().min(1, "Citizenship is required"),
  names: z.string().min(2, "Name must be at least 2 characters"),
  fatherName: z.string().min(1, "Father's name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Phone number is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  courses: z.array(z.string()).min(1, "Select at least one course"),
  // Address
  addressForDispatch: z.string().optional(),
  city: z.string().optional(),
  stateProvince: z.string().optional(),
  zipPostalCode: z.string().optional(),
  country: z.string().optional(),
  // Emergency
  emergencyContact: z.string().min(1, "Emergency contact is required"),
  // Academic
  highestAcademicEducation: z.string().min(1, "Highest academic education is required"),
  professionalCertification: z.string().optional(),
  englishWriting: z.string().min(1, "Please select your English writing level"),
  // Professional info
  workExperience: z.string().optional(),
  designation: z.string().optional(),
  currentOrganization: z.string().optional(),
  currentLocation: z.string().min(1, "Current location is required"),
  exposureSafetyIndustry: z.string().optional(),
  howDidYouHear: z.string().min(1, "Please select how you heard about us"),
  referencePersonName: z.string().optional(),
  // Reasonable adjustment
  reasonableAdjustment: z.string().min(1, "Please select an option"),
  // Consent
  consent: z.boolean().refine((v) => v === true, "You must agree to the consent statement"),
});

type FormValues = z.infer<typeof formSchema>;

const COURSES_OFFERED = [
  "OSH IN CONSTRUCTION",
  "OSH IN INDUSTRIES",
  "OSH IN MINING",
  "FOOD SAFETY",
  "SAFETY MANAGEMENT",
  "SAFE LIFTING OPERATIONS",
  "FIRE SAFETY AND EGRESS",
  "ENVIRONMENTAL SOCIAL AND GOVERNANCE (ESG)",
  "FIRST AID",
  "ISO 45001: OCCUPATIONAL HEALTH AND SAFETY MANAGEMENT SYSTEM (OH&SMS)",
  "ISO 14011: ENVIRONMENTAL MANAGEMENT SYSTEM (EMS)",
  "REFRESHER TRAINING",
  "SAFETY AWARENESS",
];

const HOW_DID_YOU_HEAR_OPTIONS = [
  "Social Media (Facebook, LinkedIn, Twitter, etc.)",
  "Google Search",
  "Friend / Colleague Referral",
  "Company / Employer",
  "Advertisement",
  "Previous Participant",
  "Other",
];

const REASONABLE_ADJUSTMENT_OPTIONS = [
  "None",
  "Visual Impairment",
  "Hearing Impairment",
  "Physical / Mobility Disability",
  "Learning Disability",
  "Other",
];

const CITIZENSHIP_OPTIONS = [
  "Rwandan",
  "Burundian",
  "Congolese (DRC)",
  "Ugandan",
  "Tanzanian",
  "Kenyan",
  "Other African",
  "Other",
];

const ENGLISH_WRITING_OPTIONS = [
  "Excellent",
  "Good",
  "Average",
  "Basic",
  "None",
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

function SingleFileUpload({
  label,
  hint,
  file,
  setter,
  required,
}: {
  label: string;
  hint?: string;
  file: File | null;
  setter: (f: File | null) => void;
  required?: boolean;
}) {
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      <div className="flex items-center gap-4 flex-wrap">
        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <UploadCloud className="w-4 h-4" />
          Choose file
          <input
            type="file"
            className="hidden"
            accept={FILE_INPUT_ACCEPT_ATTR}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.size > MAX_FILE_SIZE) {
                return;
              }
              setter(f);
            }}
          />
        </label>
        {file ? (
          <span className="text-sm text-gray-600 flex items-center gap-2">
            <FileIcon className="w-4 h-4 text-primary" />
            {file.name}
            <button
              type="button"
              onClick={() => setter(null)}
              className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ) : (
          <span className="text-sm text-gray-400">No file chosen</span>
        )}
      </div>
    </div>
  );
}

export default function TrainingRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regFile, setRegFile] = useState<File | null>(null);
  const [tuitionFile, setTuitionFile] = useState<File | null>(null);
  const [degreeFiles, setDegreeFiles] = useState<File[]>([]);
  const [passportPhotoFile, setPassportPhotoFile] = useState<File | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      citizenship: "",
      names: "",
      fatherName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      courses: [],
      addressForDispatch: "",
      city: "",
      stateProvince: "",
      zipPostalCode: "",
      country: "",
      emergencyContact: "",
      highestAcademicEducation: "",
      professionalCertification: "",
      englishWriting: "",
      workExperience: "",
      designation: "",
      currentOrganization: "",
      currentLocation: "",
      exposureSafetyIndustry: "",
      howDidYouHear: "",
      referencePersonName: "",
      reasonableAdjustment: "",
      consent: false,
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
    if (!passportPhotoFile) {
      toast.error("Please upload your passport size photo.");
      return;
    }
    if (!addressProofFile) {
      toast.error("Please upload your address proof document.");
      return;
    }
    if (!idProofFile) {
      toast.error("Please upload your ID proof document.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = { ...data };

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
      if (passportPhotoFile) {
        payload.passportPhoto = {
          filename: passportPhotoFile.name,
          contentBase64: await fileToBase64(passportPhotoFile),
        };
      }
      if (addressProofFile) {
        payload.addressProof = {
          filename: addressProofFile.name,
          contentBase64: await fileToBase64(addressProofFile),
        };
      }
      if (idProofFile) {
        payload.idProof = {
          filename: idProofFile.name,
          contentBase64: await fileToBase64(idProofFile),
        };
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
      setPassportPhotoFile(null);
      setAddressProofFile(null);
      setIdProofFile(null);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: File | null) => void
  ) => {
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

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none";

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      <Header />
      <div className="h-28 sm:h-32" aria-hidden="true" />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
              Welcome to KSOSHTC Registration
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Welcome to the <strong>Kigali Safety OSH Training Center</strong>. Please fill out
              the form below to register for our comprehensive Occupational Health and Safety
              training courses.
            </p>
          </div>

          {/* Courses list */}
          <div className="bg-green-50 text-green-900 p-6 rounded-2xl mb-10 border border-green-100">
            <h3 className="font-semibold text-lg mb-3">Training we offer:</h3>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              {COURSES_OFFERED.map((course, idx) => (
                <li key={idx} className="font-medium">
                  {course}
                </li>
              ))}
            </ol>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* ── Section 1: Personal Information ── */}
            <fieldset className="space-y-6">
              <legend className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100 w-full block">
                Personal Information
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Citizenship */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Citizenship *</label>
                  <select {...form.register("citizenship")} className={inputClass + " bg-white"}>
                    <option value="">Choose...</option>
                    {CITIZENSHIP_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {form.formState.errors.citizenship && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.citizenship.message}</p>
                  )}
                </div>

                {/* Full Names */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Your Full Name *</label>
                  <input type="text" {...form.register("names")} className={inputClass} placeholder="Enter your full name" />
                  {form.formState.errors.names && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.names.message}</p>
                  )}
                </div>

                {/* Father's Name */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Father's Name *</label>
                  <input type="text" {...form.register("fatherName")} className={inputClass} placeholder="Enter your father name" />
                  {form.formState.errors.fatherName && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.fatherName.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Email Address *</label>
                  <input type="email" {...form.register("email")} className={inputClass} placeholder="example@company.com" />
                  {form.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Mobile Number *</label>
                  <input type="tel" {...form.register("phone")} className={inputClass} placeholder="enter your number here" />
                  {form.formState.errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.phone.message}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Date of Birth *</label>
                  <input type="date" {...form.register("dateOfBirth")} className={inputClass} />
                  {form.formState.errors.dateOfBirth && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.dateOfBirth.message}</p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* ── Section 2: Professional Information ── */}
            <fieldset className="space-y-6">
              <legend className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100 w-full block">
                Professional Information
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Work Experience */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Work Experience</label>
                  <input type="text" {...form.register("workExperience")} className={inputClass} placeholder="Experience in Years" />
                </div>

                {/* Designation */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Designation</label>
                  <input type="text" {...form.register("designation")} className={inputClass} placeholder="Your Designation" />
                </div>

                {/* Current Organization */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Current Organization (If Working)</label>
                  <input type="text" {...form.register("currentOrganization")} className={inputClass} placeholder="Your Organization" />
                </div>

                {/* Current Location */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Current Location *</label>
                  <input type="text" {...form.register("currentLocation")} className={inputClass} placeholder="Current Location" />
                  {form.formState.errors.currentLocation && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.currentLocation.message}</p>
                  )}
                </div>

                {/* Exposure in Safety Industry */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Exposure in Safety Industry (If Any)</label>
                  <input type="text" {...form.register("exposureSafetyIndustry")} className={inputClass} placeholder="Exposure" />
                </div>

                {/* How did you hear */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">
                    How you came to know about Kigali Safety OSH Training Center? *
                  </label>
                  <select {...form.register("howDidYouHear")} className={inputClass + " bg-white"}>
                    <option value="">Choose...</option>
                    {HOW_DID_YOU_HEAR_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {form.formState.errors.howDidYouHear && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.howDidYouHear.message}</p>
                  )}
                </div>

                {/* Reference Person Name */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Kindly mention the name of your reference</label>
                  <input type="text" {...form.register("referencePersonName")} className={inputClass} placeholder="Reference Person Name" />
                </div>
              </div>
            </fieldset>

            {/* ── Section 3: Course Selection ── */}
            <fieldset className="space-y-4">
              <legend className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100 w-full block mb-2">
                Choose Course(s) *
              </legend>
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
                    <label htmlFor={`course-${course}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1">
                      {course}
                    </label>
                  </div>
                ))}
              </div>
              {form.formState.errors.courses && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.courses.message}</p>
              )}
            </fieldset>

            {/* ── Section 4: Address for Book Dispatch ── */}
            <fieldset className="space-y-6">
              <legend className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100 w-full block">
                Address for Book Dispatch
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Address for Book Dispatch</label>
                  <textarea
                    {...form.register("addressForDispatch")}
                    rows={3}
                    className={inputClass + " resize-none"}
                    placeholder="Enter your address..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">City</label>
                  <input type="text" {...form.register("city")} className={inputClass} placeholder="Enter City Name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">State / Province</label>
                  <input type="text" {...form.register("stateProvince")} className={inputClass} placeholder="Enter State/Province Name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Zip / Postal Code</label>
                  <input type="text" {...form.register("zipPostalCode")} className={inputClass} placeholder="Enter Zip/Postal Code" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Country</label>
                  <input type="text" {...form.register("country")} className={inputClass} placeholder="Country Name" />
                </div>
              </div>
            </fieldset>

            {/* ── Section 4b: Emergency & Academic Information ── */}
            <fieldset className="space-y-6">
              <legend className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100 w-full block">
                Emergency &amp; Academic Information
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Emergency Contact */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Emergency Contact No (Family Member) *</label>
                  <input type="tel" {...form.register("emergencyContact")} className={inputClass} placeholder="enter your emergency contact number" />
                  {form.formState.errors.emergencyContact && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.emergencyContact.message}</p>
                  )}
                </div>

                {/* Highest Academic Education */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Highest Academic Education *</label>
                  <input type="text" {...form.register("highestAcademicEducation")} className={inputClass} placeholder="Name of Highest Education" />
                  {form.formState.errors.highestAcademicEducation && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.highestAcademicEducation.message}</p>
                  )}
                </div>

                {/* Professional Certification */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Professional Certification if any</label>
                  <input type="text" {...form.register("professionalCertification")} className={inputClass} placeholder="Certification Name" />
                </div>

                {/* English Writing */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">English Writing *</label>
                  <select {...form.register("englishWriting")} className={inputClass + " bg-white"}>
                    <option value="">Choose...</option>
                    {ENGLISH_WRITING_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {form.formState.errors.englishWriting && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.englishWriting.message}</p>
                  )}
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-6">
              <legend className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100 w-full block">
                Document Uploads
              </legend>

              {/* Passport Photo */}
              <SingleFileUpload
                label="Upload file (Passport size Photo)"
                hint="Upload 1 supported file: PDF, document, or image. Max 10 MB."
                file={passportPhotoFile}
                setter={setPassportPhotoFile}
                required
              />

              {/* Address Proof */}
              <SingleFileUpload
                label="Upload file (Address Proof: Aadhar card, Passport, Voter Id, Driving License as Govt Identity for Proof) Any one in Color Copy"
                hint="Upload 1 supported file: PDF, document, or image. Max 10 MB."
                file={addressProofFile}
                setter={setAddressProofFile}
                required
              />

              {/* ID Proof */}
              <SingleFileUpload
                label="Upload file (ID Proof: Aadhar card, Passport, Voter Id, Driving License) Any one in Color Copy"
                hint="Upload 1 supported file: PDF, document, or image. Max 10 MB."
                file={idProofFile}
                setter={setIdProofFile}
                required
              />

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
                      <input type="file" multiple className="hidden" accept={FILE_INPUT_ACCEPT_ATTR} onChange={handleDegreeFiles} />
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
            </fieldset>

            {/* ── Section 6: Registration Fee ── */}
            <div className="bg-green-50 rounded-2xl p-6 border border-green-200 shadow-sm">
              <h3 className="font-bold text-green-900 mb-2 uppercase text-sm tracking-wider">Registration Fees</h3>
              <div className="text-sm text-gray-700 mb-4 space-y-1">
                <p className="font-semibold text-lg text-primary">10,000 RWF</p>
                <p>Account no: <strong>4025201372795</strong> (EQUITY BANK)</p>
                <p>Account Name: <strong>KIGALI SAFETY OSH TRAINING CENTER</strong></p>
                <p>Or use USSD: <strong>*182*1*2*4025201372795#</strong> and follow the instructions</p>
                <p>Names: <strong>Kigali Safety OSH Training Center</strong>.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Upload Receipt or Message Screenshots *</label>
                <p className="text-xs text-gray-500 mb-2">Upload 1 supported file: PDF, document, or image. Max 10 MB.</p>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <UploadCloud className="w-4 h-4" />
                    Add file
                    <input type="file" className="hidden" accept={FILE_INPUT_ACCEPT_ATTR} onChange={(e) => handleFileChange(e, setRegFile)} />
                  </label>
                  {regFile && (
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <FileIcon className="w-4 h-4 text-primary" /> {regFile.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Section 7: Tuition Fee ── */}
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
                    <input type="file" className="hidden" accept={FILE_INPUT_ACCEPT_ATTR} onChange={(e) => handleFileChange(e, setTuitionFile)} />
                  </label>
                  {tuitionFile && (
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <FileIcon className="w-4 h-4 text-primary" /> {tuitionFile.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Section 8: Reasonable Adjustment ── */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Reasonable Adjustment (Physical Disability) *
              </label>
              <select {...form.register("reasonableAdjustment")} className={inputClass + " bg-white"}>
                <option value="">Choose...</option>
                {REASONABLE_ADJUSTMENT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {form.formState.errors.reasonableAdjustment && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.reasonableAdjustment.message}</p>
              )}
            </div>

            {/* ── Section 9: Consent ── */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>Consent:</strong> Yes! all the above given information and credentials can be shared to accredited body for the purpose of selected course or qualification enrollment and Examination Enrollment.
              </p>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="consent"
                  checked={form.watch("consent")}
                  onCheckedChange={(checked) => {
                    form.setValue("consent", checked === true, { shouldValidate: true });
                  }}
                />
                <label htmlFor="consent" className="text-sm font-semibold text-gray-800 cursor-pointer">
                  Yes, I Agree <span className="text-red-500">*</span>
                </label>
              </div>
              {form.formState.errors.consent && (
                <p className="text-red-500 text-xs">{form.formState.errors.consent.message}</p>
              )}
            </div>

            {/* ── Submit ── */}
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
                "Submit"
              )}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
