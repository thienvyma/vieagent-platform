import React, { useState, useCallback } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react';

// ===== TYPES =====
interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

interface FormField {
  id: string;
  label: string;
  type:
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
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: ValidationRule;
  defaultValue?: any;
  disabled?: boolean;
  description?: string;
  className?: string;
}

interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

interface FormProps {
  fields?: FormField[];
  steps?: FormStep[];
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  loading?: boolean;
  className?: string;
  submitText?: string;
  showStepIndicator?: boolean;
  validationMode?: 'onChange' | 'onSubmit' | 'onBlur';
}

// ===== VALIDATION UTILS =====
const validateField = (value: any, validation?: ValidationRule): string | null => {
  if (!validation) return null;

  if (validation.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return 'This field is required';
  }

  if (typeof value === 'string') {
    if (validation.minLength && value.length < validation.minLength) {
      return `Minimum length is ${validation.minLength} characters`;
    }
    if (validation.maxLength && value.length > validation.maxLength) {
      return `Maximum length is ${validation.maxLength} characters`;
    }
    if (validation.pattern && !validation.pattern.test(value)) {
      return 'Invalid format';
    }
  }

  if (validation.custom) {
    return validation.custom(value);
  }

  return null;
};

// ===== FIELD COMPONENTS =====
interface FieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  onBlur?: () => void;
}

