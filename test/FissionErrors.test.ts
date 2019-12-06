import { FileSizeError, AxiosError, ByteLength } from "../src/FissionErrors"

class AxiosErrorStub implements AxiosError {
    message: string
    isAxiosError: boolean
    name: string
    config: { 
        headers: { 
            "Content-Length": number
        },
        maxContentLength: number
    }
    stack?: string
    constructor(maxContentLength: ByteLength, contentLength: ByteLength) {
        this.message = "Request body larger than maxBodyLength limit"
        this.name = "Error"
        this.isAxiosError = true
        this.config = {
            headers: {
                "Content-Length": contentLength
            },
            maxContentLength
        }
    }
}

const mbToBytes = (mb: number): ByteLength => mb * 1_000_000

const FILE_SIZE = mbToBytes(101)
const MAX_SIZE = mbToBytes(100)

const axiosError = new AxiosErrorStub(MAX_SIZE, FILE_SIZE)
const fileSizeError = new FileSizeError(axiosError)

const axiosErrorDefault = new AxiosErrorStub(-1, FILE_SIZE)
const fileSizeErrorDefault = new FileSizeError(axiosErrorDefault)

describe("FileSizeError", () => {

    it("returns an instance of FileSizeError", () => {
        expect(fileSizeError).toBeInstanceOf(Error)
    })
        
    it("contains the maxContentLength", () => {
        expect(fileSizeError.maxFileSizeBytes).toEqual(MAX_SIZE)
    })

    it("contains the file size", () => {
        expect(fileSizeError.fileSizeBytes).toEqual(FILE_SIZE)
    })

    it("details are of known length", () => {
        expect(fileSizeError.details.length).toEqual(382)
    })

    it("defaults to 10MB", () => {
        expect(fileSizeErrorDefault.maxFileSizeBytes).toEqual(10_000_000)
    })
});