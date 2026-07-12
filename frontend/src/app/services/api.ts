import { API_ROOT } from '../lib/config';

const API_BASE_URL = `${API_ROOT}/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('erp_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    window.location.href = '/'; // Simple redirect on 401
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'API request failed');
  }
  return response.json();
};

// Generic CRUD helpers
export const fetchRecords = async (module: string) => {
  const response = await fetch(`${API_BASE_URL}/${module}`, { headers: getAuthHeaders() });
  return handleResponse(response);
};

export const createRecord = async (module: string, data: any) => {
  const response = await fetch(`${API_BASE_URL}/${module}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateRecord = async (module: string, id: string, data: any) => {
  const response = await fetch(`${API_BASE_URL}/${module}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteRecord = async (module: string, id: string) => {
  const response = await fetch(`${API_BASE_URL}/${module}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// Specialized fetchers (keeping for compatibility or specific joins)
export const fetchStats = () => fetchRecords('stats');
export const fetchProductions = () => fetchRecords('production');
export const fetchInventory = () => fetchRecords('inventory');
export const fetchExpenses = () => fetchRecords('expenses');
export const fetchEmployees = () => fetchRecords('employees');
export const fetchVehicles = () => fetchRecords('vehicles');
export const fetchVendors = () => fetchRecords('vendors');
export const fetchSites = () => fetchRecords('sites');
export const fetchConsumptions = () => fetchRecords('consumption');
export const fetchAttendances = () => fetchRecords('attendance');
export const fetchMaintenances = () => fetchRecords('maintenance');
export const fetchChallans = () => fetchRecords('challans');
export const fetchPurchaseOrders = () => fetchRecords('purchase-orders');
export const fetchVehicleMovements = () => fetchRecords('vehicle-movements');
export const fetchMaterialInwards = () => fetchRecords('material-inward');
export const fetchRmcGrades = () => fetchRecords('rmc-grades');
export const fetchScraps = () => fetchRecords('scrap');
export const fetchAccountsReport = () => fetchRecords('reports/accounts');
export const fetchBusinessReport = () => fetchRecords('reports/business');
export const fetchEfficiencyReport = () => fetchRecords('reports/efficiency');
export const fetchTargetsReport = () => fetchRecords('reports/targets');
export const fetchTimeMotionReport = () => fetchRecords('reports/time-motion');
export const fetchMaintenanceOverview = () => fetchRecords('reports/maintenance-overview');
export const fetchSettingsReport = () => fetchRecords('reports/settings');

// Specialized creators
export const createProduction = (data: any) => createRecord('production', data);
export const createInventoryItem = (data: any) => createRecord('inventory', data);
export const createExpense = (data: any) => createRecord('expenses', data);
export const createEmployee = (data: any) => createRecord('employees', data);
export const createSite = (data: any) => createRecord('sites', data);
export const createVehicle = (data: any) => createRecord('vehicles', data);
export const createVendor = (data: any) => createRecord('vendors', data);
export const createConsumption = (data: any) => createRecord('consumption', data);
export const createAttendance = (data: any) => createRecord('attendance', data);
export const createMaintenance = (data: any) => createRecord('maintenance', data);
export const createChallan = (data: any) => createRecord('challans', data);
export const createPurchaseOrder = (data: any) => createRecord('purchase-orders', data);
export const createVehicleMovement = (data: any) => createRecord('vehicle-movements', data);
export const createMaterialInward = (data: any) => createRecord('material-inward', data);
export const createRmcGrade = (data: any) => createRecord('rmc-grades', data);
export const createScrap = (data: any) => createRecord('scrap', data);

export const fetchOverheadEntries = () => fetchRecords('overhead');
export const fetchOverheadSummary = () => fetchRecords('overhead/summary');
export const createOverheadEntry = (data: any) => createRecord('overhead', data);

// Document Attachment Upload Helpers
export const uploadFile = async (file: File, entityFields: { employeeId?: string; vehicleId?: string; challanId?: string }) => {
  const formData = new FormData();
  formData.append('file', file);
  if (entityFields.employeeId) formData.append('employeeId', entityFields.employeeId);
  if (entityFields.vehicleId) formData.append('vehicleId', entityFields.vehicleId);
  if (entityFields.challanId) formData.append('challanId', entityFields.challanId);

  const token = localStorage.getItem('erp_token');
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: formData,
  });
  return handleResponse(response);
};

export const fetchDocuments = async (entityFields: { employeeId?: string; vehicleId?: string; challanId?: string }) => {
  const query = new URLSearchParams(entityFields as any).toString();
  const response = await fetch(`${API_BASE_URL}/upload?${query}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

export const deleteDocument = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/upload/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// Custom Columns API
export const fetchCustomColumns = async (entity?: string) => {
  const url = entity ? `custom-columns?entity=${entity}` : 'custom-columns';
  return fetchRecords(url);
};

export const createCustomColumn = async (data: any) => {
  return createRecord('custom-columns', data);
};

export const deleteCustomColumn = async (id: string) => {
  return deleteRecord('custom-columns', id);
};
