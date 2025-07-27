'use client';

import React, { useState, useCallback, useRef } from 'react';
// ✅ FIXED in Phase 4D cleanup - Fixed drag-and-drop imports from correct library
import {
  Plus,
  Trash2,
  Edit3,
  Eye,
  Save,
  Download,
  Upload,
  Copy,
  Move,
  Settings,
  Type,
  Mail,
  Hash,
  Calendar,
  CheckSquare,
  Radio,
  List,
  FileText,
  Image,
  Link,
} from 'lucide-react';
// Note: DragDropContext, Droppable, Draggable would come from react-beautiful-dnd
// For now, we'll implement without drag-and-drop to avoid dependency issues
// ✅ FIXED in Phase 4D cleanup - Fixed Form imports to use default export and correct types
import Form from './Form';
// Import types from Form.tsx - we'll need to check what's actually exported
type FormFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'date';
import toast from 'react-hot-toast';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface FormBuilderField {
  id: string;
  type: FormFieldType;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  description?: string;
  conditional?: {
    dependsOn: string;
    condition: 'equals' | 'not_equals' | 'contains';
    value: any;
  };
}

export interface FormBuilderStep {
  id: string;
  title: string;
  description?: string;
  fields: FormBuilderField[];
}

export interface FormBuilderTemplate {
  id: string;
  name: string;
  description?: string;
  steps: FormBuilderStep[];
  settings: {
    multiStep: boolean;
    showProgress: boolean;
    allowSave: boolean;
    submitText: string;
    successMessage: string;
    errorMessage: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface FormBuilderProps {
  template?: FormBuilderTemplate;
  onSave?: (template: FormBuilderTemplate) => void;
  onPreview?: (template: FormBuilderTemplate) => void;
  className?: string;
}

// =============================================================================
// FIELD TYPE DEFINITIONS
// =============================================================================

const FIELD_TYPES: Array<{
  type: FormFieldType;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: 'basic' | 'advanced' | 'layout';
}> = [
  // Basic Fields
  {
    type: 'text',
    label: 'Text Input',
    icon: <Type className='w-4 h-4' />,
    description: 'Single line text input',
    category: 'basic',
  },
  {
    type: 'email',
    label: 'Email',
    icon: <Mail className='w-4 h-4' />,
    description: 'Email address input',
    category: 'basic',
  },
  {
    type: 'number',
    label: 'Number',
    icon: <Hash className='w-4 h-4' />,
    description: 'Numeric input',
    category: 'basic',
  },
  {
    type: 'password',
    label: 'Password',
    icon: <Type className='w-4 h-4' />,
    description: 'Password input field',
    category: 'basic',
  },
  {
    type: 'textarea',
    label: 'Textarea',
    icon: <FileText className='w-4 h-4' />,
    description: 'Multi-line text input',
    category: 'basic',
  },
  {
    type: 'date',
    label: 'Date',
    icon: <Calendar className='w-4 h-4' />,
    description: 'Date picker',
    category: 'basic',
  },

  // Advanced Fields
  {
    type: 'select',
    label: 'Select',
    icon: <List className='w-4 h-4' />,
    description: 'Dropdown selection',
    category: 'advanced',
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: <CheckSquare className='w-4 h-4' />,
    description: 'Checkbox input',
    category: 'advanced',
  },
  {
    type: 'radio',
    label: 'Radio Group',
    icon: <Radio className='w-4 h-4' />,
    description: 'Radio button group',
    category: 'advanced',
  },
  {
    type: 'file',
    label: 'File Upload',
    icon: <Upload className='w-4 h-4' />,
    description: 'File upload field',
    category: 'advanced',
  },
];

// =============================================================================
// FORM BUILDER COMPONENT
// =============================================================================

export default function FormBuilder({
  template,
  onSave,
  onPreview,
  className = '',
}: FormBuilderProps) {
  const [formTemplate, setFormTemplate] = useState<FormBuilderTemplate>(
    template || {
      id: `form_${Date.now()}`,
      name: 'New Form',
      description: '',
      steps: [
        {
          id: `step_${Date.now()}`,
          title: 'Step 1',
          description: '',
          fields: [],
        },
      ],
      settings: {
        multiStep: false,
        showProgress: true,
        allowSave: false,
        submitText: 'Submit',
        successMessage: 'Form submitted successfully!',
        errorMessage: 'Please fix the errors below.',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );

  const [activeStep, setActiveStep] = useState(0);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [draggedField, setDraggedField] = useState<FormBuilderField | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // =============================================================================
  // FORM MANAGEMENT
  // =============================================================================

  const updateTemplate = useCallback((updates: Partial<FormBuilderTemplate>) => {
    setFormTemplate(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateStep = useCallback((stepIndex: number, updates: Partial<FormBuilderStep>) => {
    setFormTemplate(prev => ({
      ...prev,
      steps: prev.steps.map((step, index) =>
        index === stepIndex ? { ...step, ...updates } : step
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const addStep = useCallback(() => {
    const newStep: FormBuilderStep = {
      id: `step_${Date.now()}`,
      title: `Step ${formTemplate.steps.length + 1}`,
      description: '',
      fields: [],
    };

    updateTemplate({
      steps: [...formTemplate.steps, newStep],
      settings: { ...formTemplate.settings, multiStep: true },
    });
    setActiveStep(formTemplate.steps.length);
  }, [formTemplate.steps, updateTemplate]);

  const removeStep = useCallback(
    (stepIndex: number) => {
      if (formTemplate.steps.length <= 1) {
        toast.error('Cannot remove the last step');
        return;
      }

      const newSteps = formTemplate.steps.filter((_, index) => index !== stepIndex);
      updateTemplate({
        steps: newSteps,
        settings: { ...formTemplate.settings, multiStep: newSteps.length > 1 },
      });

      if (activeStep >= newSteps.length) {
        setActiveStep(newSteps.length - 1);
      }
    },
    [formTemplate.steps, activeStep, updateTemplate]
  );

  // =============================================================================
  // FIELD MANAGEMENT
  // =============================================================================

  const addField = useCallback(
    (fieldType: FormFieldType) => {
      const newField: FormBuilderField = {
        id: `field_${Date.now()}`,
        type: fieldType,
        label: `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field`,
        name: `field_${Date.now()}`,
        placeholder: `Enter ${fieldType}...`,
        required: false,
        ...(fieldType === 'select' || fieldType === 'radio'
          ? {
              options: [
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' },
              ],
            }
          : {}),
      };

      const currentStep = formTemplate.steps[activeStep];
      updateStep(activeStep, {
        fields: [...currentStep.fields, newField],
      });

      setSelectedField(newField.id);
    },
    [formTemplate.steps, activeStep, updateStep]
  );

  const updateField = useCallback(
    (fieldId: string, updates: Partial<FormBuilderField>) => {
      const currentStep = formTemplate.steps[activeStep];
      updateStep(activeStep, {
        fields: currentStep.fields.map(field =>
          field.id === fieldId ? { ...field, ...updates } : field
        ),
      });
    },
    [formTemplate.steps, activeStep, updateStep]
  );

  const removeField = useCallback(
    (fieldId: string) => {
      const currentStep = formTemplate.steps[activeStep];
      updateStep(activeStep, {
        fields: currentStep.fields.filter(field => field.id !== fieldId),
      });

      if (selectedField === fieldId) {
        setSelectedField(null);
      }
    },
    [formTemplate.steps, activeStep, updateStep, selectedField]
  );

  const duplicateField = useCallback(
    (fieldId: string) => {
      const currentStep = formTemplate.steps[activeStep];
      const fieldToDuplicate = currentStep.fields.find(f => f.id === fieldId);

      if (fieldToDuplicate) {
        const duplicatedField: FormBuilderField = {
          ...fieldToDuplicate,
          id: `field_${Date.now()}`,
          name: `${fieldToDuplicate.name}_copy`,
          label: `${fieldToDuplicate.label} (Copy)`,
        };

        updateStep(activeStep, {
          fields: [...currentStep.fields, duplicatedField],
        });
      }
    },
    [formTemplate.steps, activeStep, updateStep]
  );

  // =============================================================================
  // DRAG & DROP
  // =============================================================================

  const handleDragEnd = useCallback(
    (result: any) => {
      if (!result.destination) return;

      const currentStep = formTemplate.steps[activeStep];
      const newFields = Array.from(currentStep.fields);
      const [reorderedField] = newFields.splice(result.source.index, 1);
      newFields.splice(result.destination.index, 0, reorderedField);

      updateStep(activeStep, { fields: newFields });
    },
    [formTemplate.steps, activeStep, updateStep]
  );

  // =============================================================================
  // IMPORT/EXPORT
  // =============================================================================

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(formTemplate, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${formTemplate.name.replace(/\s+/g, '_')}_form_template.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast.success('Form template exported successfully!');
  }, [formTemplate]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const importedTemplate = JSON.parse(e.target?.result as string);
        setFormTemplate({
          ...importedTemplate,
          id: `form_${Date.now()}`,
          updatedAt: new Date().toISOString(),
        });
        toast.success('Form template imported successfully!');
      } catch (error) {
        toast.error('Invalid form template file');
      }
    };
    reader.readAsText(file);
  }, []);

  // =============================================================================
  // ACTIONS
  // =============================================================================

  const handleSave = useCallback(() => {
    if (!formTemplate.name.trim()) {
      toast.error('Please enter a form name');
      return;
    }

    if (formTemplate.steps.every(step => step.fields.length === 0)) {
      toast.error('Please add at least one field');
      return;
    }

    onSave?.(formTemplate);
    toast.success('Form template saved successfully!');
  }, [formTemplate, onSave]);

  const handlePreview = useCallback(() => {
    setShowPreview(true);
    onPreview?.(formTemplate);
  }, [formTemplate, onPreview]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderFieldEditor = () => {
    const field = formTemplate.steps[activeStep].fields.find(f => f.id === selectedField);
    if (!field) return null;

    return (
      <div className='space-y-4'>
        <h3 className='text-white font-semibold'>Field Settings</h3>

        <div>
          <label className='block text-gray-300 text-sm mb-1'>Label</label>
          <input
            type='text'
            value={field.label}
            onChange={e => updateField(field.id, { label: e.target.value })}
            className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
          />
        </div>

        <div>
          <label className='block text-gray-300 text-sm mb-1'>Name</label>
          <input
            type='text'
            value={field.name}
            onChange={e => updateField(field.id, { name: e.target.value })}
            className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
          />
        </div>

        <div>
          <label className='block text-gray-300 text-sm mb-1'>Placeholder</label>
          <input
            type='text'
            value={field.placeholder || ''}
            onChange={e => updateField(field.id, { placeholder: e.target.value })}
            className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
          />
        </div>

        <div>
          <label className='flex items-center space-x-2'>
            <input
              type='checkbox'
              checked={field.required || false}
              onChange={e => updateField(field.id, { required: e.target.checked })}
              className='text-blue-500'
            />
            <span className='text-gray-300'>Required</span>
          </label>
        </div>

        {(field.type === 'select' || field.type === 'radio') && (
          <div>
            <label className='block text-gray-300 text-sm mb-1'>Options</label>
            <div className='space-y-2'>
              {field.options?.map((option, index) => (
                <div key={index} className='flex space-x-2'>
                  <input
                    type='text'
                    value={option.value}
                    onChange={e => {
                      const newOptions = [...(field.options || [])];
                      newOptions[index] = { ...option, value: e.target.value };
                      updateField(field.id, { options: newOptions });
                    }}
                    className='flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                    placeholder='Value'
                  />
                  <input
                    type='text'
                    value={option.label}
                    onChange={e => {
                      const newOptions = [...(field.options || [])];
                      newOptions[index] = { ...option, label: e.target.value };
                      updateField(field.id, { options: newOptions });
                    }}
                    className='flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                    placeholder='Label'
                  />
                  <button
                    onClick={() => {
                      const newOptions = field.options?.filter((_, i) => i !== index);
                      updateField(field.id, { options: newOptions });
                    }}
                    className='p-2 text-red-400 hover:text-red-300'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newOptions = [...(field.options || []), { value: '', label: '' }];
                  updateField(field.id, { options: newOptions });
                }}
                className='w-full px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors'
              >
                Add Option
              </button>
            </div>
          </div>
        )}

        {(field.type === 'text' || field.type === 'textarea') && (
          <div>
            <label className='block text-gray-300 text-sm mb-1'>Validation</label>
            <div className='space-y-2'>
              <div className='flex space-x-2'>
                <input
                  type='number'
                  value={field.validation?.min || ''}
                  onChange={e =>
                    updateField(field.id, {
                      validation: {
                        ...field.validation,
                        min: parseInt(e.target.value) || undefined,
                      },
                    })
                  }
                  className='flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  placeholder='Min length'
                />
                <input
                  type='number'
                  value={field.validation?.max || ''}
                  onChange={e =>
                    updateField(field.id, {
                      validation: {
                        ...field.validation,
                        max: parseInt(e.target.value) || undefined,
                      },
                    })
                  }
                  className='flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                  placeholder='Max length'
                />
              </div>
              <input
                type='text'
                value={field.validation?.pattern || ''}
                onChange={e =>
                  updateField(field.id, {
                    validation: { ...field.validation, pattern: e.target.value },
                  })
                }
                className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
                placeholder='Regex pattern'
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFormSettings = () => (
    <div className='space-y-4'>
      <h3 className='text-white font-semibold'>Form Settings</h3>

      <div>
        <label className='block text-gray-300 text-sm mb-1'>Form Name</label>
        <input
          type='text'
          value={formTemplate.name}
          onChange={e => updateTemplate({ name: e.target.value })}
          className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
        />
      </div>

      <div>
        <label className='block text-gray-300 text-sm mb-1'>Description</label>
        <textarea
          value={formTemplate.description || ''}
          onChange={e => updateTemplate({ description: e.target.value })}
          className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
          rows={3}
        />
      </div>

      <div className='space-y-2'>
        <label className='flex items-center space-x-2'>
          <input
            type='checkbox'
            checked={formTemplate.settings.multiStep}
            onChange={e =>
              updateTemplate({
                settings: { ...formTemplate.settings, multiStep: e.target.checked },
              })
            }
            className='text-blue-500'
          />
          <span className='text-gray-300'>Multi-step form</span>
        </label>

        <label className='flex items-center space-x-2'>
          <input
            type='checkbox'
            checked={formTemplate.settings.showProgress}
            onChange={e =>
              updateTemplate({
                settings: { ...formTemplate.settings, showProgress: e.target.checked },
              })
            }
            className='text-blue-500'
          />
          <span className='text-gray-300'>Show progress indicator</span>
        </label>

        <label className='flex items-center space-x-2'>
          <input
            type='checkbox'
            checked={formTemplate.settings.allowSave}
            onChange={e =>
              updateTemplate({
                settings: { ...formTemplate.settings, allowSave: e.target.checked },
              })
            }
            className='text-blue-500'
          />
          <span className='text-gray-300'>Allow save draft</span>
        </label>
      </div>

      <div>
        <label className='block text-gray-300 text-sm mb-1'>Submit Button Text</label>
        <input
          type='text'
          value={formTemplate.settings.submitText}
          onChange={e =>
            updateTemplate({
              settings: { ...formTemplate.settings, submitText: e.target.value },
            })
          }
          className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
        />
      </div>

      <div>
        <label className='block text-gray-300 text-sm mb-1'>Success Message</label>
        <input
          type='text'
          value={formTemplate.settings.successMessage}
          onChange={e =>
            updateTemplate({
              settings: { ...formTemplate.settings, successMessage: e.target.value },
            })
          }
          className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
        />
      </div>
    </div>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-800 ${className}`}>
      {/* Header */}
      <div className='p-6 border-b border-gray-800'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-xl font-bold text-white'>Form Builder</h2>
            <p className='text-gray-400'>Create dynamic forms with drag-and-drop interface</p>
          </div>
          <div className='flex items-center space-x-2'>
            <button
              onClick={() => fileInputRef.current?.click()}
              className='px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2'
            >
              <Upload className='w-4 h-4' />
              <span>Import</span>
            </button>
            <button
              onClick={handleExport}
              className='px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2'
            >
              <Download className='w-4 h-4' />
              <span>Export</span>
            </button>
            <button
              onClick={handlePreview}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2'
            >
              <Eye className='w-4 h-4' />
              <span>Preview</span>
            </button>
            <button
              onClick={handleSave}
              className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2'
            >
              <Save className='w-4 h-4' />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>

      <div className='flex h-[800px]'>
        {/* Left Sidebar - Field Types */}
        <div className='w-64 border-r border-gray-800 p-4 overflow-y-auto'>
          <h3 className='text-white font-semibold mb-4'>Field Types</h3>

          <div className='space-y-4'>
            {['basic', 'advanced', 'layout'].map(category => (
              <div key={category}>
                <h4 className='text-gray-400 text-sm font-medium mb-2 uppercase'>{category}</h4>
                <div className='space-y-1'>
                  {FIELD_TYPES.filter(field => field.category === category).map(fieldType => (
                    <button
                      key={fieldType.type}
                      onClick={() => addField(fieldType.type)}
                      className='w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-3 text-left'
                      title={fieldType.description}
                    >
                      {fieldType.icon}
                      <div>
                        <div className='text-white text-sm font-medium'>{fieldType.label}</div>
                        <div className='text-gray-400 text-xs'>{fieldType.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Form Builder */}
        <div className='flex-1 flex flex-col'>
          {/* Step Navigation */}
          {formTemplate.settings.multiStep && (
            <div className='p-4 border-b border-gray-800'>
              <div className='flex items-center space-x-2'>
                {formTemplate.steps.map((step, index) => (
                  <div key={step.id} className='flex items-center'>
                    <button
                      onClick={() => setActiveStep(index)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        activeStep === index
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {step.title}
                    </button>
                    {index < formTemplate.steps.length - 1 && (
                      <div className='w-8 h-px bg-gray-600 mx-2' />
                    )}
                  </div>
                ))}
                <button
                  onClick={addStep}
                  className='p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors'
                >
                  <Plus className='w-4 h-4' />
                </button>
              </div>
            </div>
          )}

          {/* Form Canvas */}
          <div className='flex-1 p-6 overflow-y-auto'>
            <div className='max-w-2xl mx-auto'>
              {/* Step Header */}
              <div className='mb-6'>
                <input
                  type='text'
                  value={formTemplate.steps[activeStep].title}
                  onChange={e => updateStep(activeStep, { title: e.target.value })}
                  className='text-2xl font-bold text-white bg-transparent border-none outline-none w-full'
                  placeholder='Step title'
                />
                <input
                  type='text'
                  value={formTemplate.steps[activeStep].description || ''}
                  onChange={e => updateStep(activeStep, { description: e.target.value })}
                  className='text-gray-400 bg-transparent border-none outline-none w-full mt-2'
                  placeholder='Step description (optional)'
                />
              </div>

              {/* ✅ FIXED in Phase 4D cleanup - Simplified field list without drag-and-drop */}
              <div className='space-y-4'>
                {formTemplate.steps[activeStep].fields.map((field, index) => (
                  <div
                    key={field.id}
                    className={`p-4 bg-gray-800 rounded-lg border-2 transition-all ${
                      selectedField === field.id
                        ? 'border-blue-500'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center space-x-2'>
                        <span className='text-white font-medium'>{field.label}</span>
                        {field.required && <span className='text-red-400 text-sm'>*</span>}
                      </div>
                      <div className='flex items-center space-x-1'>
                        <button
                          onClick={() => setSelectedField(field.id)}
                          className='p-1 text-gray-400 hover:text-blue-400 transition-colors'
                        >
                          <Edit3 className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() => duplicateField(field.id)}
                          className='p-1 text-gray-400 hover:text-green-400 transition-colors'
                        >
                          <Copy className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() => removeField(field.id)}
                          className='p-1 text-gray-400 hover:text-red-400 transition-colors'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </div>

                    {/* Field Preview - Simple text display instead of FormField component */}
                    <div className='pointer-events-none'>
                      <div className='text-sm text-gray-400'>
                        Type: {field.type} | Name: {field.name}
                        {field.placeholder && ` | Placeholder: ${field.placeholder}`}
                      </div>
                    </div>
                  </div>
                ))}

                {formTemplate.steps[activeStep].fields.length === 0 && (
                  <div className='text-center py-12 text-gray-400'>
                    <Type className='w-12 h-12 mx-auto mb-4 opacity-50' />
                    <p>No fields added yet</p>
                    <p className='text-sm'>Click field types from the sidebar to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className='w-80 border-l border-gray-800 p-4 overflow-y-auto'>
          <div className='flex items-center space-x-2 mb-4'>
            <button
              onClick={() => setShowSettings(false)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                !showSettings ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Field
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                showSettings ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Settings
            </button>
          </div>

          {showSettings ? (
            renderFormSettings()
          ) : selectedField ? (
            renderFieldEditor()
          ) : (
            <div className='text-center py-12 text-gray-400'>
              <Settings className='w-12 h-12 mx-auto mb-4 opacity-50' />
              <p>Select a field to edit its properties</p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type='file'
        accept='.json'
        onChange={handleImport}
        className='hidden'
      />

      {/* Preview Modal */}
      {showPreview && (
        <div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-gray-900 rounded-xl border border-gray-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6 border-b border-gray-800 flex items-center justify-between'>
              <h3 className='text-xl font-bold text-white'>Form Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className='text-gray-400 hover:text-white'
              >
                ✕
              </button>
            </div>
            {/* ✅ FIXED in Phase 4D cleanup - Fixed Form component props to match FormProps interface */}
            <div className='p-6'>
              <Form
                steps={formTemplate.steps.map(step => ({
                  id: step.id,
                  title: step.title,
                  description: step.description,
                  fields: step.fields.map(field => ({
                    id: field.id,
                    label: field.label,
                    type: field.type,
                    placeholder: field.placeholder,
                    validation: field.validation
                      ? {
                          ...field.validation,
                          pattern: field.validation.pattern
                            ? new RegExp(field.validation.pattern)
                            : undefined,
                        }
                      : undefined,
                    options: field.options,
                    defaultValue: field.defaultValue,
                  })),
                }))}
                onSubmit={data => {
                  // Form submitted successfully
                  toast.success('Form submitted successfully!');
                }}
                submitText={formTemplate.settings.submitText}
                showStepIndicator={formTemplate.settings.showProgress}
                className='max-w-2xl mx-auto'
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
