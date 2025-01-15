import React, { useState, useEffect } from "react";

export default function Profile({ w, profileData, setProfileData }) {
  const [loading, setLoading] = useState(true);

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
      <div className="dark:text-black text-white flex items-center justify-center py-4 h-[calc(100vh-<header_height>-<navbar_height>)]">
        Loading profile...
      </div>
    );
  }

  const info = profileData?.generalinformation || {};
  const qualifications = profileData?.qualification || [];

  return (
    <div className="dark:text-black text-white pt-2 pb-4 px-3 font-sans space-y-4">
      {/* Personal Information */}
      <div className="dark:bg-white bg-[#191c20] dark:border-gray-300 border-white/10 p-4 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        <div className="grid">
          <InfoRow label="Name" value={info.studentname} />
          <InfoRow label="Registration No" value={info.registrationno} />
          <InfoRow label="Date of Birth" value={info.dateofbirth} />
          <InfoRow label="Gender" value={info.gender} />
          <InfoRow label="Blood Group" value={info.bloodgroup} />
          <InfoRow label="Nationality" value={info.nationality} />
          <InfoRow label="Category" value={info.category} />
        </div>
      </div>

      {/* Academic Information */}
      <div className="dark:bg-white bg-[#191c20] dark:border-gray-300 border-white/10 p-4 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Academic Information</h2>
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

      {/* Contact Information */}
      <div className="dark:bg-white bg-[#191c20] dark:border-gray-300 border-white/10 p-4 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
        <div className="grid">
          <InfoRow label="Student Email (College)" value={info.studentemailid} />
          <InfoRow label="Student Email (Personal)" value={info.studentpersonalemailid} />
          <InfoRow label="Mobile" value={info.studentcellno} />
          <InfoRow label="Telephone" value={info.studenttelephoneno || "N/A"} />
        </div>
      </div>

      {/* Family Information */}
      <div className="dark:bg-white bg-[#191c20] dark:border-gray-300 border-white/10 p-4 rounded-lg border overflow-auto">
        <h2 className="text-xl font-semibold mb-4">Family Information</h2>
        <div className="grid gap-2">
          <InfoRow label="Father's Name" value={info.fathersname} />
          <InfoRow label="Mother's Name" value={info.mothername} />
          <InfoRow label="Parent's Email" value={info.parentemailid} />
          <InfoRow label="Parent's Mobile" value={info.parentcellno} />
          <InfoRow label="Parent's Telephone" value={info.parenttelephoneno || "N/A"} />
        </div>
      </div>

      {/* Address Information */}
      <div className="dark:bg-white bg-[#191c20] dark:border-gray-300 border-white/10 p-4 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Current Address</h2>
        <div className="grid">
          <InfoRow label="Address" value={[info.caddress1, info.caddress3].filter(Boolean).join(", ")} />
          <InfoRow label="City" value={info.ccityname} />
          <InfoRow label="District" value={info.cdistrict} />
          <InfoRow label="State" value={info.cstatename} />
          <InfoRow label="Postal Code" value={info.cpostalcode} />
        </div>
      </div>

      {/* Permanent Address */}
      <div className="dark:bg-white bg-[#191c20] dark:border-gray-300 border-white/10 p-4 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Permanent Address</h2>
        <div className="grid">
          <InfoRow label="Address" value={[info.paddress1, info.paddress2, info.paddress3].filter(Boolean).join(", ")} />
          <InfoRow label="City" value={info.pcityname} />
          <InfoRow label="District" value={info.pdistrict} />
          <InfoRow label="State" value={info.pstatename} />
          <InfoRow label="Postal Code" value={info.ppostalcode} />
        </div>
      </div>

      {/* Educational Qualifications */}
      <div className="dark:bg-white bg-[#191c20] dark:border-gray-300 border-white/10 p-4 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Educational Qualifications</h2>
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
      <div className="text-center bg-[#191c20] dark:bg-white p-4 overflow-auto max-sm:text-sm text-lg">
        Made with Big 🍆 Energy by <a href="https://github.com/codeblech" className="text-blue-600 dark:text-blue-400">Yash Malik</a>
      </div>
    </div>
  );
}

// Helper component for consistent info display
function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between py-1">
      <span className="text-gray-600 dark:text-gray-400">{label}:</span>
      <span className="font-medium">{value || "N/A"}</span>
    </div>
  );
}