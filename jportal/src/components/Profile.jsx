import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
	Image,
	UserRound,
	GraduationCap,
	IdCard,
	Mail,
	BookOpen,
	Users,
	Calendar,
	CheckCircle,
} from "lucide-react";

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
	const profileImg = hasProfilePhoto
		? `data:image/jpeg;base64,${photoData}`
		: null;

	// Helper function to get initials from name
	const getInitials = (name) => {
		if (!name) return "U";
		const nameParts = name.trim().split(/\s+/);
		if (nameParts.length === 1) {
			// Single name - take first 2 letters
			return nameParts[0].substring(0, 2).toUpperCase();
		}
		// Multiple names - take first letter of first and last name
		const firstName = nameParts[0];
		const lastName = nameParts[nameParts.length - 1];
		return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
	};

	const initials = getInitials(info.studentname);

	// Fees Helpers
	const formatCurrency = (amount) => {
		if (amount === null || amount === undefined) return "N/A";
		const num = parseFloat(amount);
		if (isNaN(num)) return "N/A";
		return `₹${num.toLocaleString("en-IN", {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		})}`;
	};

	const finesArray = feesData.fines || [];
	const summaryData = feesData.summary || {};
	const feeHeads = summaryData.feeHeads || [];

	const totalFines = finesArray.reduce((sum, fine) => {
		return (
			sum + (parseFloat(fine.charge) || parseFloat(fine.feeamounttobepaid) || 0)
		);
	}, 0);

	const totalFeeAmount = feeHeads.reduce(
		(sum, head) => sum + (parseFloat(head.feeamount) || 0),
		0
	);
	const totalReceived = feeHeads.reduce(
		(sum, head) => sum + (parseFloat(head.receiveamount) || 0),
		0
	);
	const totalDue = feeHeads.reduce(
		(sum, head) => sum + (parseFloat(head.dueamount) || 0),
		0
	);
	const totalRefund = feeHeads.reduce(
		(sum, head) => sum + (parseFloat(head.refundamount) || 0),
		0
	);
	const advanceAmount = summaryData.advanceamount?.[0]?.amount || 0;

	return (
		<div className="text-foreground pt-2 pb-4 px-3 font-sans space-y-4">
			{/* Profile Header Card */}
			<div className="w-full bg-card rounded-lg border shadow-lg p-4 relative">
				{hasProfilePhoto && (
					<button
						type="button"
						className="absolute top-3 right-3 inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-sm focus:outline-none hover:bg-primary/90 transition-colors"
						onClick={() => setShowProfilePhoto((p) => !p)}
						title={showProfilePhoto ? "Show Avatar" : "Show Photo"}
						aria-label={showProfilePhoto ? "Show Avatar" : "Show Photo"}
					>
						{showProfilePhoto ? <UserRound size={16} /> : <Image size={16} />}
					</button>
				)}

				<div className="flex gap-4">
					{/* Avatar */}
					<div className="flex-shrink-0">
						{showProfilePhoto && hasProfilePhoto ? (
							<img
								src={profileImg}
								alt="Profile"
								className="w-20 h-20 rounded-full object-cover shadow-md"
							/>
						) : (
							<div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
								<span className="text-2xl font-bold">{initials}</span>
							</div>
						)}
					</div>

					{/* Info */}
					<div className="flex-1 min-w-0">
						<h1 className="text-xl font-bold text-foreground mb-2 tracking-wide">
							{info.studentname || "N/A"}
						</h1>

						<div className="space-y-1.5 text-sm">
							<div className="flex items-center gap-2 text-muted-foreground">
								<GraduationCap size={16} className="flex-shrink-0" />
								<span className="font-medium">{info.programcode || "N/A"}</span>
								<IdCard size={16} className="flex-shrink-0 ml-2" />
								<span className="font-medium">
									{info.registrationno || "N/A"}
								</span>
							</div>

							<div className="flex items-center gap-2 text-muted-foreground">
								<Mail size={16} className="flex-shrink-0" />
								<span className="font-medium truncate">
									{info.studentemailid || "N/A"}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Bottom Row: Semester, Section, Batch */}
				<div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-sm">
					<div className="flex items-center gap-1.5">
						<BookOpen size={16} className="text-muted-foreground" />
						<span className="text-muted-foreground">Sem:</span>
						<span className="font-semibold text-foreground">
							{info.semester || "N/A"}
						</span>
					</div>

					<div className="flex items-center gap-1.5">
						<Users size={16} className="text-muted-foreground" />
						<span className="text-muted-foreground">Sec:</span>
						<span className="font-semibold text-foreground">
							{info.sectioncode || "N/A"}
						</span>
					</div>

					<div className="flex items-center gap-1.5">
						<Calendar size={16} className="text-muted-foreground" />
						<span className="text-muted-foreground">Batch:</span>
						<span className="font-semibold text-foreground">
							{info.batch || "N/A"}
						</span>
					</div>
				</div>
			</div>

			{/* Tabs Bar (mobile) */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full px-1"
			>
				<TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-background gap-2 sm:gap-3 mb-2 h-auto">
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
					<TabsTrigger
						value="fines"
						className="cursor-pointer text-muted-foreground bg-background data-[state=active]:bg-muted data-[state=active]:text-foreground px-2 py-2 text-xs sm:text-sm font-medium rounded-md"
					>
						Fines
					</TabsTrigger>
					<TabsTrigger
						value="fees"
						className="cursor-pointer text-muted-foreground bg-background data-[state=active]:bg-muted data-[state=active]:text-foreground px-2 py-2 text-xs sm:text-sm font-medium rounded-md"
					>
						Fees
					</TabsTrigger>
				</TabsList>

				{/* Personal Information */}
				<TabsContent value="personal" className="mt-3 space-y-4">
					<div className="bg-card p-4 rounded-lg border shadow-lg">
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
					<div className="bg-card p-4 rounded-lg border shadow-lg">
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
					<div className="bg-card p-4 rounded-lg border shadow-lg">
						<h2 className="text-xl font-semibold mb-3">Contact Information</h2>
						<div className="grid">
							<InfoRow
								label="Student Email (College)"
								value={info.studentemailid}
							/>
							<InfoRow
								label="Student Email (Personal)"
								value={info.studentpersonalemailid}
							/>
							<InfoRow label="Mobile" value={info.studentcellno} />
							<InfoRow
								label="Telephone"
								value={info.studenttelephoneno || "N/A"}
							/>
						</div>
					</div>

					<div className="bg-card p-4 rounded-lg shadow-lg overflow-auto">
						<h2 className="text-md font-semibold mb-3">Family Information</h2>
						<div className="grid gap-2">
							<InfoRow label="Father's Name" value={info.fathersname} />
							<InfoRow label="Mother's Name" value={info.mothername} />
							<InfoRow label="Parent's Email" value={info.parentemailid} />
							<InfoRow label="Parent's Mobile" value={info.parentcellno} />
							<InfoRow
								label="Parent's Telephone"
								value={info.parenttelephoneno || "N/A"}
							/>
						</div>
					</div>

					<div className="bg-card p-4 rounded-lg border shadow-lg">
						<h2 className="text-md font-semibold mb-3">Current Address</h2>
						<div className="grid">
							<InfoRow
								label="Address"
								value={[info.caddress1, info.caddress3]
									.filter(Boolean)
									.join(", ")}
							/>
							<InfoRow label="City" value={info.ccityname} />
							<InfoRow label="District" value={info.cdistrict} />
							<InfoRow label="State" value={info.cstatename} />
							<InfoRow label="Postal Code" value={info.cpostalcode} />
						</div>
					</div>

					<div className="bg-card p-4 rounded-lg border shadow-lg">
						<h2 className="text-md font-semibold mb-3">Permanent Address</h2>
						<div className="grid">
							<InfoRow
								label="Address"
								value={[info.paddress1, info.paddress2, info.paddress3]
									.filter(Boolean)
									.join(", ")}
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
					<div className="bg-card p-4 rounded-lg border shadow-lg">
						<h2 className="text-md font-semibold mb-3">
							Educational Qualifications
						</h2>
						{qualifications.map((qual, index) => (
							<div key={index} className="grid">
								<InfoRow label="Qualification" value={qual.qualificationcode} />
								<InfoRow label="Board" value={qual.boardname} />
								<InfoRow label="Year of Passing" value={qual.yearofpassing} />
								<InfoRow
									label="Marks Obtained"
									value={`${qual.obtainedmarks}/${qual.fullmarks}`}
								/>
								<InfoRow
									label="Percentage"
									value={`${qual.percentagemarks}%`}
								/>
								<InfoRow label="Division" value={qual.division} />
								{qual.grade && <InfoRow label="Grade" value={qual.grade} />}
							</div>
						))}
					</div>
				</TabsContent>

				{/* Pending Fines */}
				<TabsContent value="fines" className="mt-3 space-y-4">
					{feesLoading ? (
						<div className="text-center py-8">Loading fines data...</div>
					) : finesArray.length > 0 ? (
						<>
							<div className="bg-card p-4 rounded-lg border shadow-lg border-l-4 border-l-orange-500">
								<div className="flex justify-between items-center">
									<span className="font-semibold text-lg">Total Pending</span>
									<span className="font-bold text-xl text-orange-600">
										{formatCurrency(totalFines)}
									</span>
								</div>
							</div>
							{finesArray.map((fine, index) => (
								<div
									key={index}
									className="bg-card p-4 rounded-lg border shadow-lg"
								>
									<h3 className="font-semibold text-md mb-2">
										{fine.servicename || "Charge"}
									</h3>
									<div className="grid">
										<InfoRow
											label="Amount"
											value={formatCurrency(
												fine.charge || fine.feeamounttobepaid
											)}
										/>
										<InfoRow
											label="Remarks"
											value={fine.remarksbyauthority || "None"}
										/>
										{fine.quantity && (
											<InfoRow label="Quantity" value={fine.quantity} />
										)}
										{fine.remarksbystudents && (
											<InfoRow
												label="Student Info"
												value={fine.remarksbystudents}
											/>
										)}
									</div>
								</div>
							))}
						</>
					) : (
						<div className="bg-card p-8 rounded-lg border shadow-lg text-center">
							<CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
							<h3 className="font-semibold text-lg">No Pending Fines</h3>
							<p className="text-muted-foreground mt-1">
								You are all caught up!
							</p>
						</div>
					)}
				</TabsContent>

				{/* Fees Summary */}
				<TabsContent value="fees" className="mt-3 space-y-4">
					{feesLoading ? (
						<div className="text-center py-8">Loading fees data...</div>
					) : (
						<>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div className="bg-card p-4 rounded-lg border shadow-lg border-l-4 border-l-blue-500">
									<div className="text-muted-foreground text-sm font-medium">
										Total Fee
									</div>
									<div className="text-xl font-bold mt-1">
										{formatCurrency(totalFeeAmount)}
									</div>
								</div>
								<div className="bg-card p-4 rounded-lg border shadow-lg border-l-4 border-l-green-500">
									<div className="text-muted-foreground text-sm font-medium">
										Total Received
									</div>
									<div className="text-xl font-bold mt-1 text-green-600">
										{formatCurrency(totalReceived)}
									</div>
								</div>
								<div className="bg-card p-4 rounded-lg border shadow-lg border-l-4 border-l-red-500">
									<div className="text-muted-foreground text-sm font-medium">
										Total Due
									</div>
									<div className="text-xl font-bold mt-1 text-red-600">
										{formatCurrency(totalDue)}
									</div>
								</div>
								{(advanceAmount > 0 || totalRefund > 0) && (
									<div className="bg-card p-4 rounded-lg border shadow-lg border-l-4 border-l-purple-500">
										<div className="text-muted-foreground text-sm font-medium">
											{advanceAmount > 0 ? "Advance" : "Refund"}
										</div>
										<div className="text-xl font-bold mt-1 text-purple-600">
											{formatCurrency(
												advanceAmount > 0 ? advanceAmount : totalRefund
											)}
										</div>
									</div>
								)}
							</div>

							{feeHeads.length > 0 && (
								<div className="mt-4">
									<h3 className="font-semibold text-lg mb-3 px-1">
										Fee Breakdown
									</h3>
									<div className="space-y-3">
										{feeHeads.map((head, idx) => (
											<div
												key={idx}
												className="bg-card p-4 rounded-lg border shadow-lg"
											>
												<div className="flex justify-between items-start mb-2">
													<div>
														<div className="font-semibold">
															{head.stynumber
																? `Semester ${head.stynumber}`
																: "N/A"}
														</div>
														<div className="text-xs text-muted-foreground">
															{head.academicyear}
														</div>
													</div>
													<div className="text-xs bg-muted px-2 py-1 rounded">
														{head.stytypedesc || "Regular"}
													</div>
												</div>
												<div className="grid">
													<InfoRow
														label="Fee"
														value={formatCurrency(head.feeamount)}
													/>
													<InfoRow
														label="Received"
														value={formatCurrency(head.receiveamount)}
													/>
													<InfoRow
														label="Due"
														value={formatCurrency(head.dueamount)}
													/>
													{parseFloat(head.refundamount) > 0 && (
														<InfoRow
															label="Refund"
															value={formatCurrency(head.refundamount)}
														/>
													)}
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</>
					)}
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
			<span className="text-base font-medium text-muted-foreground tracking-wide">
				{label}:
			</span>
			<span className="text-base font-semibold text-foreground ml-4 text-right">
				{value || "N/A"}
			</span>
		</div>
	);
}
