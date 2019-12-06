export type ByteLength = number

export interface AxiosError extends Error {
    isAxiosError: boolean
    config: {
        headers: {
            "Content-Length": ByteLength
        }
        maxContentLength: ByteLength
    }
}

export class FileSizeError extends Error {
  fileSizeBytes: ByteLength
  maxFileSizeBytes: ByteLength
  details: string
  private axiosError: AxiosError
  private AXIOS_DEFAULT_MAXIMUM = 10_000_000;

  // Impossible to cover branch on super()
  /* istanbul ignore next */
  constructor(axiosError: AxiosError) {
      super("File size limit exceeded");    
      
      // https://github.com/facebook/jest/issues/8279
      Object.setPrototypeOf(this, Error.prototype);
      
      this.axiosError = axiosError;
      this.fileSizeBytes = this.extractFileSize()
      this.maxFileSizeBytes = this.extractMaxFileSize();
      this.details = this.constructDetails();
    }
  
  private extractFileSize = () => {
    return this.axiosError.config.headers["Content-Length"];
  }

  private extractMaxFileSize = (): ByteLength => {
    let maxFileSizeBytes = this.axiosError.config.maxContentLength;
    
    if(maxFileSizeBytes === -1) {
      maxFileSizeBytes = this.AXIOS_DEFAULT_MAXIMUM;
    }
    
    return maxFileSizeBytes;
  }
  
  private humanReadable = (bytes: number): string => {
    return (bytes / 1_000_000).toFixed(1) + "MB";
  }

  private constructDetails = (): string => {
    const fileSize = this.humanReadable(this.fileSizeBytes);
    const maxSize = this.humanReadable(this.maxFileSizeBytes);
    const overage = this.humanReadable(this.fileSizeBytes - this.maxFileSizeBytes);
    
    return `---
Oh no, the file you tried to add is too big 😲
You tried sending ${fileSize} but your current max is ${maxSize}.
That means your file was ${overage} too big 😟

To solve this, you may want to try:
 * Compressing your file
 * Breaking the file into smaller files
 * Contacting the nice people at Fission for assistance

Warm Regards and sorry for the inconvenience,

The Fission Devs 🤗
---
`
  }
}
