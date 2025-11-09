import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import TopTabsBar from "./ui/TopTabsBar";
import { useThemeStore } from "@/stores/theme-store";
import { AlertCircle, CheckCircle, DollarSign, FileText, TrendingUp } from "lucide-react";

export default function Fees({ w, feesData, setFeesData, guest = false }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("fines");

  // Subscribe to theme store to ensure re-renders on theme changes
  const themeState = useThemeStore((state) => state.themeState);
  
  // Force re-render when theme changes
  const [, setForceUpdate] = useState({});
  useEffect(() => {
    setForceUpdate({});
  }, [themeState]);
  // Theme re-render helper (swipe removed)

  useEffect(() => {
    const fetchFeesData = async () => {
      // Return early if data is already cached
      if (feesData) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [finesData, summaryData] = await Promise.all([
          w.get_fines_msc_charges().catch((err) => {
            // If the API returns "NO APPROVED REQUEST FOUND", treat it as empty array
            if (err.message?.includes("NO APPROVED REQUEST FOUND")) {
              return [];
            }
            throw err;
          }),
          w.get_fee_summary(),
        ]);

        setFeesData({
          fines: Array.isArray(finesData) ? finesData : [],
          summary: summaryData || {},
        });

        // Debug logs
        try {
          console.groupCollapsed("Fees: API responses");
          console.log("finesData:", Array.isArray(finesData) ? finesData : []);
          console.log("summaryData (raw):", summaryData);
          console.groupEnd();
        } catch (e) {
          console.warn("Failed to log fee data for debug", e);
        }
      } catch (error) {
        console.error("Failed to fetch fees data:", error);
        setError(error.message || "Failed to load fees data");
      } finally {
        setLoading(false);
      }
    };

    fetchFeesData();
  }, [w, feesData, setFeesData]);

  if (loading) {
    return <p>Loading fees data...</p>;
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-10rem)] md:min-h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <p className="text-foreground text-lg">{error}</p>
        </div>
      </div>
    );
  }

  const finesArray = feesData?.fines || [];
  const summaryData = feesData?.summary || {};
  const feeHeads = summaryData.feeHeads || [];
  const studentInfo = summaryData.studentInfo?.[0] || {};
  const advanceAmount = summaryData.advanceamount?.[0]?.amount || 0;

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "N/A";
    const num = parseFloat(amount);
    if (isNaN(num)) return "N/A";
    return `₹${num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  // Calculate total fines
  const totalFines = finesArray.reduce((sum, fine) => {
    return sum + (parseFloat(fine.charge) || parseFloat(fine.feeamounttobepaid) || 0);
  }, 0);

  // Calculate summary totals from feeHeads
  const totalFeeAmount = feeHeads.reduce((sum, head) => sum + (parseFloat(head.feeamount) || 0), 0);
  const totalReceived = feeHeads.reduce((sum, head) => sum + (parseFloat(head.receiveamount) || 0), 0);
  const totalDue = feeHeads.reduce((sum, head) => sum + (parseFloat(head.dueamount) || 0), 0);
  const totalRefund = feeHeads.reduce((sum, head) => sum + (parseFloat(head.refundamount) || 0), 0);

  return (
    <div className="min-h-[calc(100vh-10rem)] md:min-h-[calc(100vh-6rem)] flex flex-col w-full">
      {guest && (
        <div className="w-full max-w-3xl mx-auto mb-4 rounded-lg bg-accent text-accent-foreground text-center py-2 font-semibold shadow-md">
          Guest Demo: Viewing Sample Data
        </div>
      )}
      
      <div className="flex-1 flex flex-row w-full max-w-6xl mx-auto">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex w-full"
        >
          {/* Sidebar Tabs for large screens */}
          <div className="w-64 flex-shrink-0 hidden lg:block">
            <TopTabsBar
              orientation="vertical"
              className="mb-6 items-center grid grid-cols-1 w-64 h-auto py-4 gap-2"
            >
              <TabsTrigger
                value="fines"
                className="flex items-center justify-start px-6 py-3 w-full rounded-none data-[state=active]:rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground text-[1.1rem] font-medium transition-colors"
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Pending Fines
              </TabsTrigger>
              <TabsTrigger
                value="summary"
                className="flex items-center justify-start px-6 py-3 w-full rounded-none data-[state=active]:rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground text-[1.1rem] font-medium transition-colors"
              >
                <FileText className="w-5 h-5 mr-2" />
                Fee Summary
              </TabsTrigger>
            </TopTabsBar>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center w-full px-4 sm:px-0">
            {/* TabsList for mobile only */}
            <div className="w-full lg:hidden mb-4">
              <TopTabsBar
                orientation="horizontal"
                className="w-full flex flex-row justify-between h-12 overflow-x-auto whitespace-nowrap scrollbar-none"
              >
                <TabsTrigger
                  value="fines"
                  className="flex-1 min-w-fit text-lg font-semibold data-[state=active]:bg-card data-[state=active]:text-accent text-muted-foreground transition-colors"
                >
                  Pending Fines
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="flex-1 min-w-fit text-lg font-semibold data-[state=active]:bg-card data-[state=active]:text-accent text-muted-foreground transition-colors"
                >
                  Fee Summary
                </TabsTrigger>
              </TopTabsBar>
            </div>

            {/* Pending Fines Tab */}
            <TabsContent value="fines" className="w-full mt-0">
              <div className="w-full space-y-4">
                {finesArray.length > 0 ? (
                  <>
                    {/* Total Fines Summary Card */}
                    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg p-6 shadow-md border-orange-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-muted-foreground text-sm font-medium mb-1">Total Fines Pending</p>
                          <p className="text-3xl font-bold text-accent">
                            {formatCurrency(totalFines)}
                          </p>
                        </div>
                        <AlertCircle className="w-12 h-12 text-orange-500 opacity-50" />
                      </div>
                    </div>

                    {/* Individual Fines */}
                    {finesArray.map((fine, index) => (
                      <div
                        key={index}
                        className="bg-card rounded-lg p-6 shadow-md border-orange-500"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-card-foreground mb-1">
                              {fine.servicename || "Miscellaneous Charge"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {fine.remarksbyauthority || "No remarks"}
                            </p>
                          </div>
                          <span className="text-2xl font-bold text-orange-600">
                            {formatCurrency(fine.charge || fine.feeamounttobepaid)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                          {fine.servicecode && (
                            <div>
                              <span className="text-xs text-muted-foreground uppercase font-semibold">Service</span>
                              <p className="text-card-foreground font-medium text-sm mt-1">
                                {fine.servicecode}
                              </p>
                            </div>
                          )}
                          {fine.requestno && (
                            <div>
                              <span className="text-xs text-muted-foreground uppercase font-semibold">Request No</span>
                              <p className="text-card-foreground font-medium text-sm mt-1">
                                {fine.requestno}
                              </p>
                            </div>
                          )}
                          {fine.quantity && (
                            <div>
                              <span className="text-xs text-muted-foreground uppercase font-semibold">Quantity</span>
                              <p className="text-card-foreground font-medium text-sm mt-1">
                                {fine.quantity}
                              </p>
                            </div>
                          )}
                        </div>

                        {fine.remarksbystudents && (
                          <div className="mt-4 p-3 bg-background/50 rounded-lg">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">
                              Student Remarks
                            </span>
                            <p className="text-card-foreground text-sm mt-1">
                              {fine.remarksbystudents}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="bg-card rounded-lg p-12 text-center shadow-md">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-chart-1" />
                    <h3 className="text-xl font-semibold text-card-foreground mb-2">
                      No Pending Fines
                    </h3>
                    <p className="text-muted-foreground">
                      You don't have any pending fines or miscellaneous charges.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Fee Summary Tab */}
            <TabsContent value="summary" className="w-full mt-0">
              <div className="w-full space-y-4">
                {/* Overall Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Total Fee Card */}
                  <div className="bg-card rounded-lg p-6 shadow-md border-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm font-medium">Total Fee</p>
                        <p className="text-2xl font-bold text-card-foreground mt-1">
                          {formatCurrency(totalFeeAmount)}
                        </p>
                      </div>
                      <DollarSign className="w-10 h-10 text-blue-500 opacity-30" />
                    </div>
                  </div>

                  {/* Total Received Card */}
                  <div className="bg-card rounded-lg p-6 shadow-md border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm font-medium">Total Received</p>
                        <p className="text-2xl font-bold text-chart-1 mt-1">
                          {formatCurrency(totalReceived)}
                        </p>
                      </div>
                      <CheckCircle className="w-10 h-10 text-chart-1 opacity-30" />
                    </div>
                  </div>

                  {/* Total Due Card */}
                  <div className="bg-card rounded-lg p-6 shadow-md border-red-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm font-medium">Total Due</p>
                        <p className="text-2xl font-bold text-chart-2 mt-1">
                          {formatCurrency(totalDue)}
                        </p>
                      </div>
                      <AlertCircle className="w-10 h-10 text-chart-2 opacity-30" />
                    </div>
                  </div>

                  {/* Advance/Refund Card */}
                  {(advanceAmount > 0 || totalRefund > 0) && (
                    <div className="bg-card rounded-lg p-6 shadow-md border-t-4 border-purple-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-muted-foreground text-sm font-medium">
                            {advanceAmount > 0 ? "Advance" : "Refund"}
                          </p>
                          <p className="text-2xl font-bold text-purple-600 mt-1">
                            {formatCurrency(advanceAmount > 0 ? advanceAmount : totalRefund)}
                          </p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-purple-500 opacity-30" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Fee Heads by Semester/Event */}
                {feeHeads.length > 0 && (
                  <div className="bg-card rounded-lg p-6 shadow-md">
                    <h3 className="text-xl font-semibold text-card-foreground mb-6 flex items-center">
                      Fee Breakdown by Semester
                    </h3>

                    <div className="space-y-4">
                      {feeHeads.map((head, idx) => {
                        const academicYear = head.academicyear || "N/A";
                        const semester = head.stynumber ? `Semester ${head.stynumber}` : "N/A";
                        const feeAmount = parseFloat(head.feeamount) || 0;
                        const received = parseFloat(head.receiveamount) || 0;
                        const due = parseFloat(head.dueamount) || 0;
                        const refund = parseFloat(head.refundamount) || 0;

                        return (
                          <div
                            key={idx}
                            className="bg-background/50 rounded-lg p-4 border-2 border-accent"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-semibold text-foreground">
                                  {semester} ({academicYear})
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Event: {head.eventid}
                                </p>
                              </div>
                              <span className="inline-block px-2 py-1 rounded bg-accent/10 text-accent text-xs font-medium">
                                {head.stytypedesc || "Regular"}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground text-xs uppercase">Fee Amount</span>
                                <p className="text-foreground font-semibold">
                                  {formatCurrency(feeAmount)}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground text-xs uppercase">Received</span>
                                <p className="text-chart-1 font-semibold">
                                  {formatCurrency(received)}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground text-xs uppercase">Due</span>
                                <p className="text-chart-2 font-semibold">
                                  {formatCurrency(due)}
                                </p>
                              </div>
                              {refund > 0 && (
                                <div>
                                  <span className="text-muted-foreground text-xs uppercase">Refund</span>
                                  <p className="text-purple-600 font-semibold">
                                    {formatCurrency(refund)}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Waiver, Transfer details if present */}
                            {(parseFloat(head.waiveramount) > 0 || 
                              parseFloat(head.transferinamount) > 0 || 
                              parseFloat(head.transferoutamount) > 0) && (
                              <div className="mt-3 pt-3 border-t border-muted-foreground/20 grid grid-cols-3 gap-2 text-xs">
                                {parseFloat(head.waiveramount) > 0 && (
                                  <div>
                                    <span className="text-muted-foreground">Waived</span>
                                    <p className="text-foreground font-medium">
                                      {formatCurrency(head.waiveramount)}
                                    </p>
                                  </div>
                                )}
                                {parseFloat(head.transferinamount) > 0 && (
                                  <div>
                                    <span className="text-muted-foreground">Transfer In</span>
                                    <p className="text-foreground font-medium">
                                      {formatCurrency(head.transferinamount)}
                                    </p>
                                  </div>
                                )}
                                {parseFloat(head.transferoutamount) > 0 && (
                                  <div>
                                    <span className="text-muted-foreground">Transfer Out</span>
                                    <p className="text-foreground font-medium">
                                      {formatCurrency(head.transferoutamount)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
