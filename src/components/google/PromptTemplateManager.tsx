'use client';

import { useState, useEffect } from 'react';

interface PromptTemplate {
  id: string;
  service: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  examples: string[];
}

interface PromptTemplateManagerProps {
  accountId: string;
}

const defaultTemplates: Record<string, PromptTemplate[]> = {
  calendar: [
    {
      id: 'calendar_schedule',
      service: 'calendar',
      name: 'Schedule Meeting',
      description: 'AI will schedule meetings based on availability',
      template: `When user asks to schedule a meeting:
1. Check calendar availability for {{date_range}}
2. Find {{duration}} minute slot that works
3. Create event with title: {{meeting_title}}
4. Add participants: {{attendees}}
5. Set reminder: {{reminder_time}} minutes before`,
      variables: ['date_range', 'duration', 'meeting_title', 'attendees', 'reminder_time'],
      examples: [
        'Schedule a 30-minute meeting with John tomorrow afternoon',
        'Book a team standup every Monday at 9 AM',
      ],
    },
    {
      id: 'calendar_conflict',
      service: 'calendar',
      name: 'Conflict Detection',
      description: 'AI detects and resolves scheduling conflicts',
      template: `When detecting calendar conflicts:
1. Identify overlapping events
2. Prioritize by: {{priority_rule}}
3. Suggest alternative times within {{time_window}}
4. Notify about conflicts via {{notification_method}}`,
      variables: ['priority_rule', 'time_window', 'notification_method'],
      examples: ['Check for conflicts next week', 'Find free time for urgent meeting'],
    },
  ],
  gmail: [
    {
      id: 'gmail_auto_reply',
      service: 'gmail',
      name: 'Auto Reply',
      description: 'AI generates contextual email responses',
      template: `When replying to emails matching {{filter_criteria}}:
1. Analyze email sentiment and intent
2. Generate response in {{tone}} tone
3. Include: {{must_include}}
4. Max length: {{max_length}} words
5. Sign off with: {{signature}}`,
      variables: ['filter_criteria', 'tone', 'must_include', 'max_length', 'signature'],
      examples: [
        'Reply to customer inquiries politely',
        'Send acknowledgment for received documents',
      ],
    },
  ],
  sheets: [
    {
      id: 'sheets_report',
      service: 'sheets',
      name: 'Generate Report',
      description: 'AI creates reports from data',
      template: `When generating {{report_type}} report:
1. Pull data from range: {{data_range}}
2. Calculate: {{metrics}}
3. Group by: {{grouping}}
4. Format as: {{output_format}}
5. Save to: {{destination}}`,
      variables: [
        'report_type',
        'data_range',
        'metrics',
        'grouping',
        'output_format',
        'destination',
      ],
      examples: ['Create weekly sales report', 'Generate monthly revenue summary'],
    },
  ],
};

