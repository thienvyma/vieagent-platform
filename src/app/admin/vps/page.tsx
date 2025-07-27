'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  Server,
  Plus,
  Search,
  Play,
  Square,
  RotateCcw,
  Eye,
  Edit,
  Trash2,
  Activity,
  Cpu,
  HardDrive,
  Network,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  Terminal,
  Settings,
  Upload,
  Download,
  Zap,
  Database,
  Monitor,
  Users,
  TrendingUp,
} from 'lucide-react';
import { hasPermission, type UserRole } from '@/lib/permissions';
import { Dialog } from '@headlessui/react';

// Types
interface VPSConnection {
  id: string;
  name: string;
  description?: string;
  host: string;
  port: number;
  username: string;
  type: 'VPS' | 'CLOUD' | 'EDGE';
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'CONNECTING';
  lastChecked?: string;
  createdAt: string;
  updatedAt: string;
  deployments?: VPSDeployment[];
  monitoring?: VPSMonitoring[];
}

interface VPSDeployment {
  id: string;
  name: string;
  description?: string;
  status: 'PENDING' | 'DEPLOYING' | 'RUNNING' | 'STOPPED' | 'ERROR' | 'FAILED';
  agentId?: string;
  agent?: {
    id: string;
    name: string;
  };
  vpsId: string;
  config?: string;
  logs?: string;
  createdAt: string;
  updatedAt: string;
}

interface VPSMonitoring {
  id: string;
  vpsId: string;
  cpuUsage?: number;
  ramUsage?: number;
  diskUsage?: number;
  networkIn?: number;
  networkOut?: number;
  uptime?: number;
  timestamp: string;
}

interface VPSFormData {
  name: string;
  description: string;
  host: string;
  port: number;
  username: string;
  password: string;
  privateKey: string;
  type: 'VPS' | 'CLOUD' | 'EDGE';
}

interface DeploymentFormData {
  name: string;
  description: string;
  agentId: string;
  vpsId: string;
  config: string;
}

