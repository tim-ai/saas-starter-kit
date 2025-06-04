import { XIcon } from 'lucide-react';

type FileItemProps = {
  file: {
    name: string;
    size: number;
    type: string;
  };
  progress?: number;
  onRemove: () => void;
  isUploading?: boolean;
};

export default function FileItem({
  file,
  progress = 0,
  onRemove,
  isUploading = false
}: FileItemProps) {
  const getFileIcon = (type: string) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('zip')) return '📦';
    return '📁';
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="text-xl">{getFileIcon(file.type)}</div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
          <p className="text-xs text-gray-500">
            {Math.round(file.size / 1024)} KB · {file.type || 'Unknown type'}
          </p>
        </div>
      </div>

      {isUploading ? (
        <div className="flex items-center space-x-3">
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-500">{progress}%</span>
        </div>
      ) : (
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Remove file"
        >
          <XIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}