import { useState } from 'react';
import FileUploader from '../components/common/FileUploader';
import FileItem from '../components/common/FileItem';

export default function TestUpload() {
  const [results, setResults] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});

  const handleFilesSelected = (files: File[]) => {
    // Reset previous results
    setResults([]);
  };

  const handleUpload = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress({});
    
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    try {
      // Simulate progress for demonstration
      const simulateProgress = () => {
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            const newProgress = {...prev};
            for (const file of files) {
              if (!newProgress[file.name] || newProgress[file.name] < 90) {
                newProgress[file.name] = (newProgress[file.name] || 0) + 10;
              }
            }
            return newProgress;
          });
        }, 300);
        return interval;
      };
      
      const progressInterval = simulateProgress();
      
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        // Set progress to 100% for all files
        setUploadProgress(prev => {
          const completed = {...prev};
          files.forEach(file => completed[file.name] = 100);
          return completed;
        });
      } else {
        console.error('Upload failed:', await response.text());
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">File Upload Test</h1>
        
        <FileUploader
          onFilesSelected={handleFilesSelected}
          onUpload={handleUpload}
          uploadProgress={uploadProgress}
          isUploading={isUploading}
        />
        
        {results.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Upload Results</h3>
            <div className="space-y-3">
              {results.map((result, i) => (
                <FileItem
                  key={i}
                  file={{
                    name: result.name,
                    size: result.size,
                    type: result.contentType
                  }}
                  progress={100}
                  onRemove={() => {}}
                  isUploading={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}