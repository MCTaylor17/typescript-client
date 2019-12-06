import axios from 'axios'
import { Value as JSONValue } from 'json-typescript'
import { FileSizeError } from "./FissionErrors"

const BASE_URL_DEFAULT: string = 'https://hostless.dev'
const MAX_CONTENT_LENGTH: ByteLength = 100_000_000 // 100MB

export type Content = JSONValue
export type Upload = JSONValue | File
export type CID = string
export type ByteLength = number
export type Auth = {
  username: string
  password: string
}

export const content = async (cid: CID, baseURL = BASE_URL_DEFAULT): Promise<Content> => {
  const headers = { 'content-type': 'application/octet-stream' }
  const { data } = await axios.get<Content>(`${baseURL}/ipfs/${cid}`, { headers })
  return data
}

export const url = (cid: CID, baseURL = BASE_URL_DEFAULT): string => {
  return `${baseURL}/ipfs/${cid}`
}

export const cids = async (auth: Auth, baseURL = BASE_URL_DEFAULT): Promise<CID[]> => {
  const { data } = await axios.get<CID[]>(`${baseURL}/ipfs/cids`, { auth })
  return data
}

export const add = async (
  content: Content,
  auth: Auth,
  baseURL = BASE_URL_DEFAULT,
  name?: string
): Promise<CID> => {
  const headers = { 'content-type': 'application/octet-stream' }
  const maxContentLength = MAX_CONTENT_LENGTH;
  const nameStr = name ? `?name=${name}` : ''
  const axiosOptions = {
    headers,
    maxContentLength,
    auth
  }
  
  try {
    const { data } = await axios.post<CID>(`${baseURL}/ipfs${nameStr}`, content, axiosOptions)
    return data
  } catch (err) {
    switch (err.message) {
      case "Request body larger than maxBodyLength limit":
        throw new FileSizeError(err)
      default:
        throw err
    }
  }
}

export const remove = async (cid: CID, auth: Auth, baseURL = BASE_URL_DEFAULT) => {
  await axios.delete(`${baseURL}/ipfs/${cid}`, { auth })
}

export const pin = async (cid: CID, auth: Auth, baseURL = BASE_URL_DEFAULT) => {
  await axios.put(`${baseURL}/ipfs/${cid}`, {}, { auth })
}

export default class Fission {
  baseURL: string

  constructor(baseURL?: string) {
    this.baseURL = baseURL || BASE_URL_DEFAULT
  }

  login(username: string, password: string): FissionUser {
    return new FissionUser(username, password, this.baseURL)
  }

  async content(cid: CID): Promise<Content> {
    return content(cid, this.baseURL)
  }

  url(cid: CID): string {
    return url(cid, this.baseURL)
  }
}

export class FissionUser extends Fission {
  auth: Auth

  constructor(username: string, password: string, baseURL?: string) {
    super(baseURL)
    this.auth = { username, password }
    return this
  }

  async cids(): Promise<CID[]> {
    return cids(this.auth, this.baseURL)
  }

  async add(content: Content, name?: string): Promise<CID> {
    return add(content, this.auth, this.baseURL, name)
  }

  async remove(cid: CID) {
    return remove(cid, this.auth, this.baseURL)
  }

  async pin(cid: CID) {
    return pin(cid, this.auth, this.baseURL)
  }
}
