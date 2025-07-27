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

interface WebIntegrationSimpleProps {
  agents: Agent[];
}

export default function WebIntegrationSimple({ agents }: WebIntegrationSimpleProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  const handleStartSetup = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowSetupWizard(true);
  };

  return (
    <div className='space-y-8'>
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10'>
        <h2 className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
          <span className='text-3xl'></span>
          <span>Kết Nối Website</span>
        </h2>

        <div className='bg-green-500/10 border border-green-500/20 rounded-xl p-6 mb-6 text-center'>
          <div className='text-4xl mb-4'></div>
          <h3 className='text-green-300 font-semibold mb-2'>Dễ Dàng Kết Nối!</h3>
          <p className='text-green-200 text-sm'>
            Chỉ cần 3 bước đơn giản để thêm chatbot vào website của bạn. Không cần biết code!
          </p>
        </div>

        <div className='mb-8'>
          <h3 className='text-xl font-bold text-white mb-4'>
            Chọn AI Assistant để kết nối ({agents.length})
          </h3>

          {agents.length === 0 ? (
            <div className='bg-gray-500/10 border border-gray-500/20 rounded-xl p-8 text-center'>
              <div className='text-4xl mb-4'></div>
              <h3 className='text-gray-300 font-semibold mb-2'>Chưa có AI Assistant</h3>
              <p className='text-gray-400 text-sm mb-4'>
                Hãy tạo AI Assistant trước để có thể kết nối vào website.
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {agents.map(agent => (
                <div
                  key={agent.id}
                  className='bg-white/5 border border-white/10 rounded-xl p-6 hover:border-green-500/30 transition-colors'
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div className='w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center'>
                      <span className='text-2xl'></span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        agent.status === 'ACTIVE'
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}
                    >
                      {agent.status === 'ACTIVE' ? 'Sẵn sàng' : 'Chưa sẵn sàng'}
                    </span>
                  </div>

                  <h4 className='text-white font-semibold mb-2'>{agent.name}</h4>
                  <p className='text-gray-400 text-sm mb-4 line-clamp-2'>
                    {agent.description || 'AI Assistant thông minh giúp hỗ trợ khách hàng'}
                  </p>

                  <div className='text-gray-400 text-xs mb-4'>
                    Model: <span className='text-green-300'>{agent.model}</span>
                    Tạo: {new Date(agent.createdAt).toLocaleDateString('vi-VN')}
                  </div>

                  <button
                    onClick={() => handleStartSetup(agent)}
                    className='w-full bg-green-500/20 text-green-300 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors border border-green-500/30'
                  >
                    Bắt Đầu Kết Nối
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl p-4'>
            <h3 className='text-blue-300 font-semibold mb-2 flex items-center space-x-2'>
              <span></span>
              <span>Nhanh Chóng</span>
            </h3>
            <p className='text-blue-200 text-sm'>
              Chỉ cần copy-paste 1 đoạn code vào website là xong. Không cần config phức tạp.
            </p>
          </div>

          <div className='bg-purple-500/10 border border-purple-500/20 rounded-xl p-4'>
            <h3 className='text-purple-300 font-semibold mb-2 flex items-center space-x-2'>
              <span></span>
              <span>Tùy Chỉnh</span>
            </h3>
            <p className='text-purple-200 text-sm'>
              Thay đổi màu sắc, vị trí, tin nhắn chào phù hợp với thương hiệu.
            </p>
          </div>

          <div className='bg-orange-500/10 border border-orange-500/20 rounded-xl p-4'>
            <h3 className='text-orange-300 font-semibold mb-2 flex items-center space-x-2'>
              <span></span>
              <span>Responsive</span>
            </h3>
            <p className='text-orange-200 text-sm'>
              Hoạt động tốt trên cả máy tính và điện thoại. Giao diện thân thiện.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
