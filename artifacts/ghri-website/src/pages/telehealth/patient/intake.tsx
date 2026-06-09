import React, { useState, useEffect } from "react";
import { useTelehealthAuth } from "@/contexts/TelehealthAuthContext";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { ShieldCheck, CheckCircle2, AlertCircle, Lock } from "lucide-react";

type IntakeSection = {
  medicalHistory: { conditions: string; surgeries: string; familyHistory: string };
  allergies: { medications: string; foods: string; environmental: string };
  currentMedications: { list: string; vitamins: string };
  insuranceInfo: { provider: string; memberId: string; groupNumber: string; phone: string };
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];

export default function PatientIntake() {
  const { token } = useTelehealthAuth();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState(false);

  const [bloodType, setBloodType] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [sections, setSections] = useState<IntakeSection>({
    medicalHistory: { conditions: "", surgeries: "", familyHistory: "" },
    allergies: { medications: "", foods: "", environmental: "" },
    currentMedications: { list: "", vitamins: "" },
    insuranceInfo: { provider: "", memberId: "", groupNumber: "", phone: "" },
  });

  useEffect(() => {
    fetch("/api/telehealth/intake", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data?.id) {
          setExisting(true);
          setBloodType(data.bloodType ?? "");
          setEmergencyName(data.emergencyContactName ?? "");
          setEmergencyPhone(data.emergencyContactPhone ?? "");
          if (data.medicalHistory) setSections(prev => ({ ...prev, medicalHistory: data.medicalHistory }));
          if (data.allergies) setSections(prev => ({ ...prev, allergies: data.allergies }));
          if (data.currentMedications) setSections(prev => ({ ...prev, currentMedications: data.currentMedications }));
          if (data.insuranceInfo) setSections(prev => ({ ...prev, insuranceInfo: data.insuranceInfo }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const updateSection = <K extends keyof IntakeSection>(key: K, field: string, val: string) => {
    setSections(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/telehealth/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bloodType,
          emergencyContactName: emergencyName,
          emergencyContactPhone: emergencyPhone,
          medicalHistory: sections.medicalHistory,
          allergies: sections.allergies,
          currentMedications: sections.currentMedications,
          insuranceInfo: sections.insuranceInfo,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSubmitted(true);
    } catch {
      setError("Failed to save intake form. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { label: "Basic Info" },
    { label: "Medical History" },
    { label: "Allergies" },
    { label: "Medications" },
    { label: "Insurance" },
    { label: "Review" },
  ];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-[#0093D5] border-t-transparent rounded-full" />
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-10 pb-10">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#003F5C] mb-2">Intake Form {existing ? "Updated" : "Submitted"}</h2>
          <p className="text-muted-foreground mb-6">Your health information has been securely saved and encrypted. Your care team can now access your intake information.</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
            <Lock className="w-4 h-4" />
            <span>Encrypted with AES-256-GCM</span>
          </div>
          <Link href="/telehealth/patient/dashboard">
            <Button className="bg-[#0093D5] hover:bg-[#007ab8]">Back to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-[#0093D5] mb-3">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-medium">HIPAA-Compliant & Encrypted</span>
          </div>
          <h1 className="text-3xl font-bold text-[#003F5C]">Patient Health Intake Form</h1>
          <p className="text-muted-foreground mt-2">Your information is encrypted end-to-end and protected under HIPAA</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 mb-8">
          {steps.map((s, i) => (
            <React.Fragment key={s.label}>
              <div
                className={`flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${i <= step ? "text-[#0093D5]" : "text-muted-foreground"}`}
                onClick={() => i <= step && setStep(i)}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < step ? "bg-[#0093D5] text-white" : i === step ? "border-2 border-[#0093D5] text-[#0093D5]" : "border-2 border-gray-200 text-gray-400"
                }`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-[#0093D5]" : ""}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? "bg-[#0093D5]" : "bg-gray-200"}`} />}
            </React.Fragment>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6 pb-6">
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[#003F5C]">Basic Information</h2>
                <div className="space-y-1.5">
                  <Label>Blood Type</Label>
                  <select className="w-full rounded-md border border-input px-3 py-2 text-sm" value={bloodType} onChange={e => setBloodType(e.target.value)}>
                    <option value="">Select blood type</option>
                    {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Emergency Contact Name</Label>
                  <Input value={emergencyName} onChange={e => setEmergencyName(e.target.value)} placeholder="Full name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Emergency Contact Phone</Label>
                  <Input type="tel" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold text-[#003F5C]">Medical History</h2>
                  <Lock className="w-4 h-4 text-[#0093D5]" />
                </div>
                <p className="text-xs text-muted-foreground -mt-2">This section is encrypted before storage</p>
                <div className="space-y-1.5">
                  <Label>Current Medical Conditions</Label>
                  <Textarea rows={3} value={sections.medicalHistory.conditions} onChange={e => updateSection("medicalHistory", "conditions", e.target.value)} placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Previous Surgeries / Procedures</Label>
                  <Textarea rows={2} value={sections.medicalHistory.surgeries} onChange={e => updateSection("medicalHistory", "surgeries", e.target.value)} placeholder="e.g. Appendectomy (2018), Knee surgery (2020)…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Family Medical History</Label>
                  <Textarea rows={2} value={sections.medicalHistory.familyHistory} onChange={e => updateSection("medicalHistory", "familyHistory", e.target.value)} placeholder="e.g. Heart disease (father), Breast cancer (maternal aunt)…" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold text-[#003F5C]">Allergies</h2>
                  <Lock className="w-4 h-4 text-[#0093D5]" />
                </div>
                <p className="text-xs text-muted-foreground -mt-2">This section is encrypted before storage</p>
                <div className="space-y-1.5">
                  <Label>Medication Allergies</Label>
                  <Textarea rows={2} value={sections.allergies.medications} onChange={e => updateSection("allergies", "medications", e.target.value)} placeholder="e.g. Penicillin (hives), Sulfa drugs…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Food Allergies</Label>
                  <Textarea rows={2} value={sections.allergies.foods} onChange={e => updateSection("allergies", "foods", e.target.value)} placeholder="e.g. Peanuts, Shellfish, Gluten…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Environmental Allergies</Label>
                  <Textarea rows={2} value={sections.allergies.environmental} onChange={e => updateSection("allergies", "environmental", e.target.value)} placeholder="e.g. Pollen, Dust mites, Latex…" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold text-[#003F5C]">Current Medications</h2>
                  <Lock className="w-4 h-4 text-[#0093D5]" />
                </div>
                <p className="text-xs text-muted-foreground -mt-2">This section is encrypted before storage</p>
                <div className="space-y-1.5">
                  <Label>Prescription Medications</Label>
                  <Textarea rows={3} value={sections.currentMedications.list} onChange={e => updateSection("currentMedications", "list", e.target.value)} placeholder="List medication name, dosage, and frequency. e.g. Metformin 500mg twice daily…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Vitamins, Supplements & OTC Medications</Label>
                  <Textarea rows={2} value={sections.currentMedications.vitamins} onChange={e => updateSection("currentMedications", "vitamins", e.target.value)} placeholder="e.g. Vitamin D 2000IU daily, Fish oil, Aspirin 81mg…" />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold text-[#003F5C]">Insurance Information</h2>
                  <Lock className="w-4 h-4 text-[#0093D5]" />
                </div>
                <p className="text-xs text-muted-foreground -mt-2">This section is encrypted before storage</p>
                <div className="space-y-1.5">
                  <Label>Insurance Provider</Label>
                  <Input value={sections.insuranceInfo.provider} onChange={e => updateSection("insuranceInfo", "provider", e.target.value)} placeholder="e.g. Blue Cross Blue Shield" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Member ID</Label>
                    <Input value={sections.insuranceInfo.memberId} onChange={e => updateSection("insuranceInfo", "memberId", e.target.value)} placeholder="Member ID" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Group Number</Label>
                    <Input value={sections.insuranceInfo.groupNumber} onChange={e => updateSection("insuranceInfo", "groupNumber", e.target.value)} placeholder="Group number" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Insurance Phone Number</Label>
                  <Input type="tel" value={sections.insuranceInfo.phone} onChange={e => updateSection("insuranceInfo", "phone", e.target.value)} placeholder="Member services number" />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[#003F5C]">Review & Submit</h2>
                <div className="rounded-lg bg-[#0093D5]/5 border border-[#0093D5]/20 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#0093D5] flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-[#003F5C]">HIPAA Privacy Notice</p>
                      <p className="text-muted-foreground mt-1">Your health information is protected under HIPAA. Sensitive sections (medical history, allergies, medications, insurance) are encrypted using AES-256-GCM before storage. Only authorized GHRI healthcare providers can access this information.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b"><span className="text-muted-foreground">Blood Type</span><span className="font-medium text-[#003F5C]">{bloodType || "Not provided"}</span></div>
                  <div className="flex justify-between py-1.5 border-b"><span className="text-muted-foreground">Emergency Contact</span><span className="font-medium text-[#003F5C]">{emergencyName || "Not provided"}</span></div>
                  <div className="flex justify-between py-1.5 border-b"><span className="text-muted-foreground">Medical History</span><span className="font-medium text-green-600">🔒 Encrypted</span></div>
                  <div className="flex justify-between py-1.5 border-b"><span className="text-muted-foreground">Allergies</span><span className="font-medium text-green-600">🔒 Encrypted</span></div>
                  <div className="flex justify-between py-1.5 border-b"><span className="text-muted-foreground">Medications</span><span className="font-medium text-green-600">🔒 Encrypted</span></div>
                  <div className="flex justify-between py-1.5"><span className="text-muted-foreground">Insurance Info</span><span className="font-medium text-green-600">🔒 Encrypted</span></div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                  </div>
                )}
              </div>
            )}

            {/* Nav buttons */}
            <div className="flex justify-between mt-8">
              {step > 0 ? (
                <Button variant="outline" onClick={() => setStep(s => s - 1)}>← Previous</Button>
              ) : (
                <Link href="/telehealth/patient/dashboard">
                  <Button variant="outline">← Dashboard</Button>
                </Link>
              )}
              {step < steps.length - 1 ? (
                <Button onClick={() => setStep(s => s + 1)} className="bg-[#0093D5] hover:bg-[#007ab8]">
                  Next →
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  {saving ? "Saving…" : existing ? "Update Intake Form" : "Submit Intake Form"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
