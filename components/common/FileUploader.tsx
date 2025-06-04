import { useState, useCallback } from 'react';
import FileItem from '@/components/common/FileItem';
import { UploadCloudIcon } from 'lucide-react';

type FileUploaderProps = {
  onFilesSelected: (files: File[]) => void;
  onUpload: (files: File[]) => Promise<void>;
  uploadProgress?: { [key: string]: number };
  isUploading?: boolean;
};

export default function FileUploader({ 
  onFilesSelected, 
  onUpload, 
  uploadProgress = {}, 
  isUploading = false 
}: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      onFilesSelected(newFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
      onFilesSelected(newFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-900">Drag files here or click to upload</p>
          <p className="mt-1">Supports JPG, PNG, PDF up to 10MB</p>
        </div>
        <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900">Selected Files</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file, index) => (
              <FileItem 
                key={index}
                file={file}
                progress={uploadProgress[file.name] || 0}
                onRemove={() => removeFile(index)}
                isUploading={isUploading}
              />
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <button
          onClick={() => onUpload(files)}
          disabled={isUploading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isUploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isUploading ? 'Uploading...' : 'Upload Files'}
        </button>
      )}
    </div>
  );
}