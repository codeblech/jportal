import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Image, UserRound } from "lucide-react";


export default function Profile({ w, profileData, setProfileData }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const [showProfilePhoto, setShowProfilePhoto] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      // Return early if data is already cached
      if (profileData) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await w.get_personal_info();
        setProfileData(data);
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [w, profileData, setProfileData]);

  if (loading) {
    return (
      <div className="text-foreground flex items-center justify-center py-8 min-h-[50vh]">
        Loading profile...
      </div>
    );
  }

  const info = profileData?.generalinformation || {};
  const qualifications = profileData?.qualification || [];

  // Prepare profile/avatar image (mobile header)
  const photoData = profileData?.["photo&signature"]?.photo;
  const hasProfilePhoto = Boolean(photoData);
  const avatarImg =
    info.profileimgurl ||
    "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(info.studentname || "User") +
      "&background=0D8ABC&color=fff&size=128";
  const profileImg = hasProfilePhoto
    ? `data:image/jpeg;base64,${photoData}`
    : avatarImg;

  return (
    <div className="text-foreground pt-2 pb-4 px-3 font-sans space-y-4">
      {/* Mobile Header: Avatar + basic info */}
      <div className="w-full flex flex-col items-center pt-6 pb-2 relative">
        {hasProfilePhoto && (
          <button
            type="button"
            className="absolute top-2 right-2 inline-flex items-center justify-center h-9 w-9 rounded-full bg-primary text-primary-foreground shadow focus:outline-none"
            onClick={() => setShowProfilePhoto((p) => !p)}
            title={showProfilePhoto ? "Show Avatar" : "Show Photo"}
            aria-label={showProfilePhoto ? "Show Avatar" : "Show Photo"}
          >
            {showProfilePhoto ? <UserRound size={18} /> : <Image size={18} />}
          </button>
        )}
        <img
          src={showProfilePhoto && hasProfilePhoto ? profileImg : avatarImg}
          alt="Profile"
          className={`w-28 h-28 rounded-full object-cover shadow-md ${!showProfilePhoto || !hasProfilePhoto ? "border-4 border-primary" : ""}`}
        />
        <div className="mt-3 text-xl font-semibold text-center">
          {info.studentname || "N/A"}
        </div>
        <div className="text-sm text-muted-foreground font-medium text-center">
          {(info.registrationno || "N/A") + (info.programcode ? ` | ${info.programcode}` : "")}
          {info.branch ? ` - ${info.branch}` : ""}
        </div>
      </div>

      {/* Tabs Bar (mobile) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-1">
        <TabsList className="grid w-full grid-cols-4 bg-background gap-2 sm:gap-3 mb-2">
          <TabsTrigger
            value="personal"
            className="cursor-pointer text-muted-foreground bg-background data-[state=active]:bg-muted data-[state=active]:text-foreground px-2 py-2 text-xs sm:text-sm font-medium rounded-md"
          >
            Personal
          </TabsTrigger>
            <TabsTrigger
            value="academic"
            className="cursor-pointer text-muted-foreground bg-background data-[state=active]:bg-muted data-[state=active]:text-foreground px-2 py-2 text-xs sm:text-sm font-medium rounded-md"
          >
            Academic
          </TabsTrigger>
          <TabsTrigger
            value="contact"
            className="cursor-pointer text-muted-foreground bg-background data-[state=active]:bg-muted data-[state=active]:text-foreground px-2 py-2 text-xs sm:text-sm font-medium rounded-md"
          >
            Contact
          </TabsTrigger>
          <TabsTrigger
            value="education"
            className="cursor-pointer text-muted-foreground bg-background data-[state=active]:bg-muted data-[state=active]:text-foreground px-2 py-2 text-xs sm:text-sm font-medium rounded-md"
          >
            Education
          </TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal" className="mt-3 space-y-4">
          <div className="bg-card p-4 rounded-lg shadow-lg">
            <h2 className="text-md font-semibold mb-3">Personal Information</h2>
            <div className="grid">
              <InfoRow label="Date of Birth" value={info.dateofbirth} />
              <InfoRow label="Gender" value={info.gender} />
              <InfoRow label="Blood Group" value={info.bloodgroup} />
              <InfoRow label="Nationality" value={info.nationality} />
              <InfoRow label="Category" value={info.category} />
            </div>
          </div>
        </TabsContent>

        {/* Academic Information */}
        <TabsContent value="academic" className="mt-3 space-y-4">
          <div className="bg-card p-4 rounded-lg shadow-lg">
            <h2 className="text-md font-semibold mb-3">Academic Information</h2>
            <div className="grid">
              <InfoRow label="Program" value={info.programcode} />
              <InfoRow label="Branch" value={info.branch} />
              <InfoRow label="Section" value={info.sectioncode} />
              <InfoRow label="Batch" value={info.batch} />
              <InfoRow label="Semester" value={info.semester} />
              <InfoRow label="Institute" value={info.institutecode} />
              <InfoRow label="Academic Year" value={info.academicyear} />
              <InfoRow label="Admission Year" value={info.admissionyear} />
            </div>
          </div>
        </TabsContent>

        {/* Contact + Family + Address */}
        <TabsContent value="contact" className="mt-3 space-y-4">
          <div className="bg-card p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
            <div className="grid">
              <InfoRow label="Student Email (College)" value={info.studentemailid} />
              <InfoRow label="Student Email (Personal)" value={info.studentpersonalemailid} />
              <InfoRow label="Mobile" value={info.studentcellno} />
              <InfoRow label="Telephone" value={info.studenttelephoneno || "N/A"} />
            </div>
          </div>

          <div className="bg-card p-4 rounded-lg shadow-lg overflow-auto">
            <h2 className="text-md font-semibold mb-3">Family Information</h2>
            <div className="grid gap-2">
              <InfoRow label="Father's Name" value={info.fathersname} />
              <InfoRow label="Mother's Name" value={info.mothername} />
              <InfoRow label="Parent's Email" value={info.parentemailid} />
              <InfoRow label="Parent's Mobile" value={info.parentcellno} />
              <InfoRow label="Parent's Telephone" value={info.parenttelephoneno || "N/A"} />
            </div>
          </div>

          <div className="bg-card p-4 rounded-lg shadow-lg">
            <h2 className="text-md font-semibold mb-3">Current Address</h2>
            <div className="grid">
              <InfoRow label="Address" value={[info.caddress1, info.caddress3].filter(Boolean).join(", ")} />
              <InfoRow label="City" value={info.ccityname} />
              <InfoRow label="District" value={info.cdistrict} />
              <InfoRow label="State" value={info.cstatename} />
              <InfoRow label="Postal Code" value={info.cpostalcode} />
            </div>
          </div>

          <div className="bg-card p-4 rounded-lg shadow-lg">
            <h2 className="text-md font-semibold mb-3">Permanent Address</h2>
            <div className="grid">
              <InfoRow
                label="Address"
                value={[info.paddress1, info.paddress2, info.paddress3].filter(Boolean).join(", ")}
              />
              <InfoRow label="City" value={info.pcityname} />
              <InfoRow label="District" value={info.pdistrict} />
              <InfoRow label="State" value={info.pstatename} />
              <InfoRow label="Postal Code" value={info.ppostalcode} />
            </div>
          </div>
        </TabsContent>

        {/* Educational Qualifications */}
        <TabsContent value="education" className="mt-3 space-y-4">
          <div className="bg-card p-4 rounded-lg shadow-lg">
            <h2 className="text-md font-semibold mb-3">Educational Qualifications</h2>
            {qualifications.map((qual, index) => (
              <div key={index} className="grid">
                <InfoRow label="Qualification" value={qual.qualificationcode} />
                <InfoRow label="Board" value={qual.boardname} />
                <InfoRow label="Year of Passing" value={qual.yearofpassing} />
                <InfoRow label="Marks Obtained" value={`${qual.obtainedmarks}/${qual.fullmarks}`} />
                <InfoRow label="Percentage" value={`${qual.percentagemarks}%`} />
                <InfoRow label="Division" value={qual.division} />
                {qual.grade && <InfoRow label="Grade" value={qual.grade} />}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-center p-4 overflow-auto max-sm:text-sm text-lg">
        Made with Big 🍆 Energy by{" "}
        <a href="https://github.com/codeblech" className="text-primary">
          Yash Malik
        </a>
      </div>
    </div>
  );
}

// Helper component for consistent info display
function InfoRow({ label, value }) {
  return (
    <div className="flex flex-row justify-between items-center py-2">
      <span className="text-base font-medium text-muted-foreground tracking-wide">{label}:</span>
      <span className="text-base font-semibold text-foreground ml-4 text-right">{value || "N/A"}</span>
    </div>
  );
}