const TextField: React.FC<FieldProps> = ({ field, value, onChange, error, onBlur }) => {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = field.type === 'password' && showPassword ? 'text' : field.type;
  const isPassword = field.type === 'password';

  return (
    <div className='space-y-2'>
      <label className='block text-gray-300 text-sm font-medium'>
        {field.label}
        {field.validation?.required && <span className='text-red-400 ml-1'>*</span>}
      </label>

      <div className='relative'>
        <input
          type={inputType}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={field.placeholder}
          disabled={field.disabled}
          className={`
            w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-400 
            focus:outline-none focus:ring-2 transition-all
            ${
              error
                ? 'border-red-500 focus:ring-red-500/20'
                : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
            }
            ${field.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${field.className || ''}
          `}
        />

        {isPassword && (
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white'
          >
            {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
          </button>
        )}
      </div>

      {field.description && <p className='text-gray-400 text-sm'>{field.description}</p>}

      {error && (
        <p className='text-red-400 text-sm flex items-center space-x-1'>
          <AlertCircle className='w-4 h-4' />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

const TextareaField: React.FC<FieldProps> = ({ field, value, onChange, error, onBlur }) => (
  <div className='space-y-2'>
    <label className='block text-gray-300 text-sm font-medium'>
      {field.label}
      {field.validation?.required && <span className='text-red-400 ml-1'>*</span>}
    </label>

    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={field.placeholder}
      disabled={field.disabled}
      rows={4}
      className={`
        w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-400 
        focus:outline-none focus:ring-2 transition-all resize-vertical
        ${
          error
            ? 'border-red-500 focus:ring-red-500/20'
            : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
        }
        ${field.disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${field.className || ''}
      `}
    />

    {field.description && <p className='text-gray-400 text-sm'>{field.description}</p>}

    {error && (
      <p className='text-red-400 text-sm flex items-center space-x-1'>
        <AlertCircle className='w-4 h-4' />
        <span>{error}</span>
      </p>
    )}
  </div>
);

const SelectField: React.FC<FieldProps> = ({ field, value, onChange, error, onBlur }) => (
  <div className='space-y-2'>
    <label className='block text-gray-300 text-sm font-medium'>
      {field.label}
      {field.validation?.required && <span className='text-red-400 ml-1'>*</span>}
    </label>

    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={field.disabled}
      className={`
        w-full px-4 py-3 bg-gray-800 border rounded-xl text-white 
        focus:outline-none focus:ring-2 transition-all
        ${
          error
            ? 'border-red-500 focus:ring-red-500/20'
            : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
        }
        ${field.disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${field.className || ''}
      `}
    >
      <option value=''>{field.placeholder || `Select ${field.label}`}</option>
      {field.options?.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>

    {field.description && <p className='text-gray-400 text-sm'>{field.description}</p>}

    {error && (
      <p className='text-red-400 text-sm flex items-center space-x-1'>
        <AlertCircle className='w-4 h-4' />
        <span>{error}</span>
      </p>
    )}
  </div>
);

const CheckboxField: React.FC<FieldProps> = ({ field, value, onChange, error }) => (
  <div className='space-y-2'>
    <label className='flex items-center space-x-3 cursor-pointer'>
      <input
        type='checkbox'
        checked={!!value}
        onChange={e => onChange(e.target.checked)}
        disabled={field.disabled}
        className={`
          w-5 h-5 rounded bg-gray-800 border-gray-600 text-blue-500 
          focus:ring-blue-500 focus:ring-2 focus:ring-offset-0
          ${field.disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />
      <span className='text-gray-300 text-sm font-medium'>
        {field.label}
        {field.validation?.required && <span className='text-red-400 ml-1'>*</span>}
      </span>
    </label>

    {field.description && <p className='text-gray-400 text-sm ml-8'>{field.description}</p>}

    {error && (
      <p className='text-red-400 text-sm flex items-center space-x-1 ml-8'>
        <AlertCircle className='w-4 h-4' />
        <span>{error}</span>
      </p>
    )}
  </div>
);

const RadioField: React.FC<FieldProps> = ({ field, value, onChange, error }) => (
  <div className='space-y-2'>
    <label className='block text-gray-300 text-sm font-medium'>
      {field.label}
      {field.validation?.required && <span className='text-red-400 ml-1'>*</span>}
    </label>

    <div className='space-y-2'>
      {field.options?.map(option => (
        <label key={option.value} className='flex items-center space-x-3 cursor-pointer'>
          <input
            type='radio'
            name={field.id}
            value={option.value}
            checked={value === option.value}
            onChange={e => onChange(e.target.value)}
            disabled={field.disabled}
            className={`
              w-5 h-5 bg-gray-800 border-gray-600 text-blue-500 
              focus:ring-blue-500 focus:ring-2 focus:ring-offset-0
              ${field.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
          <span className='text-gray-300 text-sm'>{option.label}</span>
        </label>
      ))}
    </div>

    {field.description && <p className='text-gray-400 text-sm'>{field.description}</p>}

    {error && (
      <p className='text-red-400 text-sm flex items-center space-x-1'>
        <AlertCircle className='w-4 h-4' />
        <span>{error}</span>
      </p>
    )}
  </div>
);

// ===== FIELD RENDERER =====
const FieldRenderer: React.FC<FieldProps> = props => {
  const { field } = props;

  switch (field.type) {
    case 'textarea':
      return <TextareaField {...props} />;
    case 'select':
      return <SelectField {...props} />;
    case 'checkbox':
      return <CheckboxField {...props} />;
    case 'radio':
      return <RadioField {...props} />;
    default:
      return <TextField {...props} />;
  }
};

// ===== MAIN FORM COMPONENT =====
const Form: React.FC<FormProps> = ({
  fields = [],
  steps,
  onSubmit,
  loading = false,
  className = '',
  submitText = 'Submit',
  showStepIndicator = true,
  validationMode = 'onBlur',
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const isMultiStep = !!steps && steps.length > 1;
  const currentFields = isMultiStep ? steps[currentStep]?.fields || [] : fields;
  const allFields = isMultiStep ? steps.flatMap(step => step.fields) : fields;

  // Initialize form data with default values
  React.useEffect(() => {
    const initialData: Record<string, any> = {};
    allFields.forEach(field => {
      if (field.defaultValue !== undefined) {
        initialData[field.id] = field.defaultValue;
      }
    });
    setFormData(initialData);
  }, [allFields]);

  const validateFormField = useCallback(
    (fieldId: string, value: any) => {
      const field = allFields.find(f => f.id === fieldId);
      if (!field) return null;
      return validateField(value, field.validation);
    },
    [allFields]
  );

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));

    if (validationMode === 'onChange') {
      const error = validateFormField(fieldId, value);
      setErrors(prev => ({ ...prev, [fieldId]: error || '' }));
    }
  };

  const handleFieldBlur = (fieldId: string) => {
    setTouched(prev => ({ ...prev, [fieldId]: true }));

    if (validationMode === 'onBlur' || validationMode === 'onChange') {
      const value = formData[fieldId];
      const error = validateFormField(fieldId, value);
      setErrors(prev => ({ ...prev, [fieldId]: error || '' }));
    }
  };

  const validateCurrentStep = () => {
    const stepErrors: Record<string, string> = {};
    let hasErrors = false;

    currentFields.forEach(field => {
      const error = validateFormField(field.id, formData[field.id]);
      if (error) {
        stepErrors[field.id] = error;
        hasErrors = true;
      }
    });

    setErrors(prev => ({ ...prev, ...stepErrors }));
    return !hasErrors;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, (steps?.length || 1) - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validationMode === 'onSubmit') {
      const allErrors: Record<string, string> = {};
      let hasErrors = false;

      allFields.forEach(field => {
        const error = validateFormField(field.id, formData[field.id]);
        if (error) {
          allErrors[field.id] = error;
          hasErrors = true;
        }
      });

      setErrors(allErrors);
      if (hasErrors) return;
    } else if (isMultiStep && !validateCurrentStep()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const isLastStep = !isMultiStep || currentStep === (steps?.length || 1) - 1;
  const canProceed = isMultiStep ? validateCurrentStep() : true;

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Step Indicator */}
      {isMultiStep && showStepIndicator && steps && (
        <div className='flex items-center justify-between mb-8'>
          {steps.map((step, index) => (
            <div key={step.id} className='flex items-center'>
              <div
                className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}
              `}
              >
                {index < currentStep ? <CheckCircle className='w-5 h-5' /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                  w-16 h-1 mx-2
                  ${index < currentStep ? 'bg-blue-500' : 'bg-gray-700'}
                `}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step Title */}
      {isMultiStep && steps && (
        <div className='mb-6'>
          <h3 className='text-xl font-bold text-white'>{steps[currentStep]?.title}</h3>
          {steps[currentStep]?.description && (
            <p className='text-gray-400 mt-1'>{steps[currentStep]?.description}</p>
          )}
        </div>
      )}

      {/* Fields */}
      <div className='space-y-6'>
        {currentFields.map(field => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={formData[field.id]}
            onChange={value => handleFieldChange(field.id, value)}
            onBlur={() => handleFieldBlur(field.id)}
            error={touched[field.id] ? errors[field.id] : undefined}
          />
        ))}
      </div>

      {/* Actions */}
      <div className='flex items-center justify-between pt-6 border-t border-gray-800'>
        <div>
          {isMultiStep && currentStep > 0 && (
            <button
              type='button'
              onClick={handlePrevious}
              className='px-6 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors'
            >
              Previous
            </button>
          )}
        </div>

        <div className='flex space-x-3'>
          {isMultiStep && !isLastStep ? (
            <button
              type='button'
              onClick={handleNext}
              disabled={!canProceed}
              className='px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Next
            </button>
          ) : (
            <button
              type='submit'
              disabled={loading || (!canProceed && validationMode !== 'onSubmit')}
              className='px-6 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2'
            >
              {loading && (
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
              )}
              <span>{loading ? 'Submitting...' : submitText}</span>
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

// ===== FORM BUILDER HELPER =====
export const createFormField = (
  config: Partial<FormField> & { id: string; label: string }
): FormField => ({
  type: 'text',
  ...config,
});

export const createFormStep = (
  config: Partial<FormStep> & { id: string; title: string; fields: FormField[] }
): FormStep => ({
  ...config,
});

export default Form;
export { type FormField, type FormStep, type ValidationRule };
