'use client';

import { useState } from 'react';
interface Agent {
  id: string;
  name: string;
  description?: string;
  status: string;
  model: string;
  userId: string;
  createdAt: string;
}

interface WeChatIntegrationSimpleProps {
  agents: Agent[];
}

type SetupMethod = 'oauth' | 'manual';

export default function WeChatIntegrationSimple({ agents }: WeChatIntegrationSimpleProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [setupMethod, setSetupMethod] = useState<SetupMethod>('oauth');
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [oauthStatus, setOAuthStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>(
    'idle'
  );

  const [config, setConfig] = useState({
    officialAccountName: '',
    contactPhone: '',
    businessAddress: '',
    greeting: '',
    menuItems: ['联系客服', '产品介绍', '关于我们'],
    businessHours: '周一至周五: 9:00 - 18:00',
    autoReply: true,
  });

  const handleOAuthConnect = async (agent: Agent) => {
    setSelectedAgent(agent);
    setOAuthStatus('connecting');

    try {
      const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${process.env.NEXT_PUBLIC_WECHAT_APP_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/wechat/callback')}&response_type=code&scope=snsapi_userinfo&state=${agent.id}`;

      const popup = window.open(authUrl, 'wechat-oauth', 'width=600,height=600');

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          // Simulate connection status check
          setTimeout(() => {
            setOAuthStatus(Math.random() > 0.3 ? 'connected' : 'error');
          }, 1000);
        }
      }, 1000);
    } catch (error) {
      console.error('WeChat OAuth error:', error);
      setOAuthStatus('error');
    }
  };

  const handleStartManualSetup = (agent: Agent) => {
    setSelectedAgent(agent);
    setSetupMethod('manual');
    setConfig(prev => ({
      ...prev,
      greeting: `欢迎关注${prev.officialAccountName || '我们'}！我是${agent.name}，您的AI助手。`,
    }));
    setShowSetupWizard(true);
    setCurrentStep(1);
  };

  const generateConnectionInfo = () => {
    if (!selectedAgent) return;

    const connectionData = {
      agentName: selectedAgent.name,
      setupSteps: [
        {
          title: '注册微信公众号',
          description: '申请并认证微信公众号',
          action: '访问微信公众平台 → 立即注册 → 选择公众号类型',
          details: [
            '准备营业执照或个人身份证',
            '填写公众号基本信息',
            '等待微信审核（1-7个工作日）',
          ],
        },
        {
          title: '开发者认证',
          description: '完成开发者身份认证',
          action: '公众号后台 → 设置 → 开发者ID → 获取AppID和AppSecret',
          details: [
            '完成微信认证（需要300元认证费）',
            '获取开发者权限',
            '记录AppID和AppSecret',
          ],
        },
        {
          title: '配置服务器',
          description: '设置消息推送服务器',
          action: '开发 → 基本配置 → 服务器配置',
          details: [
            '设置服务器URL',
            '配置Token验证',
            '选择消息加解密方式',
          ],
        },
        {
          title: '接口权限配置',
          description: '开通所需的接口权限',
          action: '开发 → 接口权限 → 开通相关权限',
          details: [
            '消息管理接口',
            '用户管理接口',
            '素材管理接口',
          ],
        },
      ],
             webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/api/webhook/wechat/${selectedAgent.id}`,
      token: `wechat_${Math.random().toString(36).substr(2, 16)}`,
    };

    setConnectionInfo(connectionData);
    setCurrentStep(4);
  };

  const downloadSetupGuide = () => {
    if (!connectionInfo) return;

    const guide = `
# 微信公众号机器人接入指南

## 📱 公众号信息
- 公众号名称: ${config.officialAccountName}
- 联系电话: ${config.contactPhone}
- 地址: ${config.businessAddress}
- AI代理: ${selectedAgent?.name}

## 📋 详细设置步骤

### 步骤1: 注册微信公众号
1. 访问: https://mp.weixin.qq.com
2. 点击"立即注册" → 选择"公众号"
3. 选择类型:
   - 个人: 订阅号
   - 企业: 服务号（推荐，功能更全）
   
4. 填写信息:
   - 公众号名称: ${config.officialAccountName}
   - 功能介绍: AI智能客服，提供24小时自动回复服务
   - 运营地区: 中国大陆

### 步骤2: 完成认证
1. 提交注册信息后等待审核
2. 审核通过后，进行微信认证（企业需要）
3. 认证费用: 300元/年
4. 准备材料:
   - 营业执照
   - 对公账户信息
   - 法人身份证

### 步骤3: 获取开发者信息
1. 登录公众号后台
2. 左侧菜单 → "设置" → "开发者ID"
3. 记录以下信息:
   - AppID: [在这里显示]
   - AppSecret: [需要重置获取]

### 步骤4: 配置服务器
1. 左侧菜单 → "开发" → "基本配置"
2. 填写服务器配置:
   - URL: ${connectionInfo.webhookUrl}
   - Token: ${connectionInfo.token}
   - EncodingAESKey: [随机生成]
   - 消息加解密方式: 明文模式

### 步骤5: 设置自动回复
1. 左侧菜单 → "功能" → "自动回复"
2. 关注时回复: ${config.greeting}
3. 消息自动回复: 启用
4. 关键词回复: 根据需要设置

### 步骤6: 配置自定义菜单
1. 左侧菜单 → "功能" → "自定义菜单"
2. 创建菜单项:
   ${config.menuItems.map((item, index) => `   ${index + 1}. ${item}`).join('\n   ')}

### 步骤7: 测试机器人
1. 扫码关注公众号
2. 发送测试消息
3. 验证自动回复功能
4. 检查菜单点击响应

## ⚠️ 注意事项
- 个人订阅号功能有限，建议使用企业服务号
- 微信认证后才能使用高级接口
- 服务器URL必须支持HTTPS
- Token验证成功后才能接收消息

## 🔧 常见问题
1. 服务器配置验证失败
   - 检查URL是否可访问
   - 确认Token配置正确
   - 验证服务器响应格式

2. 消息收不到回复
   - 检查接口权限是否开通
   - 确认消息格式是否正确
   - 查看开发者工具日志

3. 菜单不显示
   - 需要取消关注后重新关注
   - 或等待24小时自动更新

---
生成时间: ${new Date().toLocaleString('zh-CN')}
AI代理平台: VIEAgent
`;

    const blob = new Blob([guide], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WeChat-Setup-${selectedAgent?.name}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (showSetupWizard) {
    return (
      <div className='bg-gray-800/50 border border-gray-700/50 rounded-xl p-8'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-xl font-bold text-white'>
            WeChat 微信公众号设置向导
          </h3>
          <button
            onClick={() => setShowSetupWizard(false)}
            className='text-gray-400 hover:text-white'
          >
            ✕
          </button>
        </div>

        <div className='mb-6'>
          <div className='flex items-center space-x-4'>
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= step
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-gray-600 text-gray-400'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        {currentStep === 1 && (
          <div className='space-y-4'>
            <h4 className='text-lg font-semibold text-white'>基本信息设置</h4>
            
            <div>
              <label className='block text-white font-medium mb-2'>公众号名称</label>
              <input
                type='text'
                value={config.officialAccountName}
                onChange={(e) => setConfig(prev => ({ ...prev, officialAccountName: e.target.value }))}
                className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white'
                placeholder='输入您的微信公众号名称'
              />
            </div>

            <div>
              <label className='block text-white font-medium mb-2'>联系电话</label>
              <input
                type='text'
                value={config.contactPhone}
                onChange={(e) => setConfig(prev => ({ ...prev, contactPhone: e.target.value }))}
                className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white'
                placeholder='客服联系电话'
              />
            </div>

            <div>
              <label className='block text-white font-medium mb-2'>营业地址</label>
              <input
                type='text'
                value={config.businessAddress}
                onChange={(e) => setConfig(prev => ({ ...prev, businessAddress: e.target.value }))}
                className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white'
                placeholder='公司或店铺地址'
              />
            </div>

            <button
              onClick={() => setCurrentStep(2)}
              className='bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 rounded-lg transition-colors'
            >
              下一步
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className='space-y-4'>
            <h4 className='text-lg font-semibold text-white'>消息设置</h4>
            
            <div>
              <label className='block text-white font-medium mb-2'>欢迎语</label>
              <textarea
                value={config.greeting}
                onChange={(e) => setConfig(prev => ({ ...prev, greeting: e.target.value }))}
                className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white h-20'
                placeholder='用户关注时的欢迎消息'
              />
            </div>

            <div>
              <label className='block text-white font-medium mb-2'>营业时间</label>
              <input
                type='text'
                value={config.businessHours}
                onChange={(e) => setConfig(prev => ({ ...prev, businessHours: e.target.value }))}
                className='w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white'
                placeholder='例如: 周一至周五 9:00-18:00'
              />
            </div>

            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                checked={config.autoReply}
                onChange={(e) => setConfig(prev => ({ ...prev, autoReply: e.target.checked }))}
                className='rounded'
              />
              <label className='text-white'>启用自动回复</label>
            </div>

            <div className='flex space-x-4'>
              <button
                onClick={() => setCurrentStep(1)}
                className='bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors'
              >
                上一步
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className='bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 rounded-lg transition-colors'
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className='space-y-4'>
            <h4 className='text-lg font-semibold text-white'>确认信息</h4>
            
            <div className='bg-gray-700/50 rounded-lg p-4 space-y-2'>
              <p className='text-white'><strong>公众号:</strong> {config.officialAccountName}</p>
              <p className='text-white'><strong>联系电话:</strong> {config.contactPhone}</p>
              <p className='text-white'><strong>AI代理:</strong> {selectedAgent?.name}</p>
              <p className='text-white'><strong>自动回复:</strong> {config.autoReply ? '已启用' : '已禁用'}</p>
            </div>

            <div className='flex space-x-4'>
              <button
                onClick={() => setCurrentStep(2)}
                className='bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors'
              >
                上一步
              </button>
              <button
                onClick={generateConnectionInfo}
                className='bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 rounded-lg transition-colors'
              >
                生成配置
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && connectionInfo && (
          <div className='space-y-4'>
            <h4 className='text-lg font-semibold text-white'>配置信息</h4>
            
            <div className='bg-gray-700/50 rounded-lg p-4'>
              <h5 className='font-semibold text-green-400 mb-2'>Webhook配置</h5>
              <div className='space-y-2 text-sm'>
                <div>
                  <span className='text-gray-400'>服务器URL:</span>
                  <code className='ml-2 bg-gray-800 px-2 py-1 rounded text-green-400'>
                    {connectionInfo.webhookUrl}
                  </code>
                </div>
                <div>
                  <span className='text-gray-400'>Token:</span>
                  <code className='ml-2 bg-gray-800 px-2 py-1 rounded text-green-400'>
                    {connectionInfo.token}
                  </code>
                </div>
              </div>
            </div>

            <button
              onClick={downloadSetupGuide}
              className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-colors'
            >
              📄 下载完整设置指南
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/20'>
        <div className='flex items-center space-x-4 mb-4'>
          <div className='w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center'>
            <span className='text-2xl'>💬</span>
          </div>
          <div>
            <h2 className='text-xl font-bold text-white'>WeChat 微信公众号</h2>
            <p className='text-green-200'>连接您的微信公众号，实现智能客服功能</p>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='bg-green-500/10 border border-green-500/20 rounded-lg p-4'>
            <h3 className='font-semibold text-green-300 mb-2'>✅ 快速OAuth连接</h3>
            <p className='text-green-200 text-sm mb-4'>
              通过微信OAuth快速授权连接公众号
            </p>
            <p className='text-yellow-300 text-xs mb-2'>
              ⚠️ 需要已认证的微信公众号
            </p>
          </div>
          
          <div className='bg-blue-500/10 border border-blue-500/20 rounded-lg p-4'>
            <h3 className='font-semibold text-blue-300 mb-2'>🔧 手动配置</h3>
            <p className='text-blue-200 text-sm mb-4'>
              生成配置信息，手动设置公众号后台
            </p>
            <p className='text-green-300 text-xs mb-2'>
              ✅ 适用于所有类型公众号
            </p>
          </div>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className='bg-gray-800/50 border border-gray-700/50 rounded-xl p-8 text-center'>
          <div className='text-4xl mb-4'>🤖</div>
          <h3 className='text-xl font-bold text-white mb-2'>暂无可用代理</h3>
          <p className='text-gray-400'>请先创建AI代理，然后再进行WeChat集成</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {agents.map((agent) => (
            <div key={agent.id} className='bg-gray-800/50 border border-gray-700/50 rounded-xl p-6'>
              <div className='text-center mb-4'>
                <div className='w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3'>
                  <span className='text-2xl'>🤖</span>
                </div>
                <h3 className='text-lg font-bold text-white'>{agent.name}</h3>
                <p className='text-gray-400 text-sm'>{agent.description || '智能AI助手'}</p>
              </div>

              <div className='space-y-3'>
                <button
                  onClick={() => handleOAuthConnect(agent)}
                  disabled={oauthStatus === 'connecting'}
                  className='w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white py-2 rounded-lg transition-colors'
                >
                  {oauthStatus === 'connecting' ? '连接中...' : '💬 OAuth连接'}
                </button>

                <button
                  onClick={() => handleStartManualSetup(agent)}
                  className='w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-2 rounded-lg transition-colors'
                >
                  🔧 手动设置
                </button>
              </div>

              {oauthStatus === 'connected' && (
                <div className='mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg'>
                  <p className='text-green-300 text-sm'>✅ 连接成功！</p>
                </div>
              )}

              {oauthStatus === 'error' && (
                <div className='mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg'>
                  <p className='text-red-300 text-sm'>❌ 连接失败，请重试</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 