import React from 'react';
import {
  XCircle,
  FileText,
  AlertTriangle,
  Building,
  Shield,
  User,
  Users,
  Camera,
  Eye,
  Download,
  Loader2
} from 'lucide-react';

const ViewModal = ({
  showDetailModal,
  selectedForm,
  closeDetailModal,
  formatDate,
  getPriorityColor,
  getStatusColor,
  getStatusIcon,
  downloadPDF,
  downloadingPdf
}) => {
  if (!showDetailModal || !selectedForm) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 md:p-4 z-50">
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-6xl max-h-[95vh] overflow-hidden w-full border border-gray-200 transform scale-100 transition-all duration-300">
        {/* Ultra Modern Header */}
        <div className="relative bg-gradient-to-br from-[#232249] via-[#2a2a5c] to-[#1a1b3a] p-4 md:p-8 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}></div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-tr-full"></div>
          
          <div className="relative flex items-center justify-between text-white">
            <div className="flex items-center space-x-3 md:space-x-6">
              <div className="p-2 md:p-4 bg-white/15 rounded-xl md:rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg">
                <FileText className="h-6 w-6 md:h-10 md:w-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent mb-1 md:mb-2">
                  Inspection Details
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                  <p className="text-white/80 text-sm md:text-lg font-medium">
                    {selectedForm.workOrderId || `WO-${new Date(selectedForm.submittedAt || selectedForm.createdAt).getFullYear()}-${String(selectedForm.id).padStart(4, '0')}`}
                  </p>
                  <div className="hidden sm:block w-2 h-2 bg-white/60 rounded-full"></div>
                  <p className="text-white/80 text-sm md:text-lg">{formatDate(selectedForm.submittedAt)}</p>
                </div>
              </div>
            </div>
            <button
              onClick={closeDetailModal}
              className="p-3 md:p-4 hover:bg-white/20 rounded-xl md:rounded-2xl transition-all duration-300 group border border-white/20"
            >
              <XCircle className="h-6 w-6 md:h-8 md:w-8 group-hover:scale-110 transition-transform text-white" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto max-h-[70vh] bg-gradient-to-br from-gray-50/50 to-white">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-[#232249]/5 to-[#232249]/10 rounded-2xl border border-[#232249]/20">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${getPriorityColor(selectedForm.priority)} border-2`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">Current Status</h4>
                <div className="flex items-center space-x-3 mt-1">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(selectedForm.status)} shadow-sm`}>
                    {getStatusIcon(selectedForm.status)}
                    {selectedForm.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getPriorityColor(selectedForm.priority)} shadow-sm`}>
                    {selectedForm.priority.charAt(0).toUpperCase() + selectedForm.priority.slice(1)} Priority
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">Last Updated</p>
              <p className="text-lg font-bold text-[#232249]">{formatDate(selectedForm.lastModified)}</p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gradient-to-br from-[#232249] to-[#2a2a5c] rounded-xl mr-4 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Basic Information</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Space Name</label>
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 group-hover:border-[#232249]/30 transition-all">
                    <p className="text-lg font-bold text-gray-900">{selectedForm.spaceName}</p>
                  </div>
                </div>
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Building</label>
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 group-hover:border-[#232249]/30 transition-all">
                    <p className="text-lg font-bold text-gray-900">{selectedForm.building}</p>
                  </div>
                </div>
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Technician</label>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 group-hover:border-blue-400 transition-all">
                    <p className="text-lg font-bold text-blue-900">{selectedForm.technician}</p>
                  </div>
                </div>
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Survey Date</label>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 group-hover:border-purple-400 transition-all">
                    <p className="text-lg font-bold text-purple-900">{formatDate(selectedForm.surveyDate)}</p>
                  </div>
                </div>
              </div>
              
              <div className="group">
                <label className="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">Location Description</label>
                <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 group-hover:border-amber-400 transition-all">
                  <p className="text-gray-900 leading-relaxed">{selectedForm.locationDescription}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Space Classification */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#232249] mb-6 flex items-center">
              <div className="p-2 bg-blue-500/10 rounded-xl mr-3">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              Space Classification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                <div className="text-sm font-medium text-gray-700 mb-2">Confined Space</div>
                <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold ${selectedForm.isConfinedSpace ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {selectedForm.isConfinedSpace ? 'Yes' : 'No'}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                <div className="text-sm font-medium text-gray-700 mb-2">Entry Permit Required</div>
                <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold ${selectedForm.permitRequired ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                  {selectedForm.permitRequired ? 'Yes' : 'No'}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                <div className="text-sm font-medium text-gray-700 mb-2">Entry Points</div>
                <div className="text-lg font-semibold text-gray-900">{selectedForm.numberOfEntryPoints || 'Not specified'}</div>
              </div>
            </div>
            {selectedForm.confinedSpaceDescription && (
              <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                <div className="text-sm font-medium text-gray-700 mb-2">Space Description</div>
                <div className="text-gray-900">{selectedForm.confinedSpaceDescription}</div>
              </div>
            )}
            {selectedForm.entryRequirements && (
              <div className="mt-4 bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                <div className="text-sm font-medium text-gray-700 mb-2">Entry Requirements</div>
                <div className="text-gray-900">{selectedForm.entryRequirements}</div>
              </div>
            )}
          </div>

          {/* Hazard Assessment */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border border-red-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#232249] mb-6 flex items-center">
              <div className="p-2 bg-red-500/10 rounded-xl mr-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              Hazard Assessment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Atmospheric Hazard</span>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${selectedForm.atmosphericHazard ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {selectedForm.atmosphericHazard ? 'Present' : 'Not Present'}
                    </div>
                  </div>
                  {selectedForm.atmosphericHazardDescription && (
                    <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg">
                      {selectedForm.atmosphericHazardDescription}
                    </div>
                  )}
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Engulfment Hazard</span>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${selectedForm.engulfmentHazard ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {selectedForm.engulfmentHazard ? 'Present' : 'Not Present'}
                    </div>
                  </div>
                  {selectedForm.engulfmentHazardDescription && (
                    <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg">
                      {selectedForm.engulfmentHazardDescription}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Configuration Hazard</span>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${selectedForm.configurationHazard ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {selectedForm.configurationHazard ? 'Present' : 'Not Present'}
                    </div>
                  </div>
                  {selectedForm.configurationHazardDescription && (
                    <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg">
                      {selectedForm.configurationHazardDescription}
                    </div>
                  )}
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Other Recognized Hazards</span>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${selectedForm.otherRecognizedHazards ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {selectedForm.otherRecognizedHazards ? 'Present' : 'Not Present'}
                    </div>
                  </div>
                  {selectedForm.otherHazardsDescription && (
                    <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg">
                      {selectedForm.otherHazardsDescription}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Safety Requirements */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#232249] mb-6 flex items-center">
              <div className="p-2 bg-green-500/10 rounded-xl mr-3">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              Safety Requirements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">PPE Required</span>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${selectedForm.ppeRequired ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                    {selectedForm.ppeRequired ? 'Required' : 'Not Required'}
                  </div>
                </div>
                {selectedForm.ppeList && (
                  <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg">
                    <strong>PPE List:</strong> {selectedForm.ppeList}
                  </div>
                )}
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Forced Air Ventilation</span>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${selectedForm.forcedAirVentilationSufficient ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {selectedForm.forcedAirVentilationSufficient ? 'Sufficient' : 'Insufficient'}
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Dedicated Air Monitor</span>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${selectedForm.dedicatedAirMonitor ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                    {selectedForm.dedicatedAirMonitor ? 'Required' : 'Not Required'}
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Warning Sign</span>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${selectedForm.warningSignPosted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {selectedForm.warningSignPosted ? 'Posted' : 'Not Posted'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personnel & Access */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#232249] mb-6 flex items-center">
              <div className="p-2 bg-purple-500/10 rounded-xl mr-3">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              Personnel & Access Control
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100">
                <div className="text-sm font-medium text-gray-700 mb-2">Other People Working Nearby</div>
                <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold ${selectedForm.otherPeopleWorkingNearSpace ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                  {selectedForm.otherPeopleWorkingNearSpace ? 'Yes' : 'No'}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100">
                <div className="text-sm font-medium text-gray-700 mb-2">Visibility into Space</div>
                <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold ${selectedForm.canOthersSeeIntoSpace ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                  {selectedForm.canOthersSeeIntoSpace ? 'Visible' : 'Not Visible'}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100">
                <div className="text-sm font-medium text-gray-700 mb-2">Contractor Entry</div>
                <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold ${selectedForm.contractorsEnterSpace ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                  {selectedForm.contractorsEnterSpace ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </div>

          {/* Images Section */}
          {(selectedForm.imageUrls || selectedForm.images) && (selectedForm.imageUrls?.length > 0 || selectedForm.images?.length > 0) && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100 shadow-sm">
              <h3 className="text-xl font-bold text-[#232249] mb-6 flex items-center">
                <div className="p-2 bg-amber-500/10 rounded-xl mr-3">
                  <Camera className="h-5 w-5 text-amber-600" />
                </div>
                Attached Images ({(selectedForm.imageUrls || selectedForm.images || []).length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(selectedForm.imageUrls || selectedForm.images || []).map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-white shadow-lg border border-amber-100">
                      <img
                        src={url}
                        alt={`Inspection image ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full bg-gray-100 hidden items-center justify-center text-gray-500 text-sm">
                        Image not available
                      </div>
                    </div>
                    <button
                      onClick={() => window.open(url, '_blank')}
                      className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-xl transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                      <div className="bg-white rounded-full p-2 shadow-lg">
                        <Eye className="h-5 w-5 text-gray-700" />
                      </div>
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-lg">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {selectedForm.notes && (
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-[#232249] mb-4 flex items-center">
                <div className="p-2 bg-gray-500/10 rounded-xl mr-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
                Additional Notes
              </h3>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedForm.notes}</div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>📅 Submitted: {formatDate(selectedForm.submittedAt)}</span>
                <span>🔄 Modified: {formatDate(selectedForm.lastModified)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => downloadPDF(selectedForm)}
                disabled={downloadingPdf === selectedForm.id}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#232249] to-[#2a2a5c] text-white rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 transform hover:-translate-y-0.5"
              >
                {downloadingPdf === selectedForm.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download PDF
              </button>
              <button
                onClick={closeDetailModal}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-medium transform hover:-translate-y-0.5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewModal;