export default function VPSManagementPage() {
  const { data: session } = useSession();

  // ✅ FIXED Phase 4D True Fix - Fix session user role access
  const sessionUser = session?.user as {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };

  const currentUserRole = sessionUser?.role as UserRole;

  // Tab management
  const [activeTab, setActiveTab] = useState<'connections' | 'deployments' | 'monitoring'>(
    'connections'
  );

  // States
  const [vpsConnections, setVpsConnections] = useState<VPSConnection[]>([]);
  const [deployments, setDeployments] = useState<VPSDeployment[]>([]);
  const [monitoring, setMonitoring] = useState<VPSMonitoring[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showCreateVPSModal, setShowCreateVPSModal] = useState(false);
  const [showEditVPSModal, setShowEditVPSModal] = useState(false);
  const [showDeleteVPSModal, setShowDeleteVPSModal] = useState(false);
  const [showCreateDeploymentModal, setShowCreateDeploymentModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedVPS, setSelectedVPS] = useState<VPSConnection | null>(null);
  const [selectedDeployment, setSelectedDeployment] = useState<VPSDeployment | null>(null);

  // Form states
  const [vpsFormData, setVpsFormData] = useState<VPSFormData>({
    name: '',
    description: '',
    host: '',
    port: 22,
    username: 'root',
    password: '',
    privateKey: '',
    type: 'VPS',
  });

  const [deploymentFormData, setDeploymentFormData] = useState<DeploymentFormData>({
    name: '',
    description: '',
    agentId: '',
    vpsId: '',
    config: JSON.stringify(
      {
        port: 3000,
        environment: 'production',
        autoRestart: true,
        maxMemory: '1GB',
      },
      null,
      2
    ),
  });

  // Action loading states
  const [actionLoading, setActionLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Permissions
  const canManageVPS = hasPermission(currentUserRole, 'manage_vps');
  const canCreateVPS = hasPermission(currentUserRole, 'create_vps');
  const canEditVPS = hasPermission(currentUserRole, 'edit_vps');
  const canDeleteVPS = hasPermission(currentUserRole, 'delete_vps');
  const canDeployAgents = hasPermission(currentUserRole, 'deploy_agents');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // ✅ FIXED Phase 4D True Fix - Fix useEffect return value
  useEffect(() => {
    if (activeTab === 'monitoring') {
      const interval = setInterval(fetchMonitoring, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }

    // Return undefined for other cases
    return undefined;
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchVPSConnections(),
        fetchDeployments(),
        fetchMonitoring(),
        fetchAgents(),
      ]);
    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchVPSConnections = async () => {
    try {
      const response = await fetch('/api/admin/vps/connections');
      const data = await response.json();
      if (data.success) {
        setVpsConnections(data.data);
      }
    } catch (error) {
      console.error('Fetch VPS connections error:', error);
    }
  };

  const fetchDeployments = async () => {
    try {
      const response = await fetch('/api/admin/vps/deployments');
      const data = await response.json();
      if (data.success) {
        setDeployments(data.data);
      }
    } catch (error) {
      console.error('Fetch deployments error:', error);
    }
  };

  const fetchMonitoring = async () => {
    try {
      const response = await fetch('/api/admin/vps/monitoring');
      const data = await response.json();
      if (data.success) {
        setMonitoring(data.data);
      }
    } catch (error) {
      console.error('Fetch monitoring error:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/admin/agents');
      const data = await response.json();
      if (data.success) {
        setAgents(data.data.agents || []);
      }
    } catch (error) {
      console.error('Fetch agents error:', error);
    }
  };

  const handleCreateVPS = async () => {
    try {
      setSaveLoading(true);
      const response = await fetch('/api/admin/vps/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vpsFormData),
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Tạo VPS connection thành công!');
        setShowCreateVPSModal(false);
        resetVPSForm();
        fetchVPSConnections();
      } else {
        toast.error(data.error || 'Không thể tạo VPS connection');
      }
    } catch (error) {
      console.error('Create VPS error:', error);
      toast.error('Lỗi khi tạo VPS connection');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEditVPS = async () => {
    if (!selectedVPS) return;

    try {
      setSaveLoading(true);
      const response = await fetch(`/api/admin/vps/connections/${selectedVPS.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vpsFormData),
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Cập nhật VPS connection thành công!');
        setShowEditVPSModal(false);
        setSelectedVPS(null);
        resetVPSForm();
        fetchVPSConnections();
      } else {
        toast.error(data.error || 'Không thể cập nhật VPS connection');
      }
    } catch (error) {
      console.error('Update VPS error:', error);
      toast.error('Lỗi khi cập nhật VPS connection');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteVPS = async () => {
    if (!selectedVPS) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/admin/vps/connections/${selectedVPS.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Xóa VPS connection thành công!');
        setShowDeleteVPSModal(false);
        setSelectedVPS(null);
        fetchVPSConnections();
      } else {
        toast.error(data.error || 'Không thể xóa VPS connection');
      }
    } catch (error) {
      console.error('Delete VPS error:', error);
      toast.error('Lỗi khi xóa VPS connection');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTestConnection = async (vps: VPSConnection) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/vps/connections/${vps.id}/test`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Kết nối VPS thành công!');
        fetchVPSConnections();
      } else {
        toast.error(data.error || 'Không thể kết nối VPS');
      }
    } catch (error) {
      console.error('Test connection error:', error);
      toast.error('Lỗi khi test kết nối');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateDeployment = async () => {
    try {
      setSaveLoading(true);
      const response = await fetch('/api/admin/vps/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deploymentFormData),
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Tạo deployment thành công!');
        setShowCreateDeploymentModal(false);
        resetDeploymentForm();
        fetchDeployments();
      } else {
        toast.error(data.error || 'Không thể tạo deployment');
      }
    } catch (error) {
      console.error('Create deployment error:', error);
      toast.error('Lỗi khi tạo deployment');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeploymentAction = async (
    deployment: VPSDeployment,
    action: 'start' | 'stop' | 'restart'
  ) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/vps/deployments/${deployment.id}/${action}`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`${action} deployment thành công!`);
        fetchDeployments();
      } else {
        toast.error(data.error || `Không thể ${action} deployment`);
      }
    } catch (error) {
      console.error(`${action} deployment error:`, error);
      toast.error(`Lỗi khi ${action} deployment`);
    } finally {
      setActionLoading(false);
    }
  };

  const resetVPSForm = () => {
    setVpsFormData({
      name: '',
      description: '',
      host: '',
      port: 22,
      username: 'root',
      password: '',
      privateKey: '',
      type: 'VPS',
    });
  };

  const resetDeploymentForm = () => {
    setDeploymentFormData({
      name: '',
      description: '',
      agentId: '',
      vpsId: '',
      config: JSON.stringify(
        {
          port: 3000,
          environment: 'production',
          autoRestart: true,
          maxMemory: '1GB',
        },
        null,
        2
      ),
    });
  };

  const openEditVPSModal = (vps: VPSConnection) => {
    setSelectedVPS(vps);
    setVpsFormData({
      name: vps.name,
      description: vps.description || '',
      host: vps.host,
      port: vps.port,
      username: vps.username,
      password: '',
      privateKey: '',
      type: vps.type,
    });
    setShowEditVPSModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      CONNECTED: 'bg-green-500/20 text-green-300 border-green-500/30',
      DISCONNECTED: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      ERROR: 'bg-red-500/20 text-red-300 border-red-500/30',
      CONNECTING: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      RUNNING: 'bg-green-500/20 text-green-300 border-green-500/30',
      STOPPED: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      PENDING: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      DEPLOYING: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      FAILED: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return colors[status as keyof typeof colors] || colors.DISCONNECTED;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      CONNECTED: <CheckCircle className='w-4 h-4' />,
      DISCONNECTED: <WifiOff className='w-4 h-4' />,
      ERROR: <XCircle className='w-4 h-4' />,
      CONNECTING: <Wifi className='w-4 h-4 animate-pulse' />,
      RUNNING: <Play className='w-4 h-4' />,
      STOPPED: <Square className='w-4 h-4' />,
      PENDING: <Clock className='w-4 h-4' />,
      DEPLOYING: <Upload className='w-4 h-4 animate-pulse' />,
      FAILED: <AlertTriangle className='w-4 h-4' />,
    };
    return icons[status as keyof typeof icons] || icons.DISCONNECTED;
  };

  const filteredVPSConnections = vpsConnections.filter(
    vps =>
      vps.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vps.host.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDeployments = deployments.filter(
    deployment =>
      deployment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deployment.agent?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!hasPermission(currentUserRole, 'view_vps')) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <Server className='w-16 h-16 text-red-400 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-white mb-2'>Không có quyền truy cập</h2>
          <p className='text-gray-400'>Bạn không có quyền xem trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-white mb-2'>VPS Agent Management</h1>
          <p className='text-gray-400'>Quản lý VPS, deploy agents và monitoring hệ thống</p>
        </div>
        <div className='flex items-center space-x-4'>
          {(canCreateVPS || canDeployAgents) && (
            <>
              {canCreateVPS && (
                <button
                  onClick={() => {
                    resetVPSForm();
                    setShowCreateVPSModal(true);
                  }}
                  className='px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center space-x-2'
                >
                  <Plus className='w-4 h-4' />
                  <span>Thêm VPS</span>
                </button>
              )}
              {canDeployAgents && activeTab === 'deployments' && (
                <button
                  onClick={() => {
                    resetDeploymentForm();
                    setShowCreateDeploymentModal(true);
                  }}
                  className='px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center space-x-2'
                >
                  <Upload className='w-4 h-4' />
                  <span>Deploy Agent</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-2 border border-white/10'>
        <div className='flex space-x-2'>
          <button
            onClick={() => setActiveTab('connections')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === 'connections'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Server className='w-5 h-5' />
            <span>VPS Connections</span>
          </button>
          <button
            onClick={() => setActiveTab('deployments')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === 'deployments'
                ? 'bg-green-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Upload className='w-5 h-5' />
            <span>Deployments</span>
          </button>
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === 'monitoring'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Activity className='w-5 h-5' />
            <span>Monitoring</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <input
            type='text'
            placeholder={`Tìm kiếm ${activeTab === 'connections' ? 'VPS connections' : activeTab === 'deployments' ? 'deployments' : 'monitoring data'}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500'
          />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'connections' && (
        <VPSConnectionsTab
          connections={filteredVPSConnections}
          loading={loading}
          onEdit={openEditVPSModal}
          onDelete={vps => {
            setSelectedVPS(vps);
            setShowDeleteVPSModal(true);
          }}
          onTestConnection={handleTestConnection}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          actionLoading={actionLoading}
          canEditVPS={canEditVPS}
          canDeleteVPS={canDeleteVPS}
        />
      )}

      {activeTab === 'deployments' && (
        <DeploymentsTab
          deployments={filteredDeployments}
          loading={loading}
          onAction={(deployment, action) => handleDeploymentAction(deployment, action)}
          onViewLogs={deployment => {
            setSelectedDeployment(deployment);
            setShowLogsModal(true);
          }}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          actionLoading={actionLoading}
          canDeployAgents={canDeployAgents}
        />
      )}

      {activeTab === 'monitoring' && (
        <MonitoringTab vpsConnections={vpsConnections} monitoring={monitoring} loading={loading} />
      )}

      {/* Create VPS Modal */}
      <Dialog
        open={showCreateVPSModal}
        onClose={() => setShowCreateVPSModal(false)}
        className='fixed z-50 inset-0 overflow-y-auto'
      >
        <div className='flex items-center justify-center min-h-screen px-4'>
          <div className='fixed inset-0 bg-black/70' aria-hidden='true' />
          <div className='relative bg-gray-900 rounded-2xl p-6 w-full max-w-2xl mx-auto z-10 border border-white/10'>
            <Dialog.Title className='text-xl font-bold text-white mb-4'>
              Thêm VPS Connection
            </Dialog.Title>

            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>Tên VPS *</label>
                  <input
                    type='text'
                    value={vpsFormData.name}
                    onChange={e => setVpsFormData(prev => ({ ...prev, name: e.target.value }))}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                    placeholder='Production Server 1'
                  />
                </div>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>Loại VPS</label>
                  <select
                    value={vpsFormData.type}
                    onChange={e =>
                      setVpsFormData(prev => ({ ...prev, type: e.target.value as any }))
                    }
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  >
                    <option value='VPS'>VPS</option>
                    <option value='CLOUD'>Cloud Server</option>
                    <option value='EDGE'>Edge Computing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>Mô tả</label>
                <textarea
                  value={vpsFormData.description}
                  onChange={e => setVpsFormData(prev => ({ ...prev, description: e.target.value }))}
                  className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  rows={2}
                  placeholder='Mô tả về VPS server...'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>Host/IP *</label>
                  <input
                    type='text'
                    value={vpsFormData.host}
                    onChange={e => setVpsFormData(prev => ({ ...prev, host: e.target.value }))}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                    placeholder='192.168.1.100 hoặc server.example.com'
                  />
                </div>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>Port</label>
                  <input
                    type='number'
                    value={vpsFormData.port}
                    onChange={e =>
                      setVpsFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 22 }))
                    }
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                    placeholder='22'
                  />
                </div>
              </div>

              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>Username *</label>
                <input
                  type='text'
                  value={vpsFormData.username}
                  onChange={e => setVpsFormData(prev => ({ ...prev, username: e.target.value }))}
                  className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  placeholder='root'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>Password</label>
                  <input
                    type='password'
                    value={vpsFormData.password}
                    onChange={e => setVpsFormData(prev => ({ ...prev, password: e.target.value }))}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                    placeholder='Mật khẩu SSH'
                  />
                </div>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>
                    Private Key
                  </label>
                  <textarea
                    value={vpsFormData.privateKey}
                    onChange={e =>
                      setVpsFormData(prev => ({ ...prev, privateKey: e.target.value }))
                    }
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                    rows={3}
                    placeholder='-----BEGIN PRIVATE KEY-----'
                  />
                </div>
              </div>

              <div className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-3'>
                <p className='text-blue-300 text-sm'>
                  💡 <strong>Lưu ý:</strong> Bạn có thể sử dụng password hoặc private key để xác
                  thực SSH. Private key được khuyến nghị cho bảo mật tốt hơn.
                </p>
              </div>
            </div>

            <div className='flex items-center justify-end space-x-4 mt-6 pt-4 border-t border-gray-800'>
              <button
                onClick={() => setShowCreateVPSModal(false)}
                className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700'
              >
                Hủy
              </button>
              <button
                onClick={handleCreateVPS}
                disabled={saveLoading}
                className='px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50'
              >
                {saveLoading ? 'Đang tạo...' : 'Tạo VPS'}
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Edit VPS Modal */}
      <Dialog
        open={showEditVPSModal}
        onClose={() => setShowEditVPSModal(false)}
        className='fixed z-50 inset-0 overflow-y-auto'
      >
        <div className='flex items-center justify-center min-h-screen px-4'>
          <div className='fixed inset-0 bg-black/70' aria-hidden='true' />
          <div className='relative bg-gray-900 rounded-2xl p-6 w-full max-w-2xl mx-auto z-10 border border-white/10'>
            <Dialog.Title className='text-xl font-bold text-white mb-4'>
              Chỉnh sửa VPS: {selectedVPS?.name}
            </Dialog.Title>

            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>Tên VPS *</label>
                  <input
                    type='text'
                    value={vpsFormData.name}
                    onChange={e => setVpsFormData(prev => ({ ...prev, name: e.target.value }))}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>Loại VPS</label>
                  <select
                    value={vpsFormData.type}
                    onChange={e =>
                      setVpsFormData(prev => ({ ...prev, type: e.target.value as any }))
                    }
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  >
                    <option value='VPS'>VPS</option>
                    <option value='CLOUD'>Cloud Server</option>
                    <option value='EDGE'>Edge Computing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>Mô tả</label>
                <textarea
                  value={vpsFormData.description}
                  onChange={e => setVpsFormData(prev => ({ ...prev, description: e.target.value }))}
                  className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  rows={2}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>Host/IP *</label>
                  <input
                    type='text'
                    value={vpsFormData.host}
                    onChange={e => setVpsFormData(prev => ({ ...prev, host: e.target.value }))}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>Port</label>
                  <input
                    type='number'
                    value={vpsFormData.port}
                    onChange={e =>
                      setVpsFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 22 }))
                    }
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  />
                </div>
              </div>

              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>Username *</label>
                <input
                  type='text'
                  value={vpsFormData.username}
                  onChange={e => setVpsFormData(prev => ({ ...prev, username: e.target.value }))}
                  className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>
                    Password (để trống nếu không thay đổi)
                  </label>
                  <input
                    type='password'
                    value={vpsFormData.password}
                    onChange={e => setVpsFormData(prev => ({ ...prev, password: e.target.value }))}
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                    placeholder='Mật khẩu mới'
                  />
                </div>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>
                    Private Key (để trống nếu không thay đổi)
                  </label>
                  <textarea
                    value={vpsFormData.privateKey}
                    onChange={e =>
                      setVpsFormData(prev => ({ ...prev, privateKey: e.target.value }))
                    }
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                    rows={3}
                    placeholder='Private key mới'
                  />
                </div>
              </div>
            </div>

            <div className='flex items-center justify-end space-x-4 mt-6 pt-4 border-t border-gray-800'>
              <button
                onClick={() => setShowEditVPSModal(false)}
                className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700'
              >
                Hủy
              </button>
              <button
                onClick={handleEditVPS}
                disabled={saveLoading}
                className='px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50'
              >
                {saveLoading ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Delete VPS Modal */}
      <Dialog
        open={showDeleteVPSModal}
        onClose={() => setShowDeleteVPSModal(false)}
        className='fixed z-50 inset-0 overflow-y-auto'
      >
        <div className='flex items-center justify-center min-h-screen px-4'>
          <div className='fixed inset-0 bg-black/70' aria-hidden='true' />
          <div className='relative bg-gray-900 rounded-2xl p-6 w-full max-w-md mx-auto z-10 border border-white/10'>
            <Dialog.Title className='text-xl font-bold text-white mb-4'>
              Xác nhận xóa VPS
            </Dialog.Title>
            <div className='text-white mb-4'>
              Bạn có chắc chắn muốn xóa VPS connection{' '}
              <span className='font-semibold text-red-400'>{selectedVPS?.name}</span>?
              <br />
              <span className='text-sm text-gray-400 mt-2 block'>
                Hành động này sẽ xóa tất cả deployments và monitoring data liên quan. Không thể hoàn
                tác.
              </span>
            </div>
            <div className='flex items-center justify-end space-x-4'>
              <button
                onClick={() => setShowDeleteVPSModal(false)}
                className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700'
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteVPS}
                disabled={deleteLoading}
                className='px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50'
              >
                {deleteLoading ? 'Đang xóa...' : 'Xóa VPS'}
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Create Deployment Modal */}
      <Dialog
        open={showCreateDeploymentModal}
        onClose={() => setShowCreateDeploymentModal(false)}
        className='fixed z-50 inset-0 overflow-y-auto'
      >
        <div className='flex items-center justify-center min-h-screen px-4'>
          <div className='fixed inset-0 bg-black/70' aria-hidden='true' />
          <div className='relative bg-gray-900 rounded-2xl p-6 w-full max-w-2xl mx-auto z-10 border border-white/10'>
            <Dialog.Title className='text-xl font-bold text-white mb-4'>
              Deploy Agent lên VPS
            </Dialog.Title>

            <div className='space-y-4'>
              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>
                  Tên Deployment *
                </label>
                <input
                  type='text'
                  value={deploymentFormData.name}
                  onChange={e => setDeploymentFormData(prev => ({ ...prev, name: e.target.value }))}
                  className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  placeholder='Production Agent Deployment'
                />
              </div>

              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>Mô tả</label>
                <textarea
                  value={deploymentFormData.description}
                  onChange={e =>
                    setDeploymentFormData(prev => ({ ...prev, description: e.target.value }))
                  }
                  className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  rows={2}
                  placeholder='Mô tả về deployment này...'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>
                    Chọn Agent *
                  </label>
                  <select
                    value={deploymentFormData.agentId}
                    onChange={e =>
                      setDeploymentFormData(prev => ({ ...prev, agentId: e.target.value }))
                    }
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  >
                    <option value=''>-- Chọn Agent --</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='block text-gray-300 text-sm font-medium mb-2'>Chọn VPS *</label>
                  <select
                    value={deploymentFormData.vpsId}
                    onChange={e =>
                      setDeploymentFormData(prev => ({ ...prev, vpsId: e.target.value }))
                    }
                    className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  >
                    <option value=''>-- Chọn VPS --</option>
                    {vpsConnections
                      .filter(vps => vps.status === 'CONNECTED')
                      .map(vps => (
                        <option key={vps.id} value={vps.id}>
                          {vps.name} ({vps.host})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className='block text-gray-300 text-sm font-medium mb-2'>
                  Deployment Configuration
                </label>
                <textarea
                  value={deploymentFormData.config}
                  onChange={e =>
                    setDeploymentFormData(prev => ({ ...prev, config: e.target.value }))
                  }
                  className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 font-mono text-sm'
                  rows={8}
                  placeholder='JSON configuration...'
                />
                <p className='text-xs text-gray-400 mt-1'>
                  Configuration JSON để setup environment, port, memory limits, etc.
                </p>
              </div>

              <div className='bg-green-500/10 border border-green-500/30 rounded-lg p-3'>
                <p className='text-green-300 text-sm'>
                  🚀 <strong>Deploy Process:</strong> Agent sẽ được build, upload và deploy lên VPS
                  được chọn. Quá trình có thể mất vài phút để hoàn thành.
                </p>
              </div>
            </div>

            <div className='flex items-center justify-end space-x-4 mt-6 pt-4 border-t border-gray-800'>
              <button
                onClick={() => setShowCreateDeploymentModal(false)}
                className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700'
              >
                Hủy
              </button>
              <button
                onClick={handleCreateDeployment}
                disabled={saveLoading || !deploymentFormData.agentId || !deploymentFormData.vpsId}
                className='px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50'
              >
                {saveLoading ? 'Đang deploy...' : 'Deploy Agent'}
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* View Logs Modal */}
      <Dialog
        open={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        className='fixed z-50 inset-0 overflow-y-auto'
      >
        <div className='flex items-center justify-center min-h-screen px-4'>
          <div className='fixed inset-0 bg-black/70' aria-hidden='true' />
          <div className='relative bg-gray-900 rounded-2xl p-6 w-full max-w-4xl mx-auto z-10 border border-white/10'>
            <Dialog.Title className='text-xl font-bold text-white mb-4'>
              Deployment Logs: {selectedDeployment?.name}
            </Dialog.Title>

            <div className='bg-black rounded-lg p-4 max-h-96 overflow-y-auto'>
              <pre className='text-green-400 text-sm font-mono whitespace-pre-wrap'>
                {selectedDeployment?.logs || 'Không có logs nào...'}
              </pre>
            </div>

            <div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-800'>
              <div className='flex items-center space-x-2'>
                <span
                  className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(selectedDeployment?.status || 'PENDING')}`}
                >
                  {getStatusIcon(selectedDeployment?.status || 'PENDING')}
                  <span className='ml-1'>{selectedDeployment?.status}</span>
                </span>
                <span className='text-gray-400 text-sm'>
                  Last updated:{' '}
                  {selectedDeployment
                    ? new Date(selectedDeployment.updatedAt).toLocaleString('vi-VN')
                    : ''}
                </span>
              </div>
              <button
                onClick={() => setShowLogsModal(false)}
                className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700'
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// VPS Connections Tab Component
interface VPSConnectionsTabProps {
  connections: VPSConnection[];
  loading: boolean;
  onEdit: (vps: VPSConnection) => void;
  onDelete: (vps: VPSConnection) => void;
  onTestConnection: (vps: VPSConnection) => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactElement;
  actionLoading: boolean;
  canEditVPS: boolean;
  canDeleteVPS: boolean;
}

function VPSConnectionsTab({
  connections,
  loading,
  onEdit,
  onDelete,
  onTestConnection,
  getStatusColor,
  getStatusIcon,
  actionLoading,
  canEditVPS,
  canDeleteVPS,
}: VPSConnectionsTabProps) {
  if (loading) {
    return (
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10'>
        <div className='animate-pulse space-y-4'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='bg-white/10 rounded-xl p-6 h-32' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
      {connections.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {connections.map(vps => (
            <div
              key={vps.id}
              className='bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-200'
            >
              {/* Header */}
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center space-x-3'>
                  <div
                    className={`p-2 rounded-lg ${vps.type === 'VPS' ? 'bg-blue-500/20' : vps.type === 'CLOUD' ? 'bg-green-500/20' : 'bg-purple-500/20'}`}
                  >
                    <Server
                      className={`w-5 h-5 ${vps.type === 'VPS' ? 'text-blue-400' : vps.type === 'CLOUD' ? 'text-green-400' : 'text-purple-400'}`}
                    />
                  </div>
                  <div>
                    <h3 className='text-white font-semibold'>{vps.name}</h3>
                    <p className='text-gray-400 text-sm'>{vps.type}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(vps.status)}`}
                >
                  {getStatusIcon(vps.status)}
                  <span className='ml-1'>{vps.status}</span>
                </span>
              </div>

              {/* Connection Info */}
              <div className='space-y-2 mb-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-400 text-sm'>Host:</span>
                  <span className='text-white text-sm font-mono'>{vps.host}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-400 text-sm'>Port:</span>
                  <span className='text-white text-sm'>{vps.port}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-400 text-sm'>User:</span>
                  <span className='text-white text-sm'>{vps.username}</span>
                </div>
                {vps.lastChecked && (
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-400 text-sm'>Last Check:</span>
                    <span className='text-white text-sm'>
                      {new Date(vps.lastChecked).toLocaleTimeString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {vps.description && (
                <p className='text-gray-300 text-sm mb-4 bg-white/5 rounded-lg p-3'>
                  {vps.description}
                </p>
              )}

              {/* Actions */}
              <div className='flex items-center space-x-2'>
                <button
                  onClick={() => onTestConnection(vps)}
                  disabled={actionLoading}
                  className='flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-1 disabled:opacity-50'
                >
                  <Wifi className='w-4 h-4' />
                  <span>Test</span>
                </button>
                {canEditVPS && (
                  <button
                    onClick={() => onEdit(vps)}
                    className='px-3 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center'
                  >
                    <Edit className='w-4 h-4' />
                  </button>
                )}
                {canDeleteVPS && (
                  <button
                    onClick={() => onDelete(vps)}
                    className='px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-12'>
          <Server className='w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50' />
          <h3 className='text-white font-semibold mb-2'>Chưa có VPS Connection</h3>
          <p className='text-gray-400 mb-4'>
            Thêm VPS connection đầu tiên để bắt đầu deploy agents
          </p>
        </div>
      )}
    </div>
  );
}

// Deployments Tab Component
interface DeploymentsTabProps {
  deployments: VPSDeployment[];
  loading: boolean;
  onAction: (deployment: VPSDeployment, action: 'start' | 'stop' | 'restart') => void;
  onViewLogs: (deployment: VPSDeployment) => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactElement;
  actionLoading: boolean;
  canDeployAgents: boolean;
}

function DeploymentsTab({
  deployments,
  loading,
  onAction,
  onViewLogs,
  getStatusColor,
  getStatusIcon,
  actionLoading,
  canDeployAgents,
}: DeploymentsTabProps) {
  if (loading) {
    return (
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10'>
        <div className='animate-pulse space-y-4'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='bg-white/10 rounded-xl p-6 h-20' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden'>
      {deployments.length > 0 ? (
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-white/5 border-b border-white/10'>
              <tr>
                <th className='text-left p-4 text-gray-300 font-medium'>Deployment</th>
                <th className='text-left p-4 text-gray-300 font-medium'>Agent</th>
                <th className='text-left p-4 text-gray-300 font-medium'>VPS</th>
                <th className='text-left p-4 text-gray-300 font-medium'>Status</th>
                <th className='text-left p-4 text-gray-300 font-medium'>Created</th>
                <th className='text-right p-4 text-gray-300 font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deployments.map(deployment => (
                <tr
                  key={deployment.id}
                  className='border-b border-white/5 hover:bg-white/5 transition-colors'
                >
                  <td className='p-4'>
                    <div>
                      <div className='text-white font-medium'>{deployment.name}</div>
                      {deployment.description && (
                        <div className='text-gray-400 text-sm mt-1'>{deployment.description}</div>
                      )}
                    </div>
                  </td>
                  <td className='p-4'>
                    <div className='text-white'>{deployment.agent?.name || 'N/A'}</div>
                  </td>
                  <td className='p-4'>
                    <div className='text-white'>VPS #{deployment.vpsId.slice(-8)}</div>
                  </td>
                  <td className='p-4'>
                    <span
                      className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(deployment.status)}`}
                    >
                      {getStatusIcon(deployment.status)}
                      <span className='ml-1'>{deployment.status}</span>
                    </span>
                  </td>
                  <td className='p-4'>
                    <div className='text-gray-300 text-sm'>
                      {new Date(deployment.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td className='p-4'>
                    <div className='flex items-center justify-end space-x-2'>
                      {/* Action buttons based on status */}
                      {deployment.status === 'RUNNING' && canDeployAgents && (
                        <>
                          <button
                            onClick={() => onAction(deployment, 'stop')}
                            disabled={actionLoading}
                            className='p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-sm disabled:opacity-50'
                            title='Stop'
                          >
                            <Square className='w-4 h-4' />
                          </button>
                          <button
                            onClick={() => onAction(deployment, 'restart')}
                            disabled={actionLoading}
                            className='p-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded text-sm disabled:opacity-50'
                            title='Restart'
                          >
                            <RotateCcw className='w-4 h-4' />
                          </button>
                        </>
                      )}
                      {deployment.status === 'STOPPED' && canDeployAgents && (
                        <button
                          onClick={() => onAction(deployment, 'start')}
                          disabled={actionLoading}
                          className='p-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded text-sm disabled:opacity-50'
                          title='Start'
                        >
                          <Play className='w-4 h-4' />
                        </button>
                      )}
                      <button
                        onClick={() => onViewLogs(deployment)}
                        className='p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-sm'
                        title='View Logs'
                      >
                        <Eye className='w-4 h-4' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className='text-center py-12 p-6'>
          <Upload className='w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50' />
          <h3 className='text-white font-semibold mb-2'>Chưa có Deployment</h3>
          <p className='text-gray-400 mb-4'>Deploy agent đầu tiên lên VPS của bạn</p>
        </div>
      )}
    </div>
  );
}

// Monitoring Tab Component
interface MonitoringTabProps {
  vpsConnections: VPSConnection[];
  monitoring: VPSMonitoring[];
  loading: boolean;
}

function MonitoringTab({ vpsConnections, monitoring, loading }: MonitoringTabProps) {
  if (loading) {
    return (
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10'>
        <div className='animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='bg-white/10 rounded-xl p-6 h-40' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-blue-500/20 rounded-lg'>
              <Server className='w-6 h-6 text-blue-400' />
            </div>
            <div>
              <div className='text-2xl font-bold text-white'>{vpsConnections.length}</div>
              <div className='text-gray-400 text-sm'>Total VPS</div>
            </div>
          </div>
        </div>

        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-green-500/20 rounded-lg'>
              <CheckCircle className='w-6 h-6 text-green-400' />
            </div>
            <div>
              <div className='text-2xl font-bold text-white'>
                {vpsConnections.filter(vps => vps.status === 'CONNECTED').length}
              </div>
              <div className='text-gray-400 text-sm'>Connected</div>
            </div>
          </div>
        </div>

        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-yellow-500/20 rounded-lg'>
              <Cpu className='w-6 h-6 text-yellow-400' />
            </div>
            <div>
              <div className='text-2xl font-bold text-white'>
                {monitoring.length > 0
                  ? (
                      monitoring.reduce((sum, m) => sum + (m.cpuUsage || 0), 0) / monitoring.length
                    ).toFixed(1)
                  : 0}
                %
              </div>
              <div className='text-gray-400 text-sm'>Avg CPU</div>
            </div>
          </div>
        </div>

        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-purple-500/20 rounded-lg'>
              <Database className='w-6 h-6 text-purple-400' />
            </div>
            <div>
              <div className='text-2xl font-bold text-white'>
                {monitoring.length > 0
                  ? (
                      monitoring.reduce((sum, m) => sum + (m.ramUsage || 0), 0) / monitoring.length
                    ).toFixed(1)
                  : 0}
                %
              </div>
              <div className='text-gray-400 text-sm'>Avg RAM</div>
            </div>
          </div>
        </div>
      </div>

      {/* VPS Monitoring Details */}
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
        <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
          <Monitor className='w-6 h-6' />
          <span>VPS Monitoring Details</span>
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {vpsConnections.length > 0 ? (
            vpsConnections.map(vps => {
              const vpsMonitoring = monitoring.find(m => m.vpsId === vps.id);
              return (
                <div key={vps.id} className='bg-white/5 rounded-xl p-4 border border-white/10'>
                  <div className='flex items-center justify-between mb-4'>
                    <h4 className='text-white font-semibold'>{vps.name}</h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs border ${vps.status === 'CONNECTED' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}
                    >
                      {vps.status}
                    </span>
                  </div>

                  {vpsMonitoring ? (
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='text-center'>
                        <div className='flex items-center justify-center space-x-2 mb-2'>
                          <Cpu className='w-4 h-4 text-blue-400' />
                          <span className='text-sm text-gray-400'>CPU</span>
                        </div>
                        <div className='text-2xl font-bold text-white'>
                          {vpsMonitoring.cpuUsage?.toFixed(1) || 0}%
                        </div>
                      </div>

                      <div className='text-center'>
                        <div className='flex items-center justify-center space-x-2 mb-2'>
                          <Database className='w-4 h-4 text-green-400' />
                          <span className='text-sm text-gray-400'>RAM</span>
                        </div>
                        <div className='text-2xl font-bold text-white'>
                          {vpsMonitoring.ramUsage?.toFixed(1) || 0}%
                        </div>
                      </div>

                      <div className='text-center'>
                        <div className='flex items-center justify-center space-x-2 mb-2'>
                          <HardDrive className='w-4 h-4 text-orange-400' />
                          <span className='text-sm text-gray-400'>Disk</span>
                        </div>
                        <div className='text-2xl font-bold text-white'>
                          {vpsMonitoring.diskUsage?.toFixed(1) || 0}%
                        </div>
                      </div>

                      <div className='text-center'>
                        <div className='flex items-center justify-center space-x-2 mb-2'>
                          <Network className='w-4 h-4 text-purple-400' />
                          <span className='text-sm text-gray-400'>Network</span>
                        </div>
                        <div className='text-lg font-bold text-white'>
                          <div className='text-xs text-gray-400'>
                            ↑{(vpsMonitoring.networkOut || 0).toFixed(1)}MB
                          </div>
                          <div className='text-xs text-gray-400'>
                            ↓{(vpsMonitoring.networkIn || 0).toFixed(1)}MB
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='text-center text-gray-400 py-8'>
                      <Monitor className='w-8 h-8 mx-auto mb-2 opacity-50' />
                      <p className='text-sm'>Không có dữ liệu monitoring</p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className='col-span-full text-center py-12'>
              <Activity className='w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50' />
              <p className='text-gray-400'>Chưa có VPS để monitoring</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
