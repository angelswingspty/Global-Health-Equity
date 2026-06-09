import React, { useState } from "react";
import { format } from "date-fns";
import { FileText, Image as ImageIcon, FileCheck, Upload, Trash2, Download } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ProtectedTelehealthRoute } from "@/components/telehealth/ProtectedTelehealthRoute";
import { useTelehealthAuth } from "@/contexts/TelehealthAuthContext";
import { useGetDocuments, useUploadDocument, getGetDocumentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const uploadSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  documentType: z.enum(["lab_result", "imaging", "referral", "insurance", "consent", "other"]),
  fileSizeBytes: z.coerce.number().optional(),
});

export default function PatientDocuments() {
  const { token } = useTelehealthAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  const { data: documents, isLoading } = useGetDocuments({
    query: { enabled: !!token, queryKey: ["getDocuments"] },
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const uploadMutation = useUploadDocument({
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      filename: "",
      documentType: "other",
      fileSizeBytes: 1024000, // Dummy size
    },
  });

  const onSubmit = (values: z.infer<typeof uploadSchema>) => {
    uploadMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({ title: "Document uploaded successfully" });
          setIsUploadOpen(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: getGetDocumentsQueryKey() });
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Upload failed",
            description: err.response?.data?.error || "An error occurred",
          });
        }
      }
    );
  };

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'imaging': return <ImageIcon className="w-8 h-8 text-indigo-500" />;
      case 'consent':
      case 'insurance': return <FileCheck className="w-8 h-8 text-green-500" />;
      default: return <FileText className="w-8 h-8 text-blue-500" />;
    }
  };

  const formatDocType = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <ProtectedTelehealthRoute allowedRoles={["patient"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
              <FileText className="w-8 h-8 mr-3 text-primary" />
              Medical Documents
            </h1>
            <p className="text-slate-500 mt-1">Access your lab results, imaging, and uploaded files.</p>
          </div>
          
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Upload className="w-4 h-4 mr-2" /> Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Upload Medical Document</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="filename"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Blood Test Results - Oct 2023" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lab_result">Lab Result</SelectItem>
                            <SelectItem value="imaging">Imaging (X-Ray, MRI, etc)</SelectItem>
                            <SelectItem value="referral">Referral Letter</SelectItem>
                            <SelectItem value="insurance">Insurance Info</SelectItem>
                            <SelectItem value="consent">Consent Form</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 text-slate-500 cursor-not-allowed">
                    <Upload className="w-8 h-8 mb-2 text-slate-400" />
                    <p className="text-sm font-medium">Click to browse or drag file here</p>
                    <p className="text-xs mt-1">PDF, JPG, PNG up to 10MB</p>
                    <p className="text-[10px] mt-2 italic text-red-500">*File upload is simulated in this demo</p>
                  </div>

                  <Button type="submit" className="w-full" disabled={uploadMutation.isPending}>
                    {uploadMutation.isPending ? "Uploading..." : "Save Document"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading documents...</div>
        ) : !documents || documents.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No documents found</h3>
            <p className="max-w-sm mx-auto">Upload your past medical records, lab results, or imaging files to share them securely with your providers.</p>
            <Button className="mt-6" variant="outline" onClick={() => setIsUploadOpen(true)}>
              Upload First Document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(doc => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow overflow-hidden group">
                <CardContent className="p-0">
                  <div className="p-5 flex items-start gap-4 border-b bg-slate-50/50">
                    <div className="p-2 bg-white rounded-lg shadow-sm border shrink-0">
                      {getDocIcon(doc.documentType)}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-semibold text-slate-900 truncate" title={doc.filename}>{doc.filename}</h3>
                      <Badge variant="secondary" className="mt-1 text-xs font-normal bg-slate-200 text-slate-700">
                        {formatDocType(doc.documentType)}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 bg-white">
                    <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
                      <span>Added {format(new Date(doc.createdAt), "MMM d, yyyy")}</span>
                      <span>{doc.fileSizeBytes ? `${Math.round(doc.fileSizeBytes / 1024)} KB` : '--'}</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-4">
                      By: {doc.uploaderName || "Unknown"}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="w-full text-primary hover:text-primary">
                        <Download className="w-4 h-4 mr-2" /> View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedTelehealthRoute>
  );
}