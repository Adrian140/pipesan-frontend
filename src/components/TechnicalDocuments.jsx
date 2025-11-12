import React, { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import { apiClient } from '../config/api';

function TechnicalDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const data = await apiClient.admin.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {documents.map((doc) => (
        <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-primary mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{doc.title}</h3>
                <p className="text-sm text-text-secondary">{doc.description}</p>
              </div>
            </div>
            <a
              href={doc.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-white p-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Download className="w-5 h-5" />
            </a>
          </div>
          
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <span>{doc.pages} pages • {doc.size}</span>
            <div className="flex gap-1">
              {doc.languages?.map((lang, langIndex) => (
                <span key={langIndex} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TechnicalDocuments;
