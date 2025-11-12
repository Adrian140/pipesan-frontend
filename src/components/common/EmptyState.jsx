import React from 'react';

function EmptyState({ 
  icon: IconComponent, 
  title, 
  description, 
  actionText, 
  onAction,
  className = ""
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {IconComponent && <IconComponent className="w-16 h-16 text-gray-300 mx-auto mb-4" />}
      <h3 className="text-lg font-medium text-text-secondary mb-2">
        {title}
      </h3>
      <p className="text-text-light mb-6">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