export default function PromptTemplateManager({ accountId }: PromptTemplateManagerProps) {
  const [selectedService, setSelectedService] = useState<string>('calendar');
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [formData, setFormData] = useState<Partial<PromptTemplate>>({});

  useEffect(() => {
    // Load templates for selected service
    loadTemplates();
  }, [selectedService]);

  const loadTemplates = async () => {
    // In production, load from API
    // For now, use default templates
    setTemplates(defaultTemplates[selectedService] || []);
  };

  const saveTemplate = async () => {
    if (!formData.name || !formData.template) {
      alert('Please fill in required fields');
      return;
    }

    // Extract variables from template
    const variableMatches = formData.template.match(/\{\{(\w+)\}\}/g) || [];
    const variables = [...new Set(variableMatches.map(v => v.replace(/[{}]/g, '')))];

    const templateData: PromptTemplate = {
      id: editingTemplate?.id || `${selectedService}_${Date.now()}`,
      service: selectedService,
      name: formData.name,
      description: formData.description || '',
      template: formData.template,
      variables,
      examples: formData.examples || [],
    };

    // In production, save to API
    // For now, update local state
    if (editingTemplate) {
      setTemplates(prev => prev.map(t => (t.id === editingTemplate.id ? templateData : t)));
    } else {
      setTemplates(prev => [...prev, templateData]);
    }

    setShowEditor(false);
    setEditingTemplate(null);
    setFormData({});
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const services = [
    { id: 'calendar', name: 'Calendar', icon: '📅' },
    { id: 'gmail', name: 'Gmail', icon: '📧' },
    { id: 'sheets', name: 'Sheets', icon: '📊' },
    { id: 'drive', name: 'Drive', icon: '📁' },
    { id: 'docs', name: 'Docs', icon: '📝' },
    { id: 'forms', name: 'Forms', icon: '📋' },
  ];

  return (
    <div className='space-y-6'>
      {/* Service Tabs */}
      <div className='flex space-x-2 overflow-x-auto'>
        {services.map(service => (
          <button
            key={service.id}
            onClick={() => setSelectedService(service.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedService === service.id
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className='mr-2'>{service.icon}</span>
            {service.name}
          </button>
        ))}
      </div>

      {/* Template List */}
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-lg font-bold text-white'>
            {services.find(s => s.id === selectedService)?.icon} Prompt Templates
          </h3>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setFormData({});
              setShowEditor(true);
            }}
            className='bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all text-sm font-medium'
          >
            + New Template
          </button>
        </div>

        {templates.length === 0 ? (
          <div className='text-center py-12'>
            <div className='text-5xl mb-4 text-blue-400'>AI</div>
            <p className='text-gray-400 mb-4'>No templates yet for this service</p>
            <button
              onClick={() => {
                setEditingTemplate(null);
                setFormData({});
                setShowEditor(true);
              }}
              className='text-blue-400 hover:text-blue-300'
            >
              Create your first template →
            </button>
          </div>
        ) : (
          <div className='space-y-4'>
            {templates.map(template => (
              <div
                key={template.id}
                className='bg-gray-800/50 rounded-xl p-4 border border-gray-700'
              >
                <div className='flex justify-between items-start mb-3'>
                  <div>
                    <h4 className='text-white font-semibold'>{template.name}</h4>
                    <p className='text-gray-400 text-sm mt-1'>{template.description}</p>
                  </div>
                  <div className='flex space-x-2'>
                    <button
                      onClick={() => {
                        setEditingTemplate(template);
                        setFormData(template);
                        setShowEditor(true);
                      }}
                      className='text-blue-400 hover:text-blue-300 p-1'
                      title='Edit'
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className='text-red-400 hover:text-red-300 p-1'
                      title='Delete'
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className='bg-gray-900/50 rounded-lg p-3 mb-3'>
                  <pre className='text-sm text-gray-300 whitespace-pre-wrap font-mono'>
                    {template.template}
                  </pre>
                </div>

                {template.variables.length > 0 && (
                  <div className='flex flex-wrap gap-2 mb-3'>
                    <span className='text-gray-500 text-xs'>Variables:</span>
                    {template.variables.map(variable => (
                      <span
                        key={variable}
                        className='bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs'
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                )}

                {template.examples.length > 0 && (
                  <div className='border-t border-gray-700 pt-3'>
                    <p className='text-gray-500 text-xs mb-2'>Example prompts:</p>
                    <div className='space-y-1'>
                      {template.examples.map((example, idx) => (
                        <p key={idx} className='text-gray-400 text-sm italic'>
                          "{example}"
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      {showEditor && (
        <div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-gray-900 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700'>
            <h3 className='text-xl font-bold text-white mb-6'>
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </h3>

            <div className='space-y-4'>
              <div>
                <label className='text-gray-300 text-sm mb-1 block'>Template Name *</label>
                <input
                  type='text'
                  value={formData.name || ''}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white'
                  placeholder='e.g., Schedule Meeting'
                />
              </div>

              <div>
                <label className='text-gray-300 text-sm mb-1 block'>Description</label>
                <input
                  type='text'
                  value={formData.description || ''}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white'
                  placeholder='What this template does...'
                />
              </div>

              <div>
                <label className='text-gray-300 text-sm mb-1 block'>
                  Template Instructions *
                  <span className='text-gray-500 ml-2'>
                    Use {'{{variable}}'} for dynamic values
                  </span>
                </label>
                <textarea
                  value={formData.template || ''}
                  onChange={e => setFormData(prev => ({ ...prev, template: e.target.value }))}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm'
                  rows={10}
                  placeholder={`When user asks to {{action}}:
1. First step...
2. Second step...
3. Include {{required_info}}
4. Format as {{output_format}}`}
                />
              </div>

              <div>
                <label className='text-gray-300 text-sm mb-1 block'>Example Prompts</label>
                <textarea
                  value={(formData.examples || []).join('\n')}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      examples: e.target.value.split('\n').filter(ex => ex.trim()),
                    }))
                  }
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm'
                  rows={3}
                  placeholder='One example per line...'
                />
              </div>
            </div>

            <div className='flex justify-end space-x-3 mt-6'>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingTemplate(null);
                  setFormData({});
                }}
                className='px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={saveTemplate}
                className='px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all'
              >
                {editingTemplate ? 'Update' : 'Create'} Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
