import React from 'react';

function PageHeader({ 
  title, 
  subtitle, 
  icon: IconComponent,
  actions,
  breadcrumbs,
  className = ""
}) {
  return (
    <div className={`text-center mb-16 ${className}`}>
      {IconComponent && (
        <IconComponent className="w-16 h-16 text-primary mx-auto mb-4" />
      )}
      
      {breadcrumbs && (
        <nav className="mb-6">
          <ol className="flex items-center justify-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <li className="text-gray-500">/</li>}
                <li>
                  {crumb.href ? (
                    <a href={crumb.href} className="text-primary hover:text-primary-dark">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-text-primary font-medium">{crumb.label}</span>
                  )}
                </li>
              </React.Fragment>
            ))}
          </ol>
        </nav>
      )}
      
      <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
        {title}
      </h1>
      
      {subtitle && (
        <p className="text-xl text-text-secondary max-w-3xl mx-auto">
          {subtitle}
        </p>
      )}
      
      {actions && (
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
