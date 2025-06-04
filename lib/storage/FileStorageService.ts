import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface FileStorageConfig {
  type: 'local' | 's3' | 'gcs';
  local?: {
    directory: string;
  };
  s3?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
  };
  gcs?: {
    projectId: string;
    keyFilename: string;
    bucket: string;
  };
}

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface StoredFile {
  key: string;
  url: string;
  size: number;
  contentType: string;
  metadata?: Record<string, any>;
}

export class FileStorageService {
  private config: FileStorageConfig;

  constructor(config: FileStorageConfig) {
    this.config = config;
  }

  async uploadFile(file: UploadedFile): Promise<StoredFile> {
    const key = `${uuidv4()}${path.extname(file.originalname)}`;
    
    switch (this.config.type) {
      case 'local':
        return this.uploadToLocal(file, key);
      case 's3':
        return this.uploadToS3(file, key);
      case 'gcs':
        return this.uploadToGCS(file, key);
      default:
        throw new Error(`Unsupported storage type: ${this.config.type}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    switch (this.config.type) {
      case 'local':
        return this.deleteFromLocal(key);
      case 's3':
        return this.deleteFromS3(key);
      case 'gcs':
        return this.deleteFromGCS(key);
      default:
        throw new Error(`Unsupported storage type: ${this.config.type}`);
    }
  }

  private async uploadToLocal(file: UploadedFile, key: string): Promise<StoredFile> {
    const { directory } = this.config.local!;
    const filePath = path.join(directory, key);
    
    await fs.promises.writeFile(filePath, file.buffer);
    
    return {
      key,
      url: `/uploads/${key}`,
      size: file.size,
      contentType: file.mimetype
    };
  }

  private async deleteFromLocal(key: string): Promise<void> {
    const { directory } = this.config.local!;
    const filePath = path.join(directory, key);
    await fs.promises.unlink(filePath);
  }

  private async uploadToS3(file: UploadedFile, key: string): Promise<StoredFile> {
    const { S3 } = await import('@aws-sdk/client-s3');
    const { accessKeyId, secretAccessKey, region, bucket } = this.config.s3!;
    
    const s3 = new S3({
      credentials: { accessKeyId, secretAccessKey },
      region
    });
    
    await s3.putObject({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size
    });
    
    return {
      key,
      url: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
      size: file.size,
      contentType: file.mimetype
    };
  }

  private async deleteFromS3(key: string): Promise<void> {
    const { S3 } = await import('@aws-sdk/client-s3');
    const { accessKeyId, secretAccessKey, region, bucket } = this.config.s3!;
    
    const s3 = new S3({
      credentials: { accessKeyId, secretAccessKey },
      region
    });
    
    await s3.deleteObject({ Bucket: bucket, Key: key });
  }

  private async uploadToGCS(file: UploadedFile, key: string): Promise<StoredFile> {
    const { projectId, keyFilename, bucket } = this.config.gcs!;
    const storage = new Storage({ projectId, keyFilename });
    
    const bucketObj = storage.bucket(bucket);
    const gcsFile = bucketObj.file(key);
    
    await gcsFile.save(file.buffer, {
      metadata: { contentType: file.mimetype }
    });
    
    await gcsFile.makePublic();
    
    return {
      key,
      url: `https://storage.googleapis.com/${bucket}/${key}`,
      size: file.size,
      contentType: file.mimetype
    };
  }

  private async deleteFromGCS(key: string): Promise<void> {
    const { projectId, keyFilename, bucket } = this.config.gcs!;
    const storage = new Storage({ projectId, keyFilename });
    
    const bucketObj = storage.bucket(bucket);
    await bucketObj.file(key).delete();
  }
}