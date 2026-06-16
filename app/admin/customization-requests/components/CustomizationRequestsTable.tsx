/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { X, Eye, Sparkles, User, Mail, Phone, Link, MessageSquare } from "lucide-react";

export function CustomizationRequestsTable({ initialRequests }: { initialRequests: any[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  const updateStatus = async (requestId: string, newStatus: string) => {
    setUpdatingId(requestId);
    try {
      const res = await fetch(`/api/admin/customization-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success("Customization request status updated!");
        setRequests(requests.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
        if (selectedRequest && selectedRequest.id === requestId) {
          setSelectedRequest({ ...selectedRequest, status: newStatus });
        }
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "NEW": return "bg-amber-50 text-amber-700 border-amber-200";
      case "CONTACTED": return "bg-blue-50 text-blue-700 border-blue-200";
      case "QUOTE_SENT": return "bg-purple-50 text-purple-700 border-purple-200";
      case "APPROVED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "IN_PRODUCTION": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "COMPLETED": return "bg-gray-100 text-gray-800 border-gray-300";
      case "CANCELLED": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="relative">
      <div className="w-full overflow-x-auto bg-white border border-gray-100 shadow-sm rounded-none pb-4">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-widest text-gray-400">
              <th className="p-5 font-bold">Request ID</th>
              <th className="p-5 font-bold">Customer</th>
              <th className="p-5 font-bold">Design / Product</th>
              <th className="p-5 font-bold">Metal Selection</th>
              <th className="p-5 font-bold">Date</th>
              <th className="p-5 font-bold">Status</th>
              <th className="p-5 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-gray-400 text-xs uppercase tracking-widest font-bold">
                  No customization requests found.
                </td>
              </tr>
            ) : requests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-5 font-mono text-xs text-gray-500 tracking-wider">
                  {request.id.slice(-8).toUpperCase()}
                </td>
                <td className="p-5">
                  <p className="font-bold text-[#111111] tracking-wide">{request.customerName}</p>
                  <p className="text-[11px] text-gray-400 mt-1 lowercase tracking-widest">{request.customerEmail}</p>
                </td>
                <td className="p-5">
                  <p className="font-bold text-[#111111] tracking-wide">{request.productName}</p>
                  {request.productSku && (
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-mono">SKU: {request.productSku}</p>
                  )}
                </td>
                <td className="p-5 text-sm text-gray-700 font-medium">
                  {request.metalType || "Not Specified"}
                </td>
                <td className="p-5 text-sm text-gray-700">
                  {format(new Date(request.createdAt), "MMM d, yyyy")}
                </td>
                <td className="p-5">
                  <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-3 py-1.5 rounded-full tracking-[0.15em] uppercase border ${getStatusStyle(request.status)}`}>
                    {request.status}
                  </span>
                </td>
                <td className="p-5 text-right">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="text-[#111111] bg-white border border-gray-200 hover:bg-gray-50 transition-all inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-none hover:border-gray-400"
                  >
                    <Eye size={14} /> Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* REQUEST DETAIL SIDE DRAWER */}
      {selectedRequest && (
        <>
          <div className="fixed inset-0 bg-gray-50/60 backdrop-blur-sm z-[9998] transition-opacity" onClick={() => setSelectedRequest(null)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.15)] z-[9999] transform transition-transform duration-300 flex flex-col border-l border-gray-200 animate-in slide-in-from-right">
            <header className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50">
              <div>
                <h3 className="text-2xl font-heading tracking-wide !text-[#111111] flex items-center gap-2">
                  <Sparkles className="text-[#C9A24A]" size={20} /> Customization Details
                </h3>
                <p className="text-[10px] uppercase font-mono tracking-widest text-gray-400 mt-1.5">ID: {selectedRequest.id}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="p-2 text-gray-400 hover:text-[#111111] hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {/* Status Selector Section */}
              <div className="bg-gray-50 p-5 rounded-none border border-gray-200 shadow-none flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Request Status</span>
                  <select
                    disabled={updatingId === selectedRequest.id}
                    className={`text-[9px] font-bold uppercase tracking-[0.15em] px-3 py-2 rounded-none outline-none border transition-colors cursor-pointer w-44 bg-gray-50 ${getStatusStyle(selectedRequest.status)}`}
                    value={selectedRequest.status}
                    onChange={(e) => updateStatus(selectedRequest.id, e.target.value)}
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUOTE_SENT">Quote Sent</option>
                    <option value="APPROVED">Approved</option>
                    <option value="IN_PRODUCTION">In Production</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h4 className="text-[10px] uppercase tracking-widest font-bold !text-[#111111] mb-3 border-b border-gray-100 pb-2">Client Details</h4>
                <div className="space-y-2.5 mt-3">
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <User size={16} className="text-gray-400" />
                    <span className="font-bold text-[#111111]">{selectedRequest.customerName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <Mail size={16} className="text-gray-400" />
                    <a href={`mailto:${selectedRequest.customerEmail}`} className="text-[#C9A24A] hover:underline">
                      {selectedRequest.customerEmail}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <Phone size={16} className="text-gray-400" />
                    <span>{selectedRequest.customerPhone}</span>
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div>
                <h4 className="text-[10px] uppercase tracking-widest font-bold !text-[#111111] mb-3 border-b border-gray-100 pb-2">Design Model</h4>
                <div className="space-y-2.5 mt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-[#111111]">{selectedRequest.productName}</span>
                    {selectedRequest.productPrice && (
                      <span className="font-bold font-body text-[#111111]">₹{parseFloat(selectedRequest.productPrice).toLocaleString("en-IN")}</span>
                    )}
                  </div>
                  {selectedRequest.productId && (
                    <p className="text-xs text-gray-500 font-mono">Product ID: {selectedRequest.productId}</p>
                  )}
                  {selectedRequest.productSku && (
                    <p className="text-xs text-gray-500 font-mono">SKU: {selectedRequest.productSku}</p>
                  )}
                  {selectedRequest.productUrl && (
                    <div className="pt-1.5">
                      <a
                        href={selectedRequest.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#C9A24A] hover:underline font-bold"
                      >
                        <Link size={14} /> View Store Page
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Customization Details */}
              <div>
                <h4 className="text-[10px] uppercase tracking-widest font-bold !text-[#111111] mb-3 border-b border-gray-100 pb-2">Requested Selections</h4>
                <div className="space-y-3 mt-3">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span className="font-medium text-gray-400">Metal Finish:</span>
                    <span className="text-[#111111] font-medium">{selectedRequest.metalType || "Original"}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-700">
                    <span className="font-medium text-gray-400">Jewelry Size:</span>
                    <span className="text-[#111111] font-medium">{selectedRequest.jewelrySize || "Not Specified"}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-700">
                    <span className="font-medium text-gray-400">Stone Type:</span>
                    <span className="text-[#111111] font-medium">{selectedRequest.stoneType || "Original"}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-700">
                    <span className="font-medium text-gray-400">Stone Size:</span>
                    <span className="text-[#111111] font-medium">{selectedRequest.stoneSize || "Original"}</span>
                  </div>
                  {selectedRequest.engraving && (
                    <div className="flex justify-between text-sm text-gray-700 border-t border-gray-100 pt-3 mt-3">
                      <span className="font-medium text-gray-400">Engraving Inscription:</span>
                      <span className="text-[#C9A24A] font-bold italic font-serif">"{selectedRequest.engraving}"</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Special Requirements */}
              <div>
                <h4 className="text-[10px] uppercase tracking-widest font-bold !text-[#111111] mb-3 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-gray-400" /> Additional Requirements
                </h4>
                <div className="bg-gray-50 border border-gray-200 p-4 mt-3 rounded-none">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedRequest.requirements}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
