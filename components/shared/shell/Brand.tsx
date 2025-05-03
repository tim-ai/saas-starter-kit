import app from '@/lib/app';
import Image from 'next/image';
import useTheme from 'hooks/useTheme';

const Brand = () => {
  const { theme } = useTheme();
  return (
    <div className="flex pt-6 shrink-0 items-center text-xl font-bold gap-2 dark:text-gray-100">
      <Image
        src={theme !== 'dark' ? app.logoUrl : '/logo.jpg'}
        alt={app.name}
        
        width={120}
        height={80}
        style={{ objectFit: 'fill' }}

      />
      
    </div>
  );
};

export default Brand;